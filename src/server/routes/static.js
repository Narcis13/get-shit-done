import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Frontend directory path
const FRONTEND_DIR = resolve(__dirname, '..', '..', 'frontend');

// MIME type mapping
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8'
};

// Security headers
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Cache control headers
const CACHE_HEADERS = {
    'html': 'no-cache, no-store, must-revalidate',
    'css': 'public, max-age=3600',
    'js': 'public, max-age=3600',
    'images': 'public, max-age=86400',
    'fonts': 'public, max-age=2592000'
};

function getCacheHeader(ext) {
    if (ext === '.html') return CACHE_HEADERS.html;
    if (ext === '.css') return CACHE_HEADERS.css;
    if (['.js', '.mjs'].includes(ext)) return CACHE_HEADERS.js;
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) return CACHE_HEADERS.images;
    if (['.woff', '.woff2', '.ttf'].includes(ext)) return CACHE_HEADERS.fonts;
    return CACHE_HEADERS.html;
}

export async function handleStatic(req, res, url) {
    try {
        // Get the requested path
        let pathname = url.pathname;
        
        // Default to index.html for root
        if (pathname === '/') {
            pathname = '/index.html';
        }
        
        // Remove leading slash
        const relativePath = pathname.slice(1);
        
        // Resolve full path and validate it's within frontend directory
        const fullPath = resolve(FRONTEND_DIR, relativePath);
        if (!fullPath.startsWith(FRONTEND_DIR)) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
            return;
        }
        
        // Get file extension
        const ext = extname(fullPath).toLowerCase();
        
        // Determine MIME type
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        
        // Read file
        const content = await readFile(fullPath);
        
        // Set headers
        const headers = {
            'Content-Type': mimeType,
            'Content-Length': content.length,
            'Cache-Control': getCacheHeader(ext),
            ...SECURITY_HEADERS
        };
        
        res.writeHead(200, headers);
        res.end(content);
        
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File not found - return 404
            res.writeHead(404, { 
                'Content-Type': 'text/html',
                ...SECURITY_HEADERS
            });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 Not Found</title>
                    <style>
                        body {
                            font-family: system-ui, -apple-system, sans-serif;
                            background: #1e1e1e;
                            color: #cccccc;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .error {
                            text-align: center;
                        }
                        h1 {
                            font-size: 48px;
                            margin: 0 0 16px;
                        }
                        a {
                            color: #569cd6;
                        }
                    </style>
                </head>
                <body>
                    <div class="error">
                        <h1>404</h1>
                        <p>The requested file was not found.</p>
                        <p><a href="/">Return to IDE</a></p>
                    </div>
                </body>
                </html>
            `);
        } else if (error.code === 'EISDIR') {
            // Directory listing not allowed
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Directory listing not allowed');
        } else {
            // Other errors
            console.error('Static file error:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal server error');
        }
    }
}

// Helper to check if a path should be handled as static
export function isStaticPath(pathname) {
    // API routes are not static
    if (pathname.startsWith('/api/')) {
        return false;
    }
    
    // Root and paths without API prefix are static
    return true;
}