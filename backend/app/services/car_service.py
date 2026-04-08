from __future__ import annotations

"""
Car service – pure business logic for searching, fetching, and comparing vehicles.
Sits between the AI tools layer and the data layer.
"""
import uuid
import httpx
from app.core.config import settings
from app.core.logging import get_logger
from app.models.schemas import (
    SearchFilters, SearchResponse, CarSummary, CarSpec,
    CompareResponse, CompareRow, LeadRequest, LeadResponse,
    BodyStyle, FuelType,
)
from app.db.mock_data import get_all_cars, get_car_by_id

logger = get_logger(__name__)


# ─── helpers ──────────────────────────────────────────────────────────────────

def _to_summary(car: dict) -> CarSummary:
    return CarSummary(**{k: v for k, v in car.items() if k in CarSummary.model_fields})


def _to_spec(car: dict) -> CarSpec:
    return CarSpec(**car)


# ─── search ───────────────────────────────────────────────────────────────────

def search_cars(filters: SearchFilters) -> SearchResponse:
    """Filter the vehicle catalog based on structured criteria."""
    if settings.USE_MOCK_DATA:
        return _search_mock(filters)
    return _search_api(filters)


def _search_mock(filters: SearchFilters) -> SearchResponse:
    cars = get_all_cars()
    results = []

    for car in cars:
        # Text query (make / model)
        if filters.query:
            q = filters.query.lower()
            haystack = f"{car['make']} {car['model']} {car.get('trim','')}".lower()
            if q not in haystack:
                continue
        if filters.make and car["make"].lower() != filters.make.lower():
            continue
        if filters.model and filters.model.lower() not in car["model"].lower():
            continue
        if filters.body_style and car["body_style"] != filters.body_style:
            continue
        if filters.fuel_type and car["fuel_type"] != filters.fuel_type:
            continue
        if filters.min_price and car["price"] < filters.min_price:
            continue
        if filters.max_price and car["price"] > filters.max_price:
            continue
        if filters.min_year and car["year"] < filters.min_year:
            continue
        if filters.max_year and car["year"] > filters.max_year:
            continue
        if filters.min_safety_rating and (car.get("safety_rating") or 0) < filters.min_safety_rating:
            continue
        if filters.min_mpg:
            city = car.get("mpg_city") or 0
            hwy = car.get("mpg_highway") or 0
            combined = (city + hwy) / 2 if city and hwy else 0
            if combined < filters.min_mpg:
                continue
        if filters.seating_capacity and (car.get("seating_capacity") or 0) < filters.seating_capacity:
            continue
        results.append(car)

    # Sort by safety rating desc, then price asc
    results.sort(key=lambda c: (-1 * (c.get("safety_rating") or 0), c["price"]))
    total = len(results)
    results = results[: filters.limit]

    logger.info("search_cars filters=%s returned %d/%d results", filters.model_dump(exclude_none=True), len(results), total)
    return SearchResponse(
        results=[_to_summary(c) for c in results],
        total=total,
        filters_applied=filters,
    )


def _search_api(filters: SearchFilters) -> SearchResponse:
    """Real vehicle API call (not implemented – swap in your provider)."""
    raise NotImplementedError("Real vehicle API not configured. Set USE_MOCK_DATA=True.")


# ─── details ──────────────────────────────────────────────────────────────────

def get_car_details(car_id: str) -> CarSpec | None:
    """Fetch full spec for a single vehicle."""
    if settings.USE_MOCK_DATA:
        car = get_car_by_id(car_id)
        return _to_spec(car) if car else None
    raise NotImplementedError("Real vehicle API not configured.")


# ─── compare ──────────────────────────────────────────────────────────────────

_COMPARE_ATTRIBUTES = [
    ("Price (MSRP)", "price", lambda v: f"${v:,.0f}"),
    ("Year", "year", str),
    ("Body Style", "body_style", str),
    ("Fuel Type", "fuel_type", str),
    ("Horsepower", "horsepower", lambda v: f"{v} hp" if v else "N/A"),
    ("MPG City / Hwy", None, None),  # special
    ("EV Range", "range_miles", lambda v: f"{v} mi" if v else "N/A"),
    ("Cargo Space (cu ft)", "cargo_space_cuft", lambda v: f"{v}" if v else "N/A"),
    ("Seating", "seating_capacity", lambda v: f"{v}" if v else "N/A"),
    ("Safety Rating", "safety_rating", lambda v: f"★ {v}/5" if v else "N/A"),
    ("Availability", "availability", str),
]


def compare_cars(car_ids: list[str]) -> CompareResponse | None:
    """Build a side-by-side comparison table."""
    cars_raw = []
    for cid in car_ids:
        car = get_car_by_id(cid) if settings.USE_MOCK_DATA else None
        if car is None:
            logger.warning("compare_cars: car_id %s not found", cid)
            return None
        cars_raw.append(car)

    cars = [_to_spec(c) for c in cars_raw]

    table: list[CompareRow] = []
    for label, field, fmt in _COMPARE_ATTRIBUTES:
        if field == "mpg_combined":
            continue
        if label == "MPG City / Hwy":
            values = {}
            for c in cars_raw:
                city = c.get("mpg_city")
                hwy = c.get("mpg_highway")
                values[c["id"]] = f"{city}/{hwy}" if city and hwy else "N/A (EV)"
            table.append(CompareRow(attribute=label, values=values))
            continue
        values = {}
        for c in cars_raw:
            raw_val = c.get(field)
            try:
                values[c["id"]] = fmt(raw_val) if fmt and raw_val is not None else (str(raw_val) if raw_val is not None else "N/A")
            except Exception:
                values[c["id"]] = str(raw_val)
        table.append(CompareRow(attribute=label, values=values))

    # Simple recommendation: highest safety then lowest price
    sorted_cars = sorted(cars_raw, key=lambda c: (-(c.get("safety_rating") or 0), c["price"]))
    best = sorted_cars[0]
    recommendation = (
        f"Based on safety rating and price, the **{best['year']} {best['make']} {best['model']} {best.get('trim','')}** "
        f"offers the best overall value at ${best['price']:,.0f}."
    )

    logger.info("compare_cars ids=%s", car_ids)
    return CompareResponse(cars=cars, comparison_table=table, recommendation=recommendation)


# ─── lead ─────────────────────────────────────────────────────────────────────

def create_lead(lead: LeadRequest) -> LeadResponse | None:
    """Record buyer interest and return next-steps info."""
    car = get_car_by_id(lead.car_id) if settings.USE_MOCK_DATA else None
    if car is None:
        return None

    lead_id = f"LEAD-{uuid.uuid4().hex[:8].upper()}"
    intent_map = {
        "contact_dealer": "A dealer representative will reach out within 24 hours.",
        "test_drive": "Your test drive request has been submitted. The dealer will call to schedule.",
        "purchase": "A sales advisor will contact you to finalize your purchase and arrange delivery.",
    }
    next_steps = intent_map.get(lead.intent, "A representative will be in touch shortly.")

    # In production: POST to CRM_WEBHOOK_URL
    logger.info(
        "create_lead lead_id=%s car_id=%s email=%s intent=%s",
        lead_id, lead.car_id, lead.email, lead.intent,
    )

    return LeadResponse(
        lead_id=lead_id,
        status="submitted",
        car=_to_summary(car),
        next_steps=next_steps,
        estimated_contact_hours=4 if lead.intent == "purchase" else 24,
    )
