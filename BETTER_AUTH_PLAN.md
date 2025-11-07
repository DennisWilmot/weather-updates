# Better Auth Installation Plan

## Overview
This document outlines the plan to install and configure Better Auth in the Hurricane Melissa Tracker application. Better Auth is a modern, type-safe authentication library that integrates seamlessly with Drizzle ORM and Next.js 14.

## Current State
- **Authentication**: Minimal - only admin secret key check (`lib/admin-auth.ts`)
- **Database**: PostgreSQL with Drizzle ORM
- **Framework**: Next.js 14 with App Router
- **User Table**: Exists in schema but not used for authentication

## Benefits of Better Auth
- ✅ Native Drizzle ORM support (no need for separate auth database)
- ✅ Type-safe authentication
- ✅ Built-in session management
- ✅ Support for email/password, OAuth providers, and more
- ✅ Works seamlessly with Next.js App Router
- ✅ Can integrate with existing `users` table

## Installation Steps

### 1. Install Dependencies
```bash
npm install better-auth @better-auth/drizzle
```

### 2. Environment Variables
Add to `.env.local`:
```env
BETTER_AUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000    # For production: https://your-domain.com
```

### 3. Create Auth Configuration
**File**: `lib/auth.ts`
- Configure Better Auth with Drizzle adapter
- Connect to existing database
- Set up email/password authentication
- Configure session settings

### 4. Create API Route Handler
**File**: `app/api/auth/[...all]/route.ts`
- Handle all Better Auth API requests
- Export GET and POST handlers

### 5. Run Database Migrations
```bash
npx better-auth migrate
```
This will create necessary auth tables (sessions, accounts, etc.) in your PostgreSQL database.

### 6. Create Client-Side Auth Utilities
**File**: `lib/auth-client.ts`
- Create client-side auth instance
- Export hooks and utilities for React components

### 7. Update Middleware
**File**: `middleware.ts`
- Integrate Better Auth session handling
- Protect routes as needed

### 8. Migrate Admin Auth
**File**: `lib/admin-auth.ts`
- Replace secret key check with Better Auth session verification
- Check user role from session

### 9. Update Components (Future)
- Add login/signup pages
- Add protected route wrappers
- Update admin functions to use Better Auth sessions

## Database Schema Considerations

Better Auth will create its own tables:
- `user` - Core user authentication data
- `session` - User sessions
- `account` - OAuth account links (if using OAuth)
- `verification` - Email verification tokens

**Integration Options**:
1. **Option A**: Use Better Auth's `user` table and extend with your `users` table via foreign key
2. **Option B**: Configure Better Auth to use your existing `users` table (more complex)

**Recommendation**: Start with Option A (Better Auth creates its own tables), then sync data between `user` and `users` tables as needed.

## Migration Strategy

### Phase 1: Installation (Non-Breaking)
- Install Better Auth
- Set up configuration
- Create API routes
- Keep existing admin-auth.ts working

### Phase 2: Integration
- Add login/signup UI
- Migrate admin functions to use Better Auth
- Update protected routes

### Phase 3: Cleanup
- Remove old admin secret key system
- Consolidate user data if needed

## Testing Checklist
- [ ] Better Auth API routes respond correctly
- [ ] User registration works
- [ ] User login works
- [ ] Sessions persist across requests
- [ ] Admin role checking works
- [ ] Protected routes work correctly
- [ ] Logout works

## Next Steps After Installation
1. Create login/signup pages
2. Add user profile management
3. Implement role-based access control (RBAC)
4. Add OAuth providers (Google, GitHub, etc.) if needed
5. Add email verification
6. Add password reset functionality

## Resources
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Drizzle Adapter Docs](https://www.better-auth.com/docs/adapters/drizzle)
- [Next.js Integration](https://www.better-auth.com/docs/installation/nextjs)

