import { ConversationList } from "@/components/conversation-list";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Conversations</h1>
        <p className="text-sm text-gray-500 mt-0.5">All employee chats with Priya</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <ConversationList />
      </div>
    </div>
  );
}
