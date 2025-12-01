import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { places, parishes, communities } from "@/lib/db/schema";
import { eq, and, inArray, isNotNull } from "drizzle-orm";
import { placesToGeoJSON } from "@/lib/maps/geojson";

// export const dynamic = 'force-dynamic';

/**
 * GET /api/places
 * List all places with optional filtering
 * Query params:
 *   - type: Filter by place type (shelter, jdf_base, hospital, etc.)
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - verified: Filter by verified status (true/false)
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const parishId = searchParams.get("parishId");
    const communityId = searchParams.get("communityId");
    const verifiedParam = searchParams.get("verified");
    const format = searchParams.get("format") || "json";

    // Build query conditions
    const conditions = [];

    if (type) {
      const types = type.split(",");
      if (types.length === 1) {
        conditions.push(eq(places.type, types[0] as any));
      } else {
        conditions.push(inArray(places.type, types as any[]));
      }
    }

    if (parishId) {
      conditions.push(eq(places.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(places.communityId, communityId));
    }

    if (verifiedParam !== null) {
      conditions.push(eq(places.verified, verifiedParam === "true"));
    }

    // Only return places with coordinates
    conditions.push(isNotNull(places.latitude));
    conditions.push(isNotNull(places.longitude));

    // Execute query with joins for related data
    const results = await db
      .select({
        place: places,
        parish: parishes,
        community: communities,
      })
      .from(places)
      .leftJoin(parishes, eq(places.parishId, parishes.id))
      .leftJoin(communities, eq(places.communityId, communities.id))
      .where(and(...conditions));

    // Transform results to include related data
    const placesWithRelations = results.map((r) => ({
      ...r.place,
      parish: r.parish,
      community: r.community,
    }));

    // Return GeoJSON or JSON format
    if (format === "geojson") {
      const geoJSON = placesToGeoJSON(placesWithRelations);
      return NextResponse.json(geoJSON, {
        headers: {
          "Content-Type": "application/geo+json",
        },
      });
    }

    return NextResponse.json({
      places: placesWithRelations,
      count: placesWithRelations.length,
    });
  } catch (error) {
    console.error("Error fetching places:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}
