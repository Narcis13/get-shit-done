/**
 * Security utilities for IDE server
 * - Path traversal prevention
 * - DNS rebinding protection via Host header validation
 */

import { resolve, relative, normalize } from 'node:path';
import { realpath } from 'node:fs/promises';

const PROJECT_ROOT = process.cwd();
const ALLOWED_DIRS = ['commands', 'looppool', 'agents', '.planning'];
const ALLOWED_HOSTS = ['localhost:3456', '127.0.0.1:3456', '[::1]:3456'];

/**
 * Validate and resolve a requested path to its canonical form.
 * Multi-layer validation prevents path traversal attacks.
 *
 * @param {string} requestedPath - User-provided path (may be URL-encoded)
 * @returns {Promise<string>} Canonical absolute path if valid
 * @throws {Error} If path escapes allowed directories
 */
export async function validatePath(requestedPath) {
  // Step 1: Decode URL-encoded characters
  const decoded = decodeURIComponent(requestedPath);

  // Step 2: Normalize and resolve to absolute path
  const normalized = normalize(decoded);
  const absolute = resolve(PROJECT_ROOT, normalized);

  // Step 3: Resolve symlinks to canonical path
  let canonical;
  try {
    canonical = await realpath(absolute);
  } catch {
    // File doesn't exist yet (for writes) - validate parent directory
    const parentPath = resolve(absolute, '..');
    const parentCanonical = await realpath(parentPath);
    const fileName = absolute.split('/').pop();
    canonical = resolve(parentCanonical, fileName);
  }

  // Step 4: Ensure within project root
  if (!canonical.startsWith(PROJECT_ROOT)) {
    throw new Error('Path escapes project root');
  }

  // Step 5: Ensure within allowed directories
  const relativePath = relative(PROJECT_ROOT, canonical);
  const topDir = relativePath.split('/')[0];

  if (!ALLOWED_DIRS.includes(topDir)) {
    throw new Error(`Path not in allowed directories: ${ALLOWED_DIRS.join(', ')}`);
  }

  return canonical;
}

/**
 * Validate Host header to prevent DNS rebinding attacks.
 * Only localhost connections are allowed.
 *
 * @param {object} req - HTTP request object with headers
 * @returns {boolean} True if Host header is valid, false otherwise
 */
export function validateHost(req) {
  const host = req.headers?.host;
  if (!host) {
    return false;
  }
  return ALLOWED_HOSTS.includes(host);
}
