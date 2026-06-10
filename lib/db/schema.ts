import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  personaName: text("persona_name").notNull().default("Priya"),
  personaDescription: text("persona_description").notNull().default(
    "You are Priya, a warm and friendly HR colleague at Vahan. You are 30 years old, based in Mumbai. You talk in a natural, conversational way - like a friendly colleague, not a corporate robot. You match the user's language: if they write in English, reply in English; if they mix Hindi and English (Hinglish), match that energy. Keep responses short and human. Use casual punctuation. Never use em dashes. Never end a conversation from your side."
  ),
  welcomeMessage: text("welcome_message").notNull().default(
    "Hey! I'm Priya from the HR team. How are you doing today? I had a few things I wanted to check in with you about - would you have a moment to chat?"
  ),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  phoneNumber: text("phone_number").notNull(),
  contactName: text("contact_name"),
  status: text("status").notNull().default("active"),
  summary: text("summary"),
  language: text("language").default("english"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metaMessageId: text("meta_message_id"),
});

export const conversationAnswers = pgTable("conversation_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  extractedAt: timestamp("extracted_at").notNull().defaultNow(),
});

export type Settings = typeof settings.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ConversationAnswer = typeof conversationAnswers.$inferSelect;
