import { useState, useEffect, useCallback, useRef } from 'react';
import {
  connectToExtractionStream,
  createGoalsFromExtraction,
  getExtractionGroupJobs,
  ExtractionProgress,
  ExtractionResult,
} from '@/services/extractionService';

export interface ExtractionState {
  groupId: string | null;
  urls: string[];
  progress: Map<string, ExtractionProgress>;
  results: ExtractionResult[];
  isComplete: boolean;
  wasAlreadyComplete: boolean; // true when jobs were done before we connected (historical reload)
  isCreatingGoals: boolean;
  error: string | null;
}

const initialState: ExtractionState = {
  groupId: null,
  urls: [],
  progress: new Map(),
  results: [],
  isComplete: false,
  wasAlreadyComplete: false,
  isCreatingGoals: false,
  error: null,
};

export function useExtraction() {
  const [state, setState] = useState<ExtractionState>(initialState);
  const disconnectRef = useRef<(() => void) | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCompleteRef = useRef(false);
  const tokenRef = useRef<string | null>(localStorage.getItem('auth_token'));

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Start extraction for a group of URLs
  const startExtraction = useCallback(async (groupId: string, urls: string[]) => {
    if (!groupId) return;
    const safeUrls = Array.isArray(urls) ? urls : [];

    // Disconnect any existing stream and stop polling
    if (disconnectRef.current) {
      disconnectRef.current();
    }
    stopPolling();
    isCompleteRef.current = false;

    setState({
      groupId,
      urls: safeUrls,
      progress: new Map(),
      results: [],
      isComplete: false,
      wasAlreadyComplete: false,
      isCreatingGoals: false,
      error: null,
    });

    // First, check if jobs already exist and their status
    try {
      const jobs = await getExtractionGroupJobs(groupId);

      if (jobs && jobs.length > 0) {
        // Check if all jobs are complete (completed or failed)
        const allComplete = jobs.every(
          (job) => job.status === 'completed' || job.status === 'failed'
        );

        if (allComplete) {
          // Jobs are already done - show results immediately (historical reload)
          const results: ExtractionResult[] = jobs.map((job) => ({
            success: job.status === 'completed',
            jobId: job.id,
            url: job.url,
            name: job.result?.name,
            price: job.result?.price,
            imageUrl: job.result?.imageUrl,
            currency: job.result?.currency,
            error: job.status === 'failed' ? job.error || 'Extraction failed' : undefined,
          }));

          isCompleteRef.current = true;
          setState((prev) => ({
            ...prev,
            results,
            isComplete: true,
            wasAlreadyComplete: true, // Don't re-fire follow-up on historical reload
          }));
          return; // Don't connect to SSE - we already have results
        }

        // Some jobs are still pending/running - show progress and connect to SSE
        // Map backend status values to UI-expected values
        const mapStatus = (status: string): ExtractionProgress['status'] => {
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
        };

        const progressMap = new Map<string, ExtractionProgress>();
        for (const job of jobs) {
          if (job.status === 'running' || job.status === 'pending' || job.status === 'in_progress' || job.status === 'started') {
            progressMap.set(job.id, {
              jobId: job.id,
              status: mapStatus(job.status),
              message: job.message || 'Processing...',
              url: job.url,
            });
          }
        }
        if (progressMap.size > 0) {
          setState((prev) => ({ ...prev, progress: progressMap }));
        }
      }
    } catch (err) {
      console.error('[useExtraction] Failed to fetch extraction job status:', err);
      // Continue with SSE connection anyway
    }

    // Connect to SSE stream for live updates
    disconnectRef.current = connectToExtractionStream(
      groupId,
      tokenRef.current,
      // onProgress
      (progress) => {
        setState((prev) => {
          const newProgress = new Map(prev.progress);
          newProgress.set(progress.jobId, progress);
          return { ...prev, progress: newProgress };
        });
      },
      // onComplete
      (results) => {
        isCompleteRef.current = true;
        stopPolling();
        setState((prev) => {
          const newResults = [...prev.results];
          for (const r of results) {
            if (!newResults.find((existing) => existing.jobId === r.jobId)) {
              newResults.push(r);
            }
          }
          // Mark complete when all URLs accounted for, or when stream ends with any results
          const isComplete = newResults.length >= prev.urls.length || newResults.length > 0;
          return { ...prev, results: newResults, isComplete };
        });
      },
      // onError
      (error) => {
        setState((prev) => ({ ...prev, error }));
      }
    );

    // Polling fallback — catches completions that SSE misses (late subscriber, missed events)
    pollRef.current = setInterval(async () => {
      if (isCompleteRef.current) {
        stopPolling();
        return;
      }

      try {
        const jobs = await getExtractionGroupJobs(groupId);
        if (!jobs || jobs.length === 0) return;

        const allComplete = jobs.every(
          (job) => job.status === 'completed' || job.status === 'failed'
        );

        if (allComplete) {
          const results: ExtractionResult[] = jobs.map((job) => ({
            success: job.status === 'completed',
            jobId: job.id,
            url: job.url,
            name: job.result?.name,
            price: job.result?.price,
            imageUrl: job.result?.imageUrl,
            currency: job.result?.currency,
            error: job.status === 'failed' ? job.error || 'Extraction failed' : undefined,
          }));

          isCompleteRef.current = true;
          stopPolling();

          setState((prev) => {
            const newResults = [...prev.results];
            for (const r of results) {
              if (!newResults.find((existing) => existing.jobId === r.jobId)) {
                newResults.push(r);
              }
            }
            return { ...prev, results: newResults, isComplete: true };
          });
        } else {
          // Update progress for in-flight jobs
          // Map backend status values to UI-expected values
          const mapStatus = (status: string): ExtractionProgress['status'] => {
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
          };

          const progressMap = new Map<string, ExtractionProgress>();
          for (const job of jobs) {
            if (job.status === 'running' || job.status === 'pending' || job.status === 'in_progress' || job.status === 'started') {
              progressMap.set(job.id, {
                jobId: job.id,
                status: mapStatus(job.status),
                message: job.message || 'Processing...',
                url: job.url,
              });
            }
          }
          if (progressMap.size > 0) {
            setState((prev) => ({ ...prev, progress: progressMap }));
          }
        }
      } catch {
        // Ignore poll errors - SSE is still the primary mechanism
      }
    }, 2500);
  }, [stopPolling]);

  // Create goals from extraction results
  const createGoals = useCallback(async (groupName: string) => {
    if (!state.groupId) return;

    setState((prev) => ({ ...prev, isCreatingGoals: true }));

    try {
      const result = await createGoalsFromExtraction(state.groupId, groupName);
      if (result.success) {
        setState((prev) => ({ ...prev, isCreatingGoals: false }));
        return result.groupGoalId;
      } else {
        setState((prev) => ({
          ...prev,
          isCreatingGoals: false,
          error: result.error || 'Failed to create goals',
        }));
        return null;
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isCreatingGoals: false,
        error: String(error),
      }));
      return null;
    }
  }, [state.groupId]);

  // Dismiss extraction
  const dismiss = useCallback(() => {
    if (disconnectRef.current) {
      disconnectRef.current();
      disconnectRef.current = null;
    }
    stopPolling();
    isCompleteRef.current = false;
    setState(initialState);
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (disconnectRef.current) {
        disconnectRef.current();
      }
      stopPolling();
    };
  }, [stopPolling]);

  return {
    ...state,
    startExtraction,
    createGoals,
    dismiss,
    isExtracting: state.groupId !== null && !state.isComplete,
  };
}

// Helper to format extraction results for AI prompt
export function formatExtractionResultsForAI(results: ExtractionResult[]): string {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  // Use JSON so the AI receives structured data without triggering URL-extraction heuristics
  const productData = successful.map((r) => ({
    name: r.name || 'Unknown product',
    price: r.price ?? null,
    imageUrl: r.imageUrl || null,
    sourceUrl: r.url, // named "sourceUrl" not "url" to avoid re-extraction triggers
  }));

  let text = `EXTRACTION_RESULTS (already scraped — do not re-extract):\n`;
  text += `\`\`\`json\n${JSON.stringify(productData, null, 2)}\n\`\`\`\n`;

  if (failed.length > 0) {
    text += `\n${failed.length} product(s) failed to extract and were skipped.\n`;
  }

  text += `\nShould I create these as individual item goals or as a group goal?`;

  return text;
}
