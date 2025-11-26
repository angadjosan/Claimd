"""
JWT Authentication Middleware
Provides JWT token generation, verification, and route protection decorators.
"""

import jwt
from datetime import datetime, timedelta
from functools import wraps
from typing import Optional, Dict, Any, Callable
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security scheme
security = HTTPBearer()


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Dictionary containing claims to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP authorization credentials from request
        
    Returns:
        User information from token payload
        
    Raises:
        HTTPException: If authentication fails
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    # Ensure user_id is present in token
    if "user_id" not in payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload


async def get_current_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency to verify the current user has admin privileges.
    
    Args:
        current_user: Current user from get_current_user dependency
        
    Returns:
        Admin user information
        
    Raises:
        HTTPException: If user is not an admin
    """
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required",
        )
    
    return current_user


def create_user_token(user_id: str, email: Optional[str] = None, **kwargs) -> str:
    """
    Create a JWT token for a regular user.
    
    Args:
        user_id: User's unique identifier
        email: User's email address
        **kwargs: Additional claims to include in token
        
    Returns:
        JWT token string
    """
    token_data = {
        "user_id": user_id,
        "is_admin": False,
        **kwargs
    }
    
    if email:
        token_data["email"] = email
    
    return create_access_token(token_data)


def create_admin_token(user_id: str, email: Optional[str] = None, **kwargs) -> str:
    """
    Create a JWT token for an admin user.
    
    Args:
        user_id: Admin's unique identifier
        email: Admin's email address
        **kwargs: Additional claims to include in token
        
    Returns:
        JWT token string
    """
    token_data = {
        "user_id": user_id,
        "is_admin": True,
        **kwargs
    }
    
    if email:
        token_data["email"] = email
    
    return create_access_token(token_data)


# Decorator for routes that require authentication
def require_auth(func: Callable) -> Callable:
    """
    Decorator to protect routes with JWT authentication.
    Use as: @require_auth
    """
    @wraps(func)
    async def wrapper(*args, current_user: Dict[str, Any] = Depends(get_current_user), **kwargs):
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper


# Decorator for routes that require admin privileges
def require_admin(func: Callable) -> Callable:
    """
    Decorator to protect routes with admin-level JWT authentication.
    Use as: @require_admin
    """
    @wraps(func)
    async def wrapper(*args, current_user: Dict[str, Any] = Depends(get_current_admin), **kwargs):
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper
