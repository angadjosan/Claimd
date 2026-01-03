import os
import time
import json
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") # Use Service Key for backend workers

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    
    # AI call

    # TODO: later
    ## black-out algorithm (PDF parsing), verification that no SSNs passed in. 
    ## orchestration - assigns, etc
    
    if task_type == 'fail_test':
        raise Exception("Simulated failure")
        
    logger.info(f"Task {task_id} completed successfully")
    return {"result": "success"}

def worker_loop():
    """Main worker loop."""
    logger.info("Worker started. Waiting for tasks...")
    
    while True:
        try:
            # 1. Fetch next pending task using RPC
            # We use an RPC call because Supabase client doesn't support 'FOR UPDATE SKIP LOCKED' directly
            response = supabase.rpc('fetch_next_task', {}).execute()
            
            tasks = response.data
            
            if not tasks:
                # No tasks, sleep and retry
                time.sleep(5) # Poll interval
                continue
            
            task = tasks[0]
            task_id = task['id']
            
            # 2. Process the task
            try:
                result = process_task(task)
                
                # 3. Mark as completed
                # Note: We merge the result into the existing payload
                current_payload = task['payload'] or {}
                current_payload['result'] = result
                
                supabase.table('processing_queue').update({
                    'status': 'completed',
                    'updated_at': 'now()',
                    'payload': current_payload
                }).eq('id', task_id).execute()
                
            except Exception as e:
                logger.error(f"Error processing task {task_id}: {e}")
                # 4. Handle failure
                supabase.table('processing_queue').update({
                    'status': 'failed',
                    'last_error': str(e),
                    'updated_at': 'now()'
                }).eq('id', task_id).execute()
                    
        except Exception as e:
            logger.error(f"Unexpected error in worker loop: {e}")
            time.sleep(5) # Sleep on error to avoid tight loops

if __name__ == "__main__":
    worker_loop()
