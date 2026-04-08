"""
Pydantic schemas for request/response validation.
These are the canonical data contracts used across API routes and services.
"""
from __future__ import annotations
from typing import Any, Optional
from pydantic import BaseModel, Field
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class FuelType(str, Enum):
    gasoline = "gasoline"
    diesel = "diesel"
    hybrid = "hybrid"
    electric = "electric"
    plug_in_hybrid = "plug_in_hybrid"

class BodyStyle(str, Enum):
    sedan = "sedan"
    suv = "suv"
    truck = "truck"
    coupe = "coupe"
    convertible = "convertible"
    hatchback = "hatchback"
    minivan = "minivan"
    wagon = "wagon"

class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"


# ─── Car ──────────────────────────────────────────────────────────────────────

class CarSpec(BaseModel):
    id: str
    make: str
    model: str
    year: int
    trim: Optional[str] = None
    body_style: BodyStyle
    fuel_type: FuelType
    price: float = Field(..., description="MSRP in USD")
    mpg_city: Optional[int] = None
    mpg_highway: Optional[int] = None
    range_miles: Optional[int] = Field(None, description="EV range in miles")
    horsepower: Optional[int] = None
    cargo_space_cuft: Optional[float] = None
    seating_capacity: Optional[int] = None
    safety_rating: Optional[float] = Field(None, ge=0, le=5)
    features: list[str] = []
    image_url: Optional[str] = None
    dealer_name: Optional[str] = None
    dealer_location: Optional[str] = None
    availability: str = "in_stock"  # in_stock | order | unavailable

class CarSummary(BaseModel):
    """Lightweight card used in search result lists."""
    id: str
    make: str
    model: str
    year: int
    trim: Optional[str] = None
    body_style: BodyStyle
    fuel_type: FuelType
    price: float
    mpg_city: Optional[int] = None
    mpg_highway: Optional[int] = None
    range_miles: Optional[int] = None
    safety_rating: Optional[float] = None
    image_url: Optional[str] = None
    availability: str = "in_stock"


# ─── Search ───────────────────────────────────────────────────────────────────

class SearchFilters(BaseModel):
    query: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    body_style: Optional[BodyStyle] = None
    fuel_type: Optional[FuelType] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_year: Optional[int] = None
    max_year: Optional[int] = None
    min_safety_rating: Optional[float] = None
    min_mpg: Optional[int] = None
    seating_capacity: Optional[int] = None
    location: Optional[str] = None
    limit: int = Field(10, ge=1, le=50)

class SearchResponse(BaseModel):
    results: list[CarSummary]
    total: int
    filters_applied: SearchFilters


# ─── Compare ──────────────────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    car_ids: list[str] = Field(..., min_length=2, max_length=5)

class CompareRow(BaseModel):
    attribute: str
    values: dict[str, Any]  # car_id -> value

class CompareResponse(BaseModel):
    cars: list[CarSpec]
    comparison_table: list[CompareRow]
    recommendation: Optional[str] = None


# ─── Lead / Purchase ──────────────────────────────────────────────────────────

class LeadRequest(BaseModel):
    car_id: str
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: Optional[str] = None
    zip_code: Optional[str] = None
    message: Optional[str] = None
    intent: str = Field("contact_dealer", description="contact_dealer | test_drive | purchase")

class LeadResponse(BaseModel):
    lead_id: str
    status: str
    car: CarSummary
    next_steps: str
    estimated_contact_hours: int = 24


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: MessageRole
    content: str

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    history: list[ChatMessage] = []

class ToolCall(BaseModel):
    tool: str
    arguments: dict[str, Any]
    result: Optional[Any] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    tool_calls: list[ToolCall] = []
    search_results: Optional[SearchResponse] = None
    compare_results: Optional[CompareResponse] = None
    lead_result: Optional[LeadResponse] = None
    suggestions: list[str] = []


# ─── Generic ──────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
