"""Chat endpoint – proxies requests to the AI agent."""
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatRequest, ChatResponse, ErrorResponse
from app.ai.agent import run_agent
from app.core.logging import get_logger

router = APIRouter(prefix="/chat", tags=["chat"])
logger = get_logger(__name__)


@router.post(
    "",
    response_model=ChatResponse,
    responses={500: {"model": ErrorResponse}},
    summary="Send a chat message to the car-shopping assistant",
)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        return run_agent(request)
    except Exception as exc:
        logger.exception("Chat endpoint error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
