"use client";

import { useState, useRef, useEffect, FormEvent } from "react";

type DealerCard = { make: string; model: string; trim?: string };
type Message = { role: "user" | "assistant"; content: string; dealerCard?: DealerCard };

function buildDealerUrls(make: string, model: string, zip: string) {
  const makeSlug = make.toLowerCase().replace(/\s+/g, "-");
  const modelSlug = model.toLowerCase().replace(/\s+/g, "-");
  return {
    carsCom: `https://www.cars.com/shopping/results/?stock_type=all&makes[]=${makeSlug}&models[]=${makeSlug}-${modelSlug}&zip=${zip}&radius=25`,
    autoTrader: `https://www.autotrader.com/cars-for-sale/new-cars/${makeSlug}/${modelSlug}?zip=${zip}&radius=25`,
  };
}

function DealerCardWidget({ make, model, trim }: DealerCard) {
  const [zip, setZip] = useState("");
  const urls = buildDealerUrls(make, model, zip);
  const label = trim ? `${make} ${model} ${trim}` : `${make} ${model}`;

  return (
    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">📍</span>
        <div>
          <p className="text-sm font-semibold text-blue-900">Ready to buy the {label}?</p>
          <p className="text-xs text-blue-600">Enter your zip code to find dealers near you.</p>
        </div>
      </div>
      <input
        type="text"
        value={zip}
        onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
        placeholder="Enter zip code"
        maxLength={5}
        className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
      />
      <div className="flex gap-2">
        <a
          href={zip.length === 5 ? urls.carsCom : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={zip.length !== 5}
          className={`flex-1 text-center text-xs font-medium py-2 px-3 rounded-lg transition-colors ${
            zip.length === 5
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
          }`}
        >
          Search Cars.com
        </a>
        <a
          href={zip.length === 5 ? urls.autoTrader : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={zip.length !== 5}
          className={`flex-1 text-center text-xs font-medium py-2 px-3 rounded-lg transition-colors ${
            zip.length === 5
              ? "bg-orange-500 text-white hover:bg-orange-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
          }`}
        >
          Search AutoTrader
        </a>
      </div>
      {zip.length > 0 && zip.length < 5 && (
        <p className="text-xs text-red-500">Please enter a full 5-digit zip code.</p>
      )}
    </div>
  );
}

const SUGGESTIONS = [
  "Find me a reliable SUV under $35k",
  "Best electric cars for daily commuting",
  "Good family car with 3rd row seating",
  "Compare Toyota RAV4 vs Honda CR-V",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, dealerCard: data.dealerCard },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, I ran into an issue: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-xl">
          🚗
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 leading-tight">Car Buying Assistant</h1>
          <p className="text-xs text-gray-500">Powered by Claude AI</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center pb-10">
            <div className="text-7xl">🚗</div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Find your perfect car</h2>
              <p className="text-gray-500 mt-2 max-w-sm">
                Tell me your budget, needs, and preferences — I&apos;ll help you find the right car.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-all text-gray-700 shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-0.5">
                    🚗
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                  }`}
                >
                  <span className="whitespace-pre-wrap">{m.content}</span>
                  {m.dealerCard && <DealerCardWidget {...m.dealerCard} />}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  🚗
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any car, budget, or need..."
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}
