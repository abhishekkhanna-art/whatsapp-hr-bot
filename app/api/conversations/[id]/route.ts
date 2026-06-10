import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  conversations,
  messages,
  conversationAnswers,
  questions,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { generateSummary } from "@/lib/ai";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.timestamp));

    const answers = await db
      .select({
        id: conversationAnswers.id,
        answer: conversationAnswers.answer,
        extractedAt: conversationAnswers.extractedAt,
        questionText: questions.text,
        questionId: questions.id,
      })
      .from(conversationAnswers)
      .leftJoin(questions, eq(questions.id, conversationAnswers.questionId))
      .where(eq(conversationAnswers.conversationId, id));

    return NextResponse.json({ conversation, messages: msgs, answers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "summarize") {
      const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(asc(messages.timestamp));

      const summary = await generateSummary(
        msgs.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );

      const [updated] = await db
        .update(conversations)
        .set({ summary })
        .where(eq(conversations.id, id))
        .returning();

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
