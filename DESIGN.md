# Design Document — Car Buying Assistant

A deep-dive into the architecture, technology choices, and design decisions behind this app.

---

## What the App Does

Car Buying Assistant is a conversational AI app that helps users find the right car. The user chats naturally — describing their budget, needs, and preferences — and the assistant recommends specific makes and models. When the user decides on a car, the app surfaces an inline dealer search panel showing nearby listings with pricing, trim details, deal ratings, and direct contact options.

**Core user flow:**

```
Ask a question → Get recommendations → Decide on a car
       → Enter zip code → See nearby dealer listings
              → Call dealer or get directions
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 14 |
| UI | React | 18 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 3.4 |
| AI | Anthropic Claude (claude-sonnet-4-6) | SDK 0.40 |

---

## Why These Technologies

### Next.js 14 (App Router)

Next.js was chosen because it collapses the frontend and backend into a single project. API routes (`/app/api/`) run server-side inside the same codebase — no separate backend server, no CORS configuration, no extra deploy target.

This matters for a car assistant specifically because the Anthropic API key must never be exposed to the browser. With Next.js, the key lives only on the server inside the API route — the client never sees it.

Alternative considered: A separate React frontend + FastAPI backend. Rejected because it adds operational complexity (two servers, CORS, two deploys) for no benefit at this scale.

### React 18

React's component model fits this app well. The chat interface, dealer card, listing cards, and loading states are all naturally isolated components with their own local state. No global state library was needed — each component manages exactly what it owns.

### TypeScript

TypeScript was used throughout to make the data shapes explicit and catch bugs at compile time rather than runtime. For example, `DealerListing` and `DealerCard` types are defined once and referenced in both the API route and the UI — if the API shape changes, TypeScript surfaces every affected component immediately.

### Tailwind CSS

Tailwind was chosen for speed and consistency. Every spacing, color, border-radius, and shadow follows a shared scale without writing a single custom CSS class. The utility-first approach also makes component styles self-documenting — you can read the className and immediately understand the visual intent.

### Anthropic SDK + claude-sonnet-4-6

Claude Sonnet 4.6 is a strong general-purpose model that handles the nuanced judgment calls this app needs — understanding vague requests ("something reliable for a family"), comparing cars on multiple axes, and detecting when a user has shifted from browsing to buying. The Anthropic TypeScript SDK wraps the API cleanly and is well-maintained.

---

## Architecture

```
Browser (React)
    │
    │  POST /api/chat  { message, history }
    ▼
Next.js API Route — /app/api/chat/route.ts
    │  Calls Anthropic API with full conversation history
    │  Parses [DEALER_CARD: ...] marker from response
    │  Returns { reply, dealerCard? }
    ▼
React UI — /app/page.tsx
    │  Renders assistant message
    │  If dealerCard present → renders DealerCardWidget
    │
    │  On zip submit: GET /api/dealers?make=...&model=...&zip=...
    ▼
Next.js API Route — /app/api/dealers/route.ts
    │  Generates mock listings for the make/model
    │  Returns { listings: DealerListing[] }
    ▼
