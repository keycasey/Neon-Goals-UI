import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Loader2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { goalsService } from '@/services/goalsService';
import { useAppStore } from '@/store/useAppStore';
import type { ScrapeJob, ScrapeJobStatus } from '@/types/goals';
import type { ItemGoal } from '@/types/goals';

interface ScrapeStatusCardProps {
  goal: ItemGoal;
  onFiltersUpdate?: (filters: Record<string, any>) => void;
  onRefresh?: () => Promise<void>;
  onScrapeComplete?: () => Promise<void>;
}

const statusConfig: Record<ScrapeJobStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: {
    icon: Clock,
    color: 'text-warning',
    label: 'Queued',
  },
  running: {
    icon: Loader2,
    color: 'text-primary animate-spin',
    label: 'Searching...',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-success',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-destructive',
    label: 'Failed',
  },
};

const POLL_INTERVAL = 3000; // Poll every 3 seconds

export const ScrapeStatusCard: React.FC<ScrapeStatusCardProps> = ({ goal, onFiltersUpdate, onRefresh, onScrapeComplete }) => {
  const { isChatMinimized, toggleChatMinimized, sendGoalMessage, triggerChatPulse } = useAppStore();
  const [scrapeJobs, setScrapeJobs] = useState<ScrapeJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [filtersJson, setFiltersJson] = useState(JSON.stringify(goal.searchFilters || {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previousJobStatus, setPreviousJobStatus] = useState<ScrapeJobStatus | null>(null);
  const [hasRefreshedAfterComplete, setHasRefreshedAfterComplete] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldStartPollingRef = useRef(false);

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);

    // Clear old jobs immediately to prevent showing stale completed status
    setScrapeJobs([]);
    setHasRefreshedAfterComplete(false);
    setPreviousJobStatus(null);

    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch scrape jobs
  const fetchScrapeJobs = async () => {
    try {
      const jobs = await goalsService.getScrapeJobs(goal.id);
      const jobsArray = Array.isArray(jobs) ? jobs : [jobs].filter(Boolean);
      setScrapeJobs(jobsArray);

      const latestJob = jobsArray.length > 0 ? jobsArray[0] : null;
      const currentStatus = latestJob?.status || (goal.statusBadge === 'pending_search' || goal.statusBadge === 'pending-search' ? 'pending' : 'completed');

      // Detect transition from active (pending/running) to completed
      const wasActive = previousJobStatus === 'pending' || previousJobStatus === 'running';
      const isNowComplete = currentStatus === 'completed' || currentStatus === 'failed';

      if (wasActive && isNowComplete && !hasRefreshedAfterComplete && onScrapeComplete) {
        console.log('[ScrapeStatusCard] Scrape completed, refreshing goal data...');
        setHasRefreshedAfterComplete(true);
        await onScrapeComplete();
      }

      setPreviousJobStatus(currentStatus);

      // Check if we should continue polling - only if there are active (pending/running) jobs
      const hasActiveJobs = jobsArray.some(
        (job: ScrapeJob) => job.status === 'pending' || job.status === 'running'
      );

      // Stop polling if no active jobs exist, regardless of goal status
      if (!hasActiveJobs && pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    } catch (error) {
      console.error('[ScrapeStatusCard] Failed to fetch scrape jobs:', error);
      // Don't clear interval on error, keep trying
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling when goal is in searching state
  useEffect(() => {
    if (goal.statusBadge === 'pending_search' || goal.statusBadge === 'pending-search') {
      shouldStartPollingRef.current = true;
      setIsLoading(true);

      // Initial fetch
      fetchScrapeJobs().then(() => {
        // Only start interval if:
        // 1. We're still supposed to be polling (status hasn't changed)
        // 2. The interval hasn't been started yet
        // 3. There are active jobs (interval would have been cleared if none)
        if (shouldStartPollingRef.current && !pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(fetchScrapeJobs, POLL_INTERVAL);
        }
      });

      return () => {
        shouldStartPollingRef.current = false;
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    } else {
      // Clear interval if not in searching state
      shouldStartPollingRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setScrapeJobs([]);
    }
  }, [goal.id, goal.statusBadge]);

  // Handle save filters
  const handleSaveFilters = async () => {
    try {
      const parsed = JSON.parse(filtersJson);
      setJsonError(null);

      await goalsService.updateSearchFilters(goal.id, parsed);

      // Update local goal data
      if (onFiltersUpdate) {
        onFiltersUpdate(parsed);
      }

      setIsEditing(false);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  // Get the most recent job
  const latestJob = scrapeJobs.length > 0 ? scrapeJobs[0] : null;
  const status = latestJob?.status || (goal.statusBadge === 'pending_search' || goal.statusBadge === 'pending-search' ? 'pending' : 'completed');
  const StatusIcon = statusConfig[status]?.icon || Clock;
  const statusColor = statusConfig[status]?.color || 'text-warning';
  const statusLabel = statusConfig[status]?.label || 'Unknown';

  // Disable refresh when there's an active job or currently refreshing
  const hasActiveJob = status === 'pending' || status === 'running';
  const isRefreshDisabled = isRefreshing || hasActiveJob;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-muted/30", statusColor)}>
            <StatusIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">
              Search Status
            </h3>
            <p className="text-sm text-muted-foreground">
              {statusLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshDisabled}
              className={cn(
                "p-2 rounded-lg transition-all",
                isRefreshDisabled
                  ? "bg-muted/20 text-muted-foreground cursor-not-allowed"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              aria-label="Refresh search"
            >
              <RefreshCw className={cn("w-4 h-4", hasActiveJob && "animate-spin")} />
            </button>
          )}

          {/* Edit Filters Button */}
          <button
            onClick={() => {
              // If chat is minimized, open it
              if (isChatMinimized) {
                toggleChatMinimized();
              }
              // Send a message to the chat as the user
              sendGoalMessage(goal.id, 'I want to update my search.');
              // Trigger pulse animation to draw attention
              triggerChatPulse();
            }}
            className="p-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="Edit search filters via chat"
          >
            <Pencil className="w-4 h-4" />
          </button>

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search Filters JSON Editor */}
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Search Filters</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setJsonError(null);
                      }}
                      className="px-3 py-1 text-sm rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveFilters}
                      disabled={!!jsonError}
                      className={cn(
                        "px-3 py-1 text-sm rounded-lg transition-all",
                        jsonError
                          ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                          : "bg-primary text-primary-foreground hover:scale-105"
                      )}
                    >
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  value={filtersJson}
                  onChange={(e) => {
                    setFiltersJson(e.target.value);
                    try {
                      JSON.parse(e.target.value);
                      setJsonError(null);
                    } catch {
                      setJsonError('Invalid JSON');
                    }
                  }}
                  className={cn(
                    "w-full h-40 p-3 rounded-lg bg-muted/30 border text-sm font-mono",
                    jsonError
                      ? "border-destructive/50 text-destructive"
                      : "border-border/50 text-foreground focus:border-primary/50"
                  )}
                  placeholder="Enter search filters as JSON..."
                />
                {jsonError && (
                  <p className="text-xs text-destructive">{jsonError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Job Details */}
                {latestJob && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Job ID</span>
                      <span className="text-foreground font-mono text-xs">
                        {typeof latestJob.id === 'string' ? latestJob.id.slice(0, 8) + '...' : 'N/A'}
                      </span>
                    </div>

                    {latestJob.startedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Started</span>
                        <span className="text-foreground">
                          {new Date(latestJob.startedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {latestJob.completedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="text-foreground">
                          {new Date(latestJob.completedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {/* Error Message */}
                    {latestJob.error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">Error</p>
                            <p className="text-xs text-destructive/80 mt-1">{latestJob.error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Filters Display */}
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">Current Filters</p>
                  <pre className="text-xs text-foreground overflow-x-auto">
                    {goal.searchFilters && Object.keys(goal.searchFilters).length > 0
                      ? JSON.stringify(goal.searchFilters, null, 2)
                      : '(empty)'}
                  </pre>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
