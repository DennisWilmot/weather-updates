/**
 * Cloudflare Workers Runtime Adapter
 * 
 * For Cloudflare Workers, the Hono app is exported directly from index.ts.
 * Cloudflare Workers will use the app's fetch handler automatically.
 * 
 * This file is kept for documentation purposes and potential future use
 * if we need Cloudflare-specific runtime logic.
 */

import type { Hono } from 'hono';

/**
 * Cloudflare Workers compatibility helper
 * 
 * In Cloudflare Workers, the default export from index.ts should be the Hono app.
 * The Workers runtime will automatically use app.fetch as the entry point.
 */
export function getCloudflareFetchHandler(app: Hono) {
  return app.fetch;
}

