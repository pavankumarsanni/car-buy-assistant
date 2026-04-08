"""
Direct REST endpoints for car operations.
These can be called independently of the chat interface
(e.g. from a mobile app or third-party integration).
"""
from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from app.models.schemas import (
    SearchFilters, SearchResponse, CarSpec,
    CompareRequest, CompareResponse,
    LeadRequest, LeadResponse,
    BodyStyle, FuelType, ErrorResponse,
)
from app.services import car_service
from app.core.logging import get_logger

router = APIRouter(prefix="/cars", tags=["cars"])
logger = get_logger(__name__)


@router.get(
    "/search",
    response_model=SearchResponse,
    summary="Search vehicles with optional filters",
)
async def search_cars(
    query: Optional[str] = Query(None, description="Free-text make/model search"),
    make: Optional[str] = None,
    model: Optional[str] = None,
    body_style: Optional[BodyStyle] = None,
    fuel_type: Optional[FuelType] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_year: Optional[int] = None,
    min_safety_rating: Optional[float] = Query(None, ge=0, le=5),
    min_mpg: Optional[int] = None,
    seating_capacity: Optional[int] = None,
    limit: int = Query(10, ge=1, le=50),
) -> SearchResponse:
    filters = SearchFilters(
        query=query, make=make, model=model, body_style=body_style,
        fuel_type=fuel_type, min_price=min_price, max_price=max_price,
        min_year=min_year, min_safety_rating=min_safety_rating,
        min_mpg=min_mpg, seating_capacity=seating_capacity, limit=limit,
    )
    return car_service.search_cars(filters)


@router.get(
    "/{car_id}",
    response_model=CarSpec,
    responses={404: {"model": ErrorResponse}},
    summary="Get full spec for a single vehicle",
)
async def get_car(car_id: str) -> CarSpec:
    car = car_service.get_car_details(car_id)
    if car is None:
        raise HTTPException(status_code=404, detail=f"Car '{car_id}' not found")
    return car


@router.post(
    "/compare",
    response_model=CompareResponse,
    responses={404: {"model": ErrorResponse}},
    summary="Compare 2-5 vehicles side-by-side",
)
async def compare_cars(request: CompareRequest) -> CompareResponse:
    result = car_service.compare_cars(request.car_ids)
    if result is None:
        raise HTTPException(status_code=404, detail="One or more car IDs not found")
    return result


@router.post(
    "/lead",
    response_model=LeadResponse,
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}},
    summary="Submit a buyer lead or purchase/test-drive request",
)
async def create_lead(request: LeadRequest) -> LeadResponse:
    result = car_service.create_lead(request)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Car '{request.car_id}' not found")
    return result
