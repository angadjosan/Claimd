"""
User service for managing user records and operations.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict
from db.connectDB import db
from utils.logger import get_logger
from db.db_retry import retry_on_db_error

logger = get_logger(__name__)


@retry_on_db_error(max_attempts=3, initial_delay=1.0)
async def save_or_update_user(name: str, email: str, social_security_number: str, application_id: str) -> Dict:
    """
    Appends the new application_id to an existing user's list of applications.
    Users must be registered via /api/auth/register before submitting applications.
    
    Args:
        name: Full name of the user (for reference/validation)
        email: User's email address (used for lookup)
        social_security_number: User's SSN (stored with application)
        application_id: ID of the application to associate with user
    
    Returns:
        Dict containing success status and user information
    """
    try:
        # Check if user exists by email
        logger.info(f"[SAVE_USER] Looking up existing user by email: {email}")
        existing_user = await db.users.find_one({"email": email})

        if not existing_user:
            logger.error(f"[SAVE_USER] User not found for email: {email}. User must register first.")
            return {
                "success": False,
                "error": "User not found. Please create an account first.",
                "error_code": "USER_NOT_FOUND"
            }

        # Update existing user - append application_id
        user_id = existing_user.get('user_id', 'unknown')
        existing_apps = existing_user.get('applications', [])
        logger.info(f"[SAVE_USER] Found existing user (ID: {user_id}) with {len(existing_apps)} existing applications")
        
        await db.users.update_one(
            {"email": email},
            {
                "$addToSet": {"applications": application_id},  # prevents duplicates
                "$set": {"updated_at": datetime.now(timezone.utc)}
            }
        )
        logger.info(f"[SAVE_USER] Updated user {user_id} - added application {application_id}")
        return {
            "success": True,
            "user_id": existing_user["user_id"],
            "updated": True
        }

    except Exception as e:
        logger.error(f"[SAVE_USER] Failed to update user '{name}': {type(e).__name__}: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
