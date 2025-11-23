/**
 * Bun Runtime Adapter
 * 
 * Provides a Bun server implementation using Bun's native HTTP server.
 * Suitable for deployment on Bun-compatible platforms.
 */

import type { Hono } from 'hono';

export interface BunServerOptions {
  port?: number;
  hostname?: string;
}

/**
 * Start the Hono app as a Bun HTTP server
 */
export function createBunServer(
  app: Hono,
  options: BunServerOptions = {}
): void {
  const port = options.port || Number(process.env.PORT) || 3001;
  const hostname = options.hostname || process.env.HOSTNAME || '0.0.0.0';

  // @ts-ignore - Bun global is available in Bun runtime
  Bun.serve({
    port,
    hostname,
    fetch: app.fetch,
  });

  console.log(`🚀 Matching Service running on http://${hostname}:${port} (Bun)`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${hostname}:${port}/health`);
}


