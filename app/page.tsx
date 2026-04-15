"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import ReactMarkdown from "react-markdown";

type DealerCard = { make: string; model: string; trim?: string };
type Message = { role: "user" | "assistant"; content: string; dealerCard?: DealerCard };

type DealerListing = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  exteriorColor: string;
  inventoryType: "new" | "used" | "certified";
  dealBadge: "great" | "good" | "fair";
  dealer: {
    name: string;
    address: string;
    city: string;
    state: string;
    phone: string;
    distance: number;
    rating: number;
  };
};

const BADGE_STYLES = {
  great: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-gray-100 text-gray-600",
};
const BADGE_LABELS = { great: "Great Deal", good: "Good Deal", fair: "Fair Price" };

const TYPE_STYLES = {
  new: "bg-blue-600 text-white",
  certified: "bg-purple-600 text-white",
  used: "bg-gray-500 text-white",
};

function ListingCard({ listing }: { listing: DealerListing }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${listing.dealer.name} ${listing.dealer.address} ${listing.dealer.city} ${listing.dealer.state}`
  )}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${TYPE_STYLES[listing.inventoryType]}`}>
              {listing.inventoryType}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${BADGE_STYLES[listing.dealBadge]}`}>
              {BADGE_LABELS[listing.dealBadge]}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {listing.year} {listing.make} {listing.model} {listing.trim}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {listing.inventoryType === "new" ? `${listing.mileage} mi` : `${listing.mileage.toLocaleString()} mi`} · {listing.exteriorColor}
          </p>
        </div>
        <p className="text-base font-bold text-gray-900 whitespace-nowrap">
          ${listing.price.toLocaleString()}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-1">
        <p className="text-xs font-medium text-gray-800">{listing.dealer.name}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{"★".repeat(Math.round(listing.dealer.rating))}{"☆".repeat(5 - Math.round(listing.dealer.rating))}</span>
          <span>{listing.dealer.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{listing.dealer.distance} mi away</span>
        </div>
        <p className="text-xs text-gray-500">
          {listing.dealer.address}, {listing.dealer.city}, {listing.dealer.state}
        </p>
      </div>

      <div className="flex gap-2">
        <a
          href={`tel:${listing.dealer.phone}`}
          className="flex-1 text-center text-xs font-medium py-2 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
        >
          📞 {listing.dealer.phone}
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-xs font-medium py-2 px-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
        >
          🗺 Directions
        </a>
      </div>
    </div>
  );
}

async function reverseGeocodeToZip(lat: number, lon: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
    { headers: { "User-Agent": "auto-advisor/1.0" } }
  );
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  const zip = data?.address?.postcode?.slice(0, 5);
  if (!zip || !/^\d{5}$/.test(zip)) throw new Error("Could not determine zip code from your location");
  return zip;
}

function DealerCardWidget({ make, model, trim }: DealerCard) {
  const [zip, setZip] = useState("");
  const [listings, setListings] = useState<DealerListing[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = trim ? `${make} ${model} ${trim}` : `${make} ${model}`;

  const handleSearch = async (zipOverride?: string) => {
    const zipToUse = zipOverride ?? zip;
    if (zipToUse.length !== 5) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/dealers?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&zip=${zipToUse}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setListings(data.listings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSearching(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const detectedZip = await reverseGeocodeToZip(pos.coords.latitude, pos.coords.longitude);
          setZip(detectedZip);
          handleSearch(detectedZip);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Could not detect your location");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError("Location access denied. Please enter your zip code manually.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="mt-3 space-y-3">
      {!listings ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <div>
              <p className="text-sm font-semibold text-blue-900">Find deals on the {label}</p>
              <p className="text-xs text-blue-600">Use your location or enter a zip code to see listings near you.</p>
            </div>
          </div>

          {/* Use My Location button */}
          <button
            onClick={handleUseLocation}
            disabled={locating || searching}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-lg border border-blue-300 bg-white text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {locating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Detecting location…
              </>
            ) : (
              <>📍 Use my location</>
            )}
          </button>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            <span>or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Manual zip input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter zip code"
              maxLength={5}
              className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
            />
            <button
              onClick={() => handleSearch()}
              disabled={zip.length !== 5 || searching}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {searching ? "Searching…" : "Find Deals"}
            </button>
          </div>

          {zip.length > 0 && zip.length < 5 && (
            <p className="text-xs text-red-500">Please enter a full 5-digit zip code.</p>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">
              {listings.length} listings near {zip}
            </p>
            <button
              onClick={() => { setListings(null); setZip(""); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Change location
            </button>
          </div>
          {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
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
          <h1 className="font-semibold text-gray-900 leading-tight">AutoAdvisor</h1>
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
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-gray-900 prose-headings:text-gray-900">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  )}
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
