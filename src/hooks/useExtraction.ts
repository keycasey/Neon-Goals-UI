import { useState, useEffect, useCallback, useRef } from 'react';
import {
  connectToExtractionStream,
  createGoalsFromExtraction,
  ExtractionProgress,
  ExtractionResult,
} from '@/services/extractionService';

export interface ExtractionState {
  groupId: string | null;
  urls: string[];
  progress: Map<string, ExtractionProgress>;
  results: ExtractionResult[];
  isComplete: boolean;
  isCreatingGoals: boolean;
  error: string | null;
}

const initialState: ExtractionState = {
  groupId: null,
  urls: [],
  progress: new Map(),
  results: [],
  isComplete: false,
  isCreatingGoals: false,
  error: null,
};

export function useExtraction() {
  const [state, setState] = useState<ExtractionState>(initialState);
  const disconnectRef = useRef<(() => void) | null>(null);
  const tokenRef = useRef<string | null>(localStorage.getItem('auth_token'));

  // Start extraction for a group of URLs
  const startExtraction = useCallback((groupId: string, urls: string[]) => {
    // Disconnect any existing stream
    if (disconnectRef.current) {
      disconnectRef.current();
    }

    setState({
      groupId,
      urls,
      progress: new Map(),
      results: [],
      isComplete: false,
      isCreatingGoals: false,
      error: null,
    });

    // Connect to SSE stream
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
        setState((prev) => {
          const newResults = [...prev.results];
          // Add any new results
          for (const r of results) {
            if (!newResults.find((existing) => existing.jobId === r.jobId)) {
              newResults.push(r);
            }
          }
          return {
            ...prev,
            results: newResults,
            isComplete: newResults.length === prev.urls.length,
          };
        });
      },
      // onError
      (error) => {
        setState((prev) => ({ ...prev, error }));
      }
    );
  }, []);

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
    setState(initialState);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (disconnectRef.current) {
        disconnectRef.current();
      }
    };
  }, []);

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

  let text = `Product extraction complete!\n\n`;
  text += `**Successfully extracted ${successful.length} products:**\n`;

  for (const r of successful) {
    text += `- **${r.name}** - $${r.price || 'N/A'}\n`;
    text += `  Image: ${r.imageUrl}\n`;
    text += `  URL: ${r.url}\n`;
  }

  if (failed.length > 0) {
    text += `\n**Failed to extract ${failed.length} products:**\n`;
    for (const r of failed) {
      text += `- ${r.url}: ${r.error}\n`;
    }
  }

  text += `\nShould I create these as individual item goals or as a group goal?`;

  return text;
}
