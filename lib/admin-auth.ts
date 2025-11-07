// Simple admin authentication using a secret key
// This is a basic implementation - consider using proper auth (NextAuth, Supabase Auth, etc.) for production

/**
 * Verify admin authentication using secret key
 * TODO: Migrate to Better Auth sessions once Better Auth is fully configured
 */
export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey) {
    console.warn('ADMIN_SECRET_KEY not set in environment variables');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  // Expected format: "Bearer YOUR_SECRET_KEY"
  const token = authHeader.replace('Bearer ', '');

  return token === adminKey;
}

/**
 * Future: Verify admin authentication using Better Auth session
 * This will be enabled once Better Auth is fully configured with environment variables
 * 
 * Uncomment and use this function when ready:
 * 
 * import { auth } from './auth';
 * 
 * export async function verifyAdminAuthBetterAuth(request: Request): Promise<boolean> {
 *   try {
 *     const session = await auth.api.getSession({
 *       headers: request.headers,
 *     });
 * 
 *     if (!session?.user) {
 *       return false;
 *     }
 * 
 *     const userRole = (session.user as any).role;
 *     return userRole === 'admin';
 *   } catch (error) {
 *     console.error('Error verifying admin auth:', error);
 *     return false;
 *   }
 * }
 */

export function getAdminAuthError() {
  return {
    error: 'Unauthorized - Admin access required',
    message: 'Include admin key in Authorization header as "Bearer YOUR_KEY"'
  };
}
