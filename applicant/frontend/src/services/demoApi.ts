import { config } from '../config/env';
import type { FormData } from '../types/form';

// Re-export types from api.ts
interface SubmitApplicationResponse {
  success: boolean;
  data: {
    application_id: string;
    status: string;
    submitted_at: string;
    created_at: string;
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB total

function validateFileSizes(files: { fieldName: string; file: File; metadata?: any }[]): void {
  let totalSize = 0;
  const oversizedFiles: string[] = [];

  for (const { file } of files) {
    if (file.size > MAX_FILE_SIZE) {
      oversizedFiles.push(file.name);
    }
    totalSize += file.size;
  }

  if (oversizedFiles.length > 0) {
    throw new Error(
      `The following file(s) exceed the 10MB limit: ${oversizedFiles.join(', ')}. Please upload smaller files.`
    );
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const maxTotalSizeMB = (MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0);
    throw new Error(
      `Total upload size (${totalSizeMB}MB) exceeds the ${maxTotalSizeMB}MB limit. Please reduce the number or size of files.`
    );
  }
}

function collectFiles(formData: FormData): { fieldName: string; file: File; metadata?: any }[] {
  const files: { fieldName: string; file: File; metadata?: any }[] = [];

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

  formData.evidence_documents.forEach((doc, index) => {
    if (doc.file) {
      files.push({
        fieldName: 'evidence_documents',
        file: doc.file,
        metadata: { index, document_type: doc.document_type, description: doc.description },
      });
    }
  });

  formData.w2_forms.forEach((w2, index) => {
    if (w2.file) {
      files.push({
        fieldName: 'w2_forms',
        file: w2.file,
        metadata: { index, year: w2.year },
      });
    }
  });

  formData.self_employment_tax_returns.forEach((ret, index) => {
    if (ret.file) {
      files.push({
        fieldName: 'self_employment_tax_returns',
        file: ret.file,
        metadata: { index, year: ret.year },
      });
    }
  });

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

/**
 * Demo API service
 * Wraps existing API functions but adds demo mode headers and routes to demo endpoints
 */
export const demoApi = {
  /**
   * Submit a new application in demo mode
   */
  async submitApplication(formData: FormData, getDemoHeaders: () => Record<string, string>): Promise<SubmitApplicationResponse> {
    const requestId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    
    console.log('[DEMO] Starting application submission', {
      requestId,
      timestamp: new Date().toISOString(),
    });

    try {
      const demoHeaders = getDemoHeaders();
      const multipartForm = new FormData();
      
      const jsonData = stripFilesFromFormData(formData);
      multipartForm.append('formData', JSON.stringify(jsonData));
      
      const files = collectFiles(formData);
      
      if (files.length > 0) {
        validateFileSizes(files);
      }
      
      files.forEach(({ fieldName, file }) => {
        multipartForm.append(fieldName, file);
      });

      const response = await fetch(`${config.apiUrl}/api/demo/applications`, {
        method: 'POST',
        headers: {
          ...demoHeaders,
          // Don't set Content-Type - browser will set it with boundary for multipart
        },
        body: multipartForm as any,
      });

      if (response.status === 202) {
        const responseData = await response.json();
        console.log('[DEMO] Submission accepted for async processing', {
          requestId,
          applicationId: responseData.data?.application_id,
        });
        return responseData;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to submit application';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        if (response.status === 401) {
          // Session expired, redirect to start new demo
          window.location.href = '/demo?session_expired=true';
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      return responseData;

    } catch (error) {
      console.error('[DEMO] Submission error', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  /**
   * Get all applications for the current demo session
   */
  async getMyApplications(getDemoHeaders: () => Record<string, string>): Promise<any[]> {
    const demoHeaders = getDemoHeaders();

    const response = await fetch(`${config.apiUrl}/api/demo/applications`, {
      headers: demoHeaders,
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/demo?session_expired=true';
      }
      throw new Error('Failed to fetch applications');
    }

    const result = await response.json();
    return result.data || [];
  },

  /**
   * Get application status (for polling)
   */
  async getApplicationStatus(applicationId: string, getDemoHeaders: () => Record<string, string>): Promise<any> {
    const demoHeaders = getDemoHeaders();

    const response = await fetch(`${config.apiUrl}/api/demo/applications/${applicationId}/status`, {
      headers: demoHeaders,
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/demo?session_expired=true';
      }
      throw new Error('Failed to fetch application status');
    }

    const result = await response.json();
    return result.data;
  },

  /**
   * Save email when user accesses demo
   */
  async saveEmail(email: string, getDemoHeaders: () => Record<string, string>): Promise<void> {
    const demoHeaders = getDemoHeaders();

    const response = await fetch(`${config.apiUrl}/api/demo/email`, {
      method: 'POST',
      headers: {
        ...demoHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/demo?session_expired=true';
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to save email');
    }
  },
};
