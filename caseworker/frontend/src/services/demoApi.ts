import { config } from '../config/env';
import type { ApplicationDetail } from './api';

// Re-export types for convenience
export type { ApplicationDetail };

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/**
 * Demo API service for caseworker frontend
 * Simplified - no session management needed
 */
class DemoApiService {
  private async fetchWithDemoHeaders(
    url: string,
    getDemoHeaders: () => Record<string, string>,
    options: RequestInit = {}
  ) {
    const demoHeaders = getDemoHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...demoHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  async getApplicationDetail(
    applicationId: string,
    getDemoHeaders: () => Record<string, string>
  ): Promise<ApplicationDetail> {
    const response: ApiResponse<ApplicationDetail> = await this.fetchWithDemoHeaders(
      `${config.apiUrl}/api/demo/applications/${applicationId}`,
      getDemoHeaders
    );
    return response.data;
  }

  async updateReviewStatus(
    applicationId: string,
    reviewStatus: 'unopened' | 'in_progress' | 'completed',
    getDemoHeaders: () => Record<string, string>
  ): Promise<any> {
    const response: ApiResponse<any> = await this.fetchWithDemoHeaders(
      `${config.apiUrl}/api/demo/applications/${applicationId}/review-status`,
      getDemoHeaders,
      {
        method: 'PATCH',
        body: JSON.stringify({ review_status: reviewStatus }),
      }
    );
    return response.data;
  }

  async updateReviewerNotes(
    applicationId: string,
    reviewerNotes: string,
    getDemoHeaders: () => Record<string, string>
  ): Promise<any> {
    const response: ApiResponse<any> = await this.fetchWithDemoHeaders(
      `${config.apiUrl}/api/demo/applications/${applicationId}/reviewer-notes`,
      getDemoHeaders,
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
    getDemoHeaders: () => Record<string, string>,
    recommendationNotes?: string
  ): Promise<any> {
    const response: ApiResponse<any> = await this.fetchWithDemoHeaders(
      `${config.apiUrl}/api/demo/applications/${applicationId}/recommendation`,
      getDemoHeaders,
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

export const demoApiService = new DemoApiService();
