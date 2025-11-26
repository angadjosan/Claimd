"""
Logging configuration for the SSDI application backend.
Provides consistent logging across all modules with different levels for dev/prod.
"""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from datetime import datetime


def setup_logging():
    """
    Configure logging for the application.
    Uses environment variable ENVIRONMENT to determine log level.
    - development: DEBUG level
    - production: INFO level
    """
    
    # Get environment from env var
    environment = os.getenv("ENVIRONMENT", "development").lower()
    
    # Set log level based on environment
    log_level = logging.DEBUG if environment == "development" else logging.INFO
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    simple_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(detailed_formatter if environment == "development" else simple_formatter)
    
    # File handler (optional, for production)
    # Only create log files in production or if LOG_TO_FILE is set
    handlers = [console_handler]
    
    if environment == "production" or os.getenv("LOG_TO_FILE", "").lower() == "true":
        log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
        os.makedirs(log_dir, exist_ok=True)
        
        log_file = os.path.join(log_dir, f"app_{datetime.now().strftime('%Y%m%d')}.log")
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(detailed_formatter)
        handlers.append(file_handler)
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        handlers=handlers,
        force=True  # Override any existing configuration
    )
    
    # Set third-party loggers to WARNING to reduce noise
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("anthropic").setLevel(logging.INFO)
    logging.getLogger("motor").setLevel(logging.WARNING)
    
    # Log startup message
    logger = logging.getLogger(__name__)
    logger.info(f"Logging initialized - Environment: {environment}, Level: {logging.getLevelName(log_level)}")
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module.
    
    Args:
        name: Usually __name__ from the calling module
        
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


# Initialize logging when module is imported
setup_logging()
