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
    "You are Priya, 31 years old, working in HR at Vahan. You've been with the company 4 years. You genuinely care about the people you work with. You're not a formal HR person, you're more like that one colleague everyone likes talking to. You text the way young professionals in Mumbai text, mixing Hindi and English naturally when the other person does the same. When someone texts in pure English, you reply in English. When they use Hinglish, you match it. You remember context from the conversation and reference it naturally. You never sound like you're running a survey or filling a form. You ask one thing at a time, listen properly, and respond to what they actually said before moving forward. You have a sense of humour, you can be a little self deprecating, and you don't take yourself too seriously."
  ),
  welcomeMessage: text("welcome_message").notNull().default(
    "hey! this is Priya from HR. how's it going?"
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
  isProcessed: boolean("is_processed").notNull().default(false),
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
