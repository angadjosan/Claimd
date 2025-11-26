# 10/25/2025
# main.py -- Main Program for Backend

# Import Separate Files
from api.ai.ai import ai
from api.read.read import read, read_application_by_id, read_all_applications, read_applications_by_user_ssn, update_application_status, read_all_users, get_filtered_applications, approve_application, deny_application
from api.logger import get_logger
from api.exceptions import internal_error_exception, not_found_exception, validation_exception

from fastapi.middleware.cors import CORSMiddleware

# Import Modules
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import uvicorn
from pydantic import BaseModel
from typing import Any, Dict
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize logger
logger = get_logger(__name__)

# RESPONSE/REQUEST SCHEMAS
class ReadRequest(BaseModel):
    ssn: str  # specifically expect an SSN string

class ReadResponse(BaseModel):
    data: Dict[str, Any]

class WriteResponse(BaseModel):
    decision: str
    confidence: float
    confidence_label: str
    summary: str
    recommendation: str
    ssdi_amount: float

app = FastAPI()

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

logger.info(f"CORS configured with origins: {ALLOWED_ORIGINS}")

# REQUEST: MultiStepForm data with file uploads
# RESPONSE: Processing results with MongoDB document IDs
# FUNCTIONALITY: Process form data and upload to MongoDB with ordered fields
@app.post("/api/benefit-application")
async def handle_benefit_application(
    firstName: str = Form(...),
    lastName: str = Form(...),
    dateOfBirth: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    zipCode: str = Form(...),
    socialSecurityNumber: str = Form(...),
    medicalRecordsFile: UploadFile = File(None),
    incomeDocumentsFile: UploadFile = File(None)
):
    try:
        logger.info(f"[BENEFIT_APPLICATION] Processing new application for {firstName} {lastName}, DOB: {dateOfBirth}")
        logger.debug(f"[BENEFIT_APPLICATION] Files received - Medical: {medicalRecordsFile.filename if medicalRecordsFile else 'None'}, Income: {incomeDocumentsFile.filename if incomeDocumentsFile else 'None'}")
        
        form_data = {
            "firstName": firstName,
            "lastName": lastName,
            "dateOfBirth": dateOfBirth,
            "address": address,
            "city": city,
            "state": state,
            "zipCode": zipCode,
            "socialSecurityNumber": socialSecurityNumber,
        }
        
        # Call AI function
        logger.info(f"[BENEFIT_APPLICATION] Sending to AI processing pipeline")
        result = await ai(
            form_data,
            medicalRecordsFile,
            incomeDocumentsFile
        )
        
        # Check if AI processing was successful
        if not result or not result.get("success"):
            error_msg = result.get("error", "Unknown error") if result else "No response from AI"
            logger.error(f"[BENEFIT_APPLICATION] AI processing failed: {error_msg}")
            raise internal_error_exception(error_msg)
        
        # Extract the JSON result from AI analysis
        json_result = result.get("result", {})
        application_id = result.get("application_id")
        
        logger.info(f"[BENEFIT_APPLICATION] Application processed successfully - ID: {application_id}, Decision: {json_result.get('decision', 'N/A')}, Confidence: {json_result.get('confidence', 'N/A')}")
        
        return {
            "success": True,
            "message": "Application processed successfully",
            "application_id": application_id,
            "analysis": json_result,
            "applicant": {
                "name": f"{firstName} {lastName}",
                "ssn": "***-**-****"  # Redacted for security
            }
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BENEFIT_APPLICATION] Unexpected error processing application for {firstName} {lastName}: {type(e).__name__}: {str(e)}", exc_info=True)
        raise internal_error_exception("Failed to process application")

# REQUEST: SSN to look up
# RESPONSE: Data from database
# FUNCTIONALITY: Read existing application data
@app.post("/api/read", response_model=ReadResponse)
async def mainRead():
    result = await read()
    
    return ReadResponse(data=result)

