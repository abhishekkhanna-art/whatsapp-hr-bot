import { NextRequest, NextResponse } from "next/server";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp";
import { handleIncomingMessage } from "@/lib/conversation-handler";

// Meta webhook verification
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// Incoming messages
export async function POST(req: NextRequest) {
  try {
    const body: WhatsAppWebhookPayload = await req.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" });
    }

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const incomingMessages = value.messages ?? [];

        for (const msg of incomingMessages) {
          if (msg.type !== "text" || !msg.text?.body) continue;

          const contact = value.contacts?.find((c) => c.wa_id === msg.from);

          // Don't await - return 200 fast to Meta, process async
          handleIncomingMessage({
            phoneNumber: msg.from,
            contactName: contact?.profile?.name,
            messageText: msg.text.body,
            metaMessageId: msg.id,
          }).catch(console.error);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
