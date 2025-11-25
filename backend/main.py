# 10/25/2025
# main.py -- Main Program for Backend

# Import Separate Files
from api.ai.ai import ai
from api.read.read import read, read_application_by_id, read_all_applications, read_applications_by_user_ssn, update_application_status, read_all_users, get_filtered_applications, approve_application, deny_application

from fastapi.middleware.cors import CORSMiddleware

# Import Modules
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
import uvicorn
from pydantic import BaseModel
from typing import Any, Dict
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# RESPONSE/REQUEST SCHEMAS
class ReadRequest(BaseModel):
    ssn: str  # specifically expect an SSN string

class ReadResponse(BaseModel):
    data: Dict[str, Any]

class WriteResponse(BaseModel):
    decision: str
    confidence: float
    confidence_label: str
    summary: str
    recommendation: str
    ssdi_amount: float

app = FastAPI()

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# REQUEST: MultiStepForm data with file uploads
# RESPONSE: Processing results with MongoDB document IDs
# FUNCTIONALITY: Process form data and upload to MongoDB with ordered fields
@app.post("/api/benefit-application")
async def handle_benefit_application(
    firstName: str = Form(...),
    lastName: str = Form(...),
    dateOfBirth: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    zipCode: str = Form(...),
    socialSecurityNumber: str = Form(...),
    medicalRecordsFile: UploadFile = File(None),
    incomeDocumentsFile: UploadFile = File(None)
):
    try:
        form_data = {
            "firstName": firstName,
            "lastName": lastName,
            "dateOfBirth": dateOfBirth,
            "address": address,
            "city": city,
            "state": state,
            "zipCode": zipCode,
            "socialSecurityNumber": socialSecurityNumber,
        }
        
        # Call AI function
        result = await ai(
            form_data,
            medicalRecordsFile,
            incomeDocumentsFile
        )
        
        # Check if AI processing was successful
        if not result or not result.get("success"):
            error_msg = result.get("error", "Unknown error") if result else "No response from AI"
            raise HTTPException(status_code=500, detail=error_msg)
        
        # Extract the JSON result from AI analysis
        json_result = result.get("result", {})
        application_id = result.get("application_id")
        
        return {
            "success": True,
            "message": "Application processed successfully",
            "application_id": application_id,
            "analysis": json_result,
            "applicant": {
                "name": f"{firstName} {lastName}",
                "ssn": socialSecurityNumber
            }
        }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in benefit application endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# REQUEST: SSN to look up
# RESPONSE: Data from database
# FUNCTIONALITY: Read existing application data
@app.post("/api/read", response_model=ReadResponse)
async def mainRead():
    result = await read()
    
    return ReadResponse(data=result)

# REQUEST: Get all applications for admin dashboard
# RESPONSE: All applications from database
# FUNCTIONALITY: Read all applications for admin dashboard
@app.get("/api/applications")
async def getAllApplications():
    result = await read_all_applications()
    return ReadResponse(data=result)

# REQUEST: Get all users for debugging
# RESPONSE: All users from database
# FUNCTIONALITY: Debug endpoint to see all users
@app.get("/api/users/all")
async def getAllUsers():
    result = await read_all_users()
    return result

@app.get("/api/users/filtered")
async def getFilteredApplications():
    result = await get_filtered_applications()
    return result

@app.put("/api/application/approve/{application_id}")
async def approveApplication(application_id: str):
    result = await approve_application(application_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Application not found"))
    return ReadResponse(data=result)

@app.put("/api/application/deny/{application_id}")
async def denyApplication(application_id: str):
    result = await deny_application(application_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Application not found"))
    return ReadResponse(data=result)
    
    

# REQUEST: SSN to look up user applications
# RESPONSE: All applications for a specific user
# FUNCTIONALITY: Read applications by user SSN
@app.get("/api/user/applications/{ssn}")
async def getUserApplications(ssn: str):
    result = await read_applications_by_user_ssn(ssn)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "User not found"))
    
    return ReadResponse(data=result)

# REQUEST: Application ID to look up
# RESPONSE: Application data from database
# FUNCTIONALITY: Read a single application by ID
@app.get("/api/application/{application_id}")
async def getApplicationById(application_id: str):
    result = await read_application_by_id(application_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=404, detail=result.get("error", "Application not found"))
    
    return ReadResponse(data=result)

# REQUEST: Application ID and status to update
# RESPONSE: Success/failure message
# FUNCTIONALITY: Update application status (approve/deny)
@app.put("/api/application/{application_id}/status")
async def updateApplicationStatus(application_id: str, status: str = Form(...), admin_notes: str = Form("")):
    result = await update_application_status(application_id, status, admin_notes)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to update status"))
    
    return ReadResponse(data=result)


if __name__ == "__main__":
    # Get port from environment variable with default
    port = int(os.getenv("PORT", "8000"))
    # This runs the app when you do `python main.py`
    uvicorn.run(app, host="127.0.0.1", port=port)