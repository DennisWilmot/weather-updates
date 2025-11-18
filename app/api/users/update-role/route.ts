import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { people } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Update user role
 * Now uses 'people' table instead of 'users' table
 * User must have a 'people' entry with type='aid_worker' to have a role
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId, role, organization } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Find the person entry for this user (aid_worker type)
    const [person] = await db
      .select()
      .from(people)
      .where(and(
        eq(people.userId, userId),
        eq(people.type, 'aid_worker')
      ))
      .limit(1);
    
    if (!person) {
      return NextResponse.json(
        { error: 'User not found as aid worker. Create a "people" entry first with type="aid_worker".' },
        { status: 404 }
      );
    }
    
    // Update organization if provided
    const updateData: any = {};
    if (organization !== undefined) {
      updateData.organization = organization;
    }
    
    // Note: Role is not stored in people table - it's managed separately
    // If role management is needed, consider adding a user_roles table or extending better-auth
    
    const [updatedPerson] = await db
      .update(people)
      .set(updateData)
      .where(eq(people.id, person.id))
      .returning();
    
    if (!updatedPerson) {
      return NextResponse.json(
        { error: 'Failed to update person' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      person: {
        id: updatedPerson.id,
        userId: updatedPerson.userId,
        organization: updatedPerson.organization,
        note: 'Role management moved to better-auth or separate user_roles table',
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}

