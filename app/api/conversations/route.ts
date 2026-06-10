import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        id: conversations.id,
        phoneNumber: conversations.phoneNumber,
        contactName: conversations.contactName,
        status: conversations.status,
        summary: conversations.summary,
        language: conversations.language,
        startedAt: conversations.startedAt,
        lastMessageAt: conversations.lastMessageAt,
        messageCount: sql<number>`count(${messages.id})::int`,
        lastMessage: sql<string>`(
          SELECT content FROM messages
          WHERE conversation_id = ${conversations.id}
          ORDER BY timestamp DESC LIMIT 1
        )`,
      })
      .from(conversations)
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.lastMessageAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
