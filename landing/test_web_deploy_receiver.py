import importlib.util
import io
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import tempfile
import unittest
from unittest.mock import Mock, patch
from urllib.parse import unquote, urlsplit

SPEC = importlib.util.spec_from_file_location('web_deploy_receiver', Path(__file__).with_name('web-deploy-receiver.py'))
receiver = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(receiver)
SHA = 'a' * 40
CONTENT = {
    'index.html': b'<html><script src="/static/js/main.js"></script><link href="./static/css/main.css" rel="stylesheet"></html>',
    'static/js/main.js': b'console.log(1)',
    'static/js/main.js.LICENSE.txt': b'license',
    'static/css/main.css': b'body{}',
    'static/media/font.woff2': b'font',
}


def archive_bytes(entries=None):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode='w', format=tarfile.GNU_FORMAT) as archive:
        for name, content, kind in entries if entries is not None else [
                ('./', b'', tarfile.DIRTYPE), ('./static/', b'', tarfile.DIRTYPE)
        ] + [('./' + name, data, tarfile.REGTYPE) for name, data in CONTENT.items()]:
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
        self.old_sha = 'b' * 40
        old = self.root / 'releases' / self.old_sha
        old.mkdir(parents=True)
        (old / 'index.html').write_bytes(b'old')
        (self.root / 'current').symlink_to('releases/' + self.old_sha)
        (self.root / 'previous').symlink_to('releases/' + 'c' * 40)
        self.sleep = Mock()

    def http(self, request, timeout):
        path = unquote(urlsplit(request.full_url).path).removeprefix('/')
        response = io.BytesIO((self.root / 'current' / path).read_bytes())
        response.status = 200
        return response

    def deploy(self, payload=None, opener=None, sha=SHA):
        return receiver.deploy('deploy ' + sha, io.BytesIO(payload if payload is not None else archive_bytes()),
                               root=self.root, opener=opener or self.http, sleep=self.sleep)

    def test_exact_command_is_required_before_reading(self):
        for command in ('', 'deploy abc', 'deploy ' + 'A' * 40, 'deploy ' + SHA + '\n',
                        'deploy ' + SHA + '; id', ' deploy ' + SHA):
            with self.subTest(command=command):
                stream = Mock()
                with self.assertRaises(ValueError):
                    receiver.read_release(command, stream)
                stream.read.assert_not_called()

    def test_gnu_tar_dot_root_build_checks_index_and_direct_assets(self):
        # Exercise the actual producer command, including its ./ directory entries.
        source = self.root / 'dist'
        for name, content in CONTENT.items():
            path = source / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        tar = shutil.which('gtar') or shutil.which('tar')
        self.assertIsNotNone(tar)
        payload = subprocess.check_output([tar, '-C', str(source), '-cf', '-', '.'],
                                          env={**os.environ, 'COPYFILE_DISABLE': '1'})
        opener = Mock(side_effect=self.http)
        self.assertEqual(self.deploy(payload, opener), SHA)
        self.assertEqual(os.readlink(self.root / 'previous'), 'releases/' + self.old_sha)
        self.assertEqual([call.args[0].full_url for call in opener.call_args_list], [
            receiver.VERIFY_URL + '/' + name
            for name in ('index.html', 'static/js/main.js', 'static/css/main.css')
        ])
        for name, content in CONTENT.items():
            self.assertEqual((self.root / 'current' / name).read_bytes(), content)
        self.sleep.assert_not_called()

    def test_rejects_unsafe_members_and_trailing_or_compressed_data(self):
        normal = [(name, data, tarfile.REGTYPE) for name, data in CONTENT.items()]
        cases = [normal[1:], normal + [normal[0]], normal + [('./index.html', b'x', tarfile.REGTYPE)]]
        for name in ('../escape.js', '/escape.js', 'static/../escape.js', '.env.json',
                     'static/.hidden/main.js', 'static//main.js', 'static\\main.js', 'server.py'):
            cases.append(normal + [(name, b'x', tarfile.REGTYPE)])
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.FIFOTYPE, tarfile.CHRTYPE, tarfile.BLKTYPE):
            cases.append(normal + [('static/evil.js', b'', kind)])
        cases.append(normal + [('static/js/main.js/child.js', b'x', tarfile.REGTYPE)])
        cases.append(normal + [('./static/', b'', tarfile.DIRTYPE), ('static/', b'', tarfile.DIRTYPE)])
        payloads = [archive_bytes(entries) for entries in cases]
        compressed = io.BytesIO()
        with tarfile.open(fileobj=compressed, mode='w:gz') as archive:
            info = tarfile.TarInfo('index.html')
            archive.addfile(info)
        payloads += [b'not a tar', archive_bytes() + b'junk', compressed.getvalue()]
        for payload in payloads:
            with self.subTest(length=len(payload), prefix=payload[:30]):
                with self.assertRaises((ValueError, tarfile.TarError)):
                    self.deploy(payload)
                self.assertEqual(os.readlink(self.root / 'current'), 'releases/' + self.old_sha)
                self.assertFalse((self.root / 'releases' / SHA).exists())

    def test_size_and_file_count_limits(self):
        for setting, value, payload in (
                ('MAX_BYTES', 100, archive_bytes()),
                ('MAX_FILE_BYTES', 10, archive_bytes()),
                ('MAX_FILES', len(CONTENT) - 1, archive_bytes()),
        ):
            with self.subTest(setting=setting), patch.object(receiver, setting, value):
                with self.assertRaises(ValueError):
                    self.deploy(payload)
        # An oversized header is rejected before reading or allocating its content.
        info = tarfile.TarInfo('index.html')
        info.size = receiver.MAX_FILE_BYTES + 1
        with self.assertRaises(ValueError):
            self.deploy(info.tobuf(format=tarfile.GNU_FORMAT) + bytes(1024))

    def test_asset_mismatch_rolls_back_even_when_index_is_correct(self):
        def wrong_asset(request, timeout):
            if request.full_url.endswith('/static/css/main.css'):
                response = io.BytesIO(b'wrong css')
                response.status = 200
                return response
            return self.http(request, timeout)
        with self.assertRaisesRegex(RuntimeError, 'rolled back'):
            self.deploy(opener=wrong_asset)
        self.assertEqual(self.sleep.call_count, 2)
        self.assertEqual(os.readlink(self.root / 'current'), 'releases/' + self.old_sha)
        self.assertEqual(os.readlink(self.root / 'previous'), 'releases/' + 'c' * 40)
        self.assertFalse((self.root / 'releases' / SHA).exists())

    def test_external_traversal_and_missing_index_assets_are_rejected(self):
        for url in ('https://evil.test/main.js', '//evil.test/main.css', '../main.js',
                    '/static/%2e%2e/main.js', '/missing.js', 'file:///main.js'):
            entries = [('index.html', ('<script src="' + url + '"></script>').encode(), tarfile.REGTYPE)]
            with self.subTest(url=url), self.assertRaises(ValueError):
                self.deploy(archive_bytes(entries))
            self.assertEqual(os.readlink(self.root / 'current'), 'releases/' + self.old_sha)
            self.assertFalse((self.root / 'releases' / SHA).exists())

    def test_same_sha_never_overwrites_existing_content(self):
        self.deploy()
        release = self.root / 'releases' / SHA
        before = {name: (release / name).stat().st_mtime_ns for name in CONTENT}
        self.deploy()
        self.assertEqual(before, {name: (release / name).stat().st_mtime_ns for name in CONTENT})
        changed = [(name, data + b'changed', tarfile.REGTYPE) for name, data in CONTENT.items()]
        with self.assertRaisesRegex(ValueError, 'refusing to modify'):
            self.deploy(archive_bytes(changed))
        self.assertEqual((release / 'static/js/main.js').read_bytes(), CONTENT['static/js/main.js'])
        with self.assertRaises(RuntimeError):
            self.deploy(opener=Mock(side_effect=OSError('connection refused')))
        self.assertTrue(release.is_dir())

    def test_existing_release_symlinks_are_rejected(self):
        release = self.root / 'releases' / SHA
        release.symlink_to(self.old_sha)
        with self.assertRaises(ValueError):
            self.deploy()
        release.unlink()
        self.deploy()
        path = release / 'static/js/main.js'
        path.unlink()
        path.symlink_to('/etc/passwd')
        with self.assertRaises(ValueError):
            self.deploy()

    def test_retention_keeps_three_full_sha_releases_and_protected_links(self):
        releases = self.root / 'releases'
        previous_sha = 'c' * 40
        for number, name in enumerate((self.old_sha, previous_sha, 'd' * 40)):
            path = releases / name
            path.mkdir(exist_ok=True)
            (path / 'index.html').write_bytes(b'old')
            os.utime(path, (number + 1, number + 1))
        (releases / 'legacy').mkdir()
        (releases / ('f' * 40)).symlink_to(self.old_sha)
        self.deploy()
        retained = {path.name for path in releases.iterdir() if len(path.name) == 40 and not path.is_symlink()}
        self.assertEqual(retained, {self.old_sha, previous_sha, SHA})
        self.assertTrue((releases / 'legacy').is_dir())
        self.assertTrue((releases / ('f' * 40)).is_symlink())


if __name__ == '__main__':
    unittest.main()
