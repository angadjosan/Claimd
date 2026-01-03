import os
import time
import json
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
DB_URL = os.getenv("DATABASE_URL")

if not DB_URL:
    logger.error("DATABASE_URL environment variable is not set.")
    exit(1)

def get_db_connection():
    """Establishes a connection to the database."""
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {e}")
        return None

def process_task(task):
    """
    Process the individual task.
    This is where your AI/Processing logic goes.
    """
    task_id = task['id']
    task_type = task['task_type']
    payload = task['payload']
    
    logger.info(f"Processing task {task_id} of type {task_type}")
    
    # Simulate processing time
    time.sleep(2)
    
    # TODO: Implement actual logic here based on task_type
    # e.g., call OpenAI, run extraction, etc.
    
    if task_type == 'fail_test':
        raise Exception("Simulated failure")
        
    logger.info(f"Task {task_id} completed successfully")
    return {"result": "success"}

def worker_loop():
    """Main worker loop."""
    logger.info("Worker started. Waiting for tasks...")
    
    while True:
        conn = get_db_connection()
        if not conn:
            time.sleep(5)
            continue
            
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                # 1. Fetch next pending task and lock it
                # SKIP LOCKED ensures multiple workers don't pick the same task
                cursor.execute("""
                    SELECT id, task_type, payload 
                    FROM processing_queue 
                    WHERE status = 'pending' 
                    ORDER BY created_at ASC 
                    LIMIT 1 
                    FOR UPDATE SKIP LOCKED
                """)
                
                task = cursor.fetchone()
                
                if not task:
                    # No tasks, sleep and retry
                    conn.commit() # Release any potential locks (though none here)
                    conn.close()
                    time.sleep(5) # Poll interval
                    continue
                
                task_id = task['id']
                
                # 2. Mark as processing
                cursor.execute("""
                    UPDATE processing_queue 
                    SET status = 'processing', 
                        locked_at = NOW(), 
                        updated_at = NOW(),
                        attempts = attempts + 1
                    WHERE id = %s
                """, (task_id,))
                conn.commit()
                
                # 3. Process the task
                try:
                    result = process_task(task)
                    
                    # 4. Mark as completed
                    cursor.execute("""
                        UPDATE processing_queue 
                        SET status = 'completed', 
                            updated_at = NOW(),
                            payload = payload || %s::jsonb
                        WHERE id = %s
                    """, (json.dumps({"result": result}), task_id))
                    conn.commit()
                    
                except Exception as e:
                    logger.error(f"Error processing task {task_id}: {e}")
                    # 5. Handle failure
                    cursor.execute("""
                        UPDATE processing_queue 
                        SET status = 'failed', 
                            last_error = %s, 
                            updated_at = NOW() 
                        WHERE id = %s
                    """, (str(e), task_id))
                    conn.commit()
                    
        except Exception as e:
            logger.error(f"Unexpected error in worker loop: {e}")
            if conn:
                conn.rollback()
        finally:
            if conn:
                conn.close()

if __name__ == "__main__":
    worker_loop()
