# Phase 7: IDE Server - Research

**Researched:** 2026-01-30
**Domain:** Node.js HTTP Server, File Watching, SSE, Security
**Confidence:** HIGH

## Summary

Phase 7 implements a localhost-only HTTP server that provides file APIs (tree, read, write), security (path traversal prevention, DNS rebinding protection), and real-time updates (SSE for file changes). The server is intentionally minimal, using Node.js native `http` module rather than Express to maintain zero production dependencies.

The recommended approach uses Node.js native `http` for the server, `chokidar` v5 for file watching, native SSE (no library needed), and the `open` package for browser launch. All dependencies are devDependencies bundled at build time.

**Primary recommendation:** Use Node.js native `http` module with explicit path validation, chokidar v5 for file watching, and SSE via standard HTTP response streaming.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `http` | native (Node 20+) | HTTP server | Zero dependencies, sufficient for localhost-only server with 4-5 endpoints |
| chokidar | 5.x | File watching | Cross-platform file watching, 1 dependency, ESM-only, handles FSEvents on macOS |
| open | 11.x | Browser launch | Cross-platform browser opening, handles macOS/Windows/Linux differences |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js `fs/promises` | native | File operations | Reading/writing files, directory listing |
| Node.js `path` | native | Path resolution | Joining paths, resolving to absolute, security validation |
| Node.js `url` | native | URL parsing | Parsing query parameters from request URLs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `http` | Express | Express adds 500KB+ dependencies for features not needed on localhost |
| Native `http` | Fastify | Fastify adds 200KB+ dependencies, overkill for 5 endpoints |
| chokidar | fs.watch | fs.watch is unreliable cross-platform, inconsistent events on macOS |

**Installation:**
```bash
npm install -D chokidar@^5 open@^11
```

Note: Both installed as devDependencies. The server code is bundled via esbuild, maintaining zero production dependencies.

## Architecture Patterns

### Recommended Project Structure
```
ide/
├── server.js            # Main server entry point
├── routes/
│   ├── tree.js          # GET /api/tree - directory listing
│   ├── file.js          # GET/PUT /api/file - file operations
│   └── events.js        # GET /api/events - SSE endpoint
├── lib/
│   ├── security.js      # Path validation, Host header checks
│   ├── watcher.js       # chokidar setup and event dispatch
│   └── tree-builder.js  # Recursive directory tree JSON
└── dist/                # Built frontend (served as static)
```

### Pattern 1: Native HTTP Router
**What:** Simple request routing without frameworks
**When to use:** Localhost dev servers with fewer than 10 endpoints
**Example:**
```javascript
// Source: Node.js native http pattern
import { createServer } from 'node:http';

const routes = {
  'GET /api/tree': handleTree,
  'GET /api/file': handleFileRead,
  'PUT /api/file': handleFileWrite,
  'GET /api/events': handleSSE,
};

const server = createServer((req, res) => {
  const key = `${req.method} ${req.url.split('?')[0]}`;
  const handler = routes[key];

  if (handler) {
    handler(req, res);
  } else if (req.url.startsWith('/api/')) {
    res.writeHead(404);
    res.end('Not found');
  } else {
    // Serve static files from dist/
    serveStatic(req, res);
  }
});

server.listen(3456, '127.0.0.1');
```

### Pattern 2: SSE Event Streaming
**What:** Server-Sent Events for real-time file change notifications
**When to use:** One-way server-to-client push (file changes, status updates)
**Example:**
```javascript
// Source: Node.js SSE pattern (official spec)
function handleSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  // Send file change events
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Register listener with watcher
  watcher.on('change', sendEvent);

  req.on('close', () => {
    clearInterval(keepAlive);
    watcher.off('change', sendEvent);
  });
}
```

### Pattern 3: Path Traversal Prevention
**What:** Multi-layer path validation to prevent escaping allowed directories
**When to use:** Any file server accepting user-provided paths
**Example:**
```javascript
// Source: OWASP/Node.js Security Best Practices
import { resolve, relative, normalize } from 'node:path';
import { realpath } from 'node:fs/promises';

const PROJECT_ROOT = process.cwd();
const ALLOWED_DIRS = ['commands', 'looppool', 'agents', '.planning'];

async function validatePath(requestedPath) {
  // Step 1: Decode URL-encoded characters
  const decoded = decodeURIComponent(requestedPath);

  // Step 2: Normalize and resolve to absolute
  const normalized = normalize(decoded);
  const absolute = resolve(PROJECT_ROOT, normalized);

  // Step 3: Resolve symlinks to canonical path
  let canonical;
  try {
    canonical = await realpath(absolute);
  } catch {
    // File doesn't exist yet (for writes) - use parent
    canonical = await realpath(resolve(absolute, '..'));
    canonical = resolve(canonical, absolute.split('/').pop());
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
```

