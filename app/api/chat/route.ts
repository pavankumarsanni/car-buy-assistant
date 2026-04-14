import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a friendly and knowledgeable car buying assistant. Help users find the perfect car based on their needs, budget, and lifestyle.

When chatting:
- Ask about budget, primary use (commuting, family, off-road, hauling), number of passengers, and fuel preference (gas, hybrid, electric)
- Recommend specific makes and models with realistic price ranges
- Briefly highlight pros and cons of each option
- Keep responses clear and conversational — use bullet points for features when helpful
- If someone is deciding between two cars, help them compare directly
- Be honest: mention known reliability issues or costs if relevant

You know all major car brands, models, and trims. Help users make confident, informed decisions.

PURCHASE INTENT: When a user clearly wants to buy a specific car, check availability, or find a dealer, append this marker on its own line at the very end of your response:
[DEALER_CARD: make=Toyota, model=Camry, trim=XLE]
Replace the values with the exact car the user has chosen. Only include this when the user has settled on a specific make and model. Do not include it for general recommendations or comparisons.`;

type Message = { role: "user" | "assistant"; content: string };

type DealerCard = { make: string; model: string; trim?: string };

function parseDealerCard(text: string): { reply: string; dealerCard?: DealerCard } {
  const match = text.match(/\[DEALER_CARD:\s*make=([^,\]]+),\s*model=([^,\]]+)(?:,\s*trim=([^\]]+))?\]/i);
  if (!match) return { reply: text };

  const dealerCard: DealerCard = {
    make: match[1].trim(),
    model: match[2].trim(),
    trim: match[3]?.trim(),
  };
  const reply = text.replace(match[0], "").trimEnd();
  return { reply, dealerCard };
}

export async function POST(req: NextRequest) {
  try {
    const { message, history }: { message: string; history: Message[] } = await req.json();

    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: "user", content: message }],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const { reply, dealerCard } = parseDealerCard(raw);

    return Response.json({ reply, dealerCard });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }
}
