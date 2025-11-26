# main.py -- Main Program for Backend

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

# Import utilities
from utils.logger import get_logger
from db.db_init import create_indexes, verify_database_connection, get_database_stats

# Import routers
from routes import health, applications, admin, users

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


# Include routers
app.include_router(health.router)
app.include_router(applications.router)
app.include_router(admin.router)
app.include_router(users.router)


if __name__ == "__main__":
    # Get port from environment variable with default
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Starting server on port {port}")
    # This runs the app when you do `python main.py`
    uvicorn.run(app, host="127.0.0.1", port=port)
