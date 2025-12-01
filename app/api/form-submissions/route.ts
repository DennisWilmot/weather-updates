import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formSubmissions, forms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { assertPermission, getCurrentUser } from "@/lib/actions";
import { auditLogFormSubmission } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to submit forms
    const user = await assertPermission(
      [
        "forms_view",
        "form_damage_assessment",
        "form_supply_verification",
        "form_shelter_survey",
        "form_medical_intake",
        "form_water_quality",
        "form_infrastructure_assessment",
        "form_emergency_contact",
        "form_resource_request",
        "form_people_needs",
      ],
      false
    );

    const body = await request.json();
    const { formId, submissionData } = body;

    // Validate required fields
    if (!formId || !submissionData) {
      return NextResponse.json(
        { error: "Form ID and submission data are required" },
        { status: 400 }
      );
    }

    // Verify the form exists and is published
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (form.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form[0].status !== "published") {
      return NextResponse.json(
        { error: "Form is not available for submissions" },
        { status: 400 }
      );
    }

    // Get client IP address for audit trail
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip") || "unknown";

    // Create the form submission
    const newSubmission = await db
      .insert(formSubmissions)
      .values({
        formId,
        submittedBy: user.id,
        submissionData,
        ipAddress,
      })
      .returning();

    // Log audit event
    await auditLogFormSubmission(request, user, formId, newSubmission[0].id);

    return NextResponse.json(
      {
        submission: newSubmission[0],
        message: "Form submitted successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating form submission:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Permission denied. You need form submission permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view form submissions
    await assertPermission("forms_view_submissions");

    const url = new URL(request.url);
    const formId = url.searchParams.get("formId");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [];
    if (formId) {
      conditions.push(eq(formSubmissions.formId, formId));
    }

    const submissions = await db
      .select({
        id: formSubmissions.id,
        formId: formSubmissions.formId,
        submittedBy: formSubmissions.submittedBy,
        submissionData: formSubmissions.submissionData,
        submittedAt: formSubmissions.submittedAt,
        ipAddress: formSubmissions.ipAddress,
      })
      .from(formSubmissions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(formSubmissions.submittedAt);

    return NextResponse.json({ submissions });
  } catch (error: any) {
    console.error("Error fetching form submissions:", error);

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
