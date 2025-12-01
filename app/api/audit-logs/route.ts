import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { assertPermission } from "@/lib/middleware";
import { desc, eq, ilike, or, and, gte, lte, count } from "drizzle-orm";

/**
 * GET /api/audit-logs
 * Fetch audit logs with filtering and pagination
 * Requires: system_access_settings permission
 */
export async function GET(request: NextRequest) {
  try {
    // Check permission - only admins can view audit logs
    await assertPermission(request, "system_access_settings");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const actionFilter = searchParams.get("action") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          ilike(auditLogs.details, `%${search}%`),
          ilike(auditLogs.userName, `%${search}%`),
          ilike(auditLogs.userEmail, `%${search}%`),
          ilike(auditLogs.action, `%${search}%`)
        )
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      conditions.push(eq(auditLogs.action, actionFilter));
    }

    // Date range filter
    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch audit logs
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(auditLogs)
      .where(whereClause);

    const totalCount = totalCountResult[0]?.count || 0;

    // Format response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      user: log.userName || log.userEmail || "System",
      timestamp: log.createdAt.toISOString(),
      details: log.details,
      ipAddress: log.ipAddress || "unknown",
      device: log.userAgent ? parseUserAgent(log.userAgent) : "Unknown Device",
      beforeValue: log.beforeValue,
      afterValue: log.afterValue,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      metadata: log.metadata,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    
    if (error.name === "PermissionError") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to parse user agent (simplified version)
 */
function parseUserAgent(userAgent: string): string {
  if (!userAgent || userAgent === "unknown") {
    return "Unknown Device";
  }

  let browser = "Unknown Browser";
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Edg")) {
    browser = "Edge";
  }

  let os = "Unknown OS";
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac")) {
    os = "Mac";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os = "iOS";
  }

  return `${browser} on ${os}`;
}

