from __future__ import annotations

"""
AI agent orchestration layer.
Handles the multi-turn agentic loop: send messages → receive tool calls →
execute tools → feed results back → repeat until a final text response.
"""
import uuid
import json
from typing import Any
import anthropic

from app.core.config import settings
from app.core.logging import get_logger
from app.models.schemas import (
    ChatRequest, ChatResponse, ChatMessage, MessageRole,
    SearchResponse, CompareResponse, LeadResponse, ToolCall,
)
from app.ai.tools import TOOL_DEFINITIONS, execute_tool
from app.ai.prompt_templates import SYSTEM_PROMPT

logger = get_logger(__name__)

# Simple in-memory conversation store (swap for Redis/DB in production)
_conversation_store: dict[str, list[dict]] = {}


def _get_or_create_history(conversation_id: str, seed: list[ChatMessage]) -> list[dict]:
    if conversation_id not in _conversation_store:
        _conversation_store[conversation_id] = [
            {"role": m.role.value, "content": m.content} for m in seed
        ]
    return _conversation_store[conversation_id]


def run_agent(request: ChatRequest) -> ChatResponse:
    """
    Main agent entry point.
    Runs the Anthropic agentic loop until a stop_sequence or end_turn,
    executing tool calls as they arrive and feeding results back.
    """
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    conversation_id = request.conversation_id or uuid.uuid4().hex

    # Seed history from request (client-side history) then append new user message
    history = _get_or_create_history(conversation_id, request.history)
    history.append({"role": "user", "content": request.message})

    all_tool_calls: list[ToolCall] = []
    final_text = ""
    search_result = None
    compare_result = None
    lead_result = None

    messages = list(history)  # working copy

    # ── Agentic loop ──────────────────────────────────────────────────────────
    max_iterations = 10
    for iteration in range(max_iterations):
        logger.debug("Agent iteration %d, messages=%d", iteration, len(messages))

        response = client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )

        logger.debug("Stop reason: %s", response.stop_reason)

        # Collect text content
        text_blocks = [b.text for b in response.content if hasattr(b, "text")]
        if text_blocks:
            final_text = " ".join(text_blocks)

        # No tool calls – we're done
        if response.stop_reason == "end_turn":
            # Append assistant reply to history
            history.append({"role": "assistant", "content": response.content})
            break

        # Process tool use blocks
        if response.stop_reason == "tool_use":
            # Add assistant message with tool_use blocks
            messages.append({"role": "assistant", "content": response.content})
            history.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue

                tool_result = execute_tool(block.name, block.input)

                # Track which structured results were produced
                if block.name == "search_cars" and "error" not in tool_result:
                    search_result = SearchResponse(**tool_result)
                elif block.name == "compare_cars" and "error" not in tool_result:
                    compare_result = CompareResponse(**tool_result)
                elif block.name == "create_lead" and "error" not in tool_result:
                    lead_result = LeadResponse(**tool_result)

                all_tool_calls.append(ToolCall(
                    tool=block.name,
                    arguments=block.input,
                    result=tool_result,
                ))

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(tool_result, default=str),
                })

            # Feed results back into messages
            messages.append({"role": "user", "content": tool_results})
            history.append({"role": "user", "content": tool_results})
            continue

        # Unexpected stop – break to avoid infinite loop
        logger.warning("Unexpected stop_reason: %s", response.stop_reason)
        break

    # Build contextual follow-up suggestions
    suggestions = _generate_suggestions(all_tool_calls, search_result, compare_result)

    return ChatResponse(
        conversation_id=conversation_id,
        message=final_text,
        tool_calls=all_tool_calls,
        search_results=search_result,
        compare_results=compare_result,
        lead_result=lead_result,
        suggestions=suggestions,
    )


def _generate_suggestions(
    tool_calls: list[ToolCall],
    search: SearchResponse | None,
    compare: CompareResponse | None,
) -> list[str]:
    """Generate contextual quick-reply suggestions based on what just happened."""
    suggestions: list[str] = []

    tool_names = {tc.tool for tc in tool_calls}

    if "search_cars" in tool_names and search and search.results:
        car = search.results[0]
        suggestions.append(f"Tell me more about the {car.year} {car.make} {car.model}")
        if len(search.results) >= 2:
            car2 = search.results[1]
            suggestions.append(f"Compare {car.make} {car.model} vs {car2.make} {car2.model}")
        suggestions.append("Schedule a test drive for this car")

    if "compare_cars" in tool_names and compare and compare.cars:
        best = compare.cars[0]
        suggestions.append(f"I want to buy the {best.year} {best.make} {best.model}")
        suggestions.append("Search for more options in this category")

    if "create_lead" in tool_names:
        suggestions.append("What other cars should I consider?")
        suggestions.append("What financing options are typically available?")

    if not suggestions:
        suggestions = [
            "Find me a reliable SUV under $35,000",
            "Show me the best EVs for commuting",
            "Compare Toyota RAV4 vs Honda CR-V",
        ]

    return suggestions[:4]
