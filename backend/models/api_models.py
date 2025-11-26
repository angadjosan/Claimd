"""
API Request/Response Models using Pydantic for validation and documentation.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class ApplicationStatus(str, Enum):
    """Valid application status values"""
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    DENIED = "DENIED"


class FinalDecision(str, Enum):
    """Valid final decision values"""
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    PENDING = "PENDING"
    UNKNOWN = "UNKNOWN"


class ConfidenceLabel(str, Enum):
    """AI confidence level labels"""
    VERY_LOW = "Very Low"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    VERY_HIGH = "Very High"


# ============================================================================
# REQUEST MODELS
# ============================================================================

class BenefitApplicationRequest(BaseModel):
    """Request model for benefit application submission"""
    firstName: str = Field(..., min_length=1, max_length=100, description="Applicant's first name")
    lastName: str = Field(..., min_length=1, max_length=100, description="Applicant's last name")
    email: str = Field(..., description="Applicant's email address")
    dateOfBirth: str = Field(..., description="Date of birth in YYYY-MM-DD format")
    address: str = Field(..., min_length=1, max_length=500, description="Street address")
    city: str = Field(..., min_length=1, max_length=100, description="City")
    state: str = Field(..., min_length=2, max_length=2, description="Two-letter state code")
    zipCode: str = Field(..., pattern=r'^\d{5}(-\d{4})?$', description="5 or 9 digit ZIP code")
    socialSecurityNumber: str = Field(..., pattern=r'^\d{3}-\d{2}-\d{4}$', description="SSN in format XXX-XX-XXXX")
    
    # Medical Information (optional)
    doctorNames: Optional[str] = Field(None, max_length=500, description="Names of doctors")
    doctorPhoneNumbers: Optional[str] = Field(None, max_length=500, description="Doctor phone numbers")
    hospitalNames: Optional[str] = Field(None, max_length=500, description="Names of hospitals")
    hospitalPhoneNumbers: Optional[str] = Field(None, max_length=500, description="Hospital phone numbers")
    medicalRecordsPermission: Optional[bool] = Field(None, description="Permission to access medical records")
    
    @field_validator('state')
    @classmethod
    def validate_state(cls, v: str) -> str:
        """Validate state is uppercase"""
        return v.upper()
    
    @field_validator('dateOfBirth')
    @classmethod
    def validate_date_of_birth(cls, v: str) -> str:
        """Validate date of birth format and reasonable range"""
        try:
            dob = datetime.strptime(v, '%Y-%m-%d')
            # Must be at least 18 years old
            age = (datetime.now() - dob).days / 365.25
            if age < 18:
                raise ValueError("Applicant must be at least 18 years old")
            if age > 120:
                raise ValueError("Invalid date of birth")
            return v
        except ValueError as e:
            if "does not match format" in str(e):
                raise ValueError("Date of birth must be in YYYY-MM-DD format")
            raise

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "firstName": "John",
                "lastName": "Doe",
                "dateOfBirth": "1980-05-15",
                "address": "123 Main St",
                "city": "Springfield",
                "state": "IL",
                "zipCode": "62701",
                "socialSecurityNumber": "123-45-6789",
                "doctorNames": "Dr. Smith",
                "doctorPhoneNumbers": "555-1234",
                "hospitalNames": "General Hospital",
                "hospitalPhoneNumbers": "555-5678",
                "medicalRecordsPermission": True
            }
        }
    )


class ReadApplicationRequest(BaseModel):
    """Request model for reading application by SSN"""
    ssn: str = Field(..., pattern=r'^\d{3}-\d{2}-\d{4}$', description="SSN in format XXX-XX-XXXX")


class UpdateStatusRequest(BaseModel):
    """Request model for updating application status"""
    application_id: str = Field(..., min_length=1, description="Unique application identifier")
    status: ApplicationStatus = Field(..., description="New status for the application")
    admin_notes: Optional[str] = Field(None, max_length=1000, description="Optional admin notes")


class ApplicationDecisionRequest(BaseModel):
    """Request model for approve/deny decisions"""
    application_id: str = Field(..., min_length=1, description="Unique application identifier")


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = Field(False, description="Always false for errors")
    error: str = Field(..., description="Error message")
    error_type: Optional[str] = Field(None, description="Type of error that occurred")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": False,
                "error": "Application not found",
                "error_type": "NotFoundError",
                "details": {"application_id": "abc-123"}
            }
        }
    )


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = Field(True, description="Always true for success")
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Optional response data")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")


class ReadinessResponse(BaseModel):
    """Readiness check response with database stats"""
    status: str = Field(..., description="Service readiness status")
    service: str = Field(..., description="Service name")
    database: str = Field(..., description="Database connection status")
    stats: Dict[str, Any] = Field(..., description="Database statistics")


class AIAnalysisResponse(BaseModel):
    """Response model for AI analysis of benefit application"""
    decision: str = Field(..., description="AI recommendation (APPROVE/REJECT)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    confidence_label: ConfidenceLabel = Field(..., description="Human-readable confidence level")
    summary: str = Field(..., description="Summary of the decision")
    recommendation: str = Field(..., description="Detailed recommendation")
    ssdi_amount: float = Field(..., ge=0, description="Estimated SSDI amount in dollars")
    application_id: Optional[str] = Field(None, description="Generated application ID")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "decision": "APPROVE",
                "confidence": 0.85,
                "confidence_label": "High",
                "summary": "Applicant meets medical and vocational criteria",
                "recommendation": "Recommend approval based on medical evidence",
                "ssdi_amount": 1500.00,
                "application_id": "550e8400-e29b-41d4-a716-446655440000"
            }
        }
    )


class ApplicationResponse(BaseModel):
    """Response model for single application"""
    success: bool = Field(..., description="Whether operation succeeded")
    application: Optional[Dict[str, Any]] = Field(None, description="Application data")
    error: Optional[str] = Field(None, description="Error message if failed")


class ApplicationListResponse(BaseModel):
    """Response model for list of applications"""
    success: bool = Field(..., description="Whether operation succeeded")
    applications: Optional[List[Dict[str, Any]]] = Field(None, description="List of applications")
    count: Optional[int] = Field(None, description="Number of applications returned")
    error: Optional[str] = Field(None, description="Error message if failed")


class UserResponse(BaseModel):
    """Response model for user data"""
    success: bool = Field(..., description="Whether operation succeeded")
    user: Optional[Dict[str, Any]] = Field(None, description="User data")
    applications: Optional[List[Dict[str, Any]]] = Field(None, description="User's applications")
    error: Optional[str] = Field(None, description="Error message if failed")


class DecisionResponse(BaseModel):
    """Response model for approve/deny operations"""
    success: bool = Field(..., description="Whether operation succeeded")
    message: str = Field(..., description="Operation result message")
    application_id: str = Field(..., description="Application ID that was updated")
    final_decision: FinalDecision = Field(..., description="The decision that was applied")


class ReadResponse(BaseModel):
    """Generic response model for read operations"""
    data: Dict[str, Any] = Field(..., description="Response data")


class BenefitApplicationResponse(BaseModel):
    """Response model for benefit application submission"""
    success: bool = Field(..., description="Whether operation succeeded")
    message: str = Field(..., description="Success message")
    application_id: str = Field(..., description="Generated application ID")
    analysis: Dict[str, Any] = Field(..., description="AI analysis results")
    applicant: Dict[str, str] = Field(..., description="Applicant information")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": True,
                "message": "Application processed successfully",
                "application_id": "550e8400-e29b-41d4-a716-446655440000",
                "analysis": {
                    "decision": "APPROVE",
                    "confidence": 0.85,
                    "summary": "Application meets criteria"
                },
                "applicant": {
                    "name": "John Doe",
                    "ssn": "***-**-****"
                }
            }
        }
    )


# ============================================================================
# INTERNAL DATA MODELS
# ============================================================================

class PersonalInformation(BaseModel):
    """Personal information extracted from application"""
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    social_security_number: Optional[str] = None
    address: Optional[str] = None


class PhaseAssessment(BaseModel):
    """Generic phase assessment structure"""
    determination: Optional[str] = None
    reasoning: Optional[str] = None
    key_findings: Optional[List[str]] = None


class OverallAssessment(BaseModel):
    """Overall assessment from AI"""
    final_determination: Optional[str] = None
    confidence_level: Optional[float] = Field(None, ge=0, le=1)
    key_strengths: Optional[List[str]] = None
    key_weaknesses: Optional[List[str]] = None
    recommendation: Optional[str] = None


class EvidenceSummary(BaseModel):
    """Summary of evidence provided"""
    medical_evidence: Optional[List[str]] = None
    financial_evidence: Optional[List[str]] = None
    work_history: Optional[List[str]] = None
    supporting_documentation: Optional[List[str]] = None


class FullAnalysisResult(BaseModel):
    """Complete AI analysis result structure"""
    personal_information: Optional[PersonalInformation] = None
    assessment_type: Optional[str] = None
    assessment_date: Optional[str] = None
    phase_1_current_work: Optional[PhaseAssessment] = None
    phase_2_medical_severity: Optional[PhaseAssessment] = None
    phase_3_listings: Optional[PhaseAssessment] = None
    phase_4_rfc: Optional[PhaseAssessment] = None
    phase_5_vocational: Optional[PhaseAssessment] = None
    overall_assessment: Optional[OverallAssessment] = None
    next_steps: Optional[Dict[str, Any]] = None
    evidence_summary: Optional[EvidenceSummary] = None
    confidence_level: Optional[float] = Field(None, ge=0, le=1)
    summary: Optional[str] = None
    recommendation: Optional[str] = None


# ============================================================================
# FILE UPLOAD VALIDATION
# ============================================================================

class FileUploadConfig:
    """Configuration for file upload validation"""
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    ALLOWED_CONTENT_TYPES = {
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}


def validate_file_upload(filename: str, content_type: str, file_size: int) -> tuple[bool, Optional[str]]:
    """
    Validate uploaded file meets requirements.
    
    Args:
        filename: Name of the uploaded file
        content_type: MIME type of the file
        file_size: Size of file in bytes (use 0 if size validation will be done during streaming)
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file size (skip if 0, as it will be validated during streaming)
    if file_size > 0 and file_size > FileUploadConfig.MAX_FILE_SIZE:
        return False, f"File size exceeds maximum allowed size of {FileUploadConfig.MAX_FILE_SIZE / (1024*1024)}MB"
    
    # Check content type
    if content_type not in FileUploadConfig.ALLOWED_CONTENT_TYPES:
        return False, f"File type '{content_type}' not allowed. Allowed types: {', '.join(FileUploadConfig.ALLOWED_CONTENT_TYPES)}"
    
    # Check file extension
    import os
    _, ext = os.path.splitext(filename.lower())
    if ext not in FileUploadConfig.ALLOWED_EXTENSIONS:
        return False, f"File extension '{ext}' not allowed. Allowed extensions: {', '.join(FileUploadConfig.ALLOWED_EXTENSIONS)}"
    
    # Check filename is not empty and not too long
    if not filename or len(filename) > 255:
        return False, "Invalid filename"
    
    return True, None
