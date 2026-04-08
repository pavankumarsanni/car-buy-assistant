"""
Tool definitions for the Anthropic function-calling API.
Each tool maps to a service function in car_service.py.
"""
from __future__ import annotations
from typing import Any
from app.models.schemas import (
    SearchFilters, CompareRequest, LeadRequest, BodyStyle, FuelType
)
from app.services import car_service
from app.core.logging import get_logger

logger = get_logger(__name__)

# ─── Tool schemas (Anthropic format) ─────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "name": "search_cars",
        "description": (
            "Search the vehicle inventory based on user preferences. "
            "Call this when the user wants to find cars matching criteria like budget, "
            "body style, fuel type, make, model, seating, MPG, or safety rating. "
            "Only pass filters that the user has explicitly specified."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Free-text search (make/model/trim)"},
                "make": {"type": "string", "description": "Vehicle manufacturer, e.g. Toyota"},
                "model": {"type": "string", "description": "Model name, e.g. RAV4"},
                "body_style": {
                    "type": "string",
                    "enum": [s.value for s in BodyStyle],
                    "description": "Body style filter",
                },
                "fuel_type": {
                    "type": "string",
                    "enum": [f.value for f in FuelType],
                    "description": "Fuel type filter",
                },
                "min_price": {"type": "number", "description": "Minimum price in USD"},
                "max_price": {"type": "number", "description": "Maximum price in USD"},
                "min_year": {"type": "integer", "description": "Minimum model year"},
                "min_safety_rating": {"type": "number", "description": "Minimum NHTSA safety rating (0-5)"},
                "min_mpg": {"type": "integer", "description": "Minimum combined MPG"},
                "seating_capacity": {"type": "integer", "description": "Minimum number of seats"},
                "limit": {"type": "integer", "description": "Max results to return (default 6)", "default": 6},
            },
            "required": [],
        },
    },
    {
        "name": "get_car_details",
        "description": (
            "Fetch full specifications for a single vehicle by its ID. "
            "Use this when the user asks for more detail about a specific car shown in search results."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "car_id": {"type": "string", "description": "The unique vehicle ID from search results"},
            },
            "required": ["car_id"],
        },
    },
    {
        "name": "compare_cars",
        "description": (
            "Compare 2-5 vehicles side-by-side. "
            "Use this when the user wants to compare specific models or asks 'X vs Y'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "car_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of vehicle IDs to compare (2-5 cars)",
                    "minItems": 2,
                    "maxItems": 5,
                },
            },
            "required": ["car_ids"],
        },
    },
    {
        "name": "create_lead",
        "description": (
            "Submit a buyer lead or purchase/test-drive request. "
            "Use this ONLY after the user has clearly expressed intent to contact a dealer, "
            "schedule a test drive, or purchase. Always confirm the car and intent first."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "car_id": {"type": "string", "description": "Vehicle ID the user is interested in"},
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "email": {"type": "string", "description": "User's email address"},
                "phone": {"type": "string", "description": "Optional phone number"},
                "zip_code": {"type": "string", "description": "User's ZIP code for local dealer matching"},
                "message": {"type": "string", "description": "Optional message to the dealer"},
                "intent": {
                    "type": "string",
                    "enum": ["contact_dealer", "test_drive", "purchase"],
                    "description": "The user's intent",
                },
            },
            "required": ["car_id", "first_name", "last_name", "email", "intent"],
        },
    },
]


# ─── Tool executor ────────────────────────────────────────────────────────────

def execute_tool(tool_name: str, tool_input: dict[str, Any]) -> Any:
    """Dispatch a tool call to the appropriate service function."""
    logger.info("execute_tool name=%s input=%s", tool_name, tool_input)

    if tool_name == "search_cars":
        filters = SearchFilters(**tool_input)
        result = car_service.search_cars(filters)
        return result.model_dump()

    elif tool_name == "get_car_details":
        car = car_service.get_car_details(tool_input["car_id"])
        if car is None:
            return {"error": f"Car '{tool_input['car_id']}' not found"}
        return car.model_dump()

    elif tool_name == "compare_cars":
        result = car_service.compare_cars(tool_input["car_ids"])
        if result is None:
            return {"error": "One or more car IDs not found"}
        return result.model_dump()

    elif tool_name == "create_lead":
        lead = LeadRequest(**tool_input)
        result = car_service.create_lead(lead)
        if result is None:
            return {"error": f"Car '{tool_input['car_id']}' not found"}
        return result.model_dump()

    else:
        return {"error": f"Unknown tool: {tool_name}"}
