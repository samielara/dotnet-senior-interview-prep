#!/usr/bin/env node
/**
 * Zero-dependency Node HTTP server for .NET Senior Interview Prep Platform.
 * Binds to port 5050 and automatically opens the browser.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 5050;
const DIRECTORY = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIRECTORY, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

  // Security: prevent path traversal
  if (!filePath.startsWith(DIRECTORY)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('='.repeat(70));
  console.log('⚡ .NET SENIOR FULL-STACK INTERVIEW PREPARATION PLATFORM');
  console.log('='.repeat(70));
  console.log(`📍 Local Server running at: ${url}`);
  console.log(`📂 Serving directory:       ${DIRECTORY}`);
  console.log('⌨️  Press Ctrl+C to stop the server.');
  console.log('='.repeat(70));

  // Automatically open browser on Windows
  const startCmd = process.platform === 'win32' ? `start "" "${url}"` :
                   process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(startCmd, () => {});
});
