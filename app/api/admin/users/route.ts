import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyAdminAuth } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, password, fullName } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Create email format for Better Auth (requires email field)
    const email = `${username}@system.local`;

    // Create user in Better Auth using the HTTP API endpoint
    try {
      const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3001';
      const signUpUrl = `${baseURL}/api/auth/sign-up/email`;

      const signUpResponse = await fetch(signUpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: fullName || username,
        }),
      });

      let signUpData: any;
      try {
        signUpData = await signUpResponse.json();
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to parse response from authentication system' },
          { status: 500 }
        );
      }

      if (!signUpResponse.ok) {
        // Check if user already exists
        if (signUpData.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
            signUpData.error?.message?.includes('already exists') || 
            signUpData.error?.message?.includes('duplicate') ||
            signUpResponse.status === 409 ||
            signUpResponse.status === 422) {
          return NextResponse.json(
            { error: 'Username already exists' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: signUpData.error?.message || signUpData.message || 'Failed to create user in authentication system' },
          { status: signUpResponse.status }
        );
      }

      // Get the Better Auth user ID (can be in different places)
      const authUserId = signUpData.data?.user?.id || 
                         signUpData.user?.id || 
                         signUpData.data?.id ||
                         signUpData.id;

      if (!authUserId) {
        return NextResponse.json(
          { error: 'Failed to get user ID from authentication system' },
          { status: 500 }
        );
      }

      // Create user record in our users table
      const [newUser] = await db
        .insert(users)
        .values({
          id: authUserId, // Use same ID as Better Auth user
          username: username, // Store username
          email: email, // Store email for Better Auth compatibility
          fullName: fullName || username,
          role: 'responder',
        })
        .returning();

      return NextResponse.json(
        {
          success: true,
          user: {
            id: newUser.id,
            username,
            fullName: newUser.fullName,
          },
        },
        { status: 201 }
      );
    } catch (authError: any) {
      // Handle Better Auth errors
      if (authError.message?.includes('already exists') || authError.message?.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }
      throw authError;
    }
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle duplicate email/username error
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: error.message },
      { status: 500 }
    );
  }
}

