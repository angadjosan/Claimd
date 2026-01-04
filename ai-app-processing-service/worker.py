import os
import time
import json
import base64
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import anthropic

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
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

claude_model = "claude-haiku-4-5-20251001"
    
if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set.")
    exit(1)

if not ANTHROPIC_API_KEY:
    logger.error("ANTHROPIC_API_KEY environment variable must be set.")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Anthropic client
anthropic_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def load_local_prompts():
    """Load prompts from local filesystem."""
    base_path = os.path.dirname(os.path.abspath(__file__))
    prompts_path = os.path.join(base_path, 'prompts')
    
    with open(os.path.join(prompts_path, 'extractor_prompt.md'), 'r') as f:
        extractor_prompt = f.read()
    with open(os.path.join(prompts_path, 'reasoning_prompt.md'), 'r') as f:
        reasoning_prompt = f.read()
    with open(os.path.join(prompts_path, 'rules.md'), 'r') as f:
        rules = f.read()
        
    return extractor_prompt, reasoning_prompt, rules

def load_local_schemas():
    """Load schemas from local filesystem."""
    base_path = os.path.dirname(os.path.abspath(__file__))
    schemas_path = os.path.join(base_path, 'schemas')
    
    with open(os.path.join(schemas_path, 'application_schema.json'), 'r') as f:
        application_schema = json.load(f)
    with open(os.path.join(schemas_path, 'extraction_schema.json'), 'r') as f:
        extraction_schema = json.load(f)
    with open(os.path.join(schemas_path, 'reasoning_output_schema.json'), 'r') as f:
        reasoning_output_schema = json.load(f)
        
    return application_schema, extraction_schema, reasoning_output_schema

def load_from_supabase(application_id):
    """
    Load application data and PDFs from Supabase.
    """
    logger.info(f"Loading application data for {application_id}")
    
    # 1. Fetch application data
    app_response = supabase.table('applications').select('*').eq('id', application_id).execute()
    if not app_response.data:
        raise Exception(f"Application {application_id} not found")
    application_data = app_response.data[0]
    
    # 2. Fetch file metadata
    files_response = supabase.table('application_files').select('*').eq('application_id', application_id).execute()
    files_metadata = files_response.data
    
    application_docs = []
    for file_meta in files_metadata:
        # 3. Download file content
        bucket = file_meta.get('storage_bucket', 'application-files')
        path = file_meta['storage_path']
        
        try:
            logger.info(f"Downloading file {path} from bucket {bucket}")
            file_content = supabase.storage.from_(bucket).download(path)
            application_docs.append({
                'metadata': file_meta,
                'content': file_content 
            })
        except Exception as e:
            logger.error(f"Failed to download file {path}: {e}")

    return application_data, application_docs

