import { config } from '../config/env';
import { authService } from './auth';

// Types based on backend API responses
export interface ApplicationListItem {
  assignment_id: string;
  application_id: string;
  applicant: {
    id: string;
    name: string;
    email: string;
  };
  application_status: string;
  review_status: 'unopened' | 'in_progress' | 'completed';
  priority: number;
  due_date: string | null;
  assigned_at: string;
  assigned_by: string | null;
  first_opened_at: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  recommendation: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  ai_recommendation: string | null;
  ai_confidence: number | null;
  ai_summary: string | null;
}

export interface ApplicationDetail {
  applicant: {
    id: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone_number: string | null;
  };
  application: {
    id: string;
    status: string;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    ai_recommendation: string | null;
    ai_confidence: number | null;
    ai_summary: string | null;
    ai_phases: any | null;
    ai_missing_information: string[];
    ai_suggested_actions: string[];
    birthdate: string | null;
    date_condition_began_affecting_work: string | null;
    earnings_history: any[];
    employment_history: any[];
    conditions: any[];
    functional_limitations: any | null;
    healthcare_providers: any[];
    medical_tests: any[];
    evidence_documents: any[];
    education: any[];
    job_training: any[];
  };
  assignment: {
    id: string;
    review_status: 'unopened' | 'in_progress' | 'completed';
    recommendation: string | null;
    reviewer_notes: string | null;
    recommendation_notes: string | null;
    priority: number;
    due_date: string | null;
    assigned_by: string | null;
    assigned_by_user: {
      id: string;
      name: string;
      email: string;
    } | null;
    assigned_at: string;
    first_opened_at: string;
    last_accessed_at: string;
    completed_at: string | null;
  };
  ai_reasoning: {
    overall_recommendation: string | null;
    confidence_score: number | null;
    summary: string | null;
    phases: any | null;
    missing_information: string[];
    suggested_actions: string[];
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const authHeader = await authService.getAuthHeader();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  async getApplications(): Promise<ApplicationListItem[]> {
    const response: ApiResponse<ApplicationListItem[]> = await this.fetchWithAuth(
      `${config.apiUrl}/api/private/dashboard/applications`
    );
    return response.data;
  }

  async getApplicationDetail(applicationId: string): Promise<ApplicationDetail> {
    const response: ApiResponse<ApplicationDetail> = await this.fetchWithAuth(
      `${config.apiUrl}/api/private/dashboard/applications/${applicationId}`
    );
    return response.data;
  }

  async updateReviewStatus(applicationId: string, reviewStatus: 'unopened' | 'in_progress' | 'completed'): Promise<any> {
    const response: ApiResponse<any> = await this.fetchWithAuth(
      `${config.apiUrl}/api/private/dashboard/applications/${applicationId}/review-status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ review_status: reviewStatus }),
      }
    );
    return response.data;
  }

  async updateReviewerNotes(applicationId: string, reviewerNotes: string): Promise<any> {
    const response: ApiResponse<any> = await this.fetchWithAuth(
      `${config.apiUrl}/api/private/dashboard/applications/${applicationId}/reviewer-notes`,
      {
        method: 'PATCH',
        body: JSON.stringify({ reviewer_notes: reviewerNotes }),
      }
    );
    return response.data;
  }

  async submitRecommendation(
    applicationId: string,
    recommendation: 'approve' | 'deny' | 'request_more_info' | 'escalate' | 'needs_medical_review',
    recommendationNotes?: string
  ): Promise<any> {
    const response: ApiResponse<any> = await this.fetchWithAuth(
      `${config.apiUrl}/api/private/dashboard/applications/${applicationId}/recommendation`,
      {
        method: 'POST',
        body: JSON.stringify({
          recommendation,
          recommendation_notes: recommendationNotes || null,
        }),
      }
    );
    return response.data;
  }
}

export const apiService = new ApiService();

