#!/usr/bin/env python3
"""
Simple zero-dependency HTTP server for Render Python Web Service fallback or local development.
"""
import os
import http.server
import socketserver

PORT = int(os.environ.get("PORT", 8080))

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add basic cache headers
        if self.path.endswith('.html') or self.path == '/':
            self.send_header('Cache-Control', 'no-cache')
        else:
            self.send_header('Cache-Control', 'public, max-age=3600')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    with socketserver.TCPServer(("0.0.0.0", PORT), CustomHandler) as httpd:
        print(f"Serving at http://0.0.0.0:{PORT}")
        httpd.serve_forever()