def extractor_call(pdfs, extraction_schema, extractor_prompt):
    """
    Calls Anthropic API to extract information from PDFs based on the schema.
    """
    logger.info("Calling Extractor AI...")
    
    # Prepare content for the message
    content = []
    
    # Add PDFs
    for doc in pdfs:
        # Encode PDF content to base64
        pdf_b64 = base64.b64encode(doc['content']).decode('utf-8')
        
        content.append({
            "type": "document",
            "source": {
                "type": "base64",
                "media_type": "application/pdf",
                "data": pdf_b64
            }
        })

    # Add the prompt
    content.append({
        "type": "text",
        "text": f"{extractor_prompt}\n\n This is extraction_schema.json: {json.dumps(extraction_schema, indent=2)}"
    })

    messages = [
        {
            "role": "user",
            "content": content
        }
    ]

    # Retry logic
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = anthropic_client.messages.create(
                max_tokens=16000,
                messages=messages,
                model=claude_model
            )
            # Extract JSON from response
            response_text = response.content[0].text
            # Simple heuristic to find JSON start/end if wrapped in markdown
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text

            result = json.loads(json_str)
            logger.info("Extractor call completed successfully")
            return result
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise
        except Exception as e:
            logger.error(f"Error in extractor_call attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(1)  # Brief delay before retry

def reasoning_call(extraction_schema, extractor_output, application_schema, application_data, reasoning_prompt, rules, reasoning_output_schema, has_extraction_output):
    """
    Calls Anthropic API to reason about the application.
    """
    logger.info("Calling Reasoning AI...")
    
    # Build prompt conditionally based on whether extraction output exists
    prompt_text = f"""
    {reasoning_prompt}
    
    application_schema.json:
    {json.dumps(application_schema, indent=2)}
    extraction_schema.json:
    {json.dumps(extraction_schema, indent=2)}
    reasoning_output_schema.json:
    {json.dumps(reasoning_output_schema, indent=2)}

    Application Data:
    {json.dumps(application_data, indent=2)}
    rules.md:
    {rules}
    """
    
    if has_extraction_output:
        prompt_text += f"""
    Extracted Data:
    {json.dumps(extractor_output, indent=2)}"""
    else:
        prompt_text += f"""
    Extracted Data:
    No additional documents were uploaded - please review the application data and make a decision based on the information provided."""

    messages = [
        {
            "role": "user",
            "content": prompt_text
        }
    ]

    # Retry logic
    max_retries = 2
    for attempt in range(max_retries):
        try:
            response = anthropic_client.messages.create(
                model=claude_model,
                messages=messages,
                max_tokens=16000  # Reasoning output can be longer with phases analysis
            )
            
            # Extract JSON from response
            response_text = response.content[0].text
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
            else:
                json_str = response_text

            return json.loads(json_str)
            
        except json.JSONDecodeError as e:
            logger.warning(f"JSON decode error on attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise
        except Exception as e:
            logger.error(f"Error in reasoning_call attempt {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(1)  # Brief delay before retry

def ai(application_id):
    extractor_prompt, reasoning_prompt, rules = load_local_prompts()
    application_schema, extraction_schema, reasoning_output_schema = load_local_schemas()
    application_data, application_docs = load_from_supabase(application_id)

    # Check if there are any documents to process
    if not application_docs:
        logger.info("No documents found. Skipping extractor call and proceeding directly to reasoning call.")
        extractor_output = None
        has_extraction_output = False
    else:
        logger.info(f"Found {len(application_docs)} document(s). Running extractor call...")
        extractor_output = extractor_call(application_docs, extraction_schema, extractor_prompt)
        logger.info("Extractor call completed successfully.")
        has_extraction_output = True
    
    logger.info("Proceeding to reasoning call...")
    reasoning_output = reasoning_call(
        extraction_schema, extractor_output, application_schema, application_data, 
        reasoning_prompt, rules, reasoning_output_schema, has_extraction_output
    )
    
    # Ensure required fields from reasoning_output_schema are populated
    # These should come from the AI, but we can add fallbacks from application_data
    if 'application_id' not in reasoning_output:
        reasoning_output['application_id'] = str(application_id)
    if 'applicant_name' not in reasoning_output and application_data.get('applicant_id'):
        # Note: We'd need to join with users table to get name, but for now leave it to AI
        pass
    if 'submission_date' not in reasoning_output and application_data.get('submitted_at'):
        reasoning_output['submission_date'] = application_data['submitted_at'][:10]  # Extract date part
    
    return reasoning_output

def update_db_with_ai_output(output, application_id, application_data):
    """
    Update the database with AI reasoning output.
    Maps reasoning_output_schema.json fields to database columns.
    """
    logger.info(f"Updating database for application {application_id}")
    try:
        # Map reasoning output schema to database columns
        # Based on add_reasoning_output_to_applications.sql migration
        # Supabase Python client accepts Python dicts/lists directly for JSONB columns
        update_data = {
            'reasoning_overall_recommendation': output.get('overall_recommendation'),
            'reasoning_confidence_score': output.get('confidence_score'),
            'reasoning_summary': output.get('summary'),
            'reasoning_phases': output.get('phases', {}),
            'reasoning_missing_information': output.get('missing_information', []),
            'reasoning_suggested_actions': output.get('suggested_actions', []),
            'updated_at': 'now()'
        }

        supabase.table('applications').update(update_data).eq('id', application_id).execute()
        logger.info("Database updated successfully with reasoning output")
        
    except Exception as e:
        logger.error(f"Failed to update database: {e}")
        raise

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
    
    application_id = payload.get('application_id')
    if application_id:
        # Load application data to pass to update function
        application_data, _ = load_from_supabase(application_id)
        out = ai(application_id)
        update_db_with_ai_output(out, application_id, application_data)
    else:
        logger.warning(f"No application_id provided in task {task_id}")

    # TODO: later
    ## https://platform.claude.com/docs/en/build-with-claude/batch-processing
    ## https://platform.claude.com/docs/en/build-with-claude/citations. For PDFs: citations will include the page number range (1-indexed).
    ## black-out algorithm (PDF parsing), verification that no SSNs passed in. 
    ## orchestration - assigns, etc
    ## https://platform.claude.com/docs/en/build-with-claude/effort
    ## https://platform.claude.com/docs/en/build-with-claude/extended-thinking
    
    
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
