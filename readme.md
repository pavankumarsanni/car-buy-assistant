# 🚗 AutoAdvisor — AI Car Shopping Assistant

A full-stack conversational car-shopping application powered by Claude AI. Users can search for cars, compare models side-by-side, get personalized recommendations, and initiate a dealer contact / purchase flow — all through natural language chat.

---

## Architecture Overview

```
car-buy-assistant/
├── backend/                   ← FastAPI Python backend
│   └── app/
│       ├── main.py            ← FastAPI app + CORS + router registration
│       ├── core/
│       │   ├── config.py      ← Pydantic settings (env vars)
│       │   └── logging.py     ← Structured logging
│       ├── models/
│       │   └── schemas.py     ← All Pydantic request/response models
│       ├── db/
│       │   └── mock_data.py   ← 14-vehicle mock catalog (swap for real DB)
│       ├── services/
│       │   └── car_service.py ← Business logic: search, compare, lead
│       ├── ai/
│       │   ├── tools.py       ← Tool definitions + executor (Anthropic format)
│       │   ├── prompt_templates.py ← System prompt + helper templates
│       │   └── agent.py       ← Agentic loop orchestration
│       └── api/routes/
│           ├── chat.py        ← POST /api/v1/chat
│           ├── cars.py        ← GET/POST /api/v1/cars/*
│           └── health.py      ← GET /health
│
└── frontend/                  ← React + TypeScript + Tailwind frontend
    └── src/
        ├── types/index.ts     ← Shared TypeScript types
        ├── services/api.ts    ← Axios API client
        ├── store/chatStore.ts ← Zustand global state
        └── components/
            ├── chat/          ← ChatWindow, MessageBubble, ChatInput, SuggestionChips
            ├── search/        ← CarCard, SearchResults
            ├── compare/       ← CompareView, CompareBasket
            ├── buy/           ← BuyFlow (multi-step lead form)
            └── ui/            ← Badge, LoadingDots
```

### Layer Diagram

```
Browser (React)
    │  POST /api/v1/chat
    ▼
FastAPI Route (chat.py)
    │
    ▼
AI Agent (agent.py)  ←→  Anthropic Claude API
    │  tool_use blocks
    ▼
Tool Executor (tools.py)
    │
    ▼
Car Service (car_service.py)
    │
    ▼
Mock DB / Real Vehicle API
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

---

## Quick Start

### 1. Clone / Open in VS Code

```bash
code car-buy-assistant
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# Run the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend Setup

Open a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | — | Your Anthropic API key |
| `ANTHROPIC_MODEL` | No | `claude-opus-4-6` | Claude model to use |
| `USE_MOCK_DATA` | No | `true` | Use mock vehicle DB (set false for real API) |
| `DEBUG` | No | `false` | Enable debug mode |
| `LOG_LEVEL` | No | `INFO` | Logging verbosity |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | CORS origins (comma-separated) |
| `VEHICLE_API_BASE_URL` | No | — | Real vehicle API URL (when USE_MOCK_DATA=false) |
| `VEHICLE_API_KEY` | No | — | Real vehicle API key |
| `CRM_WEBHOOK_URL` | No | — | CRM/lead webhook endpoint |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API URL (for production builds) |

---

## API Contracts

### POST `/api/v1/chat`

**Request:**
```json
{
  "message": "Find me a hybrid SUV under $40,000",
  "conversation_id": "abc123",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! I'm AutoAdvisor..." }
  ]
}
```

**Response:**
```json
{
  "conversation_id": "abc123",
  "message": "Great news! I found 3 hybrid SUVs under $40,000...",
  "tool_calls": [
    {
      "tool": "search_cars",
      "arguments": { "fuel_type": "hybrid", "body_style": "suv", "max_price": 40000 },
      "result": { "results": [...], "total": 3 }
    }
  ],
  "search_results": {
    "results": [
      {
        "id": "rav4-hybrid-2024-xse",
        "make": "Toyota",
        "model": "RAV4 Hybrid",
        "year": 2024,
        "trim": "XSE",
        "body_style": "suv",
        "fuel_type": "hybrid",
        "price": 35650,
        "mpg_city": 41,
        "mpg_highway": 38,
        "safety_rating": 5.0,
        "availability": "in_stock"
      }
    ],
    "total": 2
  },
  "suggestions": [
    "Tell me more about the 2024 Toyota RAV4 Hybrid",
    "Compare RAV4 Hybrid vs CR-V",
    "Schedule a test drive for this car"
  ]
}
```

