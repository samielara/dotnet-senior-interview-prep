#!/usr/bin/env python3
"""
Zero-dependency local HTTP server for .NET Senior Interview Prep Platform.
Binds to port 5050 and automatically opens the browser.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time

# Ensure UTF-8 output encoding across Windows consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 5050
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class DualStackServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def handle_error(self, request, client_address):
        # Gracefully handle Windows client disconnects (ConnectionResetError WinError 10054)
        exc_type, exc_val, _ = sys.exc_info()
        if exc_type is ConnectionResetError or (isinstance(exc_val, OSError) and getattr(exc_val, 'winerror', None) == 10054):
            return
        super().handle_error(request, client_address)

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS and disable aggressive caching for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def guess_type(self, path):
        # Ensure correct JavaScript MIME types across Windows registries
        if path.endswith('.js'):
            return 'application/javascript'
        if path.endswith('.css'):
            return 'text/css'
        if path.endswith('.html'):
            return 'text/html'
        if path.endswith('.json'):
            return 'application/json'
        if path.endswith('.svg'):
            return 'image/svg+xml'
        return super().guess_type(path)

def open_browser():
    time.sleep(1.0)
    url = f"http://localhost:{PORT}"
    print(f"\n🚀 Opening browser automatically at {url} ...")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not open browser automatically: {e}")

def run_server():
    os.chdir(DIRECTORY)
    with DualStackServer(("", PORT), CustomHTTPHandler) as httpd:
        print("=" * 70)
        print("⚡ .NET SENIOR FULL-STACK INTERVIEW PREPARATION PLATFORM")
        print("=" * 70)
        print(f"📍 Local Server running at: http://localhost:{PORT}")
        print(f"📂 Serving directory:       {DIRECTORY}")
        print("⌨️  Press Ctrl+C to stop the server.")
        print("=" * 70)
        
        # Launch browser in a background thread
        browser_thread = threading.Thread(target=open_browser, daemon=True)
        browser_thread.start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user.")
            httpd.server_close()
            sys.exit(0)

if __name__ == '__main__':
    run_server()
