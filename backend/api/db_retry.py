"""
Database retry utilities for handling transient failures.
Provides decorators and functions for automatic retry of database operations.
"""

import asyncio
from functools import wraps
from typing import Callable, TypeVar, Any
from logger import get_logger

logger = get_logger(__name__)

T = TypeVar('T')


def retry_on_db_error(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
    max_delay: float = 10.0
):
    """
    Decorator that retries a database operation on transient failures.
    
    Args:
        max_attempts: Maximum number of retry attempts (default: 3)
        initial_delay: Initial delay between retries in seconds (default: 1.0)
        backoff_factor: Multiplier for delay after each retry (default: 2.0)
        max_delay: Maximum delay between retries in seconds (default: 10.0)
    
    Usage:
        @retry_on_db_error(max_attempts=5, initial_delay=2.0)
        async def save_to_database(data):
            return await db.collection.insert_one(data)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exception = None
            
            for attempt in range(1, max_attempts + 1):
                try:
                    result = await func(*args, **kwargs)
                    
                    # Log success after retry
                    if attempt > 1:
                        logger.info(
                            f"[RETRY] {func.__name__} succeeded on attempt {attempt}/{max_attempts}"
                        )
                    
                    return result
                    
                except Exception as e:
                    last_exception = e
                    error_type = type(e).__name__
                    
                    # Check if error is retryable
                    if not is_retryable_error(e):
                        logger.error(
                            f"[RETRY] {func.__name__} failed with non-retryable error: {error_type}: {str(e)}",
                            exc_info=True
                        )
                        raise
                    
                    # Log retry attempt
                    if attempt < max_attempts:
                        logger.warning(
                            f"[RETRY] {func.__name__} attempt {attempt}/{max_attempts} failed: "
                            f"{error_type}: {str(e)}. Retrying in {delay}s..."
                        )
                        await asyncio.sleep(delay)
                        delay = min(delay * backoff_factor, max_delay)
                    else:
                        logger.error(
                            f"[RETRY] {func.__name__} failed after {max_attempts} attempts: "
                            f"{error_type}: {str(e)}",
                            exc_info=True
                        )
            
            # All retries exhausted
            raise last_exception
        
        return wrapper
    return decorator


def is_retryable_error(error: Exception) -> bool:
    """
    Determine if a database error is retryable.
    
    Retryable errors include:
    - Network timeouts
    - Connection errors
    - Server selection timeouts
    - Transient server errors
    
    Non-retryable errors include:
    - Validation errors
    - Duplicate key errors
    - Authentication errors
    """
    error_message = str(error).lower()
    error_type = type(error).__name__
    
    # Retryable error patterns
    retryable_patterns = [
        'timeout',
        'connection',
        'network',
        'server selection',
        'socket',
        'transient',
        'service unavailable',
        'too many requests',
        'rate limit'
    ]
    
    # Non-retryable error patterns
    non_retryable_patterns = [
        'duplicate key',
        'validation',
        'authentication',
        'unauthorized',
        'forbidden',
        'not found',
        'invalid'
    ]
    
    # Check for non-retryable patterns first
    for pattern in non_retryable_patterns:
        if pattern in error_message or pattern in error_type.lower():
            return False
    
    # Check for retryable patterns
    for pattern in retryable_patterns:
        if pattern in error_message or pattern in error_type.lower():
            return True
    
    # Default to retryable for unknown errors (safer approach)
    # You can change this to False for a more conservative approach
    logger.debug(f"[RETRY] Unknown error type '{error_type}', treating as retryable")
    return True


async def retry_database_operation(
    operation: Callable,
    *args,
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    **kwargs
) -> Any:
    """
    Retry a database operation with exponential backoff.
    Alternative to the decorator for one-off operations.
    
    Args:
        operation: Async function to execute
        *args: Positional arguments for the operation
        max_attempts: Maximum number of attempts
        initial_delay: Initial delay in seconds
        **kwargs: Keyword arguments for the operation
    
    Returns:
        Result of the operation
    
    Raises:
        Exception: If all retry attempts fail
    
    Example:
        result = await retry_database_operation(
            db.applications.insert_one,
            document,
            max_attempts=5
        )
    """
    delay = initial_delay
    last_exception = None
    
    for attempt in range(1, max_attempts + 1):
        try:
            result = await operation(*args, **kwargs)
            
            if attempt > 1:
                logger.info(
                    f"[RETRY] Operation succeeded on attempt {attempt}/{max_attempts}"
                )
            
            return result
            
        except Exception as e:
            last_exception = e
            
            if not is_retryable_error(e):
                logger.error(
                    f"[RETRY] Non-retryable error: {type(e).__name__}: {str(e)}",
                    exc_info=True
                )
                raise
            
            if attempt < max_attempts:
                logger.warning(
                    f"[RETRY] Attempt {attempt}/{max_attempts} failed. "
                    f"Retrying in {delay}s..."
                )
                await asyncio.sleep(delay)
                delay *= 2  # Exponential backoff
            else:
                logger.error(
                    f"[RETRY] All {max_attempts} attempts failed",
                    exc_info=True
                )
    
    raise last_exception


class DatabaseConnectionPool:
    """
    Context manager for database operations with automatic connection management.
    Ensures connections are properly closed even if errors occur.
    """
    
    def __init__(self, client):
        self.client = client
        self.connection = None
    
    async def __aenter__(self):
        self.connection = self.client
        return self.connection
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        # Connection pooling is handled by Motor automatically
        # This is mainly for any cleanup we might need
        if exc_type:
            logger.error(
                f"[DB_POOL] Error during database operation: {exc_type.__name__}: {exc_val}",
                exc_info=True
            )
        return False  # Don't suppress exceptions
