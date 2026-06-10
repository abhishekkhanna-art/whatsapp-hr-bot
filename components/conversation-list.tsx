"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { MessageCircle, User, Clock } from "lucide-react";

interface ConversationItem {
  id: string;
  phoneNumber: string;
  contactName: string | null;
  status: string;
  summary: string | null;
  language: string | null;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  lastMessage: string | null;
}

export function ConversationList() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Poll every 10 seconds for new messages
    const interval = setInterval(() => {
      fetch("/api/conversations")
        .then((r) => r.json())
        .then(setConversations)
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
        <p className="font-medium">No conversations yet</p>
        <p className="text-sm mt-1">Messages will appear here once employees start chatting</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {conversations.map((conv) => (
          <Link key={conv.id} href={`/chat/${conv.id}`}>
            <div className="bg-white rounded-xl p-4 border hover:border-green-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {conv.contactName ?? conv.phoneNumber}
                    </p>
                    <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(conv.lastMessageAt)}
                    </span>
                  </div>
                  {conv.contactName && (
                    <p className="text-xs text-gray-400">{conv.phoneNumber}</p>
                  )}
                  <p className="text-sm text-gray-500 truncate mt-1">
                    {conv.lastMessage ?? "No messages yet"}
                  </p>
                  {conv.summary && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-700 line-clamp-2">{conv.summary}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {conv.messageCount} msgs
                    </span>
                    {conv.language && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full capitalize">
                        {conv.language}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        conv.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {conv.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
