#!/usr/bin/env python3
import json
import os
import time
from http.server import HTTPServer, BaseHTTPRequestHandler


DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
DB_PATH = os.path.join(DATA_DIR, 'db.jsonl')


def ensure_storage():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DB_PATH):
        with open(DB_PATH, 'w', encoding='utf-8') as f:
            f.write('')


class SimpleAPI(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        ensure_storage()
        length = int(self.headers.get('Content-Length', '0'))
        raw = self.rfile.read(length) if length > 0 else b''
        try:
            payload = json.loads(raw.decode('utf-8') or '{}')
        except Exception:
            payload = {'_raw': raw.decode('utf-8', errors='replace')}

        record = {
            'ts': int(time.time()),
            'iso': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'path': self.path,
            'ip': self.client_address[0] if self.client_address else None,
            'payload': payload,
            'ua': self.headers.get('User-Agent'),
        }

        # Very simple routing based on path
        if self.path not in ['/api/waitlist', '/api/interest', '/api/preorder']:
            self.send_response(404)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': False, 'error': 'not_found'}).encode('utf-8'))
            return

        # Append as JSON line
        try:
            with open(DB_PATH, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record, ensure_ascii=False) + '\n')
        except Exception as e:
            self.send_response(500)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': False, 'error': 'write_failed', 'detail': str(e)}).encode('utf-8'))
            return

        self.send_response(200)
        self._set_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'ok': True}).encode('utf-8'))


def main():
    port = int(os.environ.get('PORT', '8001'))
    addr = ('0.0.0.0', port)
    httpd = HTTPServer(addr, SimpleAPI)
    print(f"API server listening on http://localhost:{port}")
    print(f"Writing to {DB_PATH}")
    httpd.serve_forever()


if __name__ == '__main__':
    main()


