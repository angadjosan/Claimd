"""
AI service for processing SSDI applications using Claude API.
"""
import os
import base64
import anthropic
from dotenv import load_dotenv
import re
import json
from typing import Dict, Any, Optional
from fastapi import UploadFile

from utils.logger import get_logger
from utils.document_utils import merge_pdfs, store_documents_in_db
from services.application_service import save_application_to_db
from services.user_service import save_or_update_user

# Initialize logger
logger = get_logger(__name__)

dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.env"))
load_dotenv(dotenv_path)

client = anthropic.Anthropic(api_key=os.getenv("CLAUDE_API_KEY"))


def load_prompt() -> str:
    """Load the AI prompt from prompt.md file."""
    prompt_path = os.path.join(os.path.dirname(__file__), "../prompt.md")
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        logger.warning(f"[LOAD_PROMPT] Could not load prompt.md: {e}")
        return "You are an AI that analyzes medical and income records for SSDI eligibility."


async def ai(form_data: Dict[str, Any], medicalRecordsFile: Optional[UploadFile], incomeDocumentsFile: Optional[UploadFile]) -> Dict[str, Any]:
    """
    Main AI processing pipeline for SSDI application analysis.
    
    Args:
        form_data: Applicant form data
        medicalRecordsFile: Uploaded medical records (optional)
        incomeDocumentsFile: Uploaded income documents (optional)
    
    Returns:
        Dict containing AI analysis results and application ID
    """
    try:
        # Read file contents
        medical_bytes = await medicalRecordsFile.read()
        income_bytes = await incomeDocumentsFile.read()
        
        # Get filenames
        medical_filename = medicalRecordsFile.filename or "medical_records.pdf"
        income_filename = incomeDocumentsFile.filename or "income_documents.pdf"
        
        # Load prompt
        prompt = load_prompt()
        
        # Encode files to base64
        medical_base64 = base64.standard_b64encode(medical_bytes).decode("utf-8")
        income_base64 = base64.standard_b64encode(income_bytes).decode("utf-8")
        
        # Determine media types
        medical_media_type = medicalRecordsFile.content_type or "application/pdf"
        income_media_type = incomeDocumentsFile.content_type or "application/pdf"
        
        logger.info(f"[AI_PROCESS] Starting Claude API analysis for application")
        
        # Create streaming message
        response_text = ""
        
        with client.messages.stream(
            model="claude-sonnet-4-5-20250929",
            max_tokens=8000,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": medical_media_type,
                                "data": medical_base64
                            }
                        },
                        {
                            "type": "document",
                            "source": {
                                "type": "base64",
                                "media_type": income_media_type,
                                "data": income_base64
                            }
                        }
                    ]
                }
            ]
        ) as stream:
            for text in stream.text_stream:
                response_text += text
        
        logger.info(f"[AI_PROCESS] Claude API response received ({len(response_text)} characters)")
        
        # Extract JSON after streaming is complete
        # Try to find content between START_OUTPUT and END_OUTPUT tags
        json_match = re.search(r'<START_OUTPUT>(.*?)<END_OUTPUT>', response_text, re.DOTALL)

        if json_match:
            json_str = json_match.group(1).strip()
        else:
            # Fallback: Try to find JSON block without tags
            logger.warning("[AI_PROCESS] START_OUTPUT/END_OUTPUT tags not found, attempting to extract JSON directly")
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1).strip()
            else:
                # Last resort: try to find any JSON object
                json_match = re.search(r'(\{[\s\S]*\})', response_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1).strip()
                else:
                    logger.error("[AI_PROCESS] Could not extract JSON from response")
                    return {
                        "success": False,
                        "error": "No JSON found in response",
                        "raw_response": response_text[:1000]  # Log first 1000 chars for debugging
                    }
        
        # Clean up JSON string (remove markdown code fences if present)
        json_str = re.sub(r'^```json\s*', '', json_str)
        json_str = re.sub(r'\s*```$', '', json_str)
        
        try:
            jsonResult = json.loads(json_str)
            logger.debug("[AI_PROCESS] JSON parsed successfully")

            # Store documents in MongoDB
            logger.info("[AI_PROCESS] Step 1/3: Storing documents in MongoDB")
            
            combinedDoc = await merge_pdfs(
                {
                    "firstName": form_data["firstName"], 
                    "lastName": form_data["lastName"], 
                    "dateOfBirth": form_data["dateOfBirth"], 
                    "socialSecurityNumber": form_data["socialSecurityNumber"], 
                    "streetAddress": form_data["address"], 
                    "city": form_data["city"], 
                    "state": form_data["state"], 
                    "zipCode": form_data["zipCode"]
                },
                [medical_bytes, income_bytes]
            )
            
            document = await store_documents_in_db(
                combinedDoc, "combined_document.pdf"
            )
            
            # Save application to MongoDB
            logger.info("[AI_PROCESS] Step 2/3: Saving application to MongoDB")
            application_id = await save_application_to_db(
                jsonResult, 
                document, 
                response_text
            )
            
            # Save or update user
            logger.info("[AI_PROCESS] Step 3/3: Saving/updating user record")
            if application_id:
                await save_or_update_user(
                    f"{form_data['firstName']} {form_data['lastName']}", 
                    form_data["socialSecurityNumber"], 
                    application_id
                )
            
            return {
                "success": True,
                "application_id": application_id,
                "result": jsonResult,
                "document": document,
                "raw_response": response_text
            }
                
        except json.JSONDecodeError as e:
            logger.error(f"[AI_PROCESS] JSON parsing failed: {type(e).__name__}: {str(e)}", exc_info=True)
            logger.debug(f"[AI_PROCESS] Failed JSON string: {json_str[:500]}")
            return {
                "success": False,
                "error": f"Failed to parse JSON response: {str(e)}",
                "raw_response": response_text[:1000]
            }
            
    except Exception as e:
        logger.error(f"[AI_PROCESS] Unexpected error in AI pipeline: {type(e).__name__}: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
