/**
 * Entry point for the matching service
 * 
 * Exports the Hono app for use in various runtime environments:
 * - Cloudflare Workers (default export)
 * - Node.js (via @hono/node-server)
 * - Bun (native support)
 */

import app from './app.js';
import { createNodeServer } from './runtime/node.js';
import { createBunServer } from './runtime/bun.js';

// Export the app for Cloudflare Workers (default export)
export default app;

// Runtime detection and server startup
// This code runs when the file is executed directly (not imported)
// For Cloudflare Workers, only the default export is used

// Check if we're in a Node.js-like environment (not Cloudflare Workers)
const isNodeLike = typeof process !== 'undefined' && process.versions?.node;

// Check if we're running as the main module (not imported)
// In Node.js/Bun, process.argv[1] contains the script path
const isMainModule = isNodeLike && (
  process.argv[1]?.endsWith('index.ts') ||
  process.argv[1]?.endsWith('index.js') ||
  process.argv[1]?.includes('matching-service')
);

if (isMainModule && isNodeLike) {
  // Detect runtime environment
  const runtime = detectRuntime();

  switch (runtime) {
    case 'bun':
      createBunServer(app);
      break;
    case 'node':
      createNodeServer(app);
      break;
    default:
      // Default to Node.js
      console.warn(`Unknown runtime: ${runtime}, defaulting to Node.js`);
      createNodeServer(app);
  }
}

/**
 * Detect the current runtime environment
 */
function detectRuntime(): 'node' | 'bun' | 'cloudflare' | 'unknown' {
  // Check for Cloudflare Workers
  if (typeof globalThis !== 'undefined' && 'caches' in globalThis && 'Request' in globalThis) {
    // Additional check: Cloudflare Workers have specific globals
    if (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers') {
      return 'cloudflare';
    }
  }

  // Check for Bun
  // @ts-ignore - Bun global is available in Bun runtime
  if (typeof Bun !== 'undefined') {
    return 'bun';
  }

  // Check for Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }

  return 'unknown';
}

