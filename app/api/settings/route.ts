import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export async function GET() {
  try {
    const [result] = await db.select().from(settings).limit(1);
    return NextResponse.json(result ?? {});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const [updated] = await db
      .insert(settings)
      .values({ id: 1, ...body, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.id,
        set: {
          personaName: body.personaName,
          personaDescription: body.personaDescription,
          welcomeMessage: body.welcomeMessage,
          isActive: body.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
