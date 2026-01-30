import { readFile, writeFile, stat, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { validatePath, sanitizePath } from '../security.js';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { rename, unlink } from 'node:fs/promises';

// Get project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

// State file path
const STATE_FILE_PATH = '.planning/current-state.md';

/**
 * Parse request body as text
 */
async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * GET /api/state - Read current project state
 */
export async function handleStateGet(req, res) {
  try {
    // Validate state file path
    const canonicalPath = await validatePath(STATE_FILE_PATH);
    
    try {
      // Read state file content
      const content = await readFile(canonicalPath, 'utf-8');
      const stats = await stat(canonicalPath);
      
      res.writeHead(200, { 
        'Content-Type': 'text/plain; charset=utf-8',
        'X-File-Size': stats.size.toString(),
        'X-File-Modified': stats.mtime.toISOString(),
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        // Return empty state if file doesn't exist
        res.writeHead(200, { 
          'Content-Type': 'text/plain; charset=utf-8',
          'X-File-Size': '0',
          'Cache-Control': 'no-cache'
        });
        res.end('');
      } else {
        throw err;
      }
    }
  } catch (error) {
    console.error('State read error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: error.message || 'Failed to read state' 
    }));
  }
}

/**
 * PUT /api/state - Write current project state with atomic writes
 */
export async function handleStatePut(req, res) {
  try {
    // Validate state file path
    const canonicalPath = await validatePath(STATE_FILE_PATH);
    
    // Parse request body
    const content = await parseBody(req);
    
    // Ensure .planning directory exists
    const dir = dirname(canonicalPath);
    await mkdir(dir, { recursive: true });
    
    // Atomic write: write to temp file then rename
    const tempPath = `${canonicalPath}.${randomBytes(8).toString('hex')}.tmp`;
    
    try {
      // Write to temporary file
      await writeFile(tempPath, content, 'utf-8');
      
      // Atomically rename temp file to target
      await rename(tempPath, canonicalPath);
      
      // Get file stats for response
      const stats = await stat(canonicalPath);
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'X-File-Size': stats.size.toString(),
        'X-File-Modified': stats.mtime.toISOString()
      });
      res.end(JSON.stringify({ 
        success: true,
        path: sanitizePath(canonicalPath),
        size: stats.size,
        modified: stats.mtime.toISOString()
      }));
    } catch (err) {
      // Clean up temp file if it exists
      try {
        await unlink(tempPath);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw err;
    }
  } catch (error) {
    console.error('State write error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: error.message || 'Failed to write state' 
    }));
  }
}