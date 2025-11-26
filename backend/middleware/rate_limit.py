"""
Rate Limiting Middleware
Provides API rate limiting functionality using slowapi.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded


def get_limiter() -> Limiter:
    """
    Create and configure a rate limiter instance.
    
    Returns:
        Configured Limiter instance
    """
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["100/minute"],  # Default rate limit
        storage_uri="memory://",  # In-memory storage (temporary)
    )
    return limiter


# Create global limiter instance
limiter = get_limiter()


# Common rate limit decorators
def rate_limit_strict(limit: str = "10/minute"):
    """
    Strict rate limit for sensitive endpoints.
    
    Args:
        limit: Rate limit string (e.g., "10/minute")
    """
    return limiter.limit(limit)


def rate_limit_moderate(limit: str = "50/minute"):
    """
    Moderate rate limit for regular endpoints.
    
    Args:
        limit: Rate limit string (e.g., "50/minute")
    """
    return limiter.limit(limit)


def rate_limit_generous(limit: str = "200/minute"):
    """
    Generous rate limit for high-traffic endpoints.
    
    Args:
        limit: Rate limit string (e.g., "200/minute")
    """
    return limiter.limit(limit)
