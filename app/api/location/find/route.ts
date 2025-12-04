import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parishes, communities } from "@/lib/db/schema";
import { sql, and, isNotNull, eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

// Calculate distance between two coordinates using Haversine formula (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if point is within bounds
function isWithinBounds(
  lat: number,
  lng: number,
  bounds: { north: number; south: number; east: number; west: number } | null
): boolean {
  if (!bounds) return false;
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude") || "");
    const longitude = parseFloat(searchParams.get("longitude") || "");

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required" },
        { status: 400 }
      );
    }

    // First, try to find a community that contains this point within its bounds
    const allCommunities = await db
      .select({
        id: communities.id,
        name: communities.name,
        parishId: communities.parishId,
        coordinates: communities.coordinates,
        bounds: communities.bounds,
      })
      .from(communities)
      .where(isNotNull(communities.bounds));

    // Find communities within bounds
    const communitiesWithinBounds = allCommunities.filter((community) => {
      const bounds = community.bounds as {
        north: number;
        south: number;
        east: number;
        west: number;
      } | null;
      return isWithinBounds(latitude, longitude, bounds);
    });

    let foundCommunity = null;
    let foundParish = null;

    if (communitiesWithinBounds.length > 0) {
      // If multiple communities contain the point, find the closest one
      let closestDistance = Infinity;
      for (const community of communitiesWithinBounds) {
        const coords = community.coordinates as { lat: number; lng: number } | null;
        if (coords) {
          const distance = calculateDistance(
            latitude,
            longitude,
            coords.lat,
            coords.lng
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            foundCommunity = community;
          }
        } else {
          // If no coordinates, use the first one
          if (!foundCommunity) {
            foundCommunity = community;
          }
        }
      }

      // Get the parish for the found community
      if (foundCommunity) {
        const [parish] = await db
          .select({
            id: parishes.id,
            name: parishes.name,
            code: parishes.code,
          })
          .from(parishes)
          .where(eq(parishes.id, foundCommunity.parishId))
          .limit(1);

        foundParish = parish;
      }
    } else {
      // No community found within bounds, find closest by distance
      let closestDistance = Infinity;
      for (const community of allCommunities) {
        const coords = community.coordinates as { lat: number; lng: number } | null;
        if (coords) {
          const distance = calculateDistance(
            latitude,
            longitude,
            coords.lat,
            coords.lng
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            foundCommunity = community;
          }
        }
      }

      // Get the parish for the closest community
      if (foundCommunity) {
        const [parish] = await db
          .select({
            id: parishes.id,
            name: parishes.name,
            code: parishes.code,
          })
          .from(parishes)
          .where(eq(parishes.id, foundCommunity.parishId))
          .limit(1);

        foundParish = parish;
      }
    }

    if (!foundCommunity || !foundParish) {
      return NextResponse.json(
        {
          error: "No parish or community found for these coordinates",
          parishId: null,
          communityId: null,
        },
        { status: 200 } // Return 200 with null values instead of error
      );
    }

    return NextResponse.json({
      parishId: foundParish.id,
      parishName: foundParish.name,
      parishCode: foundParish.code,
      communityId: foundCommunity.id,
      communityName: foundCommunity.name,
    });
  } catch (error: any) {
    console.error("Error finding location from coordinates:", error);
    return NextResponse.json(
      {
        error: "Failed to find location from coordinates",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

