#!/usr/bin/python3 -I
"""Restricted SSH receiver for static React builds; never runs uploaded code."""

import fcntl
import hashlib
from html.parser import HTMLParser
import io
import os
from pathlib import Path
import re
import shutil
import sys
import tarfile
import tempfile
import time
import urllib.parse
import urllib.request

MAX_BYTES = 100 * 1024 * 1024
MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_FILES = 2000
ROOT = Path('/var/www/newpaper-app')
VERIFY_URL = 'http://127.0.0.1:3180'
EXTENSIONS = {'.html', '.js', '.css', '.json', '.txt', '.svg', '.png', '.jpg', '.jpeg',
              '.webp', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.map', '.avif'}


def static_path(name):
    if (not name or name.startswith('/') or '\\' in name
            or any(ord(character) < 32 or ord(character) == 127 for character in name)
            or any(not part or part.startswith('.') for part in name.split('/'))):
        raise ValueError('unsafe static path')
    return name


def read_release(command, stream):
    match = re.fullmatch(r'deploy ([0-9a-f]{40})', command)
    if not match:
        raise ValueError('only deploy followed by a full lowercase commit SHA is allowed')
    payload = stream.read(MAX_BYTES + 1)
    if len(payload) > MAX_BYTES:
        raise ValueError('archive exceeds 100 MiB')
    files = {}
    members = {}
    total = 0
    end = 0
    with tarfile.open(fileobj=io.BytesIO(payload), mode='r:') as archive:
        for member in archive:
            if (member.type not in (tarfile.REGTYPE, tarfile.AREGTYPE, tarfile.DIRTYPE)
                    or member.sparse is not None or member.size < 0):
                raise ValueError('archive may contain only regular static files and directories')
            directory = member.isdir()
            name = member.name
            if name.startswith('./'):
                name = name[2:]
            if directory:
                name = name.removesuffix('/')
            if name == '.' or name == '':
                if not directory or member.name not in ('.', './'):
                    raise ValueError('unsafe archive root')
                name = ''
            else:
                static_path(name)
            if name in members:
                raise ValueError('duplicate archive path')
            members[name] = directory
            if directory:
                if member.size != 0:
                    raise ValueError('directory has content')
            else:
                if Path(name).suffix not in EXTENSIONS:
                    raise ValueError('only static file extensions are allowed')
                total += member.size
                if (member.size > MAX_FILE_BYTES or total > MAX_BYTES
                        or len(files) >= MAX_FILES):
                    raise ValueError('static file size or count limit exceeded')
                with archive.extractfile(member) as source:
                    files[name] = source.read(MAX_FILE_BYTES + 1)
                if len(files[name]) != member.size:
                    raise ValueError('truncated archive member')
            end = member.offset_data + ((member.size + 511) // 512) * 512
    if 'index.html' not in files or any(memoryview(payload)[end:]):
        raise ValueError('archive has no index.html or contains trailing data')
    for name in members:
        for parent in Path(name).parents:
            if str(parent) != '.' and members.get(str(parent)) is False:
                raise ValueError('file is used as a directory')
    return match[1], files


class IndexAssets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        for attribute, value in attrs:
            if attribute not in ('src', 'href') or value is None:
                continue
            url = urllib.parse.urlsplit(value)
            path = urllib.parse.unquote(url.path)
            if Path(path).suffix not in ('.js', '.css'):
                continue
            if url.scheme or url.netloc or path.startswith('//'):
                raise ValueError('index assets must use local static paths')
            if path.startswith('./'):
                path = path[2:]
            self.urls.append(static_path(path.removeprefix('/')))

    handle_startendtag = handle_starttag


def verify_http(files, opener, sleep):
    parser = IndexAssets()
    parser.feed(files['index.html'].decode('utf-8'))
    names = list(dict.fromkeys(['index.html'] + parser.urls))
    if any(name not in files for name in names):
        raise ValueError('index references a missing static asset')
    for attempt in range(3):
        try:
            for name in names:
                request = urllib.request.Request(
                    VERIFY_URL + '/' + urllib.parse.quote(name, safe='/'),
                    headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'},
                )
                with opener(request, timeout=5) as response:
                    actual = response.read(MAX_FILE_BYTES + 1)
                    if (response.status != 200
                            or hashlib.sha256(actual).digest() != hashlib.sha256(files[name]).digest()):
                        raise ValueError('HTTP content differs for ' + name)
            return
        except (OSError, ValueError) as error:
            if attempt == 2:
                raise RuntimeError('HTTP verification failed; deployment rolled back') from error
            sleep(1)


def replace_link(path, target):
    # The deployment lock protects this fixed temporary name.
    temporary = path.with_name('.' + path.name + '.next')
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target)
    os.replace(temporary, path)


def release_files(release):
    if release.is_symlink() or not release.is_dir():
        raise ValueError('existing release is not a static directory')
    files = {}
    for directory, directories, names in os.walk(release, followlinks=False):
        for name in directories + names:
            path = Path(directory) / name
            relative = path.relative_to(release).as_posix()
            static_path(relative)
            if path.is_symlink():
                raise ValueError('existing release contains a symlink')
            if name in names:
                if not path.is_file() or path.suffix not in EXTENSIONS:
                    raise ValueError('existing release contains a non-static file')
                if path.stat().st_size > MAX_FILE_BYTES or len(files) >= MAX_FILES:
                    raise ValueError('existing release exceeds static limits')
                files[relative] = path.read_bytes()
    if 'index.html' not in files or sum(map(len, files.values())) > MAX_BYTES:
        raise ValueError('existing release is not a complete static release')
    return files


def deploy(command, stream, root=ROOT, opener=None, sleep=time.sleep):
    if opener is None:
        # Local verification must not use environment-configured proxies or redirects.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect()).open
    with (root / '.deploy.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        sha, files = read_release(command, stream)
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
            if release_files(release) != files:
                raise ValueError('existing release content differs; refusing to modify it')
        else:
            retained = [path for path in releases.iterdir()
                        if re.fullmatch(r'[0-9a-f]{40}', path.name)
                        and not path.is_symlink() and path.is_dir()]
            protected = {link.resolve() for link in (current, previous)}
            for candidate in sorted(retained, key=lambda path: path.stat().st_mtime_ns):
                if len(retained) < 3:
                    break
                if candidate.resolve() in protected:
                    continue
                release_files(candidate)
                shutil.rmtree(candidate)
                retained.remove(candidate)
            if len(retained) >= 3:
                raise ValueError('release retention limit reached; no safe release to remove')
            temporary = Path(tempfile.mkdtemp(prefix='.incoming-', dir=releases))
            try:
                for name, content in files.items():
                    path = temporary / name
                    path.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
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


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, file, code, message, headers, new_url):
        raise ValueError('local verification must not redirect')


if __name__ == '__main__':
    try:
        print('Deployed ' + deploy(os.environ.get('SSH_ORIGINAL_COMMAND', ''), sys.stdin.buffer))
    except Exception as error:
        print('Deployment failed: ' + str(error), file=sys.stderr)
        sys.exit(1)
