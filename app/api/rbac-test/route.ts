/**
 * RBAC Test API Endpoint
 * Demonstrates server-side permission checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { assertPermission, assertRole, getUserWithRole } from '../../../lib/middleware';

export async function GET(request: NextRequest) {
  try {
    // Get current user (no specific permission required)
    const user = await getUserWithRole(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Basic endpoint - authentication only',
      user: {
        email: user.email,
        role: user.role,
        permissions: user.canViewSensitiveData ? 'Can view sensitive data' : 'Standard access'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require specific permission for POST operations
    const user = await assertPermission(request, 'deployments_create');
    
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Deployment creation endpoint',
      user: user.email,
      role: user.role,
      data: body,
      success: true
    });
  } catch (error: any) {
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          required: ['deployments_create'],
          message: 'You need deployment creation permissions to access this endpoint'
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require admin role for PUT operations
    const user = await assertRole(request, 'admin');
    
    const body = await request.json();
    
    return NextResponse.json({
      message: 'Admin-only endpoint',
      user: user.email,
      role: user.role,
      data: body,
      success: true
    });
  } catch (error: any) {
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    if (error.message.includes('Insufficient role privileges')) {
      return NextResponse.json(
        { 
          error: 'Admin access required',
          required: ['admin'],
          message: 'Only administrators can access this endpoint'
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
