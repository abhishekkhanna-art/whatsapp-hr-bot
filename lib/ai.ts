import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface PendingQuestion {
  id: string;
  text: string;
}

export async function generateReply({
  personaDescription,
  history,
  pendingQuestions,
  latestUserMessage,
}: {
  personaDescription: string;
  history: ConversationMessage[];
  pendingQuestions: PendingQuestion[];
  latestUserMessage: string;
}): Promise<{ reply: string; answeredQuestionIds: string[] }> {
  const questionsContext =
    pendingQuestions.length > 0
      ? `\n\nYou still need to naturally gather answers to these questions during the conversation (weave them in organically, don't fire them all at once like a form):\n${pendingQuestions
          .map((q, i) => `${i + 1}. [ID:${q.id}] ${q.text}`)
          .join("\n")}`
      : "\n\nYou have gathered all the needed information. Just continue having a warm conversation.";

  const systemPrompt = `${personaDescription}

IMPORTANT RULES:
- Never use em dashes (--) in your responses. Use commas, full stops, or line breaks instead.
- Keep messages short - max 3-4 sentences per reply. This is WhatsApp, not an essay.
- Never end the conversation. Always leave the door open with a follow-up question or warm closing that invites more chat.
- Match the user's language. If they write in Hindi/Hinglish, match that. If English, stay English.
- Sound human. Use casual language. Contractions are fine. An occasional "haha" or "yaar" in Hinglish context is fine.
- Don't be pushy. If someone seems busy or uncomfortable, acknowledge it and gently pivot.
- NEVER sound like a bot or say you are an AI.${questionsContext}

At the end of your response JSON, indicate which question IDs you got answers for in this exchange (can be empty array).
Respond ONLY in this JSON format:
{
  "reply": "your reply here",
  "answeredIds": ["uuid1", "uuid2"]
}`;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: latestUserMessage },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    temperature: 0.85,
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0].message.content ?? "{}";

  try {
    const parsed = JSON.parse(raw);
    return {
      reply: parsed.reply ?? "Hey, sorry I missed that - can you say it again?",
      answeredQuestionIds: Array.isArray(parsed.answeredIds)
        ? parsed.answeredIds
        : [],
    };
  } catch {
    return {
      reply: "Hey, sorry I missed that - can you say it again?",
      answeredQuestionIds: [],
    };
  }
}

export async function generateSummary(
  messages: ConversationMessage[]
): Promise<string> {
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Employee" : "Priya (HR)"}: ${m.content}`)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a concise HR assistant. Summarize this WhatsApp conversation in 2-3 bullet points. Focus on key topics discussed, employee sentiment, and any action items. Be direct and factual.",
      },
      {
        role: "user",
        content: `Summarize this conversation:\n\n${transcript}`,
      },
    ],
    max_tokens: 200,
  });

  return completion.choices[0].message.content ?? "No summary available.";
}

export async function extractAnswer(
  questionText: string,
  conversationSnippet: string
): Promise<string | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Extract the answer to the given question from the conversation. Return only the extracted answer as plain text, or return null if the question wasn't clearly answered.",
      },
      {
        role: "user",
        content: `Question: "${questionText}"\n\nConversation:\n${conversationSnippet}\n\nExtracted answer:`,
      },
    ],
    max_tokens: 150,
  });

  const answer = completion.choices[0].message.content?.trim();
  return answer && answer.toLowerCase() !== "null" ? answer : null;
}