# REQUEST: Get all applications for admin dashboard
# RESPONSE: All applications from database
# FUNCTIONALITY: Read all applications for admin dashboard
@app.get("/api/applications")
async def getAllApplications():
    logger.info("[GET_APPLICATIONS] Admin fetching all applications")
    result = await read_all_applications()
    return ReadResponse(data=result)

# REQUEST: Get all users for debugging
# RESPONSE: All users from database
# FUNCTIONALITY: Debug endpoint to see all users
@app.get("/api/users/all")
async def getAllUsers():
    logger.info("[GET_USERS] Admin fetching all users")
    result = await read_all_users()
    return result

@app.get("/api/users/filtered")
async def getFilteredApplications():
    logger.info("[GET_FILTERED] Admin fetching filtered applications (human_final=False)")
    result = await get_filtered_applications()
    return result

@app.put("/api/application/approve/{application_id}")
async def approveApplication(application_id: str):
    logger.info(f"[APPROVE_ENDPOINT] Admin approving application: {application_id}")
    result = await approve_application(application_id)
    
    if not result.get("success"):
        error_msg = result.get('error', 'Application not found')
        logger.warning(f"[APPROVE_ENDPOINT] Failed to approve {application_id}: {error_msg}")
        raise not_found_exception(error_msg)
    
    logger.info(f"[APPROVE_ENDPOINT] Successfully approved application: {application_id}")
    return ReadResponse(data=result)

@app.put("/api/application/deny/{application_id}")
async def denyApplication(application_id: str):
    logger.info(f"[DENY_ENDPOINT] Admin denying application: {application_id}")
    result = await deny_application(application_id)
    
    if not result.get("success"):
        error_msg = result.get('error', 'Application not found')
        logger.warning(f"[DENY_ENDPOINT] Failed to deny {application_id}: {error_msg}")
        raise not_found_exception(error_msg)
    
    logger.info(f"[DENY_ENDPOINT] Successfully denied application: {application_id}")
    return ReadResponse(data=result)
    
    

# REQUEST: SSN to look up user applications
# RESPONSE: All applications for a specific user
# FUNCTIONALITY: Read applications by user SSN
@app.get("/api/user/applications/{ssn}")
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

# REQUEST: Application ID to look up
# RESPONSE: Application data from database
# FUNCTIONALITY: Read a single application by ID
@app.get("/api/application/{application_id}")
async def getApplicationById(application_id: str):
    logger.info(f"[GET_APPLICATION] Fetching application by ID: {application_id}")
    result = await read_application_by_id(application_id)
    
    if not result.get("success"):
        error_msg = result.get('error', 'Application not found')
        logger.warning(f"[GET_APPLICATION] Application not found: {application_id}")
        raise not_found_exception(error_msg)
    
    logger.debug(f"[GET_APPLICATION] Successfully retrieved application: {application_id}")
    return ReadResponse(data=result)

# REQUEST: Application ID and status to update
# RESPONSE: Success/failure message
# FUNCTIONALITY: Update application status (approve/deny)
@app.put("/api/application/{application_id}/status")
async def updateApplicationStatus(application_id: str, status: str = Form(...), admin_notes: str = Form("")):
    logger.info(f"[UPDATE_STATUS_ENDPOINT] Admin updating application {application_id} to status: {status}")
    if admin_notes:
        logger.debug(f"[UPDATE_STATUS_ENDPOINT] Admin notes provided: {admin_notes[:100]}...")  # Truncate long notes
    
    result = await update_application_status(application_id, status, admin_notes)
    
    if not result.get("success"):
        error_msg = result.get('error', 'Failed to update status')
        logger.error(f"[UPDATE_STATUS_ENDPOINT] Failed to update {application_id}: {error_msg}")
        raise validation_exception(error_msg)
    
    logger.info(f"[UPDATE_STATUS_ENDPOINT] Successfully updated application {application_id} to {status}")
    return ReadResponse(data=result)


if __name__ == "__main__":
    # Get port from environment variable with default
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting server on port {port}")
    # This runs the app when you do `python main.py`
    uvicorn.run(app, host="127.0.0.1", port=port)