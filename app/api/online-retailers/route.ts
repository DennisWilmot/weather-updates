import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { onlineRetailers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/online-retailers - Get all verified and active retailers
export async function GET(request: Request) {
  try {
    const retailers = await db
      .select()
      .from(onlineRetailers)
      .where(
        and(
          eq(onlineRetailers.verified, true),
          eq(onlineRetailers.status, 'active')
        )
      )
      .orderBy(onlineRetailers.name);

    return NextResponse.json({
      success: true,
      data: retailers,
      count: retailers.length
    });
  } catch (error) {
    console.error('Error fetching online retailers:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to fetch online retailers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/online-retailers - Submit a new retailer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, websiteUrl, phoneNumber, description, logoUrl } = body;

    // Validate required fields
    if (!name || !websiteUrl) {
      return NextResponse.json(
        { error: 'Name and website URL are required' },
        { status: 400 }
      );
    }

    // Get current user if authenticated (gracefully handle errors)
    let submittedByUserId = null;
    // No authentication system - skip user lookup

    // Insert new retailer with verified = false and status = pending
    const [newRetailer] = await db
      .insert(onlineRetailers)
      .values({
        name: name.trim(),
        websiteUrl: websiteUrl.trim(),
        phoneNumber: phoneNumber?.trim() || null,
        description: description?.trim() || null,
        logoUrl: logoUrl || null,
        verified: false,
        status: 'pending',
        submittedByUserId: submittedByUserId || null
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Retailer submission received. Your submission will be reviewed and verified.',
      data: newRetailer
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting retailer:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Failed to submit retailer',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