### GET `/api/v1/cars/search`

Query params: `query`, `make`, `model`, `body_style`, `fuel_type`, `min_price`, `max_price`, `min_year`, `min_safety_rating`, `min_mpg`, `seating_capacity`, `limit`

### POST `/api/v1/cars/compare`

```json
{ "car_ids": ["rav4-2024-xle", "crv-2024-exl"] }
```

### POST `/api/v1/cars/lead`

```json
{
  "car_id": "rav4-2024-xle",
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "phone": "555-1234",
  "zip_code": "90210",
  "intent": "test_drive"
}
```

---

## Example Conversation Flows

### Flow 1 – Vague Request → Clarification → Search
```
User:     "I need a new car"
Agent:    "Happy to help! What body style are you thinking — SUV, sedan, truck, or something else?"
User:     "SUV, something reliable"
Agent:    "Great choice. What's your approximate budget?"
User:     "Under $35k"
Agent:    [calls search_cars: body_style=suv, max_price=35000]
          "Here are the top reliable SUVs under $35,000:
           1. 2024 Toyota RAV4 XLE – $31,000 ★5.0/5
           2. 2024 Subaru Forester Premium – $30,490 ★4.9/5
           ..."
```

### Flow 2 – Direct Comparison
```
User:     "Compare Toyota RAV4 vs Honda CR-V"
Agent:    [calls search_cars twice to get IDs, then compare_cars]
          [renders side-by-side table]
          "The RAV4 edges out the CR-V on safety (★5.0 vs ★5.0) and is $3,500 cheaper at $31,000.
           The CR-V offers slightly more cargo space (39 vs 37 cu ft)..."
```

### Flow 3 – EV Recommendation
```
User:     "Best EV for a daily 80-mile commute"
Agent:    [calls search_cars: fuel_type=electric]
          "For an 80-mile commute the Chevrolet Equinox EV is the standout choice at $34,995
           with 319 miles of range — comfortably covering your round trip twice over..."
```

### Flow 4 – Purchase Flow
```
User:     "I want to buy the RAV4 Hybrid"
Agent:    "Excellent choice! To connect you with a Toyota dealer, I'll need a few details.
           What's your name and email address?"
User:     "John Doe, john@example.com"
Agent:    [calls create_lead]
          "Done! Your purchase request has been submitted (LEAD-A1B2C3D4).
           A Toyota sales advisor will contact you within 4 hours."
```

---

## VS Code Developer Setup

1. **Recommended extensions:** Python, Pylance, ESLint, Tailwind CSS IntelliSense, REST Client
2. **Launch config** – create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend (uvicorn)",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8000"],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

3. **Tasks** – create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm run dev",
      "options": { "cwd": "${workspaceFolder}/frontend" },
      "group": "build"
    }
  ]
}
```

---

## Extending the App

### Connecting a Real Vehicle API

1. Set `USE_MOCK_DATA=false` in `.env`
2. Set `VEHICLE_API_BASE_URL` and `VEHICLE_API_KEY`
3. Implement `_search_api()` in `car_service.py` using httpx

### Adding a Real Database

Replace `app/db/mock_data.py` with SQLAlchemy or another ORM.  
The service layer (`car_service.py`) only calls `get_all_cars()` and `get_car_by_id()`, so the swap is isolated.

### Persisting Conversations

Replace the in-memory `_conversation_store` dict in `agent.py` with Redis or a DB-backed store.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend | FastAPI, Pydantic v2, Uvicorn |
| AI | Anthropic Claude (claude-opus-4-6), function calling |
| HTTP client | Axios (frontend), httpx (backend) |
| Data | Mock JSON catalog (swappable) |
