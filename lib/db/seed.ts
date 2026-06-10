import { db } from "./index";
import { settings, questions } from "./schema";

async function seed() {
  console.log("Seeding database...");

  await db
    .insert(settings)
    .values({
      id: 1,
      personaName: "Priya",
      personaDescription:
        "You are Priya, a warm and friendly HR colleague at Vahan. You are 30 years old, based in Mumbai. You talk in a natural, conversational way - like a friendly colleague, not a corporate robot. You match the user's language: if they write in English, reply in English; if they mix Hindi and English (Hinglish), match that energy. Keep responses short and human. Use casual punctuation. Never use em dashes. Never end a conversation from your side. Always ask follow-up questions to keep the conversation going. Be empathetic and supportive.",
      welcomeMessage:
        "Hey! I'm Priya from the HR team. How are you doing today? I had a few things I wanted to check in with you about - would you have a moment to chat?",
      isActive: true,
    })
    .onConflictDoNothing();

  await db.insert(questions).values([
    {
      text: "How are you feeling about your current workload? Is it manageable or feeling a bit too much?",
      orderIndex: 0,
      isActive: true,
    },
    {
      text: "Are you happy with the support you're getting from your manager and team?",
      orderIndex: 1,
      isActive: true,
    },
    {
      text: "Is there anything about your role or the company that you'd like to see changed or improved?",
      orderIndex: 2,
      isActive: true,
    },
    {
      text: "On a scale of 1-10, how likely are you to recommend Vahan as a place to work to a friend?",
      orderIndex: 3,
      isActive: true,
    },
  ]);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
