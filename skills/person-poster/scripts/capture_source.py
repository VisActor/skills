#!/usr/bin/env python3
"""Capture an original public response or user input; never certifies source truth."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

MAX_BYTES = 16 * 1024 * 1024


def capture_source(root: Path, source_id: str, *, url=None, input_file=None, exported_url=None,
                   acquisition_note=None) -> dict:
    root = root.resolve()
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,63}', source_id):
        raise ValueError('Source id must use lowercase letters, digits and hyphens')
    folder = root / 'evidence' / source_id
    if not folder.resolve().is_relative_to(root):
        raise ValueError('Source capture must stay inside the bundle')
    if folder.exists():
        raise ValueError('Source snapshot already exists; use a new id to preserve original evidence')
    if bool(url) == bool(input_file):
        raise ValueError('Choose one public URL or original input file')
    content_type, final_url = '', None
    if url:
        parts = urlsplit(url)
        if parts.scheme not in ('http', 'https') or parts.username or parts.password:
            raise ValueError('Use a public http(s) source without embedded credentials')
        with urlopen(Request(url, headers={'User-Agent': 'person-poster-source-capture/1'}), timeout=30) as response:
            content = response.read(MAX_BYTES + 1)
            final_url, content_type = response.geturl(), response.headers.get('Content-Type', '')
        kind, source = 'web', url
    else:
        path = Path(input_file).resolve()
        if path.stat().st_size > MAX_BYTES:
            raise ValueError('Source exceeds capture size limit')
        content, source = path.read_bytes(), str(path)
        kind = 'user-input'
        if exported_url:
            if urlsplit(exported_url).scheme not in ('http', 'https') or not acquisition_note:
                raise ValueError('Host export needs its actual URL and acquisition record')
            kind, source, final_url = 'web-export', exported_url, exported_url
    if not content or len(content) > MAX_BYTES:
        raise ValueError('Source is empty or exceeds capture size limit')
    stripped = content.lstrip()
    fmt = 'json' if stripped.startswith((b'{', b'[')) else 'html'
    if fmt == 'html' and b'<' not in content:
        raise ValueError('Capture original HTML/JSON, not a handwritten text summary')
    raw = f'evidence/{source_id}/raw.{fmt}'
    metadata = {'version': 1, 'kind': kind, 'source': source, 'requestedUrl': url,
                'finalUrl': final_url, 'capturedAt': datetime.now(timezone.utc).isoformat(),
                'contentType': content_type, 'format': fmt, 'raw': raw,
                'sha256': hashlib.sha256(content).hexdigest(), 'acquisitionNote': acquisition_note,
                'scope': 'Original bytes and acquisition trace only; authority and semantics require review.'}
    folder.mkdir(parents=True)
    (root / raw).write_bytes(content)
    (folder / 'capture.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')
    return metadata


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bundle', type=Path, required=True)
    parser.add_argument('--id', required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url')
    group.add_argument('--input', type=Path)
    parser.add_argument('--exported-url')
    parser.add_argument('--acquisition-note')
    args = parser.parse_args()
    try:
        print(json.dumps(capture_source(args.bundle, args.id, url=args.url, input_file=args.input,
                         exported_url=args.exported_url, acquisition_note=args.acquisition_note), ensure_ascii=False))
        return 0
    except (OSError, ValueError) as error:
        print(json.dumps({'passed': False, 'errors': [str(error)]}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
