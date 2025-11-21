import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      type,
      serialNumber,
      status,
      isOneTime,
      currentLocation,
      parishId,
      communityId,
      latitude,
      longitude,
      organization,
    } = body;

    // Validate minimal required fields
    if (!name || !type || typeof isOneTime !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: name, type, isOneTime" },
        { status: 400 }
      );
    }

    // Insert into DB
    const inserted = await db
      .insert(assets)
      .values({
        name,
        type,
        serialNumber: serialNumber || null,
        status: status || "available",
        isOneTime,
        currentLocation: currentLocation || null,
        parishId: parishId || null,
        communityId: communityId || null,
        latitude: latitude || null,
        longitude: longitude || null,
        organization: organization || null,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Asset created successfully",
        asset: inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}
