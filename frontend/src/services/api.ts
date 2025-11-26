import { config } from '../config/env';
import { authService } from './auth';

// Backend API Response Types
interface ReadResponse<T = any> {
  data: T;
}

interface ApiSuccessResponse {
  success: boolean;
  [key: string]: any;
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
  // Convenience fields for frontend
  applicant_name?: string;
  applicant_ssn?: string;
}

export interface Applicant {
  name: string;
  socialSecurityNumber: string;
  applications: Application[];
}

export const api = {
  // Get all applications for admin dashboard
  async getAllApplications(): Promise<Application[]> {
    // This function is deprecated - admin dashboard uses direct fetch now
    return [];
  },

  // Get specific application by ID
  async getApplicationById(applicationId: string): Promise<Application | null> {
    try {
      const response = await fetch(`${config.apiUrl}/api/application/${applicationId}`, {
        headers: {
          ...authService.getAuthHeader(),
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
        let recommendation: 'approve' | 'deny' | 'further_review' = 'further_review'; // default
        
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
          // Phase data
          phase_1_current_work: app.phase_1_current_work,
          phase_2_medical_severity: app.phase_2_medical_severity,
          phase_3_listings: app.phase_3_listings,
          phase_4_rfc: app.phase_4_rfc,
          phase_5_vocational: app.phase_5_vocational,
        };
      }
      return null;
    } catch (error) {
      return null; // Only return backend data, no mock fallback
    }
  },

  async approveApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${config.apiUrl}/api/application/approve/${applicationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: 'Failed to approve application' };
      }

      const result: ReadResponse = await response.json();
      const data = result.data as ApiSuccessResponse;

      if (data.success) {
        return { success: true, message: `✅ Application ${applicationId} approved successfully.` };
      } else {
        return { success: false, message: (data as any).error || 'Approval failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network or server error' };
    }
  },

  // Deny application
  async denyApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${config.apiUrl}/api/application/deny/${applicationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...authService.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, message: 'Failed to deny application' };
      }

      const result: ReadResponse = await response.json();
      const data = result.data as ApiSuccessResponse;

      if (data.success) {
        return { success: true, message: `🚫 Application ${applicationId} denied successfully.` };
      } else {
        return { success: false, message: (data as any).error || 'Denial failed' };
      }
    } catch (error) {
      return { success: false, message: 'Network or server error' };
    }
  },

};
