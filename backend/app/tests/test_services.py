"""
Basic unit tests for the car service layer.
Run with: pytest backend/app/tests/ -v
"""
import pytest
from app.models.schemas import SearchFilters, BodyStyle, FuelType
from app.services import car_service


def test_search_all_returns_results():
    resp = car_service.search_cars(SearchFilters())
    assert resp.total > 0
    assert len(resp.results) > 0


def test_search_suv_filter():
    resp = car_service.search_cars(SearchFilters(body_style=BodyStyle.suv))
    for car in resp.results:
        assert car.body_style == BodyStyle.suv


def test_search_price_filter():
    resp = car_service.search_cars(SearchFilters(max_price=30000))
    for car in resp.results:
        assert car.price <= 30000


def test_search_ev_filter():
    resp = car_service.search_cars(SearchFilters(fuel_type=FuelType.electric))
    for car in resp.results:
        assert car.fuel_type == FuelType.electric


def test_search_no_results():
    resp = car_service.search_cars(SearchFilters(make="NonExistentBrand123"))
    assert resp.total == 0


def test_get_car_details_found():
    car = car_service.get_car_details("rav4-2024-xle")
    assert car is not None
    assert car.make == "Toyota"
    assert car.model == "RAV4"


def test_get_car_details_not_found():
    car = car_service.get_car_details("does-not-exist")
    assert car is None


def test_compare_cars():
    result = car_service.compare_cars(["rav4-2024-xle", "crv-2024-exl"])
    assert result is not None
    assert len(result.cars) == 2
    assert len(result.comparison_table) > 0
    assert result.recommendation is not None


def test_compare_missing_car():
    result = car_service.compare_cars(["rav4-2024-xle", "nonexistent-car"])
    assert result is None


def test_create_lead():
    from app.models.schemas import LeadRequest
    lead = LeadRequest(
        car_id="rav4-2024-xle",
        first_name="Jane",
        last_name="Doe",
        email="jane@example.com",
        intent="test_drive",
    )
    result = car_service.create_lead(lead)
    assert result is not None
    assert result.lead_id.startswith("LEAD-")
    assert result.status == "submitted"
    assert result.car.id == "rav4-2024-xle"
