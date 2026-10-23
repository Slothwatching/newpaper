#!/usr/bin/python3 -I
"""Restricted SSH receiver; install root-owned at /usr/local/lib/newpaper-deploy.py."""

import fcntl
import hashlib
import io
import os
from pathlib import Path
import re
import shutil
import sys
import tarfile
import tempfile
import time
import urllib.request

FILES = ('index.html', 'style.css', 'app.js')
MAX_BYTES = 5 * 1024 * 1024
ROOT = Path('/var/www/newpaper')


def read_release(command, stream):
    match = re.fullmatch(r'deploy ([0-9a-f]{40})', command)
    if not match:
        raise ValueError('only deploy followed by a full lowercase commit SHA is allowed')
    payload = stream.read(MAX_BYTES + 1)
    if len(payload) > MAX_BYTES:
        raise ValueError('archive exceeds 5 MiB')
    files = {}
    total = 0
    end = 0
    with tarfile.open(fileobj=io.BytesIO(payload), mode='r:') as archive:
        for member in archive:
            if (member.name not in FILES or member.name in files
                    or member.type not in (tarfile.REGTYPE, tarfile.AREGTYPE)
                    or member.sparse is not None or member.size < 0):
                raise ValueError('archive must contain only the three regular static files')
            total += member.size
            if total > MAX_BYTES:
                raise ValueError('unpacked files exceed 5 MiB')
            with archive.extractfile(member) as source:
                files[member.name] = source.read(MAX_BYTES + 1)
            if len(files[member.name]) != member.size:
                raise ValueError('truncated archive member')
            end = member.offset_data + ((member.size + 511) // 512) * 512
    if set(files) != set(FILES) or any(payload[end:]):
        raise ValueError('archive has missing files or trailing data')
    return match[1], files


def replace_link(path, target):
    # The deployment lock protects this fixed temporary name.
    temporary = path.with_name('.' + path.name + '.next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    os.replace(temporary, path)


def verify_http(files, opener, sleep):
    for attempt in range(3):
        try:
            for name, expected in files.items():
                request = urllib.request.Request(
                    'http://127.0.0.1/' + name,
                    headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'},
                )
                with opener(request, timeout=5) as response:
                    actual = response.read(MAX_BYTES + 1)
                    if response.status != 200 or hashlib.sha256(actual).digest() != hashlib.sha256(expected).digest():
                        raise ValueError('HTTP content differs for ' + name)
            return
        except (OSError, ValueError) as error:
            if attempt == 2:
                raise RuntimeError('HTTP verification failed; deployment rolled back') from error
            sleep(1)


def deploy(command, stream, root=ROOT, opener=None, sleep=time.sleep):
    sha, files = read_release(command, stream)
    if opener is None:
        # Local verification must not be routed through environment-configured proxies.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({})).open
    with (root / '.deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        releases = root / 'releases'
        releases.mkdir(exist_ok=True)
        current = root / 'current'
        previous = root / 'previous'
        for link in (current, previous):
            if link.exists() and not link.is_symlink():
                raise ValueError(link.name + ' must be a symlink')
        old_current = os.readlink(current) if current.is_symlink() else None
        release = releases / sha
        created = False
        if release.exists() or release.is_symlink():
            if release.is_symlink() or not release.is_dir() or {p.name for p in release.iterdir()} != set(FILES):
                raise ValueError('existing release is not an immutable static release')
            for name, content in files.items():
                path = release / name
                if path.is_symlink() or not path.is_file() or path.read_bytes() != content:
                    raise ValueError('existing release content differs; refusing to modify it')
        else:
            retained = [path for path in releases.iterdir()
                        if re.fullmatch(r'[0-9a-f]{40}', path.name)
                        and not path.is_symlink() and path.is_dir()]
            protected = {link.resolve() for link in (current, previous)}
            for candidate in sorted(retained, key=lambda path: path.stat().st_mtime_ns):
                if len(retained) < 5:
                    break
                if candidate.resolve() in protected:
                    continue
                members = list(candidate.iterdir())
                if ({path.name for path in members} != set(FILES)
                        or any(path.is_symlink() or not path.is_file() for path in members)):
                    continue
                shutil.rmtree(candidate)
                retained.remove(candidate)
            if len(retained) >= 5:
                raise ValueError('release retention limit reached; no safe release to remove')
            temporary = Path(tempfile.mkdtemp(prefix='.incoming-', dir=releases))
            try:
                for name, content in files.items():
                    path = temporary / name
                    path.write_bytes(content)
                    path.chmod(0o644)
                temporary.chmod(0o755)
                temporary.rename(release)
                created = True
            finally:
                if temporary.exists():
                    shutil.rmtree(temporary)
        target = 'releases/' + sha
        try:
            replace_link(current, target)
            verify_http(files, opener, sleep)
            if old_current is not None and old_current != target:
                replace_link(previous, old_current)
        except BaseException:
            if old_current is None:
                current.unlink(missing_ok=True)
            else:
                replace_link(current, old_current)
            if created:
                shutil.rmtree(release)
            raise
    return sha


if __name__ == '__main__':
    try:
        print('Deployed ' + deploy(os.environ.get('SSH_ORIGINAL_COMMAND', ''), sys.stdin.buffer))
    except Exception as error:
        print('Deployment failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
