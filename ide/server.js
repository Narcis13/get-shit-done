/**
 * GSD IDE Server
 * Localhost-only HTTP server with file APIs and real-time updates
 */

import { createServer } from 'node:http';
import { resolve } from 'node:path';
import open from 'open';
import { createWatcher } from './lib/watcher.js';
import { validateHost } from './lib/security.js';
import { handleTree } from './routes/tree.js';
import { handleFile } from './routes/file.js';
import { handleSSE } from './routes/events.js';

const PROJECT_ROOT = process.cwd();
const WATCHED_DIRS = ['commands', 'looppool', 'agents'].map((d) =>
  resolve(PROJECT_ROOT, d)
);
const PORT = 3456;

// Create file watcher
const watcher = createWatcher(WATCHED_DIRS);

// Create HTTP server
const server = createServer((req, res) => {
  // DNS rebinding protection
  if (!validateHost(req)) {
    res.writeHead(403);
    res.end('Forbidden: Invalid Host header');
    return;
  }

  // Parse URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Route requests
  if (req.method === 'GET' && pathname === '/api/tree') {
    handleTree(req, res);
  } else if (req.method === 'GET' && pathname === '/api/file') {
    handleFile(req, res, 'read');
  } else if (req.method === 'PUT' && pathname === '/api/file') {
    handleFile(req, res, 'write');
  } else if (req.method === 'GET' && pathname === '/api/events') {
    handleSSE(req, res, watcher.emitter);
  } else if (pathname.startsWith('/api/')) {
    // Unknown API endpoint
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } else {
    // Non-API routes return 404 (static serving in future phase)
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

// Start server
server.listen(PORT, '127.0.0.1', () => {
  console.log(`GSD IDE running at http://localhost:${PORT}`);

  // Open browser after short delay
  setTimeout(async () => {
    try {
      await open(`http://localhost:${PORT}`);
    } catch (err) {
      // Silently ignore browser open errors
    }
  }, 500);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await watcher.close();
  server.close();
  process.exit(0);
});
