"""
Application configuration using Pydantic Settings.
All values can be overridden via environment variables or a .env file.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CarBuyAssistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # CORS – comma-separated origins
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Anthropic
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-opus-4-6"

    # Mock/real data switch
    USE_MOCK_DATA: bool = True  # Set False to hit a real vehicle API

    # External vehicle data API (optional – used when USE_MOCK_DATA=False)
    VEHICLE_API_BASE_URL: str = "https://api.example-cars.com/v1"
    VEHICLE_API_KEY: str = ""

    # Lead / CRM (optional)
    CRM_WEBHOOK_URL: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
