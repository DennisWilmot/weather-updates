import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { peopleNeeds, parishes, communities, people } from "@/lib/db/schema";
import { eq, and, inArray, isNotNull } from "drizzle-orm";
import { peopleNeedsToGeoJSON } from "@/lib/maps/geojson";
import { createPeopleNeedsHeatmap } from "@/lib/maps/heatmap";
import { assertPermission } from "@/lib/actions";
import { associatePersonWithSkills } from "@/lib/skill-normalization";

export const dynamic = "force-dynamic";

/**
 * GET /api/people/needs
 * Get people needs records with optional filtering
 * Query params:
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - urgency: Filter by urgency (low, medium, high, critical)
 *   - status: Filter by status (pending, in_progress, fulfilled, cancelled)
 *   - needs: Comma-separated list of needs to filter by
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get("parishId");
    const communityId = searchParams.get("communityId");
    const urgency = searchParams.get("urgency");
    const status = searchParams.get("status");
    const needsParam = searchParams.get("needs");
    const format = searchParams.get("format") || "json";
    const heatmap = searchParams.get("heatmap") === "true";
    const gridSize = searchParams.get("gridSize")
      ? parseFloat(searchParams.get("gridSize")!)
      : undefined;

    // Build query conditions
    const conditions = [];

    if (parishId) {
      conditions.push(eq(peopleNeeds.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(peopleNeeds.communityId, communityId));
    }

    if (urgency) {
      conditions.push(eq(peopleNeeds.urgency, urgency as any));
    }

    if (status) {
      conditions.push(eq(peopleNeeds.status, status as any));
    }

    // Only return needs with coordinates
    conditions.push(isNotNull(peopleNeeds.latitude));
    conditions.push(isNotNull(peopleNeeds.longitude));

    // Execute query with joins
    const results = await db
      .select({
        need: peopleNeeds,
        parish: parishes,
        community: communities,
      })
      .from(peopleNeeds)
      .leftJoin(parishes, eq(peopleNeeds.parishId, parishes.id))
      .leftJoin(communities, eq(peopleNeeds.communityId, communities.id))
      .where(and(...conditions))
      .orderBy(peopleNeeds.createdAt);

    // Transform results
    let needsWithRelations = results.map((r) => ({
      ...r.need,
      parish: r.parish,
      community: r.community,
    }));

    // Filter by needs if specified (client-side filter for JSONB array)
    if (needsParam) {
      const requiredNeeds = needsParam.split(",");
      needsWithRelations = needsWithRelations.filter((need) => {
        const needArray = Array.isArray(need.needs) ? need.needs : [];
        return requiredNeeds.some((req) => needArray.includes(req));
      });
    }

    // Return GeoJSON or JSON format
    if (format === "geojson") {
      let geoJSON = peopleNeedsToGeoJSON(needsWithRelations);

      // Apply heatmap aggregation if requested
      if (heatmap) {
        geoJSON = createPeopleNeedsHeatmap(geoJSON as any, {
          byUrgency: true,
          byNeedType: true,
          gridSize,
        });
      }

      return NextResponse.json(geoJSON, {
        headers: {
          "Content-Type": "application/geo+json",
        },
      });
    }

    return NextResponse.json({
      needs: needsWithRelations,
      count: needsWithRelations.length,
    });
  } catch (error) {
    console.error("Error fetching people needs:", error);
    return NextResponse.json(
      { error: "Failed to fetch people needs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/people/needs
 * Create a new people needs report
 * Body:
 *   - parishId: string (required) - UUID
 *   - communityId: string (required) - UUID
 *   - latitude: number (optional)
 *   - longitude: number (optional)
 *   - needs: string[] (required)
 *   - skills: string[] (optional)
 *   - contactName: string (required)
 *   - contactPhone: string (optional)
 *   - contactEmail: string (optional)
 *   - numberOfPeople: number (optional)
 *   - urgency: 'low' | 'medium' | 'high' | 'critical' (required)
 *   - description: string (optional)
 *   - status: 'pending' | 'in_progress' | 'fulfilled' | 'cancelled' (optional, defaults to 'pending')
 *   - reportedBy: string (required) - User ID
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and permission
    const user = await assertPermission("form_people_needs", false);

    const body = await request.json();
    const {
      parishId,
      communityId,
      latitude,
      longitude,
      needs,
      skills,
      contactName,
      contactPhone,
      contactEmail,
      numberOfPeople,
      urgency,
      description,
      status = "pending",
      reportedBy,
    } = body;

    // Validate required fields
    if (
      !parishId ||
      !communityId ||
      !needs ||
      !contactName ||
      !urgency ||
      !reportedBy
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: parishId, communityId, needs, contactName, urgency, reportedBy",
        },
        { status: 400 }
      );
    }

    // Validate needs is an array with at least one item
    if (!Array.isArray(needs) || needs.length === 0) {
      return NextResponse.json(
        { error: "Needs must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate urgency enum
    if (!["low", "medium", "high", "critical"].includes(urgency)) {
      return NextResponse.json(
        {
          error:
            "Invalid urgency level. Must be one of: low, medium, high, critical",
        },
        { status: 400 }
      );
    }

    // Validate status enum if provided
    if (
      status &&
      !["pending", "in_progress", "fulfilled", "cancelled"].includes(status)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be one of: pending, in_progress, fulfilled, cancelled",
        },
        { status: 400 }
      );
    }

    // First, create a person record in the people table as "person_in_need"
    const [newPerson] = await db
      .insert(people)
      .values({
        name: contactName.trim(), // Use contactName as the person's name
        type: "person_in_need",
        parishId,
        communityId: communityId || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        contactName: contactName.trim(),
        contactPhone: contactPhone?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        organization: null, // Not applicable for person_in_need
        needs: needs,
        skills: Array.isArray(skills) && skills.length > 0 ? skills : null,
      })
      .returning();

    // Associate skills if provided (normalized skills table)
    if (Array.isArray(skills) && skills.length > 0) {
      await associatePersonWithSkills(newPerson.id, skills);
    }

    // Now create the people needs record and link it to the person
    const [newPeopleNeed] = await db
      .insert(peopleNeeds)
      .values({
        personId: newPerson.id, // Link to the person we just created
        parishId,
        communityId,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        needs: needs,
        skills: Array.isArray(skills) && skills.length > 0 ? skills : null,
        contactName,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        numberOfPeople: numberOfPeople || null,
        urgency: urgency as "low" | "medium" | "high" | "critical",
        description: description || null,
        status: (status || "pending") as
          | "pending"
          | "in_progress"
          | "fulfilled"
          | "cancelled",
        reportedBy: reportedBy || user.id,
      })
      .returning();

    // Fetch the created records with relations
    const [result] = await db
      .select({
        need: peopleNeeds,
        parish: parishes,
        community: communities,
      })
      .from(peopleNeeds)
      .leftJoin(parishes, eq(peopleNeeds.parishId, parishes.id))
      .leftJoin(communities, eq(peopleNeeds.communityId, communities.id))
      .where(eq(peopleNeeds.id, newPeopleNeed.id))
      .limit(1);

    // Fetch the created person with relations
    const [personResult] = await db
      .select({
        person: people,
        parish: parishes,
        community: communities,
      })
      .from(people)
      .leftJoin(parishes, eq(people.parishId, parishes.id))
      .leftJoin(communities, eq(people.communityId, communities.id))
      .where(eq(people.id, newPerson.id))
      .limit(1);

    return NextResponse.json(
      {
        peopleNeed: {
          ...result.need,
          parish: result.parish,
          community: result.community,
        },
        person: {
          ...personResult.person,
          parish: personResult.parish,
          community: personResult.community,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating people needs:", error);

    if (error.message?.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.message?.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Permission denied. You need form_people_needs permission." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create people needs report",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
