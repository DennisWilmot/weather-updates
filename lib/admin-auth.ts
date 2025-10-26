// Simple admin authentication using a secret key
// This is a basic implementation - consider using proper auth (NextAuth, Supabase Auth, etc.) for production

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

export function getAdminAuthError() {
  return {
    error: 'Unauthorized - Admin access required',
    message: 'Include admin key in Authorization header as "Bearer YOUR_KEY"'
  };
}
