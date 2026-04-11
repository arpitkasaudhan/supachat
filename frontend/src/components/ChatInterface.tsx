"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
import { Send, Bot, User, AlertCircle, Zap, BarChart2 } from "lucide-react";
import { sendQuery, QueryResult, HistoryItem } from "@/lib/api";
import ResultsTable from "./ResultsTable";
import ResultsChart from "./ResultsChart";
import SqlBlock from "./SqlBlock";
import QueryHistory from "./QueryHistory";
import clsx from "clsx";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  result?: QueryResult;
  timestamp: Date;
}

const SUGGESTED = [
  "Show top trending topics in last 30 days",
  "Compare article engagement by topic",
  "Plot daily views trend for AI articles",
  "Which authors have the most articles?",
  "Show top 10 most viewed articles",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildApiHistory = () =>
    messages.slice(-10).flatMap((m) => {
      if (m.role === "user") return [{ role: "user", content: m.content }];
      if (m.role === "assistant") return [{ role: "assistant", content: m.content }];
      return [];
    });

  const submit = async (query: string) => {
    if (!query.trim() || loading) return;

    const userMsg: Message = {
      id: uuid(),
      role: "user",
      content: query.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendQuery(query.trim(), buildApiHistory());
      const assistantMsg: Message = {
        id: uuid(),
        role: "assistant",
        content: result.message,
        result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setHistory((prev) => [
        ...prev,
        { id: userMsg.id, query: query.trim(), result, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuid(),
          role: "error",
          content: err instanceof Error ? err.message : "Unknown error",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          "flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all duration-200 overflow-hidden",
          sidebarOpen ? "w-64" : "w-0"
        )}
      >
        <QueryHistory
          history={history}
          onSelect={(item) => setInput(item.query)}
          onClear={() => setHistory([])}
        />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            title="Toggle history"
          >
            <BarChart2 size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Zap size={15} className="text-sky-400" />
            </div>
            <span className="font-semibold text-sm text-gray-100">SupaChat</span>
            <span className="text-xs text-gray-500 ml-1">Blog Analytics</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-8">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                <Zap size={28} className="text-sky-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-100 mb-1">Ask your analytics</h2>
                <p className="text-sm text-gray-500">Natural language → SQL → insights</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-left text-xs px-3 py-2.5 rounded-lg border border-gray-700 hover:border-sky-500/50 hover:bg-sky-500/5 text-gray-400 hover:text-gray-200 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx("flex gap-3", msg.role === "user" && "justify-end")}
            >
              {msg.role !== "user" && (
                <div
                  className={clsx(
                    "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5",
                    msg.role === "error" ? "bg-red-500/20" : "bg-sky-500/20"
                  )}
                >
                  {msg.role === "error" ? (
                    <AlertCircle size={14} className="text-red-400" />
                  ) : (
                    <Bot size={14} className="text-sky-400" />
                  )}
                </div>
              )}

              <div
                className={clsx(
                  "rounded-2xl px-4 py-3 max-w-3xl",
                  msg.role === "user"
                    ? "bg-sky-600 text-white rounded-tr-sm"
                    : msg.role === "error"
                    ? "bg-red-500/10 border border-red-500/30 text-red-300"
                    : "bg-gray-800 text-gray-100 rounded-tl-sm"
                )}
              >
                {/* Message text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Result extras */}
                {msg.result && (
                  <>
                    <SqlBlock sql={msg.result.sql} />
                    {msg.result.rows.length > 0 && (
                      <ResultsTable columns={msg.result.columns} rows={msg.result.rows} />
                    )}
                    {msg.result.chart && msg.result.rows.length > 1 && (
                      <ResultsChart data={msg.result.rows as Record<string, unknown>[]} config={msg.result.chart} />
                    )}
                    {msg.result.latency_ms && (
                      <p className="text-[10px] text-gray-600 mt-2">
                        {msg.result.latency_ms}ms
                      </p>
                    )}
                  </>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <User size={14} className="text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center justify-center">
                <Bot size={14} className="text-sky-400" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur">
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about your blog analytics… (Enter to send)"
              rows={1}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none focus:border-sky-500/60 transition-colors scrollbar-thin"
              style={{ maxHeight: 120, overflowY: "auto" }}
              disabled={loading}
            />
            <button
              onClick={() => submit(input)}
              disabled={loading || !input.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-gray-700 disabled:text-gray-600 flex items-center justify-center transition-colors text-white"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-700 mt-2">
            Shift+Enter for new line · Powered by Claude + Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