DealerCardWidget → renders ListingCard[] inline
```

---

## Key Design Decisions

### 1. Structured Marker Extraction Instead of Tool Calling

The most important design decision was how to signal "the user wants to buy" from the AI to the frontend.

**Option A — Tool calling (function calling):** Define a `show_dealer_card` tool and have Claude call it when appropriate. This is the "right" approach for production systems.

**Option B — Structured text marker:** Instruct Claude to append `[DEALER_CARD: make=Toyota, model=Camry]` at the end of its response. The API route strips and parses it.

Option B was chosen because it keeps the implementation simple without losing any capability. The marker is deterministic and easy to parse with a single regex. Tool calling would require handling the tool use/tool result message loop, which adds complexity with no user-facing benefit here.

The trade-off: if Claude generates a malformed marker, the regex won't match and no card is shown. This is a graceful failure — the user just doesn't see the card — rather than a hard error.

```typescript
// Simple, reliable extraction
const match = text.match(
  /\[DEALER_CARD:\s*make=([^,\]]+),\s*model=([^,\]]+)(?:,\s*trim=([^\]]+))?\]/i
);
```

### 2. Stateless Chat (Full History Per Request)

Each POST to `/api/chat` sends the entire conversation history. The server holds no session state.

This means the API route is completely stateless — it receives everything it needs in the request body and returns a complete response. There is no session store, no database, no in-memory cache to manage.

The trade-off is that very long conversations increase token usage. For a portfolio app this is irrelevant. For production, you would add conversation summarization or a sliding window after ~20 messages.

### 3. Purchase Intent Detection via Prompt Engineering

The system prompt explicitly teaches Claude two behaviors:

1. **When to trigger:** Any message about deals, availability, inventory, finding a dealer, or buying a specific car.
2. **What to do:** Respond briefly and emit the `[DEALER_CARD: ...]` marker — never say "I can't access your location."

This second rule was added after observing that without it, Claude's default behavior was to explain its limitations and list external websites — exactly the wrong response. Explicit instructions ("NEVER say you cannot access location data") override that default.

```
NEVER say you cannot access location, inventory, or pricing data.
Instead, always trigger the dealer card — the app will handle location and search.
```

### 4. Mock Data Designed for Easy Swap

The `/api/dealers` route generates realistic mock data rather than calling a real inventory API. The mock data was designed to mirror what Marketcheck's API actually returns — same field names, same data shapes, same response envelope.

```typescript
// Swap this function body for a real fetch() call to Marketcheck
// and nothing else in the codebase needs to change
async function GET(req: NextRequest) {
  const listings = mockListings(make, model); // ← replace with API call
  return Response.json({ listings });
}
```

This is a deliberate architectural choice: the UI consumes `DealerListing[]` regardless of where it came from. The data source is an implementation detail of the API route.

### 5. Component-Level State for Dealer Search

The `DealerCardWidget` manages its own zip, listings, and loading state locally with `useState`. It does not push anything to a parent component or global store.

This is appropriate because the dealer search is fully self-contained — no other part of the app needs to know a zip code was entered or what listings were returned. Keeping state local makes the component portable and easier to reason about.

---

## Feature Breakdown

### Chat Interface (`/app/page.tsx`)

- Stateless message loop: user message → POST `/api/chat` → append assistant reply
- Full history passed on every request for conversational continuity
- Loading state with animated dots while waiting for the API
- Auto-scroll to the latest message
- Suggestion chips on the empty state to guide first-time users

### Purchase Intent Detection (`/app/api/chat/route.ts`)

- System prompt instructs Claude to emit `[DEALER_CARD: make=..., model=..., trim=...]`
- `parseDealerCard()` strips the marker from the reply text and returns it as structured data
- API returns `{ reply: string, dealerCard?: DealerCard }` — no breaking change when no card

### Dealer Inventory Panel (`/app/api/dealers/route.ts` + `DealerCardWidget`)

- User enters zip → `GET /api/dealers` is called
- Returns 6 listings: mix of New, Certified Pre-Owned, and Used
- Each listing includes: year, make, model, trim, price, mileage, color, deal badge (Great/Good/Fair), dealer name, distance, star rating, address, phone
- `ListingCard` renders tap-to-call (`tel:` link) and Google Maps directions (no API key required)
- "Change zip" resets the panel to search again

---

## What Was Deliberately Left Out

| Feature | Reason |
|---|---|
| Real inventory API | Cost — not needed for a portfolio demo |
| User accounts / auth | Out of scope; no persistent data |
| Conversation persistence | Adds database complexity; not needed |
| Geolocation auto-fill | Nice to have; easy to add with `navigator.geolocation` |
| Lead capture form | Natural next step but kept scope focused |
| Streaming responses | Would improve perceived latency; deferred for simplicity |

---

## How to Extend

### Add Geolocation Auto-Fill

```typescript
navigator.geolocation.getCurrentPosition(async (pos) => {
  const zip = await reverseGeocodeToZip(pos.coords); // e.g. via Google Maps API
  setZip(zip);
});
```

### Swap in Real Marketcheck Inventory

Replace the `mockListings()` call in `/app/api/dealers/route.ts`:

```typescript
const res = await fetch(
  `https://api.marketcheck.com/v2/search/car/active?api_key=${process.env.MARKETCHECK_API_KEY}&make=${make}&model=${model}&zip=${zip}&radius=25`
);
const data = await res.json();
const listings = data.listings.map(mapMarketcheckListing); // normalize to DealerListing
```

Add `MARKETCHECK_API_KEY` to `.env.local` and nothing else changes.

### Add Response Streaming

Replace `client.messages.create()` with `client.messages.stream()` and stream tokens back to the client using a `ReadableStream`. This makes the assistant feel significantly faster for long responses.

### Add Lead Capture

After the user views listings, prompt for name/email/phone and POST to a CRM webhook or send via email. The `DealerListing` already carries `dealer.name` and `dealer.phone` to include in the lead.

---

## Local Setup

```bash
# Install dependencies
npm install

# Add your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# Start the dev server
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key from console.anthropic.com |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-sonnet-4-6` |
| `MARKETCHECK_API_KEY` | No | Required only if swapping in real inventory data |
