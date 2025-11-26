"""
User-related endpoints for retrieving user applications.
"""
from fastapi import APIRouter
from utils.api_models import ReadResponse, ErrorResponse
from utils.exceptions import not_found_exception
from utils.logger import get_logger
from services.application_service import read_applications_by_user_ssn

logger = get_logger(__name__)

router = APIRouter(tags=["Users"])


@router.get(
    "/api/user/applications/{ssn}",
    response_model=ReadResponse,
    summary="Get user applications by SSN",
    description="Retrieve all applications submitted by a specific user identified by their Social Security Number.",
    responses={
        200: {"description": "User applications retrieved successfully"},
        404: {"description": "User not found", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def getUserApplications(ssn: str):
    logger.info("[USER_APPLICATIONS] Fetching applications for user by SSN")
    result = await read_applications_by_user_ssn(ssn)
    
    if not result.get("success"):
        error_msg = result.get('error', 'User not found')
        logger.warning(f"[USER_APPLICATIONS] Failed to fetch user applications: {error_msg}")
        raise not_found_exception(error_msg)
    
    app_count = result.get('application_count', 0)
    logger.info(f"[USER_APPLICATIONS] Successfully retrieved {app_count} applications for user")
    return ReadResponse(data=result)
