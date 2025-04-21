import { OverrideReview, User, AuditLogEntry } from '../types';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.message || 'An error occurred',
      response.status
    );
  }
  return response.json();
};

interface VersionComparisonSummaryRequest {
  version1: string;
  version2: string;
  accuracyDeltas: Record<string, number>;
  thresholdDeltas: Record<string, number>;
  reviewImpactDelta: number;
}

interface VersionComparisonSummaryResponse {
  summary: string;
}

interface EmailVersionComparisonRequest extends VersionComparisonSummaryRequest {
  summary: string;
  recipientEmail: string;
}

export const api = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const response = await fetch('/api/users');
    return handleResponse<User[]>(response);
  },

  // Reviews
  getReviews: async (): Promise<OverrideReview[]> => {
    const response = await fetch('/api/reviews');
    return handleResponse<OverrideReview[]>(response);
  },

  getReview: async (id: string): Promise<OverrideReview> => {
    const response = await fetch(`/api/reviews/${id}`);
    return handleResponse<OverrideReview>(response);
  },

  getReviewAuditLogs: async (
    id: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ logs: AuditLogEntry[]; total: number }> => {
    const response = await fetch(
      `/api/reviews/${id}/audit?page=${page}&pageSize=${pageSize}`
    );
    return handleResponse<{ logs: AuditLogEntry[]; total: number }>(response);
  },

  updateReviewStatus: async (
    id: string,
    status: 'approved' | 'rejected',
    notes: string
  ): Promise<OverrideReview> => {
    const response = await fetch(`/api/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    return handleResponse<OverrideReview>(response);
  },

  bulkUpdateReviewStatus: async (
    ids: string[],
    status: 'approved' | 'rejected',
    notes: string
  ): Promise<OverrideReview[]> => {
    const response = await fetch('/api/reviews/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status, notes }),
    });
    return handleResponse<OverrideReview[]>(response);
  },

  // Model Versions
  getModelVersions: async (): Promise<string[]> => {
    const response = await fetch('/api/models/versions');
    return handleResponse<string[]>(response);
  },

  getModelVersionDetails: async (version: string): Promise<{
    changes: string[];
    confidenceThresholds: Record<string, number>;
    releaseNotes: string;
  }> => {
    const response = await fetch(`/api/models/versions/${version}`);
    return handleResponse<{
      changes: string[];
      confidenceThresholds: Record<string, number>;
      releaseNotes: string;
    }>(response);
  },

  // Reviewer Analytics
  getReviewerAnalytics: async (reviewerId?: number): Promise<{
    approvalRate: number;
    averageResponseTime: number;
    totalReviews: number;
    escalatedReviews: number;
    byModelVersion: Record<string, {
      approvalRate: number;
      totalReviews: number;
    }>;
  }> => {
    const url = reviewerId 
      ? `/api/analytics/reviewers/${reviewerId}`
      : '/api/analytics/reviewers';
    const response = await fetch(url);
    return handleResponse<{
      approvalRate: number;
      averageResponseTime: number;
      totalReviews: number;
      escalatedReviews: number;
      byModelVersion: Record<string, {
        approvalRate: number;
        totalReviews: number;
      }>;
    }>(response);
  },

  // Search
  searchReviews: async (query: string): Promise<OverrideReview[]> => {
    const response = await fetch(`/api/reviews/search?q=${encodeURIComponent(query)}`);
    return handleResponse<OverrideReview[]>(response);
  },

  async generateVersionComparisonSummary(
    data: VersionComparisonSummaryRequest
  ): Promise<string> {
    const response = await fetch('/api/models/compare/summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to generate summary');
    }

    const result = await response.json() as VersionComparisonSummaryResponse;
    return result.summary;
  },

  async emailVersionComparison(
    data: EmailVersionComparisonRequest
  ): Promise<void> {
    const response = await fetch('/api/models/compare/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  },
}; 