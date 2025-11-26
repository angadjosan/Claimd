# 10/25/2025
# main.py -- Main Program for Backend

# Import Separate Files
from backend.api.routes.ai import ai
from backend.api.routes.read import read, read_application_by_id, read_all_applications, read_applications_by_user_ssn, update_application_status, read_all_users, get_filtered_applications, approve_application, deny_application
from backend.api.utils.logger import get_logger
from backend.api.utils.exceptions import internal_error_exception, not_found_exception, validation_exception
from backend.api.utils.db_init import create_indexes, verify_database_connection, get_database_stats
from backend.api.utils.models import (
    BenefitApplicationRequest,
    ReadApplicationRequest,
    UpdateStatusRequest,
    ApplicationDecisionRequest,
    ErrorResponse,
    SuccessResponse,
    HealthResponse,
    ReadinessResponse,
    AIAnalysisResponse,
    ApplicationResponse,
    ApplicationListResponse,
    DecisionResponse,
    ReadResponse,
    BenefitApplicationResponse,
    validate_file_upload,
    FileUploadConfig
)

from fastapi.middleware.cors import CORSMiddleware

# Import Modules
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, Request
from fastapi.responses import JSONResponse
import uvicorn
from typing import Any, Dict
import os
from dotenv import load_dotenv
from pydantic import ValidationError

# Load environment variables
load_dotenv()

# Initialize logger
logger = get_logger(__name__)

