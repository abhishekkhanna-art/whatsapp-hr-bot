"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, User, Bot, CheckCircle2 } from "lucide-react";
import { formatTime, formatDate, cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Answer {
  id: string;
  questionText: string | null;
  answer: string;
  extractedAt: string;
}

interface Conversation {
  id: string;
  phoneNumber: string;
  contactName: string | null;
  status: string;
  summary: string | null;
  language: string | null;
  startedAt: string;
  lastMessageAt: string;
}

export function ChatView({ conversationId }: { conversationId: string }) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchData = () => {
    fetch(`/api/conversations/${conversationId}`)
      .then((r) => r.json())
      .then((data) => {
        setConversation(data.conversation);
        setMessages(data.messages ?? []);
        setAnswers(data.answers ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "summarize" }),
      });
      const updated = await res.json();
      setConversation((prev) => prev ? { ...prev, summary: updated.summary } : prev);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        Conversation not found.
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Chat panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-whatsapp-teal text-white px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {conversation.contactName ?? conversation.phoneNumber}
            </p>
            <p className="text-xs text-white/70 truncate">
              {conversation.contactName ? conversation.phoneNumber : "WhatsApp"}
              {" - "}started {formatDate(conversation.startedAt)}
            </p>
          </div>
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full",
              conversation.status === "active"
                ? "bg-green-400/30 text-white"
                : "bg-white/20 text-white/70"
            )}
          >
            {conversation.status}
          </span>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{ background: "#e5ddd5" }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm shadow-sm",
                  msg.role === "user"
                    ? "bg-whatsapp-light rounded-br-sm"
                    : "bg-white rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={cn(
                    "text-xs mt-1",
                    msg.role === "user" ? "text-green-700/60" : "text-gray-400"
                  )}
                >
                  {formatTime(msg.timestamp)}
                  {msg.role === "assistant" && (
                    <span className="ml-1 text-green-500">Priya</span>
                  )}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Right panel - summary + answers */}
      <div className="w-72 border-l bg-white flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-800">Summary</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary block */}
          <div>
            {conversation.summary ? (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800 whitespace-pre-line">
                  {conversation.summary}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No summary yet</p>
            )}
            <button
              onClick={handleSummarize}
              disabled={summarizing}
              className="mt-2 flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3 h-3", summarizing && "animate-spin")} />
              {summarizing ? "Generating..." : "Regenerate summary"}
            </button>
          </div>

          {/* Answers collected */}
          {answers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Answers Collected
              </h3>
              <div className="space-y-3">
                {answers.map((a) => (
                  <div key={a.id} className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">
                          {a.questionText}
                        </p>
                        <p className="text-sm text-gray-800 mt-1">{a.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
