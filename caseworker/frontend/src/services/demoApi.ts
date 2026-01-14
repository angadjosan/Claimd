import { config } from '../config/env';
import type { ApplicationListItem, ApplicationDetail } from './api';

// Re-export types for convenience
export type { ApplicationListItem, ApplicationDetail };

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/**
 * Demo API service for caseworker frontend
 * Wraps existing API functions but adds demo mode headers and routes to demo endpoints
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
      if (response.status === 401) {
        // Session expired, redirect to start new demo
        window.location.href = '/demo/caseworker/dashboard?session_expired=true';
      }
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
  }

  async getApplications(getDemoHeaders: () => Record<string, string>): Promise<ApplicationListItem[]> {
    const response: ApiResponse<ApplicationListItem[]> = await this.fetchWithDemoHeaders(
      `${config.apiUrl}/api/demo/dashboard/applications`,
      getDemoHeaders
    );
    return response.data;
  }

  async getApplicationDetail(
    applicationId: string,
    getDemoHeaders: () => Record<string, string>
  ): Promise<ApplicationDetail> {
    const response: ApiResponse<ApplicationDetail> = await this.fetchWithDemoHeaders(
      `${config.apiUrl}/api/demo/dashboard/applications/${applicationId}`,
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
      `${config.apiUrl}/api/demo/dashboard/applications/${applicationId}/review-status`,
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
      `${config.apiUrl}/api/demo/dashboard/applications/${applicationId}/reviewer-notes`,
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
      `${config.apiUrl}/api/demo/dashboard/applications/${applicationId}/recommendation`,
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
