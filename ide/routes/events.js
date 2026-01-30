/**
 * Route handler for SSE events
 * GET /api/events - Server-Sent Events for file changes
 */

/**
 * Handle SSE connection for file change events
 *
 * @param {object} req - HTTP request object
 * @param {object} res - HTTP response object
 * @param {EventEmitter} emitter - Event emitter from watcher
 */
export function handleSSE(req, res, emitter) {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Keep connection alive with comments every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);

  // Send event to client
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Register listener for file changes
  emitter.on('change', sendEvent);

  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(keepAlive);
    emitter.off('change', sendEvent);
  });
}
