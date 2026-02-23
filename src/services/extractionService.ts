/**
 * Product Extraction Service
 *
 * Handles SSE streaming for product extraction from URLs.
 * Connects to backend /api/extraction/stream/:groupId endpoint.
 */

import { API_BASE_URL } from '@/lib/apiConfig';

export interface ExtractionProgress {
  jobId: string;
  status: 'started' | 'in_progress' | 'complete' | 'error';
  message: string;
  url?: string;
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
): { disconnect: () => void } {
  // Include token as query param for SSE auth (EventSource doesn't support headers)
  const url = `${API_BASE_URL}/extraction/stream/${groupId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

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
        // Progress update
        onProgress({
          jobId: data.jobId,
          status: data.status,
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

  return {
    disconnect: () => {
      eventSource.close();
    },
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
    const response = await apiClient.post('/extraction/create-goals', {
      groupId,
      groupName,
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const data = await response.json();
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
    const response = await apiClient.get(`/extraction/job/${jobId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get all jobs in an extraction group
 */
export async function getExtractionGroupJobs(groupId: string): Promise<ExtractionProgress[]> {
  try {
    const response = await apiClient.get(`/extraction/jobs/${groupId}`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

/**
 * Check if an extraction group is complete
 */
export async function isExtractionComplete(groupId: string): Promise<boolean> {
  try {
    const response = await apiClient.get(`/extraction/complete/${groupId}`);
    if (!response.ok) return false;
    const data = await response.json();
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
