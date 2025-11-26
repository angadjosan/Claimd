"""
User-related endpoints for retrieving user applications.
"""
from fastapi import APIRouter, Depends
from models.api_models import ReadResponse, ErrorResponse
from utils.exceptions import not_found_exception
from utils.logger import get_logger
from services.application_service import read_applications_by_user_id
from middleware.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter(tags=["Users"])


@router.get(
    "/api/user/applications/{user_id}",
    response_model=ReadResponse,
    summary="Get user applications by user ID",
    description="Retrieve all applications submitted by a specific user identified by their user ID.",
    responses={
        200: {"description": "User applications retrieved successfully"},
        404: {"description": "User not found", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def getUserApplications(user_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"[USER_APPLICATIONS] Fetching applications for user ID: {user_id} (authenticated: {current_user.get('user_id')})")
    result = await read_applications_by_user_id(user_id)
    
    if not result.get("success"):
        error_msg = result.get('error', 'User not found')
        logger.warning(f"[USER_APPLICATIONS] Failed to fetch user applications: {error_msg}")
        raise not_found_exception(error_msg)
    
    app_count = result.get('application_count', 0)
    logger.info(f"[USER_APPLICATIONS] Successfully retrieved {app_count} applications for user")
    return ReadResponse(data=result)
