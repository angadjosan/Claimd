import os
import time
import json
import base64
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
import anthropic
import boto3
from botocore.exceptions import ClientError

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
SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")

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

# Initialize SQS client (if queue URL is provided)
sqs_client = None
if SQS_QUEUE_URL:
    sqs_client = boto3.client('sqs')

# S3 configuration for production
S3_BUCKET_NAME = os.getenv("S3_CONFIG_BUCKET", "ai-service-configs")
S3_REGION = os.getenv("AWS_REGION", "us-east-2")

# Check if running in Lambda (production)
def is_lambda_environment():
    """Check if running in AWS Lambda environment."""
    return os.getenv("AWS_LAMBDA_FUNCTION_NAME") is not None

def load_prompts_from_s3():
    """Load prompts from S3 bucket."""
    s3_client = boto3.client('s3', region_name=S3_REGION)
    
    try:
        extractor_prompt_obj = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key='prompts/extractor_prompt.md'
        )
        extractor_prompt = extractor_prompt_obj['Body'].read().decode('utf-8')
        
        reasoning_prompt_obj = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key='prompts/reasoning_prompt.md'
        )
        reasoning_prompt = reasoning_prompt_obj['Body'].read().decode('utf-8')
        
        rules_obj = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key='prompts/rules.md'
        )
        rules = rules_obj['Body'].read().decode('utf-8')
        
        logger.info("Successfully loaded prompts from S3")
        return extractor_prompt, reasoning_prompt, rules
    except Exception as e:
        logger.error(f"Failed to load prompts from S3: {e}")
        raise

def load_schemas_from_s3():
    """Load schemas from S3 bucket."""
    s3_client = boto3.client('s3', region_name=S3_REGION)
    
    try:
        application_schema_obj = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key='schemas/application_schema.json'
        )
        application_schema = json.loads(application_schema_obj['Body'].read().decode('utf-8'))
        
        extraction_schema_obj = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key='schemas/extraction_schema.json'
        )
        extraction_schema = json.loads(extraction_schema_obj['Body'].read().decode('utf-8'))
        
        reasoning_output_schema_obj = s3_client.get_object(
            Bucket=S3_BUCKET_NAME,
            Key='schemas/reasoning_output_schema.json'
        )
        reasoning_output_schema = json.loads(reasoning_output_schema_obj['Body'].read().decode('utf-8'))
        
        logger.info("Successfully loaded schemas from S3")
        return application_schema, extraction_schema, reasoning_output_schema
    except Exception as e:
        logger.error(f"Failed to load schemas from S3: {e}")
        raise

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

def load_prompts():
    """Load prompts from S3 (production) or local filesystem (development)."""
    if is_lambda_environment():
        return load_prompts_from_s3()
    else:
        return load_local_prompts()

def load_schemas():
    """Load schemas from S3 (production) or local filesystem (development)."""
    if is_lambda_environment():
        return load_schemas_from_s3()
    else:
        return load_local_schemas()

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
    extractor_prompt, reasoning_prompt, rules = load_prompts()
    application_schema, extraction_schema, reasoning_output_schema = load_schemas()
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

