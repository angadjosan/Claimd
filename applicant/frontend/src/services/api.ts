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
   * Creates and submits the application in one call
   */
  async submitApplication(formData: FormData): Promise<SubmitApplicationResponse> {
    const authHeader = await authService.getAuthHeader();
    
    // Create FormData for multipart upload
    const multipartForm = new FormData();
    
    // Add JSON form data (without files)
    const jsonData = stripFilesFromFormData(formData);
    multipartForm.append('formData', JSON.stringify(jsonData));
    
    // Collect and add all files
    const files = collectFiles(formData);
    files.forEach(({ fieldName, file }) => {
      multipartForm.append(fieldName, file);
    });

    const response = await fetch(`${config.apiUrl}/api/private/applications`, {
      method: 'POST',
      headers: {
        ...authHeader,
        // Don't set Content-Type - browser will set it with boundary for multipart
      },
      body: multipartForm as any,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to submit application' }));
      throw new Error(error.message || 'Failed to submit application');
    }

    return response.json();
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
};
