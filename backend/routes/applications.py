"""
Application submission and retrieval endpoints.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from pydantic import ValidationError
from models.api_models import (
    BenefitApplicationRequest,
    BenefitApplicationResponse,
    ReadResponse,
    ErrorResponse,
    validate_file_upload,
    FileUploadConfig
)
from utils.exceptions import internal_error_exception, not_found_exception, validation_exception
from utils.logger import get_logger
from services.ai_service import ai
from services.application_service import read, read_application_by_id
from middleware.auth import get_current_user

logger = get_logger(__name__)

router = APIRouter(tags=["Applications"])


@router.post(
    "/api/benefit-application",
    response_model=BenefitApplicationResponse,
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
    email: str = Form(..., description="Applicant's email address"),
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
                email=email,
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


@router.post(
    "/api/read",
    response_model=ReadResponse,
    summary="Read application data",
    description="Retrieve existing application data from the database.",
    responses={
        200: {"description": "Application data retrieved successfully"},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def mainRead(current_user: dict = Depends(get_current_user)):
    result = await read()
    return ReadResponse(data=result)


@router.get(
    "/api/application/{application_id}",
    response_model=ReadResponse,
    summary="Get application by ID",
    description="Retrieve a single SSDI application by its unique identifier.",
    responses={
        200: {"description": "Application retrieved successfully"},
        404: {"description": "Application not found", "model": ErrorResponse},
        500: {"description": "Internal server error", "model": ErrorResponse}
    }
)
async def getApplicationById(application_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"[GET_APPLICATION] Fetching application by ID: {application_id} (authenticated: {current_user.get('user_id')})")
    result = await read_application_by_id(application_id)
    
    if not result.get("success"):
        error_msg = result.get('error', 'Application not found')
        logger.warning(f"[GET_APPLICATION] Application not found: {application_id}")
        raise not_found_exception(error_msg)
    
    logger.debug(f"[GET_APPLICATION] Successfully retrieved application: {application_id}")
    return ReadResponse(data=result)