def assign_case_to_caseworker(application_id):
    """
    Assign a case to an available caseworker, distributing evenly.
    For demo applications, always assign to demo caseworker.
    Returns the assigned caseworker_id or None if no caseworkers available.
    """
    logger.info(f"Assigning application {application_id} to a caseworker")
    
    # Check if this is a demo application
    app_response = supabase.table('applications').select('demo_session_id').eq('id', application_id).execute()
    is_demo = app_response.data and app_response.data[0].get('demo_session_id') is not None
    
    if is_demo:
        # Demo application - assign to demo caseworker
        demo_caseworker_id = os.getenv('DEMO_CASEWORKER_USER_ID')
        if not demo_caseworker_id:
            logger.error("DEMO_CASEWORKER_USER_ID not configured. Cannot assign demo application.")
            return None
        
        logger.info(f"[DEMO] Assigning demo application {application_id} to demo caseworker {demo_caseworker_id}")
        
        try:
            assignment_response = supabase.rpc('assign_reviewer', {
                'p_application_id': application_id,
                'p_reviewer_id': demo_caseworker_id,
                'p_priority': 0
            }).execute()
            
            if assignment_response.data:
                logger.info(f"[DEMO] Successfully assigned application {application_id} to demo caseworker {demo_caseworker_id}")
                return demo_caseworker_id
            else:
                logger.error(f"[DEMO] Failed to assign application {application_id}")
                return None
        except Exception as e:
            logger.error(f"[DEMO] Error assigning application {application_id} to demo caseworker: {e}")
            return None
    
    # Normal application - use standard assignment logic
    # Get all active and available caseworkers
    caseworkers_response = supabase.table('users').select('id').eq('role', 'caseworker').eq('is_active', True).eq('caseworker_available', True).execute()
    
    if not caseworkers_response.data or len(caseworkers_response.data) == 0:
        logger.warning("No available caseworkers found")
        return None
    
    caseworker_ids = [cw['id'] for cw in caseworkers_response.data]
    
    # Get current assignment counts for each caseworker
    # Count unopened and in_progress assignments (not completed)
    assignment_counts = {}
    for cw_id in caseworker_ids:
        # Count active assignments (unopened or in_progress)
        # Get all assignments and count them
        assignments_response = supabase.table('assigned_applications').select('id').eq('reviewer_id', cw_id).in_('review_status', ['unopened', 'in_progress']).execute()
        assignment_counts[cw_id] = len(assignments_response.data) if assignments_response.data else 0
    
    # Find caseworker with fewest assignments
    min_count = min(assignment_counts.values())
    caseworkers_with_min = [cw_id for cw_id, count in assignment_counts.items() if count == min_count]
    
    # If multiple caseworkers have the same count, pick the first one
    # (Could be randomized, but deterministic is fine for now)
    selected_caseworker_id = caseworkers_with_min[0]
    
    logger.info(f"Selected caseworker {selected_caseworker_id} with {min_count} current assignments")
    
    # Assign the application using the assign_reviewer function
    # p_assigned_by is optional (defaults to NULL for system assignments)
    # Note: This requires migration 20260104230015_add_caseworker_assigns.sql.sql to be applied
    try:
        # Try calling without p_assigned_by first (after migration)
        try:
            assignment_response = supabase.rpc('assign_reviewer', {
                'p_application_id': application_id,
                'p_reviewer_id': selected_caseworker_id,
                'p_priority': 0
            }).execute()
        except Exception as e:
            # Fallback: if migration not applied, try with NULL assigned_by
            if 'p_assigned_by' in str(e) or 'missing' in str(e).lower():
                logger.warning("Migration may not be applied, trying with explicit NULL for p_assigned_by")
                assignment_response = supabase.rpc('assign_reviewer', {
                    'p_application_id': application_id,
                    'p_reviewer_id': selected_caseworker_id,
                    'p_assigned_by': None,
                    'p_priority': 0
                }).execute()
            else:
                raise
        
        if assignment_response.data:
            logger.info(f"Successfully assigned application {application_id} to caseworker {selected_caseworker_id}")
            return selected_caseworker_id
        else:
            logger.error(f"Failed to assign application {application_id}")
            return None
    except Exception as e:
        logger.error(f"Error assigning application {application_id} to caseworker {selected_caseworker_id}: {e}")
        return None

def orchestrate_assignment(application_id):
    """
    Orchestrate case assignment to caseworkers.
    """
    logger.info(f"Orchestrating assignment for application {application_id}")
    
    # Verify application exists and is in submitted status
    app_response = supabase.table('applications').select('id, status').eq('id', application_id).execute()
    if not app_response.data:
        raise Exception(f"Application {application_id} not found")
    
    app_status = app_response.data[0]['status']
    if app_status != 'submitted':
        logger.warning(f"Application {application_id} is in status {app_status}, not submitted. Skipping assignment.")
        return {"result": "skipped", "reason": f"Application status is {app_status}"}
    
    # Check if already assigned
    existing_assignment = supabase.table('assigned_applications').select('id').eq('application_id', application_id).execute()
    if existing_assignment.data:
        logger.info(f"Application {application_id} is already assigned")
        return {"result": "already_assigned"}
    
    # Assign to caseworker
    assigned_caseworker_id = assign_case_to_caseworker(application_id)
    
    if assigned_caseworker_id:
        return {"result": "assigned", "caseworker_id": str(assigned_caseworker_id)}
    else:
        return {"result": "no_caseworkers_available"}

def send_orchestration_task_to_sqs(application_id):
    """
    Send an orchestration task to SQS queue.
    Returns True if successful, False otherwise.
    """
    if not sqs_client or not SQS_QUEUE_URL:
        logger.error("SQS client or queue URL not configured. Cannot send orchestration task.")
        return False
    
    try:
        message_body = {
            "task_type": "orchestration",
            "application_id": application_id,
            "payload": {
                "application_id": application_id
            }
        }
        
        response = sqs_client.send_message(
            QueueUrl=SQS_QUEUE_URL,
            MessageBody=json.dumps(message_body)
        )
        
        logger.info(f"Orchestration task sent to SQS for application {application_id}. MessageId: {response.get('MessageId')}")
        return True
        
    except ClientError as e:
        logger.error(f"Failed to send orchestration task to SQS for application {application_id}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending orchestration task to SQS for application {application_id}: {e}")
        return False

