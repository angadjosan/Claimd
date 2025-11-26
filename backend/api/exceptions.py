"""
Custom exception classes for the SSDI application API.
These exceptions provide more specific error handling than generic Exception.
"""

from fastapi import HTTPException, status


class ApplicationError(Exception):
    """Base exception for application-specific errors"""
    pass


class ValidationError(ApplicationError):
    """Raised when input validation fails"""
    pass


class NotFoundError(ApplicationError):
    """Raised when a requested resource is not found"""
    pass


class DatabaseError(ApplicationError):
    """Raised when database operations fail"""
    pass


class DocumentStorageError(ApplicationError):
    """Raised when document storage operations fail"""
    pass


class AIProcessingError(ApplicationError):
    """Raised when AI/Claude API processing fails"""
    pass


class FileUploadError(ApplicationError):
    """Raised when file upload validation or processing fails"""
    pass


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
