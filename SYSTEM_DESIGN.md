# System Design — Car Buying Assistant

This document explains how the app is architected at a systems level. It is written to help you understand and articulate the design in an interview setting.

---

## 1. Requirements

Before designing any system, an interviewer will ask you to define requirements. Here is how to frame this app:

### Functional Requirements
- Users can chat with an AI assistant about cars
- Assistant recommends specific makes and models based on user needs
- When a user wants to buy, the app shows nearby dealer listings
- Each listing shows price, trim, mileage, deal rating, and dealer contact info

### Non-Functional Requirements
- **Latency:** Chat responses should feel fast (< 3 seconds)
- **Security:** API keys must never be exposed to the browser
- **Stateless API:** Server should not hold session memory between requests
- **Extensibility:** Inventory data source should be swappable without UI changes

### Out of Scope (for this version)
- User accounts and authentication
- Persisting conversation history across sessions
- Real-time inventory (mock data used instead)

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │              React UI (page.tsx)                │   │
│   │                                                 │   │
│   │  ┌──────────────┐    ┌───────────────────────┐  │   │
│   │  │  Chat Window │    │  DealerCardWidget     │  │   │
│   │  │              │    │  ┌─────────────────┐  │  │   │
│   │  │  Messages    │    │  │  ListingCard x6 │  │  │   │
│   │  │  Input Bar   │    │  └─────────────────┘  │  │   │
│   │  └──────────────┘    └───────────────────────┘  │   │
│   └─────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────┬───────────────────┘
               │ POST /api/chat        │ GET /api/dealers
               ▼                      ▼
┌──────────────────────────────────────────────────────────┐
│                   Next.js Server                         │
│                                                          │
│  ┌───────────────────────┐  ┌────────────────────────┐   │
│  │  /api/chat/route.ts   │  │ /api/dealers/route.ts  │   │
│  │                       │  │                        │   │
│  │  1. Receive message   │  │  1. Receive make/model │   │
│  │     + history         │  │  2. Generate listings  │   │
│  │  2. Call Anthropic    │  │  3. Return JSON        │   │
│  │  3. Parse DEALER_CARD │  │                        │   │
│  │  4. Return reply      │  │  (mock → Marketcheck)  │   │
│  └──────────┬────────────┘  └────────────────────────┘   │
│             │                                             │
└─────────────┼─────────────────────────────────────────────┘
              │ HTTPS
              ▼
┌─────────────────────────┐
│   Anthropic Claude API  │
│   (claude-sonnet-4-6)   │
└─────────────────────────┘
```

**Key insight for interviews:** The Next.js server acts as a **Backend for Frontend (BFF)** — it sits between the browser and the Anthropic API, keeping secrets server-side and transforming responses into a shape the UI needs.

---

## 3. Component Breakdown

### 3.1 Frontend — React UI

| Component | Responsibility |
|---|---|
| `Home` (page.tsx) | Owns message history state, sends chat requests, renders message list |
| `DealerCardWidget` | Owns zip + listings state, calls `/api/dealers`, renders results |
| `ListingCard` | Pure display component — renders one dealer listing, no state |

**State ownership diagram:**
```
Home
├── messages[]        ← full chat history
├── input             ← current text input
└── loading           ← API in-flight flag

DealerCardWidget (per message)
├── zip               ← user-entered zip code
├── listings[]        ← fetched dealer listings
└── searching         ← dealer API in-flight flag

ListingCard (per listing)
└── (no state — pure display)
```

### 3.2 Backend — Next.js API Routes

**`/api/chat/route.ts`**
- Receives: `{ message: string, history: Message[] }`
- Forwards full history to Anthropic API
- Extracts `[DEALER_CARD: ...]` marker from response using regex
- Returns: `{ reply: string, dealerCard?: DealerCard }`

**`/api/dealers/route.ts`**
- Receives: `?make=Toyota&model=Camry&zip=90210`
- Generates (or fetches) dealer listings
- Returns: `{ listings: DealerListing[] }`

### 3.3 AI Layer — Anthropic Claude

Claude plays two roles in this app:

1. **Conversational advisor** — understands natural language, asks clarifying questions, recommends specific cars with pros/cons
2. **Intent detector** — recognizes when a user wants to buy/check availability and signals this via a structured marker

---

## 4. Data Flow

### Flow A: Normal Chat Message

```
User types "Best SUV under $35k"
    │
    ▼
Home.send() called
    │  builds history array from existing messages
    ▼
POST /api/chat
    body: { message: "Best SUV under $35k", history: [...] }
    │
    ▼
/api/chat/route.ts
    │  appends new message to history
    │  calls client.messages.create({ model, system, messages })
    ▼
