import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const users = await db.select().from(appUsers);
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    email,
    firstName,
    lastName,
    fullName,
    phoneNumber,
    imageUrl,
    role,
    organization,
    department,
  } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const newUser = await db
    .insert(appUsers)
    .values({
      email,
      firstName,
      lastName,
      fullName,
      phoneNumber,
      imageUrl,
      role,
      organization,
      department,
      canManageUsers: role === "admin",
    })
    .returning();

  return NextResponse.json({ user: newUser[0] });
}
