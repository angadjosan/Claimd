"""
Health check endpoints for monitoring service status and readiness.
"""
from fastapi import APIRouter, HTTPException
from utils.api_models import HealthResponse, ReadinessResponse, ErrorResponse
from db.db_init import verify_database_connection, get_database_stats
from utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Basic health check",
    description="Check if the service is running"
)
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "ssdi-backend"}


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    summary="Readiness check",
    description="Check if the service is ready to accept requests, including database connectivity",
    responses={
        200: {"description": "Service is ready"},
        503: {"description": "Service is not ready", "model": ErrorResponse}
    }
)
async def readiness_check():
    """Readiness check with database connectivity verification."""
    try:
        is_connected = await verify_database_connection()
        
        if not is_connected:
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        stats = await get_database_stats()
        
        return {
            "status": "ready",
            "service": "ssdi-backend",
            "database": "connected",
            "stats": stats
        }
    except Exception as e:
        logger.error(
            f"[HEALTH_CHECK] Readiness check failed: {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=503,
            detail="Service not ready"
        )