Anthropic API
    │  generates response text
    ▼
parseDealerCard(rawText)
    │  no [DEALER_CARD] marker found
    │  returns { reply: "Here are the top SUVs..." }
    ▼
Response: { reply: "Here are the top SUVs...", dealerCard: undefined }
    │
    ▼
Home.setMessages() appends assistant message
    │  no dealerCard → DealerCardWidget not rendered
    ▼
UI updates
```

### Flow B: Purchase Intent → Dealer Card

```
User types "I want to buy the RAV4 Hybrid"
    │
    ▼
POST /api/chat (same as above)
    │
    ▼
Anthropic API
    │  detects purchase intent from system prompt instructions
    │  generates: "Great choice! Enter your zip code below...
    │              [DEALER_CARD: make=Toyota, model=RAV4 Hybrid, trim=XLE]"
    ▼
parseDealerCard(rawText)
    │  regex matches the marker
    │  strips marker from reply text
    │  returns { reply: "Great choice!...", dealerCard: { make, model, trim } }
    ▼
Response: { reply: "...", dealerCard: { make: "Toyota", model: "RAV4 Hybrid" } }
    │
    ▼
Home.setMessages() appends message WITH dealerCard
    │
    ▼
DealerCardWidget renders → shows zip input
    │
    │  User enters "90210" and clicks "Find Deals"
    ▼
GET /api/dealers?make=Toyota&model=RAV4%20Hybrid&zip=90210
    │
    ▼
mockListings("Toyota", "RAV4 Hybrid") generates 6 listings
    │
    ▼
Response: { listings: [...] }
    │
    ▼
DealerCardWidget renders 6 ListingCards
```

---

## 5. API Design

### POST /api/chat

**Request:**
```json
{
  "message": "I want to buy the Ioniq 5",
  "history": [
    { "role": "user", "content": "Best EV under $50k?" },
    { "role": "assistant", "content": "The Hyundai Ioniq 5 is a great choice..." }
  ]
}
```

**Response (no purchase intent):**
```json
{
  "reply": "Here are my top picks...",
  "dealerCard": null
}
```

**Response (purchase intent detected):**
```json
{
  "reply": "Great choice! Enter your zip code to find dealers near you.",
  "dealerCard": {
    "make": "Hyundai",
    "model": "Ioniq 5",
    "trim": "SEL"
  }
}
```

### GET /api/dealers

**Request:**
```
GET /api/dealers?make=Hyundai&model=Ioniq%205&zip=90210
```

**Response:**
```json
{
  "listings": [
    {
      "id": "mock-hyundai-0",
      "year": 2025,
      "make": "Hyundai",
      "model": "Ioniq 5",
      "trim": "SE Standard Range",
      "price": 42300,
      "mileage": 12,
      "exteriorColor": "Cyber Gray",
      "inventoryType": "new",
      "dealBadge": "great",
      "dealer": {
        "name": "AutoNation Hyundai Beverly Hills",
        "address": "8741 Wilshire Blvd",
        "city": "Beverly Hills",
        "state": "CA",
        "phone": "(310) 555-0142",
        "distance": 3.2,
        "rating": 4.5
      }
    }
  ]
}
```

---

## 6. Key Design Patterns

### Pattern 1: Backend for Frontend (BFF)

The Next.js API routes are not a general-purpose API — they exist only to serve this specific UI. They handle auth (API keys), transform third-party responses, and return exactly what the UI needs.

```
Browser  →  Next.js BFF  →  Anthropic API
                        →  Marketcheck API (future)
```

**Why it matters:** The browser never talks to Anthropic directly. The API key is never exposed. The BFF can also combine, filter, or reshape data from multiple sources before it reaches the UI.

### Pattern 2: Structured Output Extraction

Instead of using Claude's formal tool-calling mechanism, the app uses a lightweight text marker pattern:

```
Claude response:
"Great choice! Here's how to find dealers near you.
[DEALER_CARD: make=Hyundai, model=Ioniq 5, trim=SEL]"

After parsing:
reply   → "Great choice! Here's how to find dealers near you."
dealCard → { make: "Hyundai", model: "Ioniq 5", trim: "SEL" }
```

This is a common pattern when you need structured signals from an LLM but don't need the full complexity of tool calling.

### Pattern 3: Adapter / Swappable Data Layer

The `/api/dealers` route is designed so the data source can be swapped without touching the UI:

```typescript
// Today: mock data
const listings = mockListings(make, model);

// Tomorrow: real API
const listings = await fetchFromMarketcheck(make, model, zip);

