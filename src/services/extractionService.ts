/**
 * Product Extraction Service
 *
 * Handles SSE streaming for product extraction from URLs.
 * Connects to backend /api/extraction/stream/:groupId endpoint.
 */

import { API_BASE_URL } from '@/lib/apiConfig';
import { apiClient } from './apiClient';

export interface ExtractionProgress {
  jobId: string;
  status: 'started' | 'in_progress' | 'complete' | 'error';
  message: string;
  url?: string;
}

/**
 * Map backend status values to UI-expected values
 */
function mapStatus(status: string): ExtractionProgress['status'] {
  switch (status) {
    case 'running':
    case 'in_progress':
      return 'in_progress';
    case 'pending':
    case 'started':
      return 'started';
    case 'completed':
    case 'complete':
      return 'complete';
    case 'failed':
    case 'error':
      return 'error';
    default:
      return 'started';
  }
}

export interface ExtractionResult {
  success: boolean;
  name?: string;
  price?: number | null;
  imageUrl?: string;
  currency?: string;
  error?: string;
  url?: string;
  jobId?: string;
}

export interface ExtractionGroup {
  groupId: string;
  urls: string[];
  jobs: Map<string, ExtractionProgress>;
  results: ExtractionResult[];
  isComplete: boolean;
  isCreatingGoals: boolean;
}

export type ExtractionCallback = (progress: ExtractionProgress) => void;
export type ExtractionCompleteCallback = (results: ExtractionResult[]) => void;
export type ExtractionErrorCallback = (error: string) => void;

/**
 * Connect to SSE stream for extraction progress updates
 */
export function connectToExtractionStream(
  groupId: string,
  token: string | null,
  onProgress: ExtractionCallback,
  onComplete: ExtractionCompleteCallback,
  onError: ExtractionErrorCallback,
): () => void {
  // Include token as query param for SSE auth (EventSource doesn't support headers)
  // Note: API_BASE_URL doesn't include /api prefix, so we add it here
  const url = `${API_BASE_URL}/api/extraction/stream/${groupId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

  const eventSource = new EventSource(url, { withCredentials: true });

  const results: ExtractionResult[] = [];

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.status === 'complete' && data.result) {
        // Job completed with result
        results.push({
          ...data.result,
          url: data.url,
          jobId: data.jobId,
        });
        onComplete(results);
      } else if (data.type === 'extraction:complete') {
        // Final completion event
        if (data.result) {
          results.push({
            ...data.result,
            url: data.url,
            jobId: data.jobId,
          });
        }
        onComplete(results);
      } else {
        // Progress update - map backend status to UI-expected values
        onProgress({
          jobId: data.jobId,
          status: mapStatus(data.status),
          message: data.message,
          url: data.url,
        });
      }
    } catch (e) {
      console.error('Failed to parse SSE data:', e);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    onError('Connection to extraction stream lost');
    eventSource.close();
  };

  // Return plain cleanup function (not an object) so callers can invoke directly
  return () => {
    eventSource.close();
  };
}

/**
 * Trigger goal creation from completed extractions
 */
export async function createGoalsFromExtraction(
  groupId: string,
  groupName: string,
): Promise<{ success: boolean; groupGoalId?: string; error?: string }> {
  try {
    const data = await apiClient.post<{ id: string }>('/extraction/create-goals', {
      groupId,
      groupName,
    });
    return { success: true, groupGoalId: data.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Get extraction job status
 */
export async function getExtractionJobStatus(jobId: string): Promise<ExtractionProgress | null> {
  try {
    return await apiClient.get<ExtractionProgress>(`/extraction/job/${jobId}`);
  } catch {
    return null;
  }
}

/**
 * Get all jobs in an extraction group
 */
export async function getExtractionGroupJobs(groupId: string): Promise<any[]> {
  try {
    const data = await apiClient.get<{ groupId: string; jobs: any[] }>(`/extraction/jobs/${groupId}`);
    console.log('[extractionService] getExtractionGroupJobs response:', data);
    return data.jobs || [];
  } catch (error) {
    console.error('[extractionService] getExtractionGroupJobs failed:', error);
    return [];
  }
}

/**
 * Check if an extraction group is complete
 */
export async function isExtractionComplete(groupId: string): Promise<boolean> {
  try {
    const data = await apiClient.get<{ complete: boolean }>(`/extraction/complete/${groupId}`);
    return data.complete === true;
  } catch {
    return false;
  }
}

export const extractionService = {
  connectToExtractionStream,
  createGoalsFromExtraction,
  getExtractionJobStatus,
  getExtractionGroupJobs,
  isExtractionComplete,
};
