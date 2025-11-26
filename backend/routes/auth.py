"""
Authentication endpoints for token generation.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
import uuid
from datetime import datetime, timezone
from passlib.context import CryptContext
from middleware.auth import create_user_token, create_admin_token, get_current_user, get_current_admin
from utils.logger import get_logger
from utils.admin_utils import verify_admin, list_admins, add_admin, remove_admin
from db.connectDB import db

logger = get_logger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter(tags=["Authentication"])


class RegisterRequest(BaseModel):
    """Request model for user registration."""
    name: str = Field(..., description="User's full name")
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="User's password (minimum 8 characters)")


class LoginRequest(BaseModel):
    """Request model for user login."""
    user_id: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")
    email: Optional[str] = Field(None, description="User's email address")


class AdminLoginRequest(BaseModel):
    """Request model for admin login."""
    email: EmailStr = Field(..., description="Admin's email address")
    password: str = Field(..., description="Admin's password")


class TokenResponse(BaseModel):
    """Response model for token generation."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    is_admin: bool


@router.post(
    "/api/auth/register",
    response_model=TokenResponse,
    summary="User registration",
    description="Register a new user account with email and password.",
    responses={
        200: {"description": "Registration successful, token generated"},
        400: {"description": "Email already registered or invalid data"},
        500: {"description": "Internal server error"},
    }
)
async def register(request: RegisterRequest):
    """
    Register a new user account.
    
    - Creates a new user with hashed password
    - Returns a JWT token for immediate login
    - Email must be unique
    """
    logger.info(f"[AUTH_REGISTER] Registration request for email: {request.email}")
    
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": request.email})
        
        if existing_user:
            logger.warning(f"[AUTH_REGISTER] Email already registered: {request.email}")
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Hash the password
        hashed_password = pwd_context.hash(request.password)
        
        # Create new user document
        user_id = str(uuid.uuid4())
        user_doc = {
            "user_id": user_id,
            "name": request.name,
            "email": request.email,
            "password": hashed_password,
            "applications": [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Insert into database
        result = await db.users.insert_one(user_doc)
        logger.info(f"[AUTH_REGISTER] User created successfully: {user_id} (MongoDB _id: {result.inserted_id})")
        
        # Generate token for immediate login
        token = create_user_token(
            user_id=user_id,
            email=request.email
        )
        
        logger.info(f"[AUTH_REGISTER] Token generated for new user: {user_id}")
        
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user_id,
            is_admin=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH_REGISTER] Error during registration: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred during registration"
        )


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
    
    - Verifies email and password
    - Returns JWT token on success
    """
    logger.info(f"[AUTH_LOGIN] User login request for email: {request.user_id}")
    
    # Look up user by email
    try:
        user = await db.users.find_one({"email": request.user_id})
        
        if not user:
            logger.warning(f"[AUTH_LOGIN] User not found for email: {request.user_id}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Verify password
        stored_password = user.get("password")
        if not stored_password:
            logger.warning(f"[AUTH_LOGIN] User has no password set: {request.user_id}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        if not pwd_context.verify(request.password, stored_password):
            logger.warning(f"[AUTH_LOGIN] Invalid password for user: {request.user_id}")
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        user_id = user.get("user_id")
        if not user_id:
            logger.error(f"[AUTH_LOGIN] User found but missing user_id: {request.user_id}")
            raise HTTPException(
                status_code=500,
                detail="Invalid user record"
            )
        
        # Generate token with user_id
        token = create_user_token(
            user_id=user_id,
            email=request.user_id
        )
        
        logger.info(f"[AUTH_LOGIN] Token generated successfully for user: {user_id}")
        
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user_id=user_id,
            is_admin=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH_LOGIN] Error during login: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred during login"
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
    
    Verifies admin credentials (email and password) against the admins.json file.
    """
    logger.info(f"[AUTH_ADMIN_LOGIN] Admin login request for: {request.email}")
    
    # Verify admin credentials using admin_utils
    admin_info = verify_admin(request.email, request.password)
    
    if not admin_info:
        logger.warning(f"[AUTH_ADMIN_LOGIN] Invalid credentials for: {request.email}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    email = admin_info.get("email")
    
    token = create_admin_token(
        user_id=email,
        email=email,
        name=admin_info.get("name")
    )
    
    logger.info(f"[AUTH_ADMIN_LOGIN] Admin token generated successfully for: {request.email}")
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=email,
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
    email: EmailStr = Field(..., description="New admin's email address")
    password: str = Field(..., description="New admin's password")
    name: str = Field(..., description="New admin's display name")


@router.get(
    "/api/auth/admins",
    summary="List all admins",
    description="Get a list of all admins (admin-only endpoint). Does not expose passwords.",
    responses={
        200: {"description": "Admin list retrieved successfully"},
        403: {"description": "Admin privileges required"},
    }
)
async def get_admins(current_user: dict = Depends(get_current_admin)):
    """
    List all admins without exposing their passwords.
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
    logger.info(f"[AUTH_ADD_ADMIN] Admin {current_user.get('user_id')} adding new admin: {request.email}")
    
    success = add_admin(
        email=request.email,
        password=request.password,
        name=request.name
    )
    
    if not success:
        logger.warning(f"[AUTH_ADD_ADMIN] Failed to add admin (may already exist): {request.email}")
        raise HTTPException(
            status_code=400,
            detail="Admin ID already exists or failed to add admin"
        )
    
    logger.info(f"[AUTH_ADD_ADMIN] Successfully added new admin: {request.email}")
    
    return {
        "success": True,
        "message": "Admin added successfully",
        "email": request.email
    }


@router.delete(
    "/api/auth/admins/{email}",
    summary="Remove admin",
    description="Remove an admin from the system (admin-only endpoint).",
    responses={
        200: {"description": "Admin removed successfully"},
        404: {"description": "Admin not found"},
        403: {"description": "Admin privileges required"},
    }
)
async def delete_admin(email: str, current_user: dict = Depends(get_current_admin)):
    """
    Remove an admin from the admins.json file.
    Requires admin authentication.
    """
    logger.info(f"[AUTH_REMOVE_ADMIN] Admin {current_user.get('user_id')} removing admin: {email}")
    
    # Prevent admin from removing themselves
    if email == current_user.get("user_id"):
        logger.warning(f"[AUTH_REMOVE_ADMIN] Admin {email} attempted to remove themselves")
        raise HTTPException(
            status_code=400,
            detail="Cannot remove yourself as admin"
        )
    
    success = remove_admin(email)
    
    if not success:
        logger.warning(f"[AUTH_REMOVE_ADMIN] Failed to remove admin (not found): {email}")
        raise HTTPException(
            status_code=404,
            detail="Admin not found"
        )
    
    logger.info(f"[AUTH_REMOVE_ADMIN] Successfully removed admin: {email}")
    
    return {
        "success": True,
        "message": "Admin removed successfully",
        "email": email
    }
