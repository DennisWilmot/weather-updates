/**
 * Node.js Runtime Adapter
 * 
 * Provides a Node.js server implementation using @hono/node-server.
 * Suitable for deployment on Node.js-compatible platforms (Railway, Fly.io, etc.)
 */

import { serve } from '@hono/node-server';
import type { Hono } from 'hono';

export interface NodeServerOptions {
  port?: number;
  hostname?: string;
}

/**
 * Start the Hono app as a Node.js HTTP server
 */
export function createNodeServer(
  app: Hono,
  options: NodeServerOptions = {}
): void {
  const port = options.port || Number(process.env.PORT) || 3001;
  const hostname = options.hostname || process.env.HOSTNAME || '0.0.0.0';

  serve({
    fetch: app.fetch,
    port,
    hostname,
  });

  console.log(`🚀 Matching Service running on http://${hostname}:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${hostname}:${port}/health`);
}