def process_task(task_data, task_id=None):
    """
    Process the individual task based on task type.
    
    Args:
        task_data: Dictionary containing task_type, application_id, and payload
        task_id: Optional task ID from processing_queue table
    """
    task_type = task_data.get('task_type')
    payload = task_data.get('payload', {})
    application_id = payload.get('application_id') or task_data.get('application_id')
    
    logger.info(f"Processing task {task_id or 'unknown'} of type {task_type} for application {application_id}")
    
    if task_type == 'ai':
        # AI processing task
        if not application_id:
            raise Exception(f"No application_id provided in AI task")
        
        # Load application data to pass to update function
        application_data, _ = load_from_supabase(application_id)
        out = ai(application_id)
        update_db_with_ai_output(out, application_id, application_data)
        
        logger.info(f"AI task {task_id or 'unknown'} completed successfully")
        return {"result": "success", "next_task": "orchestration"}
        
    elif task_type == 'orchestration':
        # Orchestration task - assign to caseworkers
        if not application_id:
            raise Exception(f"No application_id provided in orchestration task")
        
        result = orchestrate_assignment(application_id)
        logger.info(f"Orchestration task {task_id or 'unknown'} completed: {result}")
        return result
        
    elif task_type == 'fail_test':
        raise Exception("Simulated failure")
        
    else:
        logger.warning(f"Unknown task type: {task_type}")
        return {"result": "unknown_task_type"}

def find_or_create_task_record(task_data):
    """
    Find existing task record in processing_queue or create one if not found.
    Returns the task_id.
    """
    application_id = task_data.get('application_id') or task_data.get('payload', {}).get('application_id')
    task_type = task_data.get('task_type')
    task_id = task_data.get('task_id')
    
    # If task_id is provided, try to find it
    if task_id:
        try:
            response = supabase.table('processing_queue').select('id').eq('id', task_id).execute()
            if response.data:
                return task_id
        except Exception as e:
            logger.warning(f"Could not find task with id {task_id}: {e}")
    
    # Otherwise, try to find by application_id + task_type + pending status
    if application_id and task_type:
        try:
            response = supabase.table('processing_queue')\
                .select('id')\
                .eq('application_id', application_id)\
                .eq('task_type', task_type)\
                .eq('status', 'pending')\
                .order('created_at', desc=True)\
                .limit(1)\
                .execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]['id']
        except Exception as e:
            logger.warning(f"Could not find existing task record: {e}")
    
    # If not found, create a new record
    try:
        insert_data = {
            'application_id': application_id,
            'task_type': task_type,
            'payload': task_data.get('payload', {}),
            'status': 'pending'
        }
        response = supabase.table('processing_queue').insert(insert_data).execute()
        if response.data and len(response.data) > 0:
            return response.data[0]['id']
    except Exception as e:
        logger.error(f"Failed to create task record: {e}")
        raise
    
    return None

def update_task_status(task_id, status, error_message=None, result=None):
    """
    Update the status of a task in processing_queue table.
    """
    try:
        update_data = {
            'status': status,
            'updated_at': 'now()'
        }
        
        if status == 'processing':
            update_data['locked_at'] = 'now()'
            # Increment attempts
            # Get current attempts first
            current_task = supabase.table('processing_queue').select('attempts').eq('id', task_id).execute()
            current_attempts = current_task.data[0].get('attempts', 0) if current_task.data else 0
            update_data['attempts'] = current_attempts + 1
        
        if error_message:
            update_data['last_error'] = error_message
        
        if result:
            # Merge result into payload
            current_task = supabase.table('processing_queue').select('payload').eq('id', task_id).execute()
            current_payload = current_task.data[0].get('payload', {}) if current_task.data else {}
            if isinstance(current_payload, str):
                current_payload = json.loads(current_payload) if current_payload else {}
            current_payload['result'] = result
            update_data['payload'] = current_payload
        
        supabase.table('processing_queue').update(update_data).eq('id', task_id).execute()
        logger.info(f"Updated task {task_id} status to {status}")
        
    except Exception as e:
        logger.error(f"Failed to update task {task_id} status: {e}")
        # Don't raise - this is non-critical for processing

