import { ChatView } from "@/components/chat-view";

export const dynamic = "force-dynamic";

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatView conversationId={params.id} />;
}