### Pattern 4: Host Header Validation (DNS Rebinding Protection)
**What:** Reject requests with unexpected Host headers
**When to use:** Localhost servers accessible only from same machine
**Example:**
```javascript
// Source: Node.js Security Best Practices
const ALLOWED_HOSTS = [
  'localhost:3456',
  '127.0.0.1:3456',
  '[::1]:3456',
];

function validateHost(req) {
  const host = req.headers.host;
  if (!host || !ALLOWED_HOSTS.includes(host)) {
    return false;
  }
  return true;
}

// In request handler:
if (!validateHost(req)) {
  res.writeHead(403);
  res.end('Forbidden: Invalid Host header');
  return;
}
```

### Anti-Patterns to Avoid
- **String concatenation for paths:** Never use `baseDir + userPath`. Always use `path.resolve()` then validate.
- **Trusting path.normalize alone:** Normalize removes redundant separators but doesn't prevent traversal.
- **Skipping symlink resolution:** Symlinks can escape allowed directories. Always use `realpath()`.
- **Watching root directory:** Watch specific directories, not the entire project root.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File watching | Custom fs.watch wrapper | chokidar | Cross-platform consistency, debouncing, atomic write detection |
| Browser launch | Child process spawn | `open` package | Platform detection, WSL support, app arguments |
| Path security | Simple startsWith check | Multi-layer validation with realpath | Symlinks, URL encoding, normalization bypasses |
| SSE heartbeat | Manual timeout | Built-in keepalive comments | Browser reconnection behavior varies |

**Key insight:** File watching and path security have edge cases that take months to discover. chokidar handles atomic saves, OS-specific events, and EMFILE limits. Path validation must handle symlinks, URL encoding, and Unicode normalization attacks.

## Common Pitfalls

### Pitfall 1: EMFILE (Too Many Open Files)
**What goes wrong:** Watching too many files exhausts file descriptor limits
**Why it happens:** chokidar opens file handles for each watched path; default ulimit is often 256-1024
**How to avoid:**
- Watch only needed directories: `['commands', 'looppool', 'agents']`
- Use `depth` option to limit recursion
- Use `ignored` option to skip node_modules, .git
**Warning signs:** Server crashes on startup with EMFILE error

```javascript
// Good: Scoped watching
chokidar.watch(['commands', 'looppool', 'agents'], {
  ignored: /(^|[\/\\])\../,  // Ignore dotfiles
  depth: 10,
  persistent: true,
});

// Bad: Watch everything
chokidar.watch('.', { persistent: true });
```

### Pitfall 2: Symlink Escape Vulnerability
**What goes wrong:** User creates symlink inside allowed directory pointing outside
**Why it happens:** Path validation checks initial path but not resolved target
**How to avoid:** Always use `fs.realpath()` to resolve canonical path before validation
**Warning signs:** Paths like `commands/../../../etc/passwd` or symlinks resolving outside project

### Pitfall 3: Race Condition in Path Validation (TOCTOU)
**What goes wrong:** Path is valid at check time but symlink changes before use
**Why it happens:** Time-of-check to time-of-use gap
**How to avoid:**
- Use `fs.openSync` with `O_NOFOLLOW` flag for writes
- Or accept that localhost dev tools have lower threat model
**Warning signs:** Only relevant if running in hostile environment

### Pitfall 4: SSE Connection Limits
**What goes wrong:** Browser limits concurrent SSE connections to same origin (6 in older browsers)
**Why it happens:** HTTP/1.1 connection limits
**How to avoid:**
- Use single SSE connection per browser window
- Modern browsers with HTTP/2 have higher limits
**Warning signs:** Some tabs don't receive updates

### Pitfall 5: Request Body Parsing
**What goes wrong:** PUT request body not collected before processing
**Why it happens:** Node.js streams request body in chunks
**How to avoid:** Collect chunks and parse on 'end' event
**Warning signs:** Empty file contents, partial writes

```javascript
// Correct: Collect request body
async function handleFileWrite(req, res) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString('utf-8');
  // Now safe to parse/use body
}
```

## Code Examples

Verified patterns from official sources:

### Directory Tree Builder
```javascript
// Source: Node.js fs/promises recursive pattern
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function buildTree(dir, baseDir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const tree = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      tree.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children: await buildTree(fullPath, baseDir),
      });
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      tree.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
      });
    }
  }

  return tree.sort((a, b) => {
    // Directories first, then alphabetical
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
```

