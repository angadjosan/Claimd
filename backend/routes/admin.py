"""
Admin endpoints for managing applications.
"""
from fastapi import APIRouter, HTTPException
from utils.api_models import ReadResponse, ErrorResponse
from utils.exceptions import not_found_exception
from utils.logger import get_logger
from core.crud import (
    read_all_applications,
    read_all_users,
    get_filtered_applications,
    approve_application,
    deny_application
)

logger = get_logger(__name__)

router = APIRouter(tags=["Admin"])


@router.get(
    "/api/applications",
    response_model=ReadResponse,
    summary="Get all applications",
    description="Retrieve all SSDI applications from the database. Admin only endpoint.",
    responses={
        200: {"description": "Applications retrieved successfully"},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def getAllApplications():
    logger.info("[GET_APPLICATIONS] Admin fetching all applications")
    result = await read_all_applications()
    return ReadResponse(data=result)


@router.get(
    "/api/users/all",
    summary="Get all users",
    description="Retrieve all users from the database. Debug/admin endpoint.",
    responses={
        200: {"description": "Users retrieved successfully"},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def getAllUsers():
    logger.info("[GET_USERS] Admin fetching all users")
    result = await read_all_users()
    return result


@router.get(
    "/api/users/filtered",
    summary="Get filtered applications",
    description="Retrieve applications that require human review (human_final=False).",
    responses={
        200: {"description": "Filtered applications retrieved successfully"},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def getFilteredApplications():
    logger.info("[GET_FILTERED] Admin fetching filtered applications (human_final=False)")
    result = await get_filtered_applications()
    return result


@router.put(
    "/api/application/approve/{application_id}",
    response_model=ReadResponse,
    summary="Approve application",
    description="Approve a SSDI application and update its status to APPROVED.",
    responses={
        200: {"description": "Application approved successfully"},
        404: {"description": "Application not found", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def approveApplication(application_id: str):
    logger.info(f"[APPROVE_ENDPOINT] Admin approving application: {application_id}")
    result = await approve_application(application_id)
    
    if not result.get("success"):
        error_msg = result.get('error', 'Application not found')
        logger.warning(f"[APPROVE_ENDPOINT] Failed to approve {application_id}: {error_msg}")
        raise not_found_exception(error_msg)
    
    logger.info(f"[APPROVE_ENDPOINT] Successfully approved application: {application_id}")
    return ReadResponse(data=result)


@router.put(
    "/api/application/deny/{application_id}",
    response_model=ReadResponse,
    summary="Deny application",
    description="Deny a SSDI application and update its status to DENIED.",
    responses={
        200: {"description": "Application denied successfully"},
        404: {"description": "Application not found", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def denyApplication(application_id: str):
    logger.info(f"[DENY_ENDPOINT] Admin denying application: {application_id}")
    result = await deny_application(application_id)
    
    if not result.get("success"):
        error_msg = result.get('error', 'Application not found')
        logger.warning(f"[DENY_ENDPOINT] Failed to deny {application_id}: {error_msg}")
        raise not_found_exception(error_msg)
    
    logger.info(f"[DENY_ENDPOINT] Successfully denied application: {application_id}")
    return ReadResponse(data=result)
