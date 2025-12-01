import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { assertPermission, getCurrentUser } from "@/lib/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to view forms
    await assertPermission(["forms_view", "forms_view_submissions"], false);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formId = params.id;

    const formData = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (formData.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    const form = formData[0];

    // Check if user has access to this specific form based on their role
    const allowedRoles = (form.allowedRoles as string[]) || ["admin"];

    if (!Array.isArray(allowedRoles) || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: "Access denied. You don't have permission to view this form.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ form });
  } catch (error: any) {
    console.error("Error fetching form:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to edit forms
    await assertPermission("forms_edit_templates");

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formId = params.id;
    const body = await request.json();
    const { name, description, status, fields, allowedRoles } = body;

    // Check if form exists
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (existingForm.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Validate fields if provided
    if (fields) {
      if (!Array.isArray(fields) || fields.length === 0) {
        return NextResponse.json(
          { error: "At least one field is required" },
          { status: 400 }
        );
      }

      for (const field of fields) {
        if (!field.id || !field.type || !field.label) {
          return NextResponse.json(
            { error: "Each field must have id, type, and label" },
            { status: 400 }
          );
        }
      }
    }

    // Validate allowedRoles if provided
    let rolesWithAdmin = undefined;
    if (allowedRoles !== undefined) {
      if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
        return NextResponse.json(
          { error: "At least one role must be allowed to access the form" },
          { status: 400 }
        );
      }
      // Ensure admin is always included
      rolesWithAdmin = allowedRoles.includes("admin")
        ? allowedRoles
        : [...allowedRoles, "admin"];
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) updateData.fields = fields;
    if (rolesWithAdmin !== undefined) updateData.allowedRoles = rolesWithAdmin;

    if (status !== undefined) {
      updateData.status = status;

      // Update timestamp based on status
      if (status === "published" && existingForm[0].status !== "published") {
        updateData.publishedAt = new Date();
      } else if (
        status === "archived" &&
        existingForm[0].status !== "archived"
      ) {
        updateData.archivedAt = new Date();
      }
    }

    // Update the form
    const updatedForm = await db
      .update(forms)
      .set(updateData)
      .where(eq(forms.id, formId))
      .returning();

    return NextResponse.json({ form: updatedForm[0] });
  } catch (error: any) {
    console.error("Error updating form:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Permission denied. You need form editing permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user has permission to delete forms
    await assertPermission("forms_delete_templates");

    const formId = params.id;

    // Check if form exists
    const existingForm = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (existingForm.length === 0) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    // Delete the form (this will also delete related submissions due to cascade)
    await db.delete(forms).where(eq(forms.id, formId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting form:", error);

    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        { error: "Permission denied. You need form deletion permissions." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
