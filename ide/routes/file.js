/**
 * Route handler for file operations
 * GET /api/file - read file content
 * PUT /api/file - write file content
 */

import { readFile, writeFile } from 'node:fs/promises';
import { validatePath } from '../lib/security.js';

/**
 * Handle file read/write requests
 *
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {string} mode - 'read' or 'write'
 */
export async function handleFile(req, res, mode) {
  try {
    // Parse path from URL query parameter
    const url = new URL(req.url, `http://${req.headers.host}`);
    const requestedPath = url.searchParams.get('path');

    if (!requestedPath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }

    // Validate path (throws on invalid)
    let canonicalPath;
    try {
      canonicalPath = await validatePath(requestedPath);
    } catch (err) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }

    if (mode === 'read') {
      // Read file content
      try {
        const content = await readFile(canonicalPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(content);
      } catch (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'File not found' }));
        } else {
          throw err;
        }
      }
    } else if (mode === 'write') {
      // Collect request body
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString('utf-8');

      // Write file content
      await writeFile(canonicalPath, body, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    }
  } catch (err) {
    console.error('Error handling file request:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
