import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { roles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET ALL ROLES
export async function GET() {
  const result = await db.select().from(roles);
  return NextResponse.json(result);
}

// CREATE ROLE
export async function POST(req: Request) {
  const { name, description, permissions } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Role name is required" },
      { status: 400 }
    );
  }

  await db.insert(roles).values({
    name,
    description: description ?? "",
    permissions: permissions ?? [],
  });

  return NextResponse.json({ message: "Role created" });
}

// UPDATE ROLE (rename + description + permissions)
export async function PUT(req: Request) {
  const { originalName, name, description, permissions } = await req.json();

  if (!originalName) {
    return NextResponse.json(
      { error: "originalName is required" },
      { status: 400 }
    );
  }

  await db
    .update(roles)
    .set({
      name,
      description,
      permissions,
    })
    .where(eq(roles.name, originalName));

  return NextResponse.json({ message: "Role updated" });
}

// DELETE ROLE
export async function DELETE(req: Request) {
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json(
      { error: "Role name is required" },
      { status: 400 }
    );
  }

  await db.delete(roles).where(eq(roles.name, name));

  return NextResponse.json({ message: "Role deleted" });
}