app = FastAPI(
    title="SSDI Application Processing API",
    description="API for processing Social Security Disability Insurance (SSDI) applications with AI-powered analysis",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# File upload size limit (25MB total request size to allow for 2 x 10MB files + form data)
MAX_REQUEST_SIZE = 25 * 1024 * 1024  # 25 MB

@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    """Middleware to limit request body size and prevent DoS attacks."""
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            logger.warning(f"[SECURITY] Request rejected: size {content_length} exceeds limit {MAX_REQUEST_SIZE}")
            return JSONResponse(
                status_code=413,
                content={"detail": f"Request body too large. Maximum size is {MAX_REQUEST_SIZE / (1024*1024):.1f}MB"}
            )
    return await call_next(request)

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


# STARTUP EVENT: Initialize database indexes and verify connection
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    try:
        logger.info("[STARTUP] Initializing application...")
        
        # Create database indexes
        logger.info("[STARTUP] Creating database indexes...")
        await create_indexes()
        logger.info("[STARTUP] Database indexes created successfully")
        
        # Verify database connection
        logger.info("[STARTUP] Verifying database connection...")
        is_connected = await verify_database_connection()
        if is_connected:
            logger.info("[STARTUP] Database connection verified")
        else:
            logger.error("[STARTUP] Database connection verification failed")
            raise RuntimeError("Failed to connect to database")
        
        # Log database statistics
        stats = await get_database_stats()
        logger.info(f"[STARTUP] Database stats: {stats}")
        
        logger.info("[STARTUP] Application startup complete")
        
    except Exception as e:
        logger.error(
            f"[STARTUP] Application startup failed: {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        raise


# HEALTH CHECK ENDPOINTS
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Basic health check",
    description="Check if the service is running"
)
async def health_check():
    """Basic health check endpoint."""
    return {"status": "healthy", "service": "ssdi-backend"}


@app.get(
    "/health/ready",
    response_model=ReadinessResponse,
    tags=["Health"],
    summary="Readiness check",
    description="Check if the service is ready to accept requests, including database connectivity",
    responses={
        200: {"description": "Service is ready"},
        503: {"description": "Service is not ready", "model": ErrorResponse}
    }
)
async def readiness_check():
    """Readiness check with database connectivity verification."""
    try:
        is_connected = await verify_database_connection()
        
        if not is_connected:
            raise HTTPException(status_code=503, detail="Database connection failed")
        
        stats = await get_database_stats()
        
        return {
            "status": "ready",
            "service": "ssdi-backend",
            "database": "connected",
            "stats": stats
        }
    except Exception as e:
        logger.error(
            f"[HEALTH_CHECK] Readiness check failed: {type(e).__name__}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=503,
            detail="Service not ready"
        )

# REQUEST: MultiStepForm data with file uploads
# RESPONSE: Processing results with MongoDB document IDs
# FUNCTIONALITY: Process form data and upload to MongoDB with ordered fields
@app.post(
    "/api/benefit-application",
    response_model=BenefitApplicationResponse,
    tags=["Applications"],
    summary="Submit SSDI benefit application",
    description="Process a new SSDI benefit application with personal information and supporting documents. Files are validated and analyzed by AI to generate a recommendation.",
    responses={
        200: {"description": "Application processed successfully"},
        400: {"description": "Invalid input or file validation failed", "model": ErrorResponse},
        500: {"description": "Internal server error during processing", "model": ErrorResponse}
    }
)
async def handle_benefit_application(
    firstName: str = Form(..., description="Applicant's first name"),
    lastName: str = Form(..., description="Applicant's last name"),
    dateOfBirth: str = Form(..., description="Date of birth in YYYY-MM-DD format"),
    address: str = Form(..., description="Street address"),
    city: str = Form(..., description="City"),
    state: str = Form(..., description="Two-letter state code"),
    zipCode: str = Form(..., description="5 or 9 digit ZIP code"),
    socialSecurityNumber: str = Form(..., description="SSN in format XXX-XX-XXXX"),
    medicalRecordsFile: UploadFile = File(None, description="Medical records PDF or image"),
    incomeDocumentsFile: UploadFile = File(None, description="Income/financial documents PDF or image")
):
    try:
        logger.info(f"[BENEFIT_APPLICATION] Processing new application for {firstName} {lastName}, DOB: {dateOfBirth}")
        logger.debug(f"[BENEFIT_APPLICATION] Files received - Medical: {medicalRecordsFile.filename if medicalRecordsFile else 'None'}, Income: {incomeDocumentsFile.filename if incomeDocumentsFile else 'None'}")
        
        # Validate form data using Pydantic model
        try:
            form_data_model = BenefitApplicationRequest(
                firstName=firstName,
                lastName=lastName,
                dateOfBirth=dateOfBirth,
                address=address,
                city=city,
                state=state,
                zipCode=zipCode,
                socialSecurityNumber=socialSecurityNumber
            )
            form_data = form_data_model.model_dump()
        except ValidationError as ve:
            logger.warning(f"[BENEFIT_APPLICATION] Form validation failed: {ve}")
            raise validation_exception(f"Invalid form data: {str(ve)}")
        
        # Validate uploaded files with streaming to prevent memory issues
        if medicalRecordsFile and medicalRecordsFile.filename:
            # Validate file metadata first
            is_valid, error_msg = validate_file_upload(
                medicalRecordsFile.filename,
                medicalRecordsFile.content_type or '',
                0  # Size will be validated during streaming
            )
            if not is_valid:
                logger.warning(f"[BENEFIT_APPLICATION] Medical records file validation failed: {error_msg}")
                raise validation_exception(f"Medical records file error: {error_msg}")
            
            # Validate file size by reading in chunks
            total_size = 0
            chunk_size = 1024 * 1024  # 1MB chunks
            while chunk := await medicalRecordsFile.read(chunk_size):
                total_size += len(chunk)
                if total_size > FileUploadConfig.MAX_FILE_SIZE:
                    logger.warning(f"[BENEFIT_APPLICATION] Medical records file exceeds size limit: {total_size} bytes")
                    raise validation_exception(f"Medical records file exceeds maximum size of {FileUploadConfig.MAX_FILE_SIZE / (1024*1024)}MB")
            await medicalRecordsFile.seek(0)  # Reset file pointer
        
        if incomeDocumentsFile and incomeDocumentsFile.filename:
            # Validate file metadata first
            is_valid, error_msg = validate_file_upload(
                incomeDocumentsFile.filename,
                incomeDocumentsFile.content_type or '',
                0  # Size will be validated during streaming
            )
            if not is_valid:
                logger.warning(f"[BENEFIT_APPLICATION] Income documents file validation failed: {error_msg}")
                raise validation_exception(f"Income documents file error: {error_msg}")
            
            # Validate file size by reading in chunks
            total_size = 0
            chunk_size = 1024 * 1024  # 1MB chunks
            while chunk := await incomeDocumentsFile.read(chunk_size):
                total_size += len(chunk)
                if total_size > FileUploadConfig.MAX_FILE_SIZE:
                    logger.warning(f"[BENEFIT_APPLICATION] Income documents file exceeds size limit: {total_size} bytes")
                    raise validation_exception(f"Income documents file exceeds maximum size of {FileUploadConfig.MAX_FILE_SIZE / (1024*1024)}MB")
            await incomeDocumentsFile.seek(0)  # Reset file pointer
        
        form_data_dict = {
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
            form_data_dict,
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
@app.post(
    "/api/read",
    response_model=ReadResponse,
    tags=["Applications"],
    summary="Read application data",
    description="Retrieve existing application data from the database.",
    responses={
        200: {"description": "Application data retrieved successfully"},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def mainRead():
    result = await read()
    
    return ReadResponse(data=result)

# REQUEST: Get all applications for admin dashboard
# RESPONSE: All applications from database
# FUNCTIONALITY: Read all applications for admin dashboard
@app.get(
    "/api/applications",
    response_model=ReadResponse,
    tags=["Admin"],
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

# REQUEST: Get all users for debugging
# RESPONSE: All users from database
# FUNCTIONALITY: Debug endpoint to see all users
@app.get(
    "/api/users/all",
    tags=["Admin", "Debug"],
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

@app.get(
    "/api/users/filtered",
    tags=["Admin"],
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

@app.put(
    "/api/application/approve/{application_id}",
    response_model=ReadResponse,
    tags=["Admin", "Decisions"],
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

@app.put(
    "/api/application/deny/{application_id}",
    response_model=ReadResponse,
    tags=["Admin", "Decisions"],
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
    
    

# REQUEST: SSN to look up user applications
# RESPONSE: All applications for a specific user
# FUNCTIONALITY: Read applications by user SSN
@app.get(
    "/api/user/applications/{ssn}",
    response_model=ReadResponse,
    tags=["Applications", "Users"],
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

# REQUEST: Application ID to look up
# RESPONSE: Application data from database
# FUNCTIONALITY: Read a single application by ID
@app.get(
    "/api/application/{application_id}",
    response_model=ReadResponse,
    tags=["Applications"],
    summary="Get application by ID",
    description="Retrieve a single SSDI application by its unique identifier.",
    responses={
        200: {"description": "Application retrieved successfully"},
        404: {"description": "Application not found", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
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
@app.put(
    "/api/application/{application_id}/status",
    response_model=ReadResponse,
    tags=["Admin", "Applications"],
    summary="Update application status",
    description="Update the status of a SSDI application with optional admin notes.",
    responses={
        200: {"description": "Application status updated successfully"},
        400: {"description": "Invalid status or validation error", "model": ErrorResponse},
        404: {"description": "Application not found", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def updateApplicationStatus(
    application_id: str,
    status: str = Form(..., description="New status (PENDING, UNDER_REVIEW, APPROVED, DENIED)"),
    admin_notes: str = Form("", description="Optional admin notes about the status change")
):
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