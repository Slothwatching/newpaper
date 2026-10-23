import importlib.util
import io
import os
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest.mock import Mock

SPEC = importlib.util.spec_from_file_location('deploy_receiver', Path(__file__).with_name('deploy-receiver.py'))
receiver = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(receiver)
SHA = 'a' * 40
CONTENT = {'index.html': b'<html>new release</html>', 'style.css': b'body{}', 'app.js': b'console.log(1)'}


def archive_bytes(entries=None):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w') as archive:
        for name, content, kind in entries or [(name, data, tarfile.REGTYPE) for name, data in CONTENT.items()]:
            info = tarfile.TarInfo(name)
            info.type = kind
            info.size = len(content) if kind == tarfile.REGTYPE else 0
            info.linkname = '/etc/passwd' if kind in (tarfile.SYMTYPE, tarfile.LNKTYPE) else ''
            archive.addfile(info, io.BytesIO(content))
    return buffer.getvalue()


class ReceiverTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        old = self.root / 'releases' / '846e24a'
        old.mkdir(parents=True)
        (old / 'index.html').write_bytes(b'old')
        (self.root / 'current').symlink_to('releases/846e24a')
        (self.root / 'previous').symlink_to('releases/older')
        self.sleep = Mock()

    def http(self, request, timeout):
        response = io.BytesIO((self.root / 'current' / request.full_url.rsplit('/', 1)[1]).read_bytes())
        response.status = 200
        return response

    def deploy(self, payload=None, opener=None):
        return receiver.deploy('deploy ' + SHA, io.BytesIO(payload if payload is not None else archive_bytes()),
                               root=self.root, opener=opener or self.http, sleep=self.sleep)

    def test_only_exact_command_is_accepted_before_reading_input(self):
        for command in ('', 'deploy abc', 'deploy ' + 'A' * 40, 'deploy ' + SHA + '\n',
                        'deploy ' + SHA + '; id', ' deploy ' + SHA):
            with self.subTest(command=command):
                stream = Mock()
                with self.assertRaises(ValueError):
                    receiver.read_release(command, stream)
                stream.read.assert_not_called()

    def test_rejects_unsafe_and_incomplete_archives_without_switching(self):
        normal = [(name, data, tarfile.REGTYPE) for name, data in CONTENT.items()]
        cases = [normal[:-1], normal + [normal[0]], normal + [('../escape', b'x', tarfile.REGTYPE)],
                 [('/index.html', b'x', tarfile.REGTYPE)] + normal[1:]]
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.DIRTYPE, tarfile.FIFOTYPE, tarfile.CHRTYPE):
            cases.append([('index.html', b'', kind)] + normal[1:])
        payloads = [archive_bytes(entries) for entries in cases]
        payloads += [b'not a tar', b'x' * (receiver.MAX_BYTES + 1), archive_bytes() + b'junk']
        for payload in payloads:
            with self.subTest(length=len(payload), prefix=payload[:30]):
                with self.assertRaises((ValueError, tarfile.TarError)):
                    self.deploy(payload)
                self.assertEqual(os.readlink(self.root / 'current'), 'releases/846e24a')
                self.assertFalse((self.root / 'releases' / SHA).exists())

    def test_success_checks_all_files_and_keeps_previous(self):
        opener = Mock(side_effect=self.http)
        self.assertEqual(self.deploy(opener=opener), SHA)
        self.assertEqual(os.readlink(self.root / 'current'), 'releases/' + SHA)
        self.assertEqual(os.readlink(self.root / 'previous'), 'releases/846e24a')
        self.assertEqual([call.args[0].full_url for call in opener.call_args_list],
                         ['http://127.0.0.1/' + name for name in CONTENT])
        for name, data in CONTENT.items():
            self.assertEqual((self.root / 'current' / name).read_bytes(), data)
        self.sleep.assert_not_called()

    def test_http_mismatch_rolls_back_and_preserves_previous(self):
        def wrong_content(request, timeout):
            response = io.BytesIO(b'wrong release')
            response.status = 200
            return response
        opener = Mock(side_effect=wrong_content)
        with self.assertRaisesRegex(RuntimeError, 'rolled back'):
            self.deploy(opener=opener)
        self.assertEqual(opener.call_count, 3)
        self.assertEqual(self.sleep.call_count, 2)
        self.assertEqual(os.readlink(self.root / 'current'), 'releases/846e24a')
        self.assertEqual(os.readlink(self.root / 'previous'), 'releases/older')
        self.assertFalse((self.root / 'releases' / SHA).exists())

    def test_http_connection_failure_rolls_back(self):
        with self.assertRaises(RuntimeError):
            self.deploy(opener=Mock(side_effect=OSError('connection refused')))
        self.assertEqual(os.readlink(self.root / 'current'), 'releases/846e24a')

    def test_same_sha_is_idempotent_but_never_overwrites_existing_bytes(self):
        self.deploy()
        release = self.root / 'releases' / SHA
        before = {name: (release / name).stat().st_mtime_ns for name in CONTENT}
        self.deploy()
        self.assertEqual(before, {name: (release / name).stat().st_mtime_ns for name in CONTENT})
        self.assertEqual(os.readlink(self.root / 'previous'), 'releases/846e24a')
        changed = [(name, data + b'changed', tarfile.REGTYPE) for name, data in CONTENT.items()]
        with self.assertRaisesRegex(ValueError, 'refusing to modify'):
            self.deploy(archive_bytes(changed))
        self.assertEqual((release / 'index.html').read_bytes(), CONTENT['index.html'])

    def test_existing_release_symlinks_are_rejected(self):
        release = self.root / 'releases' / SHA
        release.symlink_to('846e24a')
        with self.assertRaises(ValueError):
            self.deploy()
        release.unlink()
        release.mkdir()
        for name, data in CONTENT.items():
            (release / name).write_bytes(data)
        (release / 'index.html').unlink()
        (release / 'index.html').symlink_to('../846e24a/index.html')
        with self.assertRaises(ValueError):
            self.deploy()
        self.assertEqual(os.readlink(self.root / 'current'), 'releases/846e24a')

    def test_retention_removes_oldest_unprotected_full_sha_release(self):
        releases = self.root / 'releases'
        names = [str(number) * 40 for number in range(5)]
        for number, name in enumerate(names):
            path = releases / name
            path.mkdir()
            for filename, content in CONTENT.items():
                (path / filename).write_bytes(content)
            os.utime(path, (number + 1, number + 1))
        (self.root / 'current').unlink()
        (self.root / 'current').symlink_to('releases/' + names[0])
        (self.root / 'previous').unlink()
        (self.root / 'previous').symlink_to('releases/' + names[1])
        (releases / ('f' * 40)).symlink_to('846e24a')
        self.deploy()
        self.assertTrue((releases / names[0]).is_dir())
        self.assertTrue((releases / names[1]).is_dir())
        self.assertFalse((releases / names[2]).exists())
        self.assertTrue((releases / '846e24a').is_dir())
        self.assertTrue((releases / ('f' * 40)).is_symlink())
        retained = [path for path in releases.iterdir()
                    if len(path.name) == 40 and not path.is_symlink()]
        self.assertEqual(len(retained), 5)

    def test_failed_existing_release_is_retained_for_retries(self):
        self.deploy()
        with self.assertRaises(RuntimeError):
            self.deploy(opener=Mock(side_effect=OSError('connection refused')))
        self.assertTrue((self.root / 'releases' / SHA).is_dir())
        self.assertEqual(os.readlink(self.root / 'current'), 'releases/' + SHA)


if __name__ == '__main__':
    unittest.main()