// UI never changes — it only knows about DealerListing[]
```

This is the **Adapter pattern** — the UI depends on an interface (`DealerListing[]`), not on a specific data source.

---

## 7. Scalability Considerations

This section is important for interviews. Even though the current app is simple, you should be able to explain how it would scale.

### Current Bottleneck: Anthropic API Latency

Every chat message waits for a full response from Claude (~1-3 seconds). At low volume this is fine. At scale:

- **Add streaming:** Use `client.messages.stream()` to start showing tokens as they arrive. This makes responses feel ~3x faster with no change to actual latency.
- **Add a queue:** For very high traffic, queue requests and process them asynchronously with a WebSocket or Server-Sent Events connection.

### Current Bottleneck: No Caching

Every `/api/dealers` call regenerates the same mock data. With a real API:

- **Cache by make/model/zip:** Results for "Toyota Camry near 90210" don't change minute-to-minute. A Redis cache with a 15-minute TTL would dramatically reduce API calls.

### Stateless Design is Already Scalable

Because the chat API is stateless (all history comes from the client), you can run any number of server instances behind a load balancer with no session affinity required. This is a good scalability property to mention.

### If Conversation History Gets Too Long

Sending full history on every request costs tokens and increases latency for long conversations. Solutions:
- **Sliding window:** Only send the last N messages
- **Summarization:** Periodically ask Claude to summarize the conversation so far and replace old messages with the summary

---

## 8. Security Design

| Concern | How It's Handled |
|---|---|
| Anthropic API key exposure | Key lives only in server-side API route — never sent to browser |
| Prompt injection | System prompt is server-controlled — user cannot override it |
| XSS | React escapes all rendered content by default |
| Input validation | Make/model/zip validated before use; zip stripped to digits only |

---

## 9. Trade-offs Made

These are the decisions where you chose one approach over another. Being able to articulate trade-offs is what separates good engineers from great ones in interviews.

| Decision | Chosen | Alternative | Why |
|---|---|---|---|
| Backend structure | Next.js API routes (BFF) | Separate FastAPI backend | Simpler, fewer moving parts, same security boundary |
| AI signaling | Text marker `[DEALER_CARD: ...]` | Claude tool calling | Tool calling adds a request/response loop; marker is simpler for this use case |
| Chat state | Stateless, full history per request | Server-side session store | No database needed; scales horizontally |
| Inventory data | Mock data | Real Marketcheck API | Zero cost for a portfolio project; API layer is designed to swap |
| Response delivery | Full response wait | Streaming | Streaming is the right production choice; deferred for simplicity |

---

## 10. How to Talk About This in an Interview

### "Walk me through the architecture."

> "It's a Next.js full-stack app. The frontend is a React chat UI. When the user sends a message, it POSTs to a Next.js API route that acts as a BFF — it holds the Anthropic API key securely on the server and forwards the conversation history to Claude. Claude returns a response, which I parse for a structured marker that signals purchase intent. If that marker is present, the UI renders an inline dealer search panel where the user can enter their zip and see nearby listings."

### "Why Next.js instead of separate frontend and backend?"

> "For this use case, the main reason to have a separate backend would be to keep the API key off the browser — but Next.js API routes handle that in the same project. A separate backend would mean managing CORS, two deployment targets, and more configuration with no added benefit at this scale."

### "How does the AI know when to show the dealer card?"

> "I engineered the system prompt to teach Claude two things: the trigger conditions (any message about deals, availability, buying, or finding a dealer) and the output format (a structured text marker at the end of the response). I also explicitly told it never to say it can't access location data — without that, Claude defaults to explaining its limitations, which isn't useful here."

### "How would you scale this?"

> "Three main changes: add streaming responses so the UI feels faster, add a Redis cache on the dealer API results since inventory doesn't change frequently, and add conversation summarization for very long sessions to keep the token count manageable. The stateless API design already supports horizontal scaling — you can run multiple server instances with no shared state."

### "What would you do differently if this were a production app?"

> "I'd replace mock inventory data with Marketcheck or a similar real-time inventory API. I'd add streaming for better perceived latency. I'd add a lead capture form so users can request a quote directly. And I'd add conversation persistence so users can return to previous sessions."

---

## 11. Folder Structure

```
car-buy-assistant/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts      ← AI chat endpoint (BFF layer)
│   │   └── dealers/
│   │       └── route.ts      ← Dealer inventory endpoint
│   ├── layout.tsx             ← Root HTML layout
│   └── page.tsx               ← Full UI: chat + dealer card
├── DESIGN.md                  ← Technology choices and design rationale
├── SYSTEM_DESIGN.md           ← This document
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```
