"""
Database initialization and index management for the SSDI application.
This module handles creating indexes and ensuring database schema is properly configured.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
import certifi
from logger import get_logger

logger = get_logger(__name__)

# Load environment variables
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env"))
load_dotenv(dotenv_path)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "Main"


async def create_indexes():
    """
    Create all necessary indexes for optimal query performance.
    Should be run on application startup or during deployment.
    """
    logger.info("[DB_INIT] Starting database index creation")
    
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        db = client[DB_NAME]
        
        # Applications collection indexes
        logger.info("[DB_INIT] Creating indexes for 'applications' collection")
        
        # Unique index on application_id (primary lookup field)
        await db.applications.create_index(
            "application_id",
            unique=True,
            name="idx_application_id"
        )
        logger.info("[DB_INIT] ✓ Created unique index on application_id")
        
        # Index on human_final for filtering pending reviews
        await db.applications.create_index(
            "human_final",
            name="idx_human_final"
        )
        logger.info("[DB_INIT] ✓ Created index on human_final")
        
        # Index on final_decision for status filtering
        await db.applications.create_index(
            "final_decision",
            name="idx_final_decision"
        )
        logger.info("[DB_INIT] ✓ Created index on final_decision")
        
        # Index on created_at for date-based queries and sorting
        await db.applications.create_index(
            "created_at",
            name="idx_created_at"
        )
        logger.info("[DB_INIT] ✓ Created index on created_at")
        
        # Compound index for common admin queries (pending + date)
        await db.applications.create_index(
            [("human_final", 1), ("created_at", -1)],
            name="idx_human_final_created_at"
        )
        logger.info("[DB_INIT] ✓ Created compound index on human_final + created_at")
        
        # Users collection indexes
        logger.info("[DB_INIT] Creating indexes for 'users' collection")
        
        # Unique index on socialSecurityNumber (primary lookup field)
        await db.users.create_index(
            "socialSecurityNumber",
            unique=True,
            name="idx_ssn"
        )
        logger.info("[DB_INIT] ✓ Created unique index on socialSecurityNumber")
        
        # Unique index on user_id
        await db.users.create_index(
            "user_id",
            unique=True,
            name="idx_user_id"
        )
        logger.info("[DB_INIT] ✓ Created unique index on user_id")
        
        # Index on applications array for reverse lookups
        await db.users.create_index(
            "applications",
            name="idx_user_applications"
        )
        logger.info("[DB_INIT] ✓ Created index on applications array")
        
        # Documents collection indexes
        logger.info("[DB_INIT] Creating indexes for 'documents' collection")
        
        # Index on _id is automatic, but we can add created_at if needed
        await db.documents.create_index(
            "created_at",
            name="idx_doc_created_at",
            expireAfterSeconds=None  # Set to number of seconds for TTL if needed
        )
        logger.info("[DB_INIT] ✓ Created index on documents.created_at")
        
        logger.info("[DB_INIT] ✓ All indexes created successfully")
        
        # List all indexes for verification
        apps_indexes = await db.applications.index_information()
        users_indexes = await db.users.index_information()
        docs_indexes = await db.documents.index_information()
        
        logger.info(f"[DB_INIT] Applications collection has {len(apps_indexes)} indexes: {list(apps_indexes.keys())}")
        logger.info(f"[DB_INIT] Users collection has {len(users_indexes)} indexes: {list(users_indexes.keys())}")
        logger.info(f"[DB_INIT] Documents collection has {len(docs_indexes)} indexes: {list(docs_indexes.keys())}")
        
        client.close()
        return True
        
    except Exception as e:
        logger.error(f"[DB_INIT] Failed to create indexes: {type(e).__name__}: {str(e)}", exc_info=True)
        return False


async def verify_database_connection():
    """
    Verify that the database connection is working and the database is accessible.
    Used for health checks.
    """
    try:
        logger.debug("[DB_HEALTH] Verifying database connection")
        
        client = AsyncIOMotorClient(
            MONGO_URI,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        
        # Ping the database
        await client.admin.command('ping')
        
        # Check if our database exists
        db_list = await client.list_database_names()
        db_exists = DB_NAME in db_list
        
        # Get collection stats
        db = client[DB_NAME]
        collections = await db.list_collection_names()
        
        stats = {
            "connected": True,
            "database_exists": db_exists,
            "database_name": DB_NAME,
            "collections": collections,
            "collection_count": len(collections)
        }
        
        logger.debug(f"[DB_HEALTH] Database connection verified: {stats}")
        client.close()
        
        return stats
        
    except Exception as e:
        logger.error(f"[DB_HEALTH] Database connection failed: {type(e).__name__}: {str(e)}", exc_info=True)
        return {
            "connected": False,
            "error": str(e),
            "error_type": type(e).__name__
        }


async def get_database_stats():
    """
    Get database statistics for monitoring and debugging.
    """
    try:
        logger.info("[DB_STATS] Fetching database statistics")
        
        client = AsyncIOMotorClient(
            MONGO_URI,
            tls=True,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000
        )
        db = client[DB_NAME]
        
        # Get counts for each collection
        applications_count = await db.applications.count_documents({})
        users_count = await db.users.count_documents({})
        documents_count = await db.documents.count_documents({})
        
        # Get pending applications count
        pending_count = await db.applications.count_documents({"human_final": False})
        
        # Get approved/rejected counts
        approved_count = await db.applications.count_documents({"final_decision": "APPROVE"})
        rejected_count = await db.applications.count_documents({"final_decision": "REJECT"})
        
        stats = {
            "applications": {
                "total": applications_count,
                "pending_review": pending_count,
                "approved": approved_count,
                "rejected": rejected_count
            },
            "users": {
                "total": users_count
            },
            "documents": {
                "total": documents_count
            }
        }
        
        logger.info(f"[DB_STATS] Statistics retrieved: {stats}")
        client.close()
        
        return stats
        
    except Exception as e:
        logger.error(f"[DB_STATS] Failed to fetch statistics: {type(e).__name__}: {str(e)}", exc_info=True)
        return None


if __name__ == "__main__":
    # Allow running this script directly to create indexes
    import asyncio
    
    async def main():
        print("Creating database indexes...")
        success = await create_indexes()
        
        if success:
            print("\n✅ Database indexes created successfully!")
            
            print("\nVerifying database connection...")
            health = await verify_database_connection()
            print(f"Database health: {health}")
            
            print("\nFetching database statistics...")
            stats = await get_database_stats()
            if stats:
                print(f"Applications: {stats['applications']['total']} total, {stats['applications']['pending_review']} pending")
                print(f"Users: {stats['users']['total']}")
                print(f"Documents: {stats['documents']['total']}")
        else:
            print("❌ Failed to create indexes. Check logs for details.")
    
    asyncio.run(main())
