import { config } from '../config/env';
import { authService } from './auth';
import type { FormData } from '../types/form';

// Backend API Response Types
interface ReadResponse<T = any> {
  data: T;
}

interface SubmitApplicationResponse {
  success: boolean;
  data: {
    application_id: string;
    status: string;
    submitted_at: string;
    created_at: string;
  };
}

// Application interface matching backend schema
export interface Application {
  application_id: string;
  user_id?: string;
  personal_information?: {
    name?: string;
    social_security_number?: string;
    date_of_birth?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip_code?: string;
    };
  };
  documents?: {
    document_id: string;
    filename: string;
    content_type: string;
  };
  document?: string; // Base64 encoded PDF
  claude_summary: string;
  claude_recommendation: 'approve' | 'deny' | 'further_review';
  claude_confidence_level: number;
  phase_1_current_work?: any;
  phase_2_medical_severity?: any;
  phase_3_listings?: any;
  phase_4_rfc?: any;
  phase_5_vocational?: any;
  human_final?: boolean;
  final_decision?: string;
  admin_status?: string;
  admin_notes?: string;
  status_updated_at?: string;
  decision_updated_at?: string;
  created_at?: string;
  applicant_name?: string;
  applicant_ssn?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total (reasonable limit for multiple files)

/**
 * Validates file sizes before upload
 * @throws Error if any file exceeds 10MB or total exceeds 100MB
 */
function validateFileSizes(files: { fieldName: string; file: File; metadata?: any }[]): void {
  let totalSize = 0;
  const oversizedFiles: string[] = [];

  for (const { file } of files) {
    // Check individual file size
    if (file.size > MAX_FILE_SIZE) {
      oversizedFiles.push(file.name);
    }
    totalSize += file.size;
  }

  // Check for oversized individual files
  if (oversizedFiles.length > 0) {
    throw new Error(
      `The following file(s) exceed the 10MB limit: ${oversizedFiles.join(', ')}. Please upload smaller files.`
    );
  }

  // Check total size
  if (totalSize > MAX_TOTAL_SIZE) {
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const maxTotalSizeMB = (MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0);
    throw new Error(
      `Total upload size (${totalSizeMB}MB) exceeds the ${maxTotalSizeMB}MB limit. Please reduce the number or size of files.`
    );
  }
}

/**
 * Collects all files from the form data and returns them with their field names
 */
function collectFiles(formData: FormData): { fieldName: string; file: File; metadata?: any }[] {
  const files: { fieldName: string; file: File; metadata?: any }[] = [];

  // Single file fields
  if (formData.permanent_resident_card) {
    files.push({ fieldName: 'permanent_resident_card', file: formData.permanent_resident_card });
  }
  if (formData.social_security_statement) {
    files.push({ fieldName: 'social_security_statement', file: formData.social_security_statement });
  }
  if (formData.birth_certificate) {
    files.push({ fieldName: 'birth_certificate', file: formData.birth_certificate });
  }
  if (formData.citizenship_proof) {
    files.push({ fieldName: 'citizenship_proof', file: formData.citizenship_proof });
  }
  if (formData.military_discharge_papers) {
    files.push({ fieldName: 'military_discharge_papers', file: formData.military_discharge_papers });
  }

  // Evidence documents (array of files)
  formData.evidence_documents.forEach((doc, index) => {
    if (doc.file) {
      files.push({
        fieldName: 'evidence_documents',
        file: doc.file,
        metadata: { index, document_type: doc.document_type, description: doc.description },
      });
    }
  });

  // W2 forms (array with years)
  formData.w2_forms.forEach((w2, index) => {
    if (w2.file) {
      files.push({
        fieldName: 'w2_forms',
        file: w2.file,
        metadata: { index, year: w2.year },
      });
    }
  });

  // Self-employment tax returns (array with years)
  formData.self_employment_tax_returns.forEach((ret, index) => {
    if (ret.file) {
      files.push({
        fieldName: 'self_employment_tax_returns',
        file: ret.file,
        metadata: { index, year: ret.year },
      });
    }
  });

  // Workers comp proof (array with types)
  formData.workers_comp_proof.forEach((proof, index) => {
    if (proof.file) {
      files.push({
        fieldName: 'workers_comp_proof',
        file: proof.file,
        metadata: { index, type: proof.type, description: proof.description },
      });
    }
  });

  return files;
}

