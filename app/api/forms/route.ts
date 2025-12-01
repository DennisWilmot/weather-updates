import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { assertPermission, getCurrentUser } from "@/lib/actions";

// Simple in-memory cache for forms (they don't change frequently)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const formsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(userRole: string): string {
  return `forms:${userRole}`;
}

function getFromCache(key: string): any | null {
  const entry = formsCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  formsCache.delete(key); // Remove expired entry
  return null;
}

function setCache(key: string, data: any): void {
  formsCache.set(key, { data, timestamp: Date.now() });

  // Simple cleanup: remove old entries periodically
  if (formsCache.size > 50) {
    const now = Date.now();
    for (const [k, entry] of formsCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        formsCache.delete(k);
      }
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user once and check permissions (combines both operations)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions after getting user (avoid duplicate user lookup)
    await assertPermission(["forms_view", "forms_view_submissions"], false);

    // Check cache first
    const cacheKey = getCacheKey(user.role);
    const cachedForms = getFromCache(cacheKey);
    if (cachedForms) {
      const response = NextResponse.json({ forms: cachedForms });
      response.headers.set(
        "Cache-Control",
        "public, max-age=300, s-maxage=600"
      );
      response.headers.set("CDN-Cache-Control", "public, max-age=600");
      response.headers.set("X-Cache", "HIT");
      return response;
    }

    // Optimize: Filter by user role in database instead of JavaScript
    // Use PostgreSQL's JSONB operators for efficient role filtering
    const formsData = await db
      .select({
        id: forms.id,
        name: forms.name,
        description: forms.description,
        status: forms.status,
        fields: forms.fields,
        allowedRoles: forms.allowedRoles,
        createdBy: forms.createdBy,
        createdAt: forms.createdAt,
        updatedAt: forms.updatedAt,
        publishedAt: forms.publishedAt,
        archivedAt: forms.archivedAt,
      })
      .from(forms)
      .where(
        // Filter forms where user's role is in allowedRoles array
        // This uses PostgreSQL's JSONB ? operator for efficient array membership check
        sql`${forms.allowedRoles} ? ${user.role}`
      )
      .orderBy(desc(forms.updatedAt));

    // Cache the result
    setCache(cacheKey, formsData);

    const response = NextResponse.json({ forms: formsData });

    // Add caching headers (forms don't change frequently)
    response.headers.set("Cache-Control", "public, max-age=300, s-maxage=600");
    response.headers.set("CDN-Cache-Control", "public, max-age=600");
    response.headers.set("X-Cache", "MISS");

    return response;
  } catch (error: any) {
    console.error("Error fetching forms:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Permission denied. You need form viewing permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user once and check permissions (combines both operations)
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check permissions after getting user (avoid duplicate user lookup)
    await assertPermission("forms_create_templates");

    const body = await request.json();
    const { name, description, status, fields, allowedRoles } = body;

    // Validate required fields
    if (!name || !description || !fields) {
      return NextResponse.json(
        { error: "Name, description, and fields are required" },
        { status: 400 }
      );
    }

    // Validate allowedRoles
    if (
      !allowedRoles ||
      !Array.isArray(allowedRoles) ||
      allowedRoles.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one role must be allowed to access the form" },
        { status: 400 }
      );
    }

    // Ensure admin is always included
    const rolesWithAdmin = allowedRoles.includes("admin")
      ? allowedRoles
      : [...allowedRoles, "admin"];

    // Validate fields array
    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: "At least one field is required" },
        { status: 400 }
      );
    }

    // Validate field structure
    for (const field of fields) {
      if (!field.id || !field.type || !field.label) {
        return NextResponse.json(
          { error: "Each field must have id, type, and label" },
          { status: 400 }
        );
      }
    }

    // Create the form
    const newForm = await db
      .insert(forms)
      .values({
        name,
        description,
        status: status || "draft",
        fields,
        allowedRoles: rolesWithAdmin,
        createdBy: user.id,
        publishedAt: status === "published" ? new Date() : null,
        archivedAt: status === "archived" ? new Date() : null,
      })
      .returning();

    // Invalidate cache for all roles that can access this form
    for (const role of rolesWithAdmin) {
      const rolesCacheKey = getCacheKey(role);
      formsCache.delete(rolesCacheKey);
    }

    return NextResponse.json({ form: newForm[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating form:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Permission denied. You need form creation permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