### chokidar Watcher Setup
```javascript
// Source: chokidar GitHub documentation (v5)
import chokidar from 'chokidar';
import { EventEmitter } from 'node:events';

export function createWatcher(directories) {
  const emitter = new EventEmitter();

  const watcher = chokidar.watch(directories, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
    depth: 10,
  });

  watcher
    .on('change', (path) => emitter.emit('change', { event: 'change', path }))
    .on('add', (path) => emitter.emit('change', { event: 'add', path }))
    .on('unlink', (path) => emitter.emit('change', { event: 'unlink', path }))
    .on('error', (error) => console.error('Watcher error:', error));

  return {
    emitter,
    close: () => watcher.close(),
  };
}
```

### Browser Launch on Server Start
```javascript
// Source: open package GitHub (v11)
import open from 'open';
import { createServer } from 'node:http';

const server = createServer(handler);

server.listen(3456, '127.0.0.1', async () => {
  console.log('IDE server running at http://localhost:3456');

  // Open browser after short delay to ensure server is ready
  setTimeout(async () => {
    try {
      await open('http://localhost:3456');
    } catch (err) {
      console.log('Could not open browser automatically');
    }
  }, 500);
});
```

### Complete Server Startup Pattern
```javascript
// Source: Composite pattern from research
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import open from 'open';
import { createWatcher } from './lib/watcher.js';
import { handleTree } from './routes/tree.js';
import { handleFile } from './routes/file.js';
import { handleSSE } from './routes/events.js';
import { validateHost } from './lib/security.js';

const PROJECT_ROOT = process.cwd();
const WATCHED_DIRS = ['commands', 'looppool', 'agents'].map(d => resolve(PROJECT_ROOT, d));

const watcher = createWatcher(WATCHED_DIRS);

const server = createServer((req, res) => {
  // DNS rebinding protection
  if (!validateHost(req)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const route = `${req.method} ${url.pathname}`;

  switch (route) {
    case 'GET /api/tree':
      return handleTree(req, res);
    case 'GET /api/file':
      return handleFile(req, res, 'read');
    case 'PUT /api/file':
      return handleFile(req, res, 'write');
    case 'GET /api/events':
      return handleSSE(req, res, watcher.emitter);
    default:
      // Serve static frontend
      serveStatic(req, res, url.pathname);
  }
});

server.listen(3456, '127.0.0.1', () => {
  console.log('GSD IDE running at http://localhost:3456');
  open('http://localhost:3456').catch(() => {});
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await watcher.close();
  server.close();
  process.exit(0);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chokidar v3 (CJS) | chokidar v5 (ESM-only) | Nov 2025 | Node 20+ required, cleaner API |
| Express for dev servers | Native http | 2024+ | Zero dependencies for simple servers |
| WebSocket for updates | SSE | Always valid | Simpler for one-way push |
| fs.watch | chokidar | Always | Cross-platform reliability |

**Deprecated/outdated:**
- chokidar v3/v4 glob patterns: No longer supported in v5. Use `ignored` option with filter functions.
- open package CommonJS: v10+ is ESM-only. Use dynamic `import()` if needed in CJS.

## Open Questions

Things that couldn't be fully resolved:

1. **Static file serving**
   - What we know: Need to serve bundled frontend from `dist/`
   - What's unclear: Whether to use `send` package or custom handler
   - Recommendation: Start with custom simple handler; add `send` if range requests or caching needed

2. **CORS configuration**
   - What we know: Browser on localhost:3456 accessing API on localhost:3456 (same origin)
   - What's unclear: Whether any CORS headers needed for SSE
   - Recommendation: Add `Access-Control-Allow-Origin: *` to SSE responses only; test in Firefox

## Sources

### Primary (HIGH confidence)
- [chokidar GitHub](https://github.com/paulmillr/chokidar) - v5 API, ESM-only, Node 20+ requirement
- [open GitHub](https://github.com/sindresorhus/open) - v11 API, cross-platform browser launch
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security) - DNS rebinding, path validation
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html) - Path traversal prevention

### Secondary (MEDIUM confidence)
- [Node.js January 2026 Security Release](https://nodejs.org/en/blog/vulnerability/december-2025-security-releases) - Symlink escape vulnerability CVE
- [DigitalOcean SSE Tutorial](https://www.digitalocean.com/community/tutorials/nodejs-server-sent-events-build-realtime-app) - SSE implementation pattern
- [StackHawk Path Traversal Guide](https://www.stackhawk.com/blog/node-js-path-traversal-guide-examples-and-prevention/) - Multi-layer validation

### Tertiary (LOW confidence)
- [chokidar EMFILE issues](https://github.com/paulmillr/chokidar/issues/1155) - Community workarounds for file limits

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified via official docs and npm
- Architecture: HIGH - Based on Node.js documentation and official examples
- Pitfalls: HIGH - Verified via CVEs, GitHub issues, and official security advisories

**Research date:** 2026-01-30
**Valid until:** 60 days (stable domain, mature libraries)
