"use client";

import { useEffect, useState } from "react";
import { Save, Plus, Trash2, GripVertical, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotSettings {
  id?: number;
  personaName: string;
  personaDescription: string;
  welcomeMessage: string;
  isActive: boolean;
}

interface Question {
  id: string;
  text: string;
  orderIndex: number;
  isActive: boolean;
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<BotSettings>({
    personaName: "Priya",
    personaDescription: "",
    welcomeMessage: "",
    isActive: true,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingQ, setSavingQ] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.personaName) setSettings(data);
      });

    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions);
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) showToast("Settings saved!");
    } finally {
      setSaving(false);
    }
  };

  const toggleQuestion = async (q: Question) => {
    setSavingQ(q.id);
    const updated = { ...q, isActive: !q.isActive };
    await fetch(`/api/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    setQuestions((prev) => prev.map((x) => (x.id === q.id ? updated : x)));
    setSavingQ(null);
  };

  const updateQuestionText = async (q: Question, text: string) => {
    const updated = { ...q, text };
    setQuestions((prev) => prev.map((x) => (x.id === q.id ? updated : x)));
  };

  const saveQuestion = async (q: Question) => {
    setSavingQ(q.id);
    await fetch(`/api/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(q),
    });
    setSavingQ(null);
    showToast("Question saved!");
  };

  const deleteQuestion = async (id: string) => {
    await fetch(`/api/questions/${id}`, { method: "DELETE" });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    showToast("Question deleted.");
  };

  const addQuestion = async () => {
    if (!newQuestion.trim()) return;
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: newQuestion.trim(),
        orderIndex: questions.length,
        isActive: true,
      }),
    });
    const created = await res.json();
    setQuestions((prev) => [...prev, created]);
    setNewQuestion("");
    showToast("Question added!");
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {toast}
        </div>
      )}

      {/* Bot Status */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Bot Status</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {settings.isActive ? "Priya is active and responding to messages." : "Bot is paused. Messages will not be answered."}
            </p>
          </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, isActive: !s.isActive }))}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
              settings.isActive
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {settings.isActive ? (
              <ToggleRight className="w-5 h-5" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
            {settings.isActive ? "Active" : "Paused"}
          </button>
        </div>
      </div>

      {/* Persona Settings */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Persona</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bot Name
          </label>
          <input
            type="text"
            value={settings.personaName}
            onChange={(e) =>
              setSettings((s) => ({ ...s, personaName: e.target.value }))
            }
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. Priya"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Persona Description / System Prompt
          </label>
          <textarea
            value={settings.personaDescription}
            onChange={(e) =>
              setSettings((s) => ({ ...s, personaDescription: e.target.value }))
            }
            rows={8}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
            placeholder="Describe who Priya is, how she talks, what tone to use..."
          />
          <p className="text-xs text-gray-400 mt-1">
            This is the base system prompt fed to GPT-4o. Be specific about tone, language style, and boundaries.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Welcome Message
          </label>
          <textarea
            value={settings.welcomeMessage}
            onChange={(e) =>
              setSettings((s) => ({ ...s, welcomeMessage: e.target.value }))
            }
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="First message sent when a new conversation starts..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Sent automatically when an employee messages for the first time.
          </p>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Persona"}
        </button>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Questions to Collect</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Priya will naturally weave these into conversations and log the answers.
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                q.isActive ? "bg-gray-50" : "bg-gray-100 opacity-60"
              )}
            >
              <div className="flex items-center gap-1 mt-2 text-gray-300">
                <span className="text-xs font-mono text-gray-400">{idx + 1}</span>
              </div>
              <textarea
                value={q.text}
                onChange={(e) => updateQuestionText(q, e.target.value)}
                onBlur={() => saveQuestion(q)}
                rows={2}
                className="flex-1 text-sm bg-transparent focus:outline-none resize-none"
              />
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => toggleQuestion(q)}
                  disabled={savingQ === q.id}
                  className={cn(
                    "p-1 rounded transition-colors",
                    q.isActive
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-400 hover:bg-gray-200"
                  )}
                  title={q.isActive ? "Disable" : "Enable"}
                >
                  {q.isActive ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new question */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuestion()}
            placeholder="Add a new question..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={addQuestion}
            disabled={!newQuestion.trim()}
            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
