"""
Custom exception classes for the SSDI application API.
These exceptions provide more specific error handling than generic Exception.
"""

from fastapi import HTTPException, status
from typing import Optional, Dict, Any


class ApplicationError(Exception):
    """Base exception for application-specific errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)
    
    def __str__(self):
        if self.details:
            details_str = ", ".join(f"{k}={v}" for k, v in self.details.items())
            return f"{self.message} ({details_str})"
        return self.message


class ValidationError(ApplicationError):
    """Raised when input validation fails"""
    def __init__(self, message: str, field: Optional[str] = None, value: Optional[Any] = None):
        details = {}
        if field:
            details['field'] = field
        if value is not None:
            details['invalid_value'] = str(value)[:100]  # Truncate long values
        super().__init__(message, details)


class NotFoundError(ApplicationError):
    """Raised when a requested resource is not found"""
    def __init__(self, resource_type: str, resource_id: str):
        message = f"{resource_type} not found"
        details = {'resource_id': resource_id, 'resource_type': resource_type}
        super().__init__(message, details)


class DatabaseError(ApplicationError):
    """Raised when database operations fail"""
    def __init__(self, operation: str, collection: str, error_details: Optional[str] = None):
        message = f"Database {operation} failed on {collection}"
        details = {'operation': operation, 'collection': collection}
        if error_details:
            details['error'] = error_details
        super().__init__(message, details)


class DocumentStorageError(ApplicationError):
    """Raised when document storage operations fail"""
    def __init__(self, operation: str, document_id: Optional[str] = None, error_details: Optional[str] = None):
        message = f"Document storage {operation} failed"
        details = {'operation': operation}
        if document_id:
            details['document_id'] = document_id
        if error_details:
            details['error'] = error_details
        super().__init__(message, details)


class AIProcessingError(ApplicationError):
    """Raised when AI/Claude API processing fails"""
    def __init__(self, stage: str, error_details: Optional[str] = None):
        message = f"AI processing failed at stage: {stage}"
        details = {'stage': stage}
        if error_details:
            details['error'] = error_details
        super().__init__(message, details)


class FileUploadError(ApplicationError):
    """Raised when file upload validation or processing fails"""
    def __init__(self, filename: str, reason: str, max_size: Optional[int] = None):
        message = f"File upload failed: {reason}"
        details = {'filename': filename, 'reason': reason}
        if max_size:
            details['max_size_mb'] = max_size // (1024 * 1024)
        super().__init__(message, details)


# HTTP Exception helpers for common status codes
def not_found_exception(detail: str) -> HTTPException:
    """Returns a 404 Not Found exception"""
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=detail
    )


def validation_exception(detail: str) -> HTTPException:
    """Returns a 400 Bad Request exception"""
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=detail
    )


def internal_error_exception(detail: str = "Internal server error") -> HTTPException:
    """Returns a 500 Internal Server Error exception"""
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=detail
    )


def unauthorized_exception(detail: str = "Unauthorized") -> HTTPException:
    """Returns a 401 Unauthorized exception"""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail
    )
