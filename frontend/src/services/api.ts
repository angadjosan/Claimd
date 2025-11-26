import { config } from '../config/env';

// API service for admin dashboard operations
export interface Application {
  application_id: string;
  document: string;
  claude_confidence_level: number;
  claude_summary: string;
  claude_recommendation: 'approve' | 'deny' | 'further_review';
  applicant_name?: string;
  applicant_ssn?: string;
  socialSecurityNumber?: string;
  // Phase data
  phase_1_current_work?: {
    finding?: string;
    status?: string;
  };
  phase_2_medical_severity?: {
    finding?: string;
    status?: string;
  };
  phase_3_listings?: {
    finding?: string;
    status?: string;
  };
  phase_4_rfc?: {
    reason_cannot_assess?: string;
    status?: string;
  };
  phase_5_vocational?: {
    reason?: string;
    status?: string;
  };
}

export interface Applicant {
  name: string;
  socialSecurityNumber: string;
  applications: Application[];
}

// Mock data - REMOVED - only using real backend data now
/*const mockData: Applicant[] = [
  {
    "name": "Alice Johnson",
    "ssn": "123-45-6789",
    "applications": [
      {
        "application_id": "a3c6bbbc-6b33-4e91-97a5-7e38d1cfb001",
        "documents": [
          "/Print.pdf",
          "/medical-records.pdf",
          "/insurance-claim.pdf"
        ],
        "claude_confidence_level": 0.92,
        "claude_summary": "Alice Johnson suffers from chronic back pain and cannot perform her previous job. Extensive medical records support her claim.",
        "claude_recommendation": "approve"
      },
      {
        "application_id": "b29d0043-ddce-4fc5-a34e-1af806cdca22",
        "documents": [
          "/Print.pdf", 
          "/doctor-notes.pdf"
        ],
        "claude_confidence_level": 0.67,
        "claude_summary": "Alice experienced an injury last year, but documentation is limited. Further clarity on long-term disability is needed.",
        "claude_recommendation": "further_review"
      },
      {
        "application_id": "0bb4b488-8037-49e1-8141-86fc501b7f98",
        "documents": [
          "/Print.pdf",
          "/medical-records.pdf"
        ],
        "claude_confidence_level": 0.80,
        "claude_summary": "Recent surgery has left Alice unable to work, according to her doctors; prognosis pending for recovery.",
        "claude_recommendation": "further_review"
      },
      {
        "application_id": "12bd59a4-64ca-4371-95ba-4f4ec2a2cdee",
        "documents": [
          "/Print.pdf",
          "/Print.pdf",
          "/Print.pdf"
        ],
        "claude_confidence_level": 0.97,
        "claude_summary": "Strong evidence supporting Alice's ongoing severe condition and lack of earning capacity.",
        "claude_recommendation": "approve"
      }
    ]
  },
  {
    "name": "Marcus Perez",
    "ssn": "987-65-4321",
    "applications": [
      {
        "application_id": "dc114cee-cf5b-4eb7-bf91-1fea070c5c83",
        "documents": [
          "/Print.pdf",
          "/medical-records.pdf"
        ],
        "claude_confidence_level": 0.89,
        "claude_summary": "Marcus Perez is unable to work due to multiple sclerosis as verified by specialists.",
        "claude_recommendation": "approve"
      },
      {
        "application_id": "003aa949-c733-4bbe-b046-470d431a5e5b",
        "documents": [
          "/Print.pdf",
          "/Print.pdf",
          "/Print.pdf",
          "/Print.pdf"
        ],
        "claude_confidence_level": 0.73,
        "claude_summary": "Marcus has partial supporting documents for chronic fatigue syndrome; income impact is significant.",
        "claude_recommendation": "further_review"
      },
      {
        "application_id": "1b14ba82-a208-4f6e-8569-db13e141ebae",
        "documents": [
          "/Print.pdf",
          "/medical-records.pdf"
        ],
        "claude_confidence_level": 0.96,
        "claude_summary": "Additional updated records from Marcus's primary physician confirm the original diagnosis.",
        "claude_recommendation": "approve"
      },
      {
        "application_id": "c6e5842a-6a45-40ac-a7b1-817813059d90",
        "documents": [
          "/Print.pdf",
          "/Print.pdf",
          "/Print.pdf"
        ],
        "claude_confidence_level": 0.51,
        "claude_summary": "Evidence for Marcus's claim was inconclusive; more documentation requested.",
        "claude_recommendation": "further_review"
      },
      {
        "application_id": "991e42c4-eec8-4c6e-a7ee-ac03edbf2b11",
        "documents": [
          "/Print.pdf",
          "/medical-records.pdf"
        ],
        "claude_confidence_level": 0.79,
        "claude_summary": "Recent appeal for Marcus with updated MRI results; committee review suggested.",
        "claude_recommendation": "further_review"
      }
    ]
  }
];*/

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Get all applications for admin dashboard
  async getAllApplications(): Promise<Application[]> {
    // This function is deprecated - admin dashboard uses direct fetch now
    return [];
  },

  // Get specific application by ID
  async getApplicationById(applicationId: string): Promise<Application | null> {
    try {
      const response = await fetch(`${config.apiUrl}/api/application/${applicationId}`);
      if (!response.ok) {
        console.error('Failed to fetch application:', response.statusText);
        return null;
      }
      const result = await response.json();
      
      if (result.data.success && result.data.application) {
        const app = result.data.application;
        
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
      console.error('Error fetching application:', error);
      return null; // Only return backend data, no mock fallback
    }
  },

  async approveApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${config.apiUrl}/api/application/approve/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to approve application:', errorText);
        return { success: false, message: 'Failed to approve application' };
      }

      const result = await response.json();
      const data = result?.data;

      if (data?.success) {
        return { success: true, message: `✅ Application ${applicationId} approved successfully.` };
      } else {
        return { success: false, message: data?.error || 'Approval failed' };
      }
    } catch (error) {
      console.error('⚠️ Error approving application:', error);
      return { success: false, message: 'Network or server error' };
    }
  },

  // Deny application
  async denyApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${config.apiUrl}/api/application/deny/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to deny application:', errorText);
        return { success: false, message: 'Failed to deny application' };
      }

      const result = await response.json();
      const data = result?.data;

      if (data?.success) {
        return { success: true, message: `🚫 Application ${applicationId} denied successfully.` };
      } else {
        return { success: false, message: data?.error || 'Denial failed' };
      }
    } catch (error) {
      console.error('⚠️ Error denying application:', error);
      return { success: false, message: 'Network or server error' };
    }
  },

};
