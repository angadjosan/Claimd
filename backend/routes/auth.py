"""
Authentication endpoints for token generation.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from middleware.auth import create_user_token, create_admin_token, get_current_user, get_current_admin
from utils.logger import get_logger
from utils.admin_utils import verify_admin, list_admins, add_admin, remove_admin

logger = get_logger(__name__)

router = APIRouter(tags=["Authentication"])


class LoginRequest(BaseModel):
    """Request model for user/admin login."""
    user_id: str = Field(..., description="User's unique identifier (e.g., SSN or email)")
    password: Optional[str] = Field(None, description="Password (not verified in this temporary implementation)")
    email: Optional[str] = Field(None, description="User's email address")


class AdminLoginRequest(BaseModel):
    """Request model for admin login."""
    admin_id: str = Field(..., description="Admin's unique identifier")
    admin_key: str = Field(..., description="Admin secret key")
    email: Optional[str] = Field(None, description="Admin's email address")


class TokenResponse(BaseModel):
    """Response model for token generation."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    is_admin: bool


@router.post(
    "/api/auth/login",
    response_model=TokenResponse,
    summary="User login",
    description="Generate a JWT token for regular users. This is a temporary implementation without password verification.",
    responses={
        200: {"description": "Login successful, token generated"},
        400: {"description": "Invalid request"},
    }
)
async def login(request: LoginRequest):
    """
    Generate a JWT token for a regular user.
    
    Note: This is a temporary implementation. In production, you should:
    - Verify user credentials against a database
    - Hash and compare passwords
    - Implement rate limiting on login attempts
    - Add account lockout after failed attempts
    """
    logger.info(f"[AUTH_LOGIN] User login request for: {request.user_id}")
    
    # For now, just generate a token without verification
    # In production, verify credentials here
    
    token = create_user_token(
        user_id=request.user_id,
        email=request.email
    )
    
    logger.info(f"[AUTH_LOGIN] Token generated successfully for user: {request.user_id}")
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=request.user_id,
        is_admin=False
    )


@router.post(
    "/api/auth/admin/login",
    response_model=TokenResponse,
    summary="Admin login",
    description="Generate a JWT token for admin users. Requires admin secret key.",
    responses={
        200: {"description": "Admin login successful, token generated"},
        401: {"description": "Invalid admin credentials"},
    }
)
async def admin_login(request: AdminLoginRequest):
    """
    Generate a JWT token for an admin user.
    
    Verifies admin credentials against the admins.json file.
    """
    logger.info(f"[AUTH_ADMIN_LOGIN] Admin login request for: {request.admin_id}")
    
    # Verify admin credentials using admin_utils
    admin_info = verify_admin(request.admin_id, request.admin_key)
    
    if not admin_info:
        logger.warning(f"[AUTH_ADMIN_LOGIN] Invalid credentials for: {request.admin_id}")
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials"
        )
    
    # Use email from request if provided, otherwise from admin_info
    email = request.email or admin_info.get("email")
    
    token = create_admin_token(
        user_id=request.admin_id,
        email=email,
        name=admin_info.get("name")
    )
    
    logger.info(f"[AUTH_ADMIN_LOGIN] Admin token generated successfully for: {request.admin_id}")
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=request.admin_id,
        is_admin=True
    )


@router.get(
    "/api/auth/verify",
    summary="Verify token",
    description="Verify the current JWT token and return user information.",
    responses={
        200: {"description": "Token is valid"},
        401: {"description": "Invalid or expired token"},
    }
)
async def verify_token(current_user: dict = Depends(get_current_user)):
    """
    Verify the JWT token and return user information.
    This endpoint is protected and requires a valid JWT token.
    """
    logger.info(f"[AUTH_VERIFY] Token verification for user: {current_user.get('user_id')}")
    
    return {
        "valid": True,
        "user_id": current_user.get("user_id"),
        "is_admin": current_user.get("is_admin", False),
        "email": current_user.get("email")
    }


# ====================================
# Admin Management Endpoints
# ====================================

class AddAdminRequest(BaseModel):
    """Request model for adding a new admin."""
    admin_id: str = Field(..., description="New admin's unique identifier")
    admin_key: str = Field(..., description="New admin's secret key")
    email: str = Field(..., description="New admin's email address")
    name: str = Field(..., description="New admin's display name")


@router.get(
    "/api/auth/admins",
    summary="List all admins",
    description="Get a list of all admins (admin-only endpoint). Does not expose admin keys.",
    responses={
        200: {"description": "Admin list retrieved successfully"},
        403: {"description": "Admin privileges required"},
    }
)
async def get_admins(current_user: dict = Depends(get_current_admin)):
    """
    List all admins without exposing their keys.
    Requires admin authentication.
    """
    logger.info(f"[AUTH_ADMINS] Admin {current_user.get('user_id')} requesting admin list")
    
    admins = list_admins()
    
    return {
        "success": True,
        "count": len(admins),
        "admins": admins
    }


@router.post(
    "/api/auth/admins",
    summary="Add new admin",
    description="Add a new admin to the system (admin-only endpoint).",
    responses={
        200: {"description": "Admin added successfully"},
        400: {"description": "Admin ID already exists"},
        403: {"description": "Admin privileges required"},
    }
)
async def create_admin(request: AddAdminRequest, current_user: dict = Depends(get_current_admin)):
    """
    Add a new admin to the admins.json file.
    Requires admin authentication.
    """
    logger.info(f"[AUTH_ADD_ADMIN] Admin {current_user.get('user_id')} adding new admin: {request.admin_id}")
    
    success = add_admin(
        admin_id=request.admin_id,
        admin_key=request.admin_key,
        email=request.email,
        name=request.name
    )
    
    if not success:
        logger.warning(f"[AUTH_ADD_ADMIN] Failed to add admin (may already exist): {request.admin_id}")
        raise HTTPException(
            status_code=400,
            detail="Admin ID already exists or failed to add admin"
        )
    
    logger.info(f"[AUTH_ADD_ADMIN] Successfully added new admin: {request.admin_id}")
    
    return {
        "success": True,
        "message": "Admin added successfully",
        "admin_id": request.admin_id
    }


@router.delete(
    "/api/auth/admins/{admin_id}",
    summary="Remove admin",
    description="Remove an admin from the system (admin-only endpoint).",
    responses={
        200: {"description": "Admin removed successfully"},
        404: {"description": "Admin not found"},
        403: {"description": "Admin privileges required"},
    }
)
async def delete_admin(admin_id: str, current_user: dict = Depends(get_current_admin)):
    """
    Remove an admin from the admins.json file.
    Requires admin authentication.
    """
    logger.info(f"[AUTH_REMOVE_ADMIN] Admin {current_user.get('user_id')} removing admin: {admin_id}")
    
    # Prevent admin from removing themselves
    if admin_id == current_user.get("user_id"):
        logger.warning(f"[AUTH_REMOVE_ADMIN] Admin {admin_id} attempted to remove themselves")
        raise HTTPException(
            status_code=400,
            detail="Cannot remove yourself as admin"
        )
    
    success = remove_admin(admin_id)
    
    if not success:
        logger.warning(f"[AUTH_REMOVE_ADMIN] Failed to remove admin (not found): {admin_id}")
        raise HTTPException(
            status_code=404,
            detail="Admin not found"
        )
    
    logger.info(f"[AUTH_REMOVE_ADMIN] Successfully removed admin: {admin_id}")
    
    return {
        "success": True,
        "message": "Admin removed successfully",
        "admin_id": admin_id
    }
