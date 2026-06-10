import { db } from "./db";
import {
  conversations,
  messages,
  questions,
  conversationAnswers,
  settings,
} from "./db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { generateReply, generateSummary, extractAnswer } from "./ai";
import { sendWhatsAppMessage } from "./whatsapp";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  // Save incoming message (unprocessed)
  const [savedMsg] = await db
    .insert(messages)
    .values({
      conversationId: conversation.id,
      role: "user",
      content: messageText,
      metaMessageId,
      isProcessed: false,
    })
    .returning();

  // Update last message time
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversation.id));

  // --- DEBOUNCE: wait 3s, then check if we're still the latest message ---
  await sleep(3000);

  const [latestMsg] = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversation.id),
        eq(messages.role, "user")
      )
    )
    .orderBy(desc(messages.timestamp))
    .limit(1);

  // If a newer message came in while we were waiting, let that one handle the reply
  if (latestMsg && latestMsg.id !== savedMsg.id) {
    return;
  }

  // Gather all unprocessed user messages to batch them into context
  const unprocessedMsgs = await db
    .select()
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversation.id),
        eq(messages.role, "user"),
        eq(messages.isProcessed, false)
      )
    )
    .orderBy(asc(messages.timestamp));

  const batchedText = unprocessedMsgs.map((m) => m.content).join("\n");

  // Mark all as processed
  for (const m of unprocessedMsgs) {
    await db
      .update(messages)
      .set({ isProcessed: true })
      .where(eq(messages.id, m.id));
  }

  // Get bot settings
  const [botSettings] = await db.select().from(settings).limit(1);

  // If brand new conversation, send welcome message first
  if (isNew && botSettings?.welcomeMessage) {
    await sleep(1500);
    await sendWhatsAppMessage(phoneNumber, botSettings.welcomeMessage);
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: "assistant",
      content: botSettings.welcomeMessage,
      isProcessed: true,
    });
  }

  // Get conversation history (last 30 messages)
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(asc(messages.timestamp))
    .limit(30);

  // Get active questions not yet answered
  const allQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.isActive, true))
    .orderBy(asc(questions.orderIndex));

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
    pendingQuestions: pendingQuestions.map((q) => ({ id: q.id, text: q.text })),
    latestUserMessage: batchedText,
  });

  // Natural typing delay: ~60 words per minute, min 1.5s max 4s
  const wordCount = reply.split(" ").length;
  const typingDelay = Math.min(Math.max(wordCount * 60, 1500), 4000);
  await sleep(typingDelay);

  // Save and send reply
  await db.insert(messages).values({
    conversationId: conversation.id,
    role: "assistant",
    content: reply,
    isProcessed: true,
  });

  await sendWhatsAppMessage(phoneNumber, reply);

  // Extract and save answers
  if (answeredQuestionIds.length > 0) {
    const recentMessages = history.slice(-6);
    const snippet = recentMessages.map((m) => `${m.role}: ${m.content}`).join("\n");

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

  // Regenerate summary every 10 messages
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
