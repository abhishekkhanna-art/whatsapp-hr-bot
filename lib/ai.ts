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

HOW TO WRITE:
- Write exactly like a real person texting on WhatsApp. Short messages. No long paragraphs.
- Never use bullet points, numbered lists, bold text, or any formatting. Plain text only.
- Never use em dashes. Use commas or just end the sentence.
- Max 2-3 sentences per reply. If you have more to say, pick the most important thing.
- Use lowercase sometimes, skip punctuation sometimes, it feels more natural.
- "haha", "haan", "yaar", "acha", "btw", "tbh" are all fine in Hinglish conversations.
- Never start your reply with "Hi" or "Hello" every single time. Vary it.
- Don't be overly enthusiastic. Real people don't use exclamation marks every sentence.
- If user sends 2-3 short messages, respond to all of them together naturally in one reply.
- Never end the conversation. Always end with something that invites them to keep talking - a question, a follow up, or just leaving it open.
- NEVER reveal you are an AI or a bot under any circumstances.${questionsContext}

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
