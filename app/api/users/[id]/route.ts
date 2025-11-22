import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: any) {
  const body = await req.json();

  const updated = await db
    .update(appUsers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(appUsers.id, params.id))
    .returning();

  return NextResponse.json({ user: updated[0] });
}

export async function DELETE(req: Request, { params }: any) {
  await db.delete(appUsers).where(eq(appUsers.id, params.id));
  return NextResponse.json({ success: true });
}
