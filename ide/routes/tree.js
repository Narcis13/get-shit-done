/**
 * Route handler for GET /api/tree
 * Returns combined directory tree for allowed directories
 */

import { resolve } from 'node:path';
import { buildTree } from '../lib/tree-builder.js';

const PROJECT_ROOT = process.cwd();
const ALLOWED_DIRS = ['commands', 'looppool', 'agents'];

/**
 * Handle GET /api/tree request
 * Returns JSON array of directory trees for allowed directories
 *
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 */
export async function handleTree(req, res) {
  try {
    const trees = [];

    for (const dirName of ALLOWED_DIRS) {
      const dirPath = resolve(PROJECT_ROOT, dirName);
      const tree = await buildTree(dirPath, dirPath);

      trees.push({
        name: dirName,
        path: dirName,
        type: 'directory',
        children: tree,
      });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(trees));
  } catch (err) {
    console.error('Error building tree:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}