/**
 * Strips File objects from form data for JSON serialization
 */
function stripFilesFromFormData(formData: FormData): any {
  return {
    ...formData,
    permanent_resident_card: undefined,
    social_security_statement: undefined,
    birth_certificate: undefined,
    citizenship_proof: undefined,
    military_discharge_papers: undefined,
    evidence_documents: formData.evidence_documents.map(doc => ({
      document_type: doc.document_type,
      description: doc.description,
    })),
    w2_forms: formData.w2_forms.map(w2 => ({
      year: w2.year,
    })),
    self_employment_tax_returns: formData.self_employment_tax_returns.map(ret => ({
      year: ret.year,
    })),
    workers_comp_proof: formData.workers_comp_proof.map(proof => ({
      type: proof.type,
      description: proof.description,
    })),
  };
}

export const api = {
  /**
   * Submit a new application with form data and files
   * Returns immediately after submission is accepted (202 Accepted)
   * Processing continues asynchronously on the server
   */
  async submitApplication(formData: FormData): Promise<SubmitApplicationResponse> {
    const submissionStartTime = Date.now();
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    
    console.log('[FRONTEND] Starting application submission', {
      requestId,
      timestamp: new Date().toISOString(),
      fileCount: collectFiles(formData).length,
    });

    try {
      console.log('[FRONTEND] Getting auth header...', { requestId });
      const authHeader = await authService.getAuthHeader();
      console.log('[FRONTEND] Got auth header', { 
        requestId,
        hasToken: !!authHeader.Authorization,
        headerKeys: Object.keys(authHeader),
      });
      
      // Create FormData for multipart upload
      console.log('[FRONTEND] Creating multipart form...', { requestId });
      const multipartForm = new FormData();
      
      // Add JSON form data (without files)
      console.log('[FRONTEND] Stripping files from form data...', { requestId });
      const jsonData = stripFilesFromFormData(formData);
      console.log('[FRONTEND] Stripped files, stringifying JSON...', { 
        requestId,
        jsonDataKeys: Object.keys(jsonData),
      });
      multipartForm.append('formData', JSON.stringify(jsonData));
      console.log('[FRONTEND] Added formData to multipart form', { requestId });
      
      // Collect and add all files
      console.log('[FRONTEND] Collecting files...', { requestId });
      const files = collectFiles(formData);
      console.log('[FRONTEND] Collected files', { 
        requestId,
        fileCount: files.length,
      });
      
      // Validate file sizes before upload
      if (files.length > 0) {
        console.log('[FRONTEND] Validating file sizes...', { requestId });
        validateFileSizes(files);
        console.log('[FRONTEND] File size validation passed', { requestId });
      }
      
      const totalFileSize = files.reduce((sum, { file }) => sum + file.size, 0);
      
      console.log('[FRONTEND] Prepared submission data', {
        requestId,
        fileCount: files.length,
        totalFileSize: `${(totalFileSize / 1024 / 1024).toFixed(2)}MB`,
      });

      console.log('[FRONTEND] Appending files to multipart form...', { requestId });
      files.forEach(({ fieldName, file }) => {
        multipartForm.append(fieldName, file);
      });
      console.log('[FRONTEND] All files appended to multipart form', { requestId });

      const fetchStartTime = Date.now();
      console.log('[FRONTEND] Sending submission request', {
        requestId,
        url: `${config.apiUrl}/api/private/applications`,
      });

      const response = await fetch(`${config.apiUrl}/api/private/applications`, {
        method: 'POST',
        headers: {
          ...authHeader,
          // Don't set Content-Type - browser will set it with boundary for multipart
        },
        body: multipartForm as any,
      });

      const fetchDuration = Date.now() - fetchStartTime;
      const totalDuration = Date.now() - submissionStartTime;

      console.log('[FRONTEND] Received submission response', {
        requestId,
        status: response.status,
        statusText: response.statusText,
        fetchDuration: `${fetchDuration}ms`,
        totalDuration: `${totalDuration}ms`,
      });

      // Accept both 201 (synchronous) and 202 (async) responses
      if (response.status === 202) {
        // Async processing - return immediately
        const responseData = await response.json();
        console.log('[FRONTEND] Submission accepted for async processing', {
          requestId,
          applicationId: responseData.data?.application_id,
          status: responseData.data?.status,
        });
        return responseData;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to submit application';
        let errorDetails: any = {};
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData;
        } catch (e) {
          // If response isn't JSON, try to get text
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          } catch (textError) {
            // Fall back to status text
            errorMessage = response.statusText || errorMessage;
          }
        }
        
        // Special handling for rate limiting
        if (response.status === 429) {
          errorMessage = errorDetails.message || errorDetails.error || 'Too many requests. Please wait before submitting again.';
          if (errorDetails.retryAfter) {
            errorMessage += ` Retry after: ${errorDetails.retryAfter}`;
          }
        }
        
        console.error('[FRONTEND] Submission failed', {
          requestId,
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          errorDetails,
        });
        throw new Error(errorMessage);
      }

      // 201 Created (synchronous response - legacy support)
      const responseData = await response.json();
      console.log('[FRONTEND] Submission completed synchronously', {
        requestId,
        applicationId: responseData.data?.application_id,
        status: responseData.data?.status,
        totalDuration: `${totalDuration}ms`,
      });
      return responseData;

    } catch (error) {
      const totalDuration = Date.now() - submissionStartTime;
      console.error('[FRONTEND] Submission error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
        totalDuration: `${totalDuration}ms`,
      });
      console.error('[FRONTEND] Full error object:', error);
      throw error;
    }
  },

  /**
   * Get all applications for the current user
   */
  async getMyApplications(): Promise<any[]> {
    const authHeader = await authService.getAuthHeader();

    const response = await fetch(`${config.apiUrl}/api/private/applications`, {
      headers: {
        ...authHeader,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch applications');
    }

    const result = await response.json();
    return result.data || [];
  },

  // Get specific application by ID
  async getApplicationById(applicationId: string): Promise<Application | null> {
    try {
      const authHeader = await authService.getAuthHeader();
      const response = await fetch(`${config.apiUrl}/api/application/${applicationId}`, {
        headers: {
          ...authHeader,
        },
      });
      if (!response.ok) {
        return null;
      }
      const result: ReadResponse = await response.json();
      const data = result.data;
      
      if (data.success && data.application) {
        const app = data.application;
        
        // Convert backend recommendation format to frontend format
        const backendDecision = app.final_decision || app.claude_recommendation || '';
        let recommendation: 'approve' | 'deny' | 'further_review' = 'further_review';
        
        if (backendDecision.toUpperCase() === 'APPROVE') {
          recommendation = 'approve';
        } else if (backendDecision.toUpperCase() === 'REJECT' || backendDecision.toUpperCase() === 'DENY') {
          recommendation = 'deny';
        } else if (backendDecision.toUpperCase() === 'FURTHER REVIEW') {
          recommendation = 'further_review';
        }
        
        return {
          application_id: app.application_id,
          document: app.document,
          claude_confidence_level: app.claude_confidence_level,
          claude_summary: app.claude_summary,
          claude_recommendation: recommendation,
          applicant_name: app.personal_information?.name || 'Unknown',
          applicant_ssn: app.personal_information?.social_security_number || '',
          phase_1_current_work: app.phase_1_current_work,
          phase_2_medical_severity: app.phase_2_medical_severity,
          phase_3_listings: app.phase_3_listings,
          phase_4_rfc: app.phase_4_rfc,
          phase_5_vocational: app.phase_5_vocational,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Cancel an in-progress application
   */
  async cancelApplication(applicationId: string): Promise<void> {
    const authHeader = await authService.getAuthHeader();

    const response = await fetch(`${config.apiUrl}/api/private/applications/${applicationId}/cancel`, {
      method: 'DELETE',
      headers: {
        ...authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to cancel application' }));
      throw new Error(error.message || 'Failed to cancel application');
    }

    return response.json();
  },
};
