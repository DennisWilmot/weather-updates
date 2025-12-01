import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  people,
  parishes,
  communities,
  skills,
  peopleSkills,
} from "@/lib/db/schema";
import { eq, and, inArray, isNotNull } from "drizzle-orm";
import {
  associatePersonWithSkills,
  getPersonSkills,
} from "@/lib/skill-normalization";

// export const dynamic = 'force-dynamic';

/**
 * GET /api/people
 * List people (both people in need and aid workers)
 * Query params:
 *   - type: Filter by type (person_in_need | aid_worker)
 *   - parishId: Filter by parish
 *   - communityId: Filter by community
 *   - format: 'geojson' | 'json' (default: json)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const parishId = searchParams.get("parishId");
    const communityId = searchParams.get("communityId");
    const format = searchParams.get("format") || "json";

    // Build query conditions
    const conditions = [];

    if (type) {
      conditions.push(eq(people.type, type as any));
    }

    if (parishId) {
      conditions.push(eq(people.parishId, parishId));
    }

    if (communityId) {
      conditions.push(eq(people.communityId, communityId));
    }

    // Only return people with coordinates
    conditions.push(isNotNull(people.latitude));
    conditions.push(isNotNull(people.longitude));

    // Execute query with joins
    const results = await db
      .select({
        person: people,
        parish: parishes,
        community: communities,
      })
      .from(people)
      .leftJoin(parishes, eq(people.parishId, parishes.id))
      .leftJoin(communities, eq(people.communityId, communities.id))
      .where(and(...conditions));

    // Transform results and fetch skills for each person
    const peopleWithRelations = await Promise.all(
      results.map(async (r) => {
        const personSkills = await getPersonSkills(r.person.id);
        return {
          ...r.person,
          parish: r.parish,
          community: r.community,
          skills: personSkills, // Array of { id, name } objects
        };
      })
    );

    // Return GeoJSON or JSON format
    if (format === "geojson") {
      // For aid workers, we'll use a separate endpoint that includes capabilities
      // For now, return basic GeoJSON
      const features = peopleWithRelations
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [
              parseFloat(p.longitude!.toString()),
              parseFloat(p.latitude!.toString()),
            ],
          },
          properties: {
            id: p.id,
            name: p.name,
            type: p.type,
            contactName: p.contactName,
            contactPhone: p.contactPhone,
            contactEmail: p.contactEmail,
            organization: p.organization,
            parishId: p.parishId,
            communityId: p.communityId,
            createdAt: p.createdAt,
          },
        }));

      return NextResponse.json(
        {
          type: "FeatureCollection",
          features,
        },
        {
          headers: {
            "Content-Type": "application/geo+json",
          },
        }
      );
    }

    return NextResponse.json({
      people: peopleWithRelations,
      count: peopleWithRelations.length,
    });
  } catch (error) {
    console.error("Error fetching people:", error);
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/people
 * Create a new person record
 * Body:
 *   - name: string (required)
 *   - type: 'person_in_need' | 'aid_worker' (required)
 *   - parishId: string (required)
 *   - communityId: string (optional)
 *   - contactName: string (required)
 *   - contactPhone: string (optional)
 *   - contactEmail: string (optional)
 *   - organization: string (optional)
 *   - latitude: number (optional)
 *   - longitude: number (optional)
 *   - needs: string[] (optional)
 *   - skills: string[] (optional) - Will be normalized and stored in people_skills table
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      parishId,
      communityId,
      contactName,
      contactPhone,
      contactEmail,
      organization,
      latitude,
      longitude,
      needs,
      skills: skillsArray,
    } = body;

    // Validate required fields
    if (!name || !type || !parishId || !contactName) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, parishId, contactName" },
        { status: 400 }
      );
    }

    if (type !== "person_in_need" && type !== "aid_worker") {
      return NextResponse.json(
        { error: 'Invalid type. Must be "person_in_need" or "aid_worker"' },
        { status: 400 }
      );
    }

    // Create person record
    const [newPerson] = await db
      .insert(people)
      .values({
        name: name.trim(),
        type: type as "person_in_need" | "aid_worker",
        parishId,
        communityId: communityId || null,
        contactName: contactName.trim(),
        contactPhone: contactPhone?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        organization: organization?.trim() || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        needs: Array.isArray(needs) ? needs : null,
        // Keep skills array for backward compatibility, but we'll also use normalized table
        skills: Array.isArray(skillsArray) ? skillsArray : null,
      })
      .returning();

    // Associate skills if provided
    if (Array.isArray(skillsArray) && skillsArray.length > 0) {
      await associatePersonWithSkills(newPerson.id, skillsArray);
    }

    // Fetch the created person with relations and skills
    const [personWithRelations] = await db
      .select({
        person: people,
        parish: parishes,
        community: communities,
      })
      .from(people)
      .leftJoin(parishes, eq(people.parishId, parishes.id))
      .leftJoin(communities, eq(people.communityId, communities.id))
      .where(eq(people.id, newPerson.id));

    const personSkills = await getPersonSkills(newPerson.id);

    return NextResponse.json(
      {
        ...personWithRelations.person,
        parish: personWithRelations.parish,
        community: personWithRelations.community,
        skills: personSkills,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating person:", error);
    return NextResponse.json(
      {
        error: "Failed to create person",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
