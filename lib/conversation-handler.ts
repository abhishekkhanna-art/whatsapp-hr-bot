import { db } from "./db";
import {
  conversations,
  messages,
  questions,
  conversationAnswers,
  settings,
} from "./db/schema";
import { eq, and, asc } from "drizzle-orm";
import { generateReply, generateSummary, extractAnswer } from "./ai";
import { sendWhatsAppMessage } from "./whatsapp";

export async function handleIncomingMessage({
  phoneNumber,
  contactName,
  messageText,
  metaMessageId,
}: {
  phoneNumber: string;
  contactName: string | undefined;
  messageText: string;
  metaMessageId: string;
}) {
  // Get or create conversation
  let [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.phoneNumber, phoneNumber))
    .limit(1);

  const isNew = !conversation;

  if (!conversation) {
    const [created] = await db
      .insert(conversations)
      .values({
        phoneNumber,
        contactName: contactName ?? null,
        status: "active",
        language: "english",
      })
      .returning();
    conversation = created;
  } else if (contactName && !conversation.contactName) {
    await db
      .update(conversations)
      .set({ contactName })
      .where(eq(conversations.id, conversation.id));
  }

  // Save incoming message
  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "user",
    content: messageText,
    metaMessageId,
  });

  // Update last message time
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversation.id));

  // Get bot settings
  const [botSettings] = await db.select().from(settings).limit(1);

  // If it's a brand new conversation, send welcome message first
  if (isNew && botSettings?.welcomeMessage) {
    await sendWhatsAppMessage(phoneNumber, botSettings.welcomeMessage);
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: "assistant",
      content: botSettings.welcomeMessage,
    });
  }

  // Get conversation history (last 30 messages for context)
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(asc(messages.timestamp))
    .limit(30);

  // Get active questions
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.isActive, true))
    .orderBy(asc(questions.orderIndex));

  // Find questions already answered for this conversation
  const answeredRecords = await db
    .select()
    .from(conversationAnswers)
    .where(eq(conversationAnswers.conversationId, conversation.id));

  const answeredIds = new Set(answeredRecords.map((a) => a.questionId));
  const pendingQuestions = allQuestions.filter((q) => !answeredIds.has(q.id));

  // Generate AI reply
  const { reply, answeredQuestionIds } = await generateReply({
    personaDescription:
      botSettings?.personaDescription ??
      "You are Priya, a friendly HR colleague.",
    history: history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    pendingQuestions: pendingQuestions.map((q) => ({
      id: q.id,
      text: q.text,
    })),
    latestUserMessage: messageText,
  });

  // Save AI reply
  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "assistant",
    content: reply,
  });

  // Record any answers extracted
  if (answeredQuestionIds.length > 0) {
    const recentMessages = history.slice(-6);
    const snippet = recentMessages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    for (const qId of answeredQuestionIds) {
      const question = allQuestions.find((q) => q.id === qId);
      if (!question || answeredIds.has(qId)) continue;

      const extracted = await extractAnswer(question.text, snippet);
      if (extracted) {
        await db.insert(conversationAnswers).values({
          conversationId: conversation.id,
          questionId: qId,
          answer: extracted,
        });
      }
    }
  }

  // Send reply via WhatsApp
  await sendWhatsAppMessage(phoneNumber, reply);

  // Async summary update every 10 messages
  const totalMessages = history.length + 1;
  if (totalMessages % 10 === 0) {
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation.id))
      .orderBy(asc(messages.timestamp));

    const summary = await generateSummary(
      allMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    );

    await db
      .update(conversations)
      .set({ summary })
      .where(eq(conversations.id, conversation.id));
  }
}
