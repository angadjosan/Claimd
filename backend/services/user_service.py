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
async def save_or_update_user(name: str, social_security_number: str, application_id: str) -> Dict:
    """
    Creates a new user if not found, otherwise appends the new application_id
    to their list of applications.
    
    Args:
        name: Full name of the user
        social_security_number: User's SSN
        application_id: ID of the application to associate with user
    
    Returns:
        Dict containing success status and user information
    """
    try:
        # Check if user already exists by SSN
        logger.info(f"[SAVE_USER] Checking for existing user in database")
        existing_user = await db.users.find_one({"socialSecurityNumber": social_security_number})

        if existing_user:
            # Append new application_id if not already in list
            user_id = existing_user.get('user_id', 'unknown')
            existing_apps = existing_user.get('applications', [])
            logger.info(f"[SAVE_USER] Found existing user (ID: {user_id}) with {len(existing_apps)} existing applications")
            
            await db.users.update_one(
                {"socialSecurityNumber": social_security_number},
                {"$addToSet": {"applications": application_id}}  # prevents duplicates
            )
            logger.info(f"[SAVE_USER] Updated user {user_id} - added application {application_id}")
            return {
                "success": True,
                "user_id": existing_user["user_id"],
                "updated": True
            }

        else:
            logger.info(f"[SAVE_USER] User not found - creating new user record for {name}")
            # Create a new user document
            user_doc = {
                "user_id": str(uuid.uuid4()),
                "name": name,
                "socialSecurityNumber": social_security_number,
                "applications": [application_id],
                "created_at": datetime.now(timezone.utc)
            }

            result = await db.users.insert_one(user_doc)
            logger.info(f"[SAVE_USER] Successfully created new user with ID: {user_doc['user_id']} (MongoDB _id: {result.inserted_id})")
            return {
                "success": True,
                "user_id": user_doc["user_id"],
                "inserted_id": str(result.inserted_id),
                "updated": False
            }

    except Exception as e:
        logger.error(f"[SAVE_USER] Failed to save or update user '{name}': {type(e).__name__}: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
