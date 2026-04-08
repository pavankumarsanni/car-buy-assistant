from __future__ import annotations

"""
Mock vehicle database – used when USE_MOCK_DATA=True.
All figures are representative of real-world 2024/2025 models.
Replace with a real database or third-party API for production.
"""
from app.models.schemas import CarSpec, BodyStyle, FuelType

MOCK_CARS: list[dict] = [
    # ── SUVs ──────────────────────────────────────────────────────────────────
    {
        "id": "rav4-2024-xle",
        "make": "Toyota", "model": "RAV4", "year": 2024, "trim": "XLE",
        "body_style": "suv", "fuel_type": "gasoline",
        "price": 31000,
        "mpg_city": 27, "mpg_highway": 35,
        "horsepower": 203, "cargo_space_cuft": 37.6, "seating_capacity": 5,
        "safety_rating": 5.0,
        "features": ["Apple CarPlay", "Android Auto", "Lane Departure Alert", "Adaptive Cruise Control", "Blind Spot Monitor"],
        "image_url": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600",
        "dealer_name": "Toyota of Downtown", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
    {
        "id": "crv-2024-exl",
        "make": "Honda", "model": "CR-V", "year": 2024, "trim": "EX-L",
        "body_style": "suv", "fuel_type": "gasoline",
        "price": 34500,
        "mpg_city": 28, "mpg_highway": 34,
        "horsepower": 190, "cargo_space_cuft": 39.2, "seating_capacity": 5,
        "safety_rating": 5.0,
        "features": ["Heated Seats", "Apple CarPlay", "Honda Sensing Suite", "Power Moonroof", "Wireless Charging"],
        "image_url": "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600",
        "dealer_name": "Honda City Auto", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
    {
        "id": "cx5-2024-signature",
        "make": "Mazda", "model": "CX-5", "year": 2024, "trim": "Signature",
        "body_style": "suv", "fuel_type": "gasoline",
        "price": 40000,
        "mpg_city": 24, "mpg_highway": 30,
        "horsepower": 227, "cargo_space_cuft": 30.9, "seating_capacity": 5,
        "safety_rating": 4.8,
        "features": ["Nappa Leather", "Head-Up Display", "Bose Audio", "360° Camera", "Adaptive LED Headlights"],
        "image_url": "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=600",
        "dealer_name": "Prestige Mazda", "dealer_location": "Santa Monica, CA",
        "availability": "in_stock",
    },
    {
        "id": "forrester-2024-premium",
        "make": "Subaru", "model": "Forester", "year": 2024, "trim": "Premium",
        "body_style": "suv", "fuel_type": "gasoline",
        "price": 30490,
        "mpg_city": 26, "mpg_highway": 33,
        "horsepower": 182, "cargo_space_cuft": 35.5, "seating_capacity": 5,
        "safety_rating": 4.9,
        "features": ["EyeSight Driver Assist", "Symmetrical AWD", "Panoramic Roof", "StarTex Interior", "Rear Cross-Traffic Alert"],
        "image_url": "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=600",
        "dealer_name": "Subaru of the Valley", "dealer_location": "Burbank, CA",
        "availability": "in_stock",
    },
    # ── EVs ───────────────────────────────────────────────────────────────────
    {
        "id": "model3-2024-lr",
        "make": "Tesla", "model": "Model 3", "year": 2024, "trim": "Long Range AWD",
        "body_style": "sedan", "fuel_type": "electric",
        "price": 45990,
        "range_miles": 358,
        "horsepower": 358, "cargo_space_cuft": 15.0, "seating_capacity": 5,
        "safety_rating": 5.0,
        "features": ["Autopilot", "15\" Touchscreen", "Over-the-Air Updates", "Supercharger Access", "Glass Roof"],
        "image_url": "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600",
        "dealer_name": "Tesla", "dealer_location": "Online / Nationwide",
        "availability": "order",
    },
    {
        "id": "ioniq6-2024-se",
        "make": "Hyundai", "model": "IONIQ 6", "year": 2024, "trim": "SE Standard Range",
        "body_style": "sedan", "fuel_type": "electric",
        "price": 38615,
        "range_miles": 240,
        "horsepower": 149, "cargo_space_cuft": 11.1, "seating_capacity": 5,
        "safety_rating": 4.8,
        "features": ["800V Fast Charging", "Vehicle-to-Load", "Digital Side Mirrors", "Ambient Lighting", "BlueLink Connected Services"],
        "image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600",
        "dealer_name": "Hyundai of Beverly Hills", "dealer_location": "Beverly Hills, CA",
        "availability": "in_stock",
    },
    {
        "id": "equinox-ev-2024-lt",
        "make": "Chevrolet", "model": "Equinox EV", "year": 2024, "trim": "LT",
        "body_style": "suv", "fuel_type": "electric",
        "price": 34995,
        "range_miles": 319,
        "horsepower": 210, "cargo_space_cuft": 57.0, "seating_capacity": 5,
        "safety_rating": 4.7,
        "features": ["Super Cruise", "Google Built-in", "DC Fast Charging", "Bose Audio", "Wireless CarPlay"],
        "image_url": "https://images.unsplash.com/photo-1625591339971-4b6b46e0894c?w=600",
        "dealer_name": "Chevy EV Center", "dealer_location": "Torrance, CA",
        "availability": "in_stock",
    },
    {
        "id": "leaf-2024-sv",
        "make": "Nissan", "model": "LEAF", "year": 2024, "trim": "SV Plus",
        "body_style": "hatchback", "fuel_type": "electric",
        "price": 31400,
        "range_miles": 212,
        "horsepower": 214, "cargo_space_cuft": 23.6, "seating_capacity": 5,
        "safety_rating": 4.5,
        "features": ["ProPILOT Assist", "e-Pedal", "Bose Audio", "NissanConnect EV", "Heated Steering Wheel"],
        "image_url": "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600",
        "dealer_name": "Nissan Metro", "dealer_location": "Glendale, CA",
        "availability": "in_stock",
    },
    # ── Hybrids ───────────────────────────────────────────────────────────────
    {
        "id": "camry-hybrid-2024-se",
        "make": "Toyota", "model": "Camry Hybrid", "year": 2024, "trim": "SE",
        "body_style": "sedan", "fuel_type": "hybrid",
        "price": 30340,
        "mpg_city": 51, "mpg_highway": 53,
        "horsepower": 208, "cargo_space_cuft": 15.1, "seating_capacity": 5,
        "safety_rating": 4.9,
        "features": ["Toyota Safety Sense 2.5+", "8\" Touchscreen", "Apple CarPlay", "Smart Key", "Dual Zone Climate"],
        "image_url": "https://images.unsplash.com/photo-1571987502951-37eeef2cb5eb?w=600",
        "dealer_name": "Toyota of Downtown", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
    {
        "id": "rav4-hybrid-2024-xse",
        "make": "Toyota", "model": "RAV4 Hybrid", "year": 2024, "trim": "XSE",
        "body_style": "suv", "fuel_type": "hybrid",
        "price": 35650,
        "mpg_city": 41, "mpg_highway": 38,
        "horsepower": 219, "cargo_space_cuft": 37.6, "seating_capacity": 5,
        "safety_rating": 5.0,
        "features": ["AWD", "Sport-tuned Suspension", "JBL Audio", "Digital Rearview Mirror", "Toyota Safety Sense 2.0"],
        "image_url": "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600",
        "dealer_name": "Toyota of Downtown", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
    # ── Trucks ────────────────────────────────────────────────────────────────
    {
        "id": "f150-2024-xlt",
        "make": "Ford", "model": "F-150", "year": 2024, "trim": "XLT",
        "body_style": "truck", "fuel_type": "gasoline",
        "price": 42185,
        "mpg_city": 20, "mpg_highway": 26,
        "horsepower": 400, "seating_capacity": 6,
        "safety_rating": 4.6,
        "features": ["SYNC 4 Infotainment", "Ford Co-Pilot360", "Pro Power Onboard", "360° Camera", "Tow Package"],
        "image_url": "https://images.unsplash.com/photo-1551522435-a13afa10f103?w=600",
        "dealer_name": "Ford of America", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
    # ── Sedans ────────────────────────────────────────────────────────────────
    {
        "id": "civic-2024-sport",
        "make": "Honda", "model": "Civic", "year": 2024, "trim": "Sport",
        "body_style": "sedan", "fuel_type": "gasoline",
        "price": 25350,
        "mpg_city": 31, "mpg_highway": 40,
        "horsepower": 158, "cargo_space_cuft": 14.8, "seating_capacity": 5,
        "safety_rating": 5.0,
        "features": ["Honda Sensing", "9\" Touchscreen", "Wireless Apple CarPlay", "Sport Pedals", "LED Headlights"],
        "image_url": "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600",
        "dealer_name": "Honda City Auto", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
    {
        "id": "corolla-2024-le",
        "make": "Toyota", "model": "Corolla", "year": 2024, "trim": "LE",
        "body_style": "sedan", "fuel_type": "gasoline",
        "price": 23150,
        "mpg_city": 31, "mpg_highway": 40,
        "horsepower": 139, "cargo_space_cuft": 13.1, "seating_capacity": 5,
        "safety_rating": 4.9,
        "features": ["Toyota Safety Sense 2.0", "8\" Touchscreen", "Apple CarPlay", "Backup Camera", "Auto Climate Control"],
        "image_url": "https://images.unsplash.com/photo-1626668893632-6f3a4466d22f?w=600",
        "dealer_name": "Toyota of Downtown", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
    # ── Minivan ───────────────────────────────────────────────────────────────
    {
        "id": "sienna-2024-xse",
        "make": "Toyota", "model": "Sienna", "year": 2024, "trim": "XSE",
        "body_style": "minivan", "fuel_type": "hybrid",
        "price": 42615,
        "mpg_city": 36, "mpg_highway": 36,
        "horsepower": 245, "cargo_space_cuft": 101.0, "seating_capacity": 8,
        "safety_rating": 4.9,
        "features": ["AWD Hybrid", "Dual Power Sliding Doors", "JBL Audio", "Tri-Zone Climate", "12.3\" Display"],
        "image_url": "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600",
        "dealer_name": "Toyota of Downtown", "dealer_location": "Los Angeles, CA",
        "availability": "in_stock",
    },
]


def get_all_cars() -> list[dict]:
    return MOCK_CARS


def get_car_by_id(car_id: str) -> dict | None:
    for car in MOCK_CARS:
        if car["id"] == car_id:
            return car
    return None
