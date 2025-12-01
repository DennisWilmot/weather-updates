/**
 * Audit Logging Utility
 * Provides functions to log user actions for security and compliance
 */

import { db } from "./db";
import { auditLogs } from "./db/schema";
import type { NextRequest } from "next/server";
import type { UserWithRole } from "./permissions";

export interface AuditLogData {
  action: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  resourceType?: string;
  resourceId?: string;
  beforeValue?: any;
  afterValue?: any;
  metadata?: any;
}

/**
 * Extract IP address from NextRequest
 */
export function getIpAddress(request: NextRequest | Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  
  return "unknown";
}

/**
 * Extract user agent from NextRequest
 */
export function getUserAgent(request: NextRequest | Request): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Parse user agent to get device/browser info
 */
export function parseUserAgent(userAgent: string): string {
  if (!userAgent || userAgent === "unknown") {
    return "Unknown Device";
  }

  // Extract browser
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

  // Extract OS
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

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: data.action,
      userId: data.userId || null,
      userEmail: data.userEmail || null,
      userName: data.userName || null,
      details: data.details,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      resourceType: data.resourceType || null,
      resourceId: data.resourceId || null,
      beforeValue: data.beforeValue || null,
      afterValue: data.afterValue || null,
      metadata: data.metadata || null,
    });
  } catch (error) {
    // Don't throw errors - audit logging should never break the main flow
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Create an audit log from a request and user
 */
export async function auditLog(
  request: NextRequest | Request,
  user: UserWithRole | null,
  action: string,
  details: string,
  options?: {
    resourceType?: string;
    resourceId?: string;
    beforeValue?: any;
    afterValue?: any;
    metadata?: any;
  }
): Promise<void> {
  const ipAddress = getIpAddress(request);
  const userAgent = getUserAgent(request);

  await createAuditLog({
    action,
    userId: user?.id,
    userEmail: user?.email,
    userName: user?.name || user?.fullName || user?.email || "Unknown User",
    details,
    ipAddress,
    userAgent,
    resourceType: options?.resourceType,
    resourceId: options?.resourceId,
    beforeValue: options?.beforeValue,
    afterValue: options?.afterValue,
    metadata: options?.metadata,
  });
}

/**
 * Helper to log user login
 */
export async function auditLogLogin(
  request: NextRequest | Request,
  user: UserWithRole,
  success: boolean = true
): Promise<void> {
  await auditLog(
    request,
    user,
    "User Login",
    success ? "Successful login" : "Failed login attempt",
    {
      metadata: { success },
    }
  );
}

/**
 * Helper to log user logout
 */
export async function auditLogLogout(
  request: NextRequest | Request,
  user: UserWithRole | null
): Promise<void> {
  await auditLog(request, user, "User Logout", "User logged out");
}

/**
 * Helper to log user creation
 */
export async function auditLogUserCreate(
  request: NextRequest | Request,
  user: UserWithRole,
  createdUser: any
): Promise<void> {
  await auditLog(
    request,
    user,
    "User Created",
    `Created user: ${createdUser.email || createdUser.id}`,
    {
      resourceType: "user",
      resourceId: createdUser.id,
      afterValue: createdUser,
    }
  );
}

/**
 * Helper to log user update
 */
export async function auditLogUserUpdate(
  request: NextRequest | Request,
  user: UserWithRole,
  updatedUser: any,
  beforeValue?: any
): Promise<void> {
  await auditLog(
    request,
    user,
    "User Updated",
    `Updated user: ${updatedUser.email || updatedUser.id}`,
    {
      resourceType: "user",
      resourceId: updatedUser.id,
      beforeValue,
      afterValue: updatedUser,
    }
  );
}

/**
 * Helper to log user deletion
 */
export async function auditLogUserDelete(
  request: NextRequest | Request,
  user: UserWithRole,
  deletedUser: any
): Promise<void> {
  await auditLog(
    request,
    user,
    "User Deleted",
    `Deleted user: ${deletedUser.email || deletedUser.id}`,
    {
      resourceType: "user",
      resourceId: deletedUser.id,
      beforeValue: deletedUser,
    }
  );
}

/**
 * Helper to log user suspension
 */
export async function auditLogUserSuspend(
  request: NextRequest | Request,
  user: UserWithRole,
  targetUser: any,
  suspended: boolean
): Promise<void> {
  await auditLog(
    request,
    user,
    suspended ? "User Suspended" : "User Unsuspended",
    `${suspended ? "Suspended" : "Unsuspended"} user: ${targetUser.email || targetUser.id}`,
    {
      resourceType: "user",
      resourceId: targetUser.id,
      metadata: { suspended },
    }
  );
}

/**
 * Helper to log role creation
 */
export async function auditLogRoleCreate(
  request: NextRequest | Request,
  user: UserWithRole,
  role: any
): Promise<void> {
  await auditLog(
    request,
    user,
    "Role Created",
    `Created role: ${role.name}`,
    {
      resourceType: "role",
      resourceId: role.id,
      afterValue: role,
    }
  );
}

/**
 * Helper to log role update
 */
export async function auditLogRoleUpdate(
  request: NextRequest | Request,
  user: UserWithRole,
  role: any,
  beforeValue?: any
): Promise<void> {
  await auditLog(
    request,
    user,
    "Role Updated",
    `Updated role: ${role.name}`,
    {
      resourceType: "role",
      resourceId: role.id,
      beforeValue,
      afterValue: role,
    }
  );
}

/**
 * Helper to log role deletion
 */
export async function auditLogRoleDelete(
  request: NextRequest | Request,
  user: UserWithRole,
  role: any
): Promise<void> {
  await auditLog(
    request,
    user,
    "Role Deleted",
    `Deleted role: ${role.name}`,
    {
      resourceType: "role",
      resourceId: role.id,
      beforeValue: role,
    }
  );
}

/**
 * Helper to log form submission
 */
export async function auditLogFormSubmission(
  request: NextRequest | Request,
  user: UserWithRole | null,
  formId: string,
  submissionId: string
): Promise<void> {
  await auditLog(
    request,
    user,
    "Form Submitted",
    `Submitted form: ${formId}`,
    {
      resourceType: "form_submission",
      resourceId: submissionId,
      metadata: { formId },
    }
  );
}

