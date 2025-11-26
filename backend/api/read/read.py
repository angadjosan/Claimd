import os
from bson import ObjectId
from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Any, Dict
from connectDB import db
import base64
from bson import Binary
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from logger import get_logger

# Load environment
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.env"))
load_dotenv(dotenv_path)

# Initialize logger
logger = get_logger(__name__)

# --------------------------------------------------------
# Utility: Convert MongoDB BSON → JSON-safe
# --------------------------------------------------------
def bson_to_json(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively converts MongoDB BSON types (ObjectId, datetime) into JSON-safe types."""
    if not doc:
        return {}

    result = {}
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, list):
            result[key] = [bson_to_json(v) if isinstance(v, dict) else v for v in value]
        elif isinstance(value, dict):
            result[key] = bson_to_json(value)
        else:
            result[key] = value
    return result


# --------------------------------------------------------
# Read single application by ID
# --------------------------------------------------------
async def read_application_by_id(application_id: str):
    """
    Given an application_id, find and return the full application data
    """
    logger.info(f"[READ_APPLICATION] Fetching application by ID: {application_id}")
    try:
        app = await db.applications.find_one({"application_id": application_id})
        if not app:
            logger.warning(f"[READ_APPLICATION] Application not found in database: {application_id}")
            return {"success": False, "error": f"No application found with application_id {application_id}"}
        
        docs = app["documents"]
        doc_id = docs["document_id"]
        logger.debug(f"[READ_APPLICATION] Retrieving document from GridFS: {doc_id}")
                
        doc = await db.documents.find_one({"_id": ObjectId(doc_id)})
        
        if not doc:
            logger.warning(f"[READ_APPLICATION] Document not found in GridFS: {doc_id} for application: {application_id}")
            return {"success": False, "application": bson_to_json(app)} 
        
        app["document"] = base64.b64encode(doc["data"]).decode("utf-8")
        logger.info(f"[READ_APPLICATION] Successfully retrieved application: {application_id} with document")
        return {"success": True, "application": bson_to_json(app)}

    except KeyError as e:
        logger.error(f"[READ_APPLICATION] Missing required field in application document: {e} for application: {application_id}", exc_info=True)
        return {"success": False, "error": "Failed to fetch application"}
    except Exception as e:
        logger.error(f"[READ_APPLICATION] Unexpected error fetching application {application_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        return {"success": False, "error": "Failed to fetch application"}


# --------------------------------------------------------
# Main read function
# --------------------------------------------------------
async def read_all_applications():
    """
    Get all applications from the database for admin dashboard
    """
    logger.info("[READ_ALL_APPLICATIONS] Starting fetch of all applications from database")
    try:
        # Find all applications
        cursor = db.applications.find({})
        applications = []
        
        async for app in cursor:
            applications.append(bson_to_json(app))

        response_data = {
            "success": True,
            "applications": applications,
            "application_count": len(applications)
        }
        logger.info(f"[READ_ALL_APPLICATIONS] Successfully retrieved {len(applications)} applications")
        return response_data

    except Exception as e:
        logger.error(f"[READ_ALL_APPLICATIONS] Database query failed: {type(e).__name__}: {str(e)}", exc_info=True)
        return {"success": False, "error": "Failed to fetch applications"}

async def get_document_data(document_ref: Dict[str, Any]):
    try:
        if not document_ref or "document_id" not in document_ref:
            return None
        
        document_id = document_ref["document_id"]
        doc = await db.documents.find_one({"_id": ObjectId(document_id)})
        
        if not doc:
            return None

        return doc.get["data"]
    except Exception as e:
        logger.error(f"[GET_DOCUMENT_DATA] Failed to retrieve document {document_ref.get('document_id', 'unknown')}: {type(e).__name__}: {str(e)}", exc_info=True)
        return None

async def read_applications_by_user_ssn(ssn: str):
    """
    Get all applications for a specific user by their SSN
    """
    logger.info("[READ_USER_APPLICATIONS] Fetching applications for user by SSN")
    try:
        # First find the user by SSN
        user = await db.users.find_one({"socialSecurityNumber": ssn})
        
        if not user:
            logger.warning("[READ_USER_APPLICATIONS] User not found in database")
            return {"success": False, "error": f"No user found with SSN {ssn}"}
        
        # Get all application IDs for this user
        application_ids = user.get("applications", [])
        user_id = user.get("user_id", "unknown")
        
        if not application_ids:
            logger.info(f"[READ_USER_APPLICATIONS] User {user_id} has no applications")
            return {
                "success": True, 
                "applications": [],
                "user": bson_to_json(user),
                "application_count": 0
            }
        
        # Find all applications for this user
        cursor = db.applications.find({"application_id": {"$in": application_ids}})
        applications = []
        
        async for app in cursor:
            app_json = bson_to_json(app)
            
            document_ref = app.get("documents")
            document_data = await get_document_data(document_ref)
            
            app_json["document_full"] = document_data
            
            applications.append(app_json)

        response_data = {
            "success": True,
            "applications": applications,
            "user": bson_to_json(user),
            "application_count": len(applications)
        }
        logger.info(f"[READ_USER_APPLICATIONS] Successfully retrieved {len(applications)} applications for user {user_id}")
        return response_data

    except Exception as e:
        logger.error(f"[READ_USER_APPLICATIONS] Failed to fetch user applications: {type(e).__name__}: {str(e)}", exc_info=True)
        return {"success": False, "error": "Failed to fetch user applications"}


async def update_application_status(application_id: str, status: str, admin_notes: str = ""):
    """
    Update the status of an application (approve/deny)
    """
    logger.info(f"[UPDATE_STATUS] Updating application {application_id} status to: {status}")
    try:
        # Validate status
        valid_statuses = ["APPROVED", "DENIED", "PENDING", "UNDER_REVIEW"]
        if status.upper() not in valid_statuses:
            logger.warning(f"[UPDATE_STATUS] Invalid status value attempted: {status} for application {application_id}")
            return {"success": False, "error": f"Invalid status. Must be one of: {valid_statuses}"}
        
        # Update the application
        result = await db.applications.update_one(
            {"application_id": application_id},
            {
                "$set": {
                    "admin_status": status.upper(),
                    "admin_notes": admin_notes,
                    "status_updated_at": datetime.now(timezone.utc)
                }
            }
        )
        
        if result.matched_count == 0:
            logger.warning(f"[UPDATE_STATUS] Application not found: {application_id}")
            return {"success": False, "error": f"No application found with ID {application_id}"}
        
        logger.info(f"[UPDATE_STATUS] Successfully updated application {application_id} status to {status} (matched: {result.matched_count}, modified: {result.modified_count})")
        return {"success": True, "message": f"Application status updated to {status}"}

    except Exception as e:
        logger.error(f"[UPDATE_STATUS] Database update failed for application {application_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        return {"success": False, "error": "Failed to update application status"}


async def get_pending_users():
    try:
        logger.info("Fetching pending users")
        
        users_cursor = db.users.find({})
        users = []
        
        async for user in users_cursor:
            users.append({
                "user_id": user.get("user_id"),
                "name": user.get("name"),
                "ssn": user.get("socialSecurityNumber"),
                "application_count": len(user.get("applications", []))
            })
        
        return {"success": True, "users": users, "count": len(users)}
    
    except Exception as e:
        logger.error(f"Error in read_all_users(): {e}", exc_info=True)
        return {"success": False, "error": "Failed to fetch users"}

async def get_filtered_applications():
    """
    Get all applications where human_final is False, with user details appended
    """
    try:
        logger.info("Fetching filtered applications (human_final = False)")
        
        # Get all users
        users_cursor = db.users.find({})
        filtered_applications = []
        
        async for user in users_cursor:
            # Get application IDs for this user
            app_ids = user.get("applications", [])
            
            # Fetch each application
            for app_id in app_ids:
                app = await db.applications.find_one({"application_id": app_id})
                
                if app and app.get("human_final") == False:
                    # Convert to JSON-safe format
                    app_json = bson_to_json(app)
                    
                    # Append user details
                    app_json["user_details"] = {
                        "user_id": user.get("user_id"),
                        "name": user.get("name"),
                        "socialSecurityNumber": user.get("socialSecurityNumber"),
                        "email": user.get("email"),
                        "phone": user.get("phone")
                    }
                    
                    filtered_applications.append(app_json)
        
        return {
            "success": True,
            "applications": filtered_applications,
            "count": len(filtered_applications)
        }
    
    except Exception as e:
        logger.error(f"Error in get_filtered_applications(): {e}", exc_info=True)
        return {"success": False, "error": "Failed to fetch filtered applications"}


async def read_all_users():
    """
    Get all users with basic info (no full application data)
    """
    try:
        logger.info("Fetching all users")
        
        users_cursor = db.users.find({})
        users = []
        
        async for user in users_cursor:
            users.append({
                "user_id": user.get("user_id"),
                "name": user.get("name"),
                "ssn": user.get("socialSecurityNumber"),
                "application_count": len(user.get("applications", []))
            })
        
        return {"success": True, "users": users, "count": len(users)}
    
    except Exception as e:
        logger.error(f"Error in read_all_users(): {e}", exc_info=True)
        return {"success": False, "error": "Failed to fetch users"}


async def read():
    """
    Get all users and all their applications (full data)
    """
    try:
        logger.info("Fetching all users with their applications")

        users_cursor = db.users.find({})
        users_with_apps = []

        async for user in users_cursor:
            # Extract application IDs for this user
            app_ids = user.get("applications", [])
            applications = []

            # Fetch each application by ID
            for app_id in app_ids:
                app = await db.applications.find_one({"application_id": app_id})
                if app:
                    applications.append(bson_to_json(app))

            # Add user + their applications to list
            users_with_apps.append({
                **bson_to_json(user),
                "applications_full": applications,
                "application_count": len(applications)
            })

        # Final response
        return {
            "success": True,
            "total_users": len(users_with_apps),
            "users": users_with_apps
        }

    except Exception as e:
        logger.error(f"Error in read(): {e}", exc_info=True)
        return {"success": False, "error": "Failed to fetch users and applications"}



async def approve_application(application_id: str):
    """
    Mark an application as approved (human_final=True, final_decision="APPROVE")
    """
    logger.info(f"[APPROVE] Processing approval for application: {application_id}")
    try:
        result = await db.applications.update_one(
            {"application_id": application_id},
            {
                "$set": {
                    "human_final": True,
                    "final_decision": "APPROVE",
                    "decision_updated_at": datetime.now(timezone.utc)
                }
            }
        )

        if result.matched_count == 0:
            logger.warning(f"[APPROVE] Application not found: {application_id}")
            return {"success": False, "error": f"No application found with ID {application_id}"}

        logger.info(f"[APPROVE] Successfully approved application {application_id} (matched: {result.matched_count}, modified: {result.modified_count})")
        return {
            "success": True,
            "message": f"Application {application_id} has been approved",
            "application_id": application_id,
            "final_decision": "APPROVE"
        }

    except Exception as e:
        logger.error(f"[APPROVE] Database operation failed for application {application_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        return {"success": False, "error": "Failed to approve application"}


# --------------------------------------------------------
# Deny an application
# --------------------------------------------------------
async def deny_application(application_id: str):
    """
    Mark an application as denied (human_final=True, final_decision="REJECT")
    """
    logger.info(f"[DENY] Processing denial for application: {application_id}")
    try:
        result = await db.applications.update_one(
            {"application_id": application_id},
            {
                "$set": {
                    "human_final": True,
                    "final_decision": "REJECT",
                    "decision_updated_at": datetime.now(timezone.utc)
                }
            }
        )

        if result.matched_count == 0:
            logger.warning(f"[DENY] Application not found: {application_id}")
            return {"success": False, "error": f"No application found with ID {application_id}"}

        logger.info(f"[DENY] Successfully denied application {application_id} (matched: {result.matched_count}, modified: {result.modified_count})")
        return {
            "success": True,
            "message": f"Application {application_id} has been denied",
            "application_id": application_id,
            "final_decision": "REJECT"
        }

    except Exception as e:
        logger.error(f"[DENY] Database operation failed for application {application_id}: {type(e).__name__}: {str(e)}", exc_info=True)
        return {"success": False, "error": "Failed to deny application"}
