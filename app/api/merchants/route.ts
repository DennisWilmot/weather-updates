import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { merchants, parishes, communities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { assertPermission, PermissionError } from "@/lib/middleware";

export const dynamic = "force-dynamic";

/**
 * GET /api/merchants
 * Get merchant records with optional filtering
 * Query params:
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - businessType: Filter by business type
 *   - status: Filter by status (pending, active, inactive)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get("parishId");
    const communityId = searchParams.get("communityId");
    const businessType = searchParams.get("businessType");
    const status = searchParams.get("status");

    // Build query conditions
    const conditions = [];

    if (parishId) {
      conditions.push(eq(merchants.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(merchants.communityId, communityId));
    }

    if (businessType) {
      conditions.push(eq(merchants.businessType, businessType));
    }

    if (status) {
      conditions.push(eq(merchants.status, status as any));
    }

    // Execute query with joins
    const results = await db
      .select({
        merchant: merchants,
        parish: parishes,
        community: communities,
      })
      .from(merchants)
      .leftJoin(parishes, eq(merchants.parishId, parishes.id))
      .leftJoin(communities, eq(merchants.communityId, communities.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(merchants.createdAt);

    // Transform results
    const merchantsWithRelations = results.map((r) => ({
      ...r.merchant,
      parish: r.parish,
      community: r.community,
    }));

    return NextResponse.json({
      merchants: merchantsWithRelations,
      count: merchantsWithRelations.length,
    });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchants" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchants
 * Create a new merchant onboarding record
 * Body:
 *   - businessName: string (required)
 *   - tradingName: string (optional)
 *   - businessType: string (required)
 *   - parishId: string (required) - UUID
 *   - communityId: string (required) - UUID
 *   - streetAddress: string (required)
 *   - gpsPin: string (optional)
 *   - latitude: number (optional)
 *   - longitude: number (optional)
 *   - ownerName: string (required)
 *   - phone: string (required)
 *   - alternatePhone: string (optional)
 *   - email: string (optional)
 *   - submittedBy: string (required) - User ID
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission (using middleware version for API routes)
    const user = await assertPermission(request, "form_people_needs", false); // Using same permission for now

    const body = await request.json();
    const {
      businessName,
      tradingName,
      businessType,
      parishId,
      communityId,
      streetAddress,
      gpsPin,
      latitude,
      longitude,
      ownerName,
      phone,
      alternatePhone,
      email,
      productCategories,
      topItems,
      wantsFullInventoryUpload,
      monthlySalesVolume,
      numberOfEmployees,
      issuesInvoices,
      acceptsDigitalPayments,
      hasElectricity,
      hasInternetAccess,
      hasSmartphone,
      revenueAllocationPercentage,
      estimatedMonthlyPurchaseAmount,
      interestedImportProducts,
      shopfrontPhotoUrl,
      documentPhotoUrl,
      invoicePhotoUrl,
      consent,
      notes,
      submittedBy,
    } = body;

    // Validate required fields
    const missingFields: string[] = [];
    if (!businessName) missingFields.push('businessName');
    if (!businessType) missingFields.push('businessType');
    if (!parishId) missingFields.push('parishId');
    if (!communityId) missingFields.push('communityId');
    if (!streetAddress) missingFields.push('streetAddress');
    if (!ownerName) missingFields.push('ownerName');
    if (!phone) missingFields.push('phone');
    if (consent !== true) missingFields.push('consent');
    if (issuesInvoices === undefined) missingFields.push('issuesInvoices');
    if (acceptsDigitalPayments === undefined) missingFields.push('acceptsDigitalPayments');
    if (hasElectricity === undefined) missingFields.push('hasElectricity');
    if (hasInternetAccess === undefined) missingFields.push('hasInternetAccess');
    if (hasSmartphone === undefined) missingFields.push('hasSmartphone');
    if (!estimatedMonthlyPurchaseAmount) missingFields.push('estimatedMonthlyPurchaseAmount');
    if (!submittedBy) missingFields.push('submittedBy');

    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error('Validation error:', errorMsg, { body });
      return NextResponse.json(
        {
          error: errorMsg,
          message: errorMsg,
          missingFields,
        },
        { status: 400 }
      );
    }

    // Create merchant record
    const [newMerchant] = await db
      .insert(merchants)
      .values({
        businessName: businessName.trim(),
        tradingName: tradingName?.trim() || null,
        businessType: businessType.trim(),
        parishId,
        communityId,
        streetAddress: streetAddress.trim(),
        gpsPin: gpsPin?.trim() || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        alternatePhone: alternatePhone?.trim() || null,
        email: email?.trim() || null,
        productCategories: Array.isArray(productCategories) ? productCategories : [],
        topItems: Array.isArray(topItems) ? topItems : [],
        wantsFullInventoryUpload: wantsFullInventoryUpload === true,
        monthlySalesVolume: monthlySalesVolume ? String(monthlySalesVolume) : null,
        numberOfEmployees: numberOfEmployees || null,
        issuesInvoices: issuesInvoices === true,
        acceptsDigitalPayments: acceptsDigitalPayments === true,
        hasElectricity: hasElectricity === true,
        hasInternetAccess: hasInternetAccess === true,
        hasSmartphone: hasSmartphone === true,
        revenueAllocationPercentage: revenueAllocationPercentage || null,
        estimatedMonthlyPurchaseAmount: estimatedMonthlyPurchaseAmount ? String(estimatedMonthlyPurchaseAmount) : null,
        interestedImportProducts: Array.isArray(interestedImportProducts) ? interestedImportProducts : [],
        shopfrontPhotoUrl: shopfrontPhotoUrl?.trim() || null,
        documentPhotoUrl: documentPhotoUrl?.trim() || null,
        invoicePhotoUrl: invoicePhotoUrl?.trim() || null,
        consent: consent === true,
        notes: notes?.trim() || null,
        submittedBy: submittedBy || user.id,
        status: "pending",
        verified: false,
      })
      .returning();

    // Fetch the created record with relations
    const [result] = await db
      .select({
        merchant: merchants,
        parish: parishes,
        community: communities,
      })
      .from(merchants)
      .leftJoin(parishes, eq(merchants.parishId, parishes.id))
      .leftJoin(communities, eq(merchants.communityId, communities.id))
      .where(eq(merchants.id, newMerchant.id))
      .limit(1);

    return NextResponse.json(
      {
        merchant: {
          ...result.merchant,
          parish: result.parish,
          community: result.community,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating merchant:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
    });

    // Handle PermissionError from middleware
    if (error instanceof PermissionError) {
      if (error.code === "UNAUTHORIZED") {
        return NextResponse.json(
          { 
            error: "Authentication required",
            message: "Authentication required",
          },
          { status: 401 }
        );
      }
      
      if (error.code === "FORBIDDEN") {
        return NextResponse.json(
          { 
            error: "Permission denied. You need form_people_needs permission.",
            message: "Permission denied. You need form_people_needs permission.",
          },
          { status: 403 }
        );
      }
    }

    // Handle legacy error format (from actions.ts)
    if (error.message?.includes("Authentication required")) {
      return NextResponse.json(
        { 
          error: "Authentication required",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    if (error.message?.includes("Insufficient permissions")) {
      return NextResponse.json(
        { 
          error: "Permission denied. You need form_people_needs permission.",
          message: "Permission denied. You need form_people_needs permission.",
        },
        { status: 403 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to create merchant onboarding record",
        message: errorMessage,
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