def process_sqs_message(record):
    """
    Process a single SQS message record.
    Returns (success: bool, message_id: str, error: str or None)
    """
    message_id = record.get('messageId')
    body = record.get('body', '{}')
    
    try:
        # Parse message body
        task_data = json.loads(body)
        logger.info(f"Processing SQS message {message_id}: {task_data}")
        
        # Find or create task record in processing_queue
        task_id = find_or_create_task_record(task_data)
        if not task_id:
            raise Exception("Could not find or create task record")
        
        # Update status to processing
        update_task_status(task_id, 'processing')
        
        # Process the task
        result = process_task(task_data, task_id)
        
        # Update status to completed
        update_task_status(task_id, 'completed', result=result)
        
        # If AI task completed successfully, send orchestration task to SQS
        if task_data.get('task_type') == 'ai' and result.get('result') == 'success':
            application_id = task_data.get('application_id') or task_data.get('payload', {}).get('application_id')
            if application_id:
                logger.info(f"AI task completed successfully, sending orchestration task to SQS for application {application_id}")
                # Also create record in processing_queue for orchestration task
                try:
                    supabase.table('processing_queue').insert({
                        'application_id': application_id,
                        'task_type': 'orchestration',
                        'payload': {'application_id': application_id},
                        'status': 'pending'
                    }).execute()
                except Exception as e:
                    logger.warning(f"Failed to create orchestration task record in DB: {e}")
                
                # Send to SQS
                send_orchestration_task_to_sqs(application_id)
        
        return (True, message_id, None)
        
    except json.JSONDecodeError as e:
        error_msg = f"Invalid JSON in message body: {e}"
        logger.error(f"Error processing message {message_id}: {error_msg}")
        return (False, message_id, error_msg)
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error processing message {message_id}: {error_msg}")
        
        # Try to update task status to failed if we have a task_id
        try:
            task_data = json.loads(body)
            task_id = find_or_create_task_record(task_data)
            if task_id:
                update_task_status(task_id, 'failed', error_message=error_msg)
        except:
            pass  # Ignore errors in error handling
        
        return (False, message_id, error_msg)

def lambda_handler(event, context):
    """
    AWS Lambda handler for processing SQS events.
    
    Args:
        event: SQS event containing Records array
        context: Lambda context object
    
    Returns:
        Response with batchItemFailures for partial batch failure handling
    """
    logger.info(f"Lambda invoked with {len(event.get('Records', []))} SQS message(s)")
    
    batch_item_failures = []
    
    for record in event.get('Records', []):
        message_id = record.get('messageId')
        success, msg_id, error = process_sqs_message(record)
        
        if not success:
            logger.error(f"Failed to process message {msg_id}: {error}")
            batch_item_failures.append({
                "itemIdentifier": message_id
            })
    
    # Return response for partial batch failure handling
    response = {}
    if batch_item_failures:
        response["batchItemFailures"] = batch_item_failures
        logger.warning(f"Returning {len(batch_item_failures)} failed message(s) for retry")
    else:
        logger.info("All messages processed successfully")
    
    return response

def worker_loop():
    """
    Legacy worker loop for local testing.
    This function is kept for backward compatibility but should not be used in production.
    """
    logger.warning("Using legacy worker_loop(). This should only be used for local testing.")
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
                result = process_task(task, task_id)
                
                # 3. Mark as completed
                # Note: We merge the result into the existing payload
                current_payload = task['payload'] or {}
                current_payload['result'] = result
                
                supabase.table('processing_queue').update({
                    'status': 'completed',
                    'updated_at': 'now()',
                    'payload': current_payload
                }).eq('id', task_id).execute()
                
                # 4. If AI task completed successfully, create orchestration task
                if task['task_type'] == 'ai' and result.get('result') == 'success':
                    application_id = task['payload'].get('application_id')
                    if application_id:
                        logger.info(f"Creating orchestration task for application {application_id}")
                        try:
                            supabase.table('processing_queue').insert({
                                'application_id': application_id,
                                'task_type': 'orchestration',
                                'payload': {'application_id': application_id},
                                'status': 'pending'
                            }).execute()
                            logger.info(f"Orchestration task created for application {application_id}")
                        except Exception as e:
                            logger.error(f"Failed to create orchestration task for application {application_id}: {e}")
                            # Don't fail the AI task if orchestration task creation fails
                
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
    # For local testing, you can simulate SQS events
    # Example:
    # test_event = {
    #     "Records": [
    #         {
    #             "messageId": "test-msg-1",
    #             "body": json.dumps({
    #                 "task_type": "ai",
    #                 "application_id": "your-test-uuid",
    #                 "payload": {"application_id": "your-test-uuid"}
    #             })
    #         }
    #     ]
    # }
    # result = lambda_handler(test_event, None)
    # print(result)
    
    # Or use legacy worker loop for local testing
    worker_loop()
