import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, TrendingUp, CheckCircle2, Circle, Plus, Layers, Scan, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { SIDEBAR_HANDLE_WIDTH } from '@/components/layout/Sidebar';
import { CandidateScanner } from './scanner/CandidateScanner';
import { ScannerPlaceholder } from './ScannerPlaceholder';
import { ScrapeStatusCard } from './ScrapeStatusCard';
import { ObjectiveList } from './ObjectiveList';
import { CompletionBurst } from './CompletionBurst';
import { NestedProgressBar } from './NestedProgressBar';
import { ComponentMatrix } from './ComponentMatrix';
import { GoalBreadcrumb } from './GoalBreadcrumb';
import { getProgressBreakdown, isFullyComplete } from '@/lib/progressCalculator';
import type { Goal, ItemGoal, FinanceGoal, ActionGoal, GroupGoal, ProductCandidate } from '@/types/goals';

interface GoalDetailViewProps {
  goal: Goal;
  onClose: () => void;
}

// Recursively find a goal by ID in the goals array (including nested subgoals)
const findGoalById = (goals: Goal[], id: string): Goal | null => {
  for (const goal of goals) {
    if (goal.id === id) return goal;
    if (goal.subgoals && goal.subgoals.length > 0) {
      const found = findGoalById(goal.subgoals, id);
      if (found) return found;
    }
  }
  return null;
};

// Spring animation config for bouncy effect
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

// Staggered children animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const GoalDetailView: React.FC<GoalDetailViewProps> = ({ goal, onClose }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const { 
    isChatMinimized, 
    updateGoal, 
    goalNavigationStack, 
    navigationDirection,
    navigateToGoal,
    navigateBack,
    goals,
  } = useAppStore();

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Build navigation stack as Goal objects for breadcrumb (search recursively)
  const navigationStackGoals = useMemo(() => {
    return goalNavigationStack
      .map(id => findGoalById(goals, id))
      .filter((g): g is Goal => g !== null);
  }, [goalNavigationStack, goals]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (goalId: string | null) => {
    if (goalId === null) {
      onCloseRef.current(); // Navigate to root (close goal view)
    } else {
      navigateToGoal(goalId);
    }
  };

  // Close handler that closes scanner first if open, or navigates back if in stack
  const handleClose = () => {
    const scannerOpen = document.querySelector('[data-scanner-open="true"]');
    if (scannerOpen) {
      window.dispatchEvent(new CustomEvent('close-scanner'));
    } else if (goalNavigationStack.length > 0) {
      navigateBack();
    } else {
      onCloseRef.current();
    }
  };

  // ESC key to close goal view or scanner
  useEffect(() => {
    console.log('[GoalDetailView] ESC handler effect mounted');
    const handleEsc = (e: KeyboardEvent) => {
      console.log('[GoalDetailView] Key pressed:', e.key);
      if (e.key === 'Escape') {
        const scannerOpen = document.querySelector('[data-scanner-open="true"]');
        if (scannerOpen) {
          window.dispatchEvent(new CustomEvent('close-scanner'));
        } else if (goalNavigationStack.length > 0) {
          navigateBack();
        } else {
          onCloseRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    console.log('[GoalDetailView] ESC handler cleanup');
    return () => {
      console.log('[GoalDetailView] Removing ESC handler');
      window.removeEventListener('keydown', handleEsc);
    };
  }, [goalNavigationStack.length, navigateBack]);
  
  // Track desktop breakpoint for sidebar handle margin
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Animation variants based on navigation direction
  const slideVariants = {
    initial: (direction: 'forward' | 'back' | null) => ({
      opacity: 0,
      x: direction === 'forward' ? 100 : direction === 'back' ? -100 : 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: 'forward' | 'back' | null) => ({
      opacity: 0,
      x: direction === 'forward' ? -100 : direction === 'back' ? 100 : 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.4, delay: 0.2 },
      }}
      className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md overflow-hidden"
    >
      {/* Breadcrumb Navigation */}
      <div 
        className="absolute top-0 z-30"
        style={{ 
          left: isDesktop ? SIDEBAR_HANDLE_WIDTH : 0,
          right: isChatMinimized ? 0 : undefined,
          width: isChatMinimized ? undefined : isDesktop ? 'calc(100% - 48px - 416px)' : '100%',
        }}
      >
        <GoalBreadcrumb
          navigationStack={navigationStackGoals}
          currentGoal={goal}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>


      {/* Goal Details Content - respects sidebar handle on desktop */}
      <AnimatePresence mode="wait" custom={navigationDirection}>
        <motion.div
          key={goal.id}
          custom={navigationDirection}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={springConfig}
          style={{
            left: isDesktop ? SIDEBAR_HANDLE_WIDTH : 0,
          }}
          className={cn(
            "absolute top-20 bottom-0 right-0 overflow-y-auto p-6 lg:p-8 scrollbar-neon",
            !isChatMinimized && "lg:right-[416px]"
          )}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {goal.type === 'item' && <ItemGoalDetail goal={goal as ItemGoal} />}
            {goal.type === 'finance' && <FinanceGoalDetail goal={goal as FinanceGoal} />}
            {goal.type === 'action' && <ActionGoalDetail goal={goal as ActionGoal} />}
            {goal.type === 'group' && <GroupGoalDetail goal={goal as GroupGoal} />}
          </motion.div>
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
};

// Item Goal Detail with Scanner Mode
const ItemGoalDetail: React.FC<{ goal: ItemGoal }> = ({ goal }) => {
  const { isChatMinimized, updateGoal, searchAndUpdateGoal, goals, fetchGoals, goalsVersion } = useAppStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Get the latest goal from store to ensure reactivity (use goalsVersion to force updates)
  const latestGoal = useMemo(() => {
    return goals.find(g => g.id === goal.id) as ItemGoal || goal;
  }, [goals, goal.id, goalsVersion]);

  // Initialize selectedCandidate from the goal's selectedCandidateId (if set), but don't auto-select first candidate
  const [selectedCandidate, setSelectedCandidate] = useState<ProductCandidate | null>(() => {
    // Only auto-select if the goal already has an explicit selectedCandidateId
    if (latestGoal.selectedCandidateId && latestGoal.candidates) {
      return latestGoal.candidates.find(c => c.id === latestGoal.selectedCandidateId) || null;
    }
    // Otherwise start with null (no auto-selection)
    return null;
  });
  const [hasNewCandidates, setHasNewCandidates] = useState(false);
  // Track candidate count before search to detect new candidates after search completes
  const [candidateCountBeforeSearch, setCandidateCountBeforeSearch] = useState<number | null>(null);
  const [justCompletedScrape, setJustCompletedScrape] = useState(false); // Track when scrape just completed
  const [scrapedWithNoResults, setScrapedWithNoResults] = useState(false); // Track when scrape completed with no new candidates
  const [scrapeCompleted, setScrapeCompleted] = useState(false); // Track when scrape job completes (regardless of results)

  // Sync selectedCandidate and goal data when store updates
  useEffect(() => {
    console.log('[ItemGoalDetail] Goal updated, syncing state', {
      candidatesLength: latestGoal.candidates?.length,
      selectedCandidateId: latestGoal.selectedCandidateId,
      productImage: latestGoal.productImage,
      statusBadge: latestGoal.statusBadge,
      justCompletedScrape,
      // Log retailer names for debugging
      candidatesRetailers: latestGoal.candidates?.map(c => ({ retailer: c.retailer, name: c.name })) || [],
      // Log candidate IDs to check for duplicates
      candidateIds: latestGoal.candidates?.map(c => c.id) || [],
      shortlistedIds: (latestGoal as ItemGoal).shortlistedCandidates?.map(c => c.id) || [],
      deniedIds: (latestGoal as ItemGoal).deniedCandidates?.map(c => c.id) || [],
    });

    // Keep current selectedCandidate if it still exists in candidates, otherwise sync with store
    setSelectedCandidate(prev => {
      // If we just completed a scrape with new candidates, don't auto-select
      if (justCompletedScrape) {
        return prev; // Keep current selection (or null if none was selected)
      }

      // If current selection still exists in new candidates array, keep it
      if (prev && latestGoal.candidates?.some(c => c.id === prev.id)) {
        return prev;
      }

      // Otherwise, try to find the candidate matching the store's selectedCandidateId
      // BUT exclude denied candidates from auto-selection
      const deniedIds = (latestGoal.deniedCandidates || []).map(c => c.id);
      const matchingCandidate = latestGoal.candidates?.find(c =>
        c.id === latestGoal.selectedCandidateId && !deniedIds.includes(c.id)
      );

      return matchingCandidate || null; // Don't auto-select denied candidates
    });
  }, [latestGoal.candidates, latestGoal.selectedCandidateId, latestGoal.productImage, latestGoal.id, latestGoal.statusBadge, latestGoal.deniedCandidates, justCompletedScrape]);

  // Check if there are any candidates OR shortlisted items OR a selected candidate
  const hasCandidates = (latestGoal.candidates && latestGoal.candidates.length > 0) ||
    ((latestGoal as ItemGoal).shortlistedCandidates && (latestGoal as ItemGoal).shortlistedCandidates!.length > 0) ||
    latestGoal.selectedCandidateId;

  // Calculate candidate count (only main scanner candidates, exclude denied and shortlisted)
  const candidateCount = (() => {
    const deniedIds = (latestGoal.deniedCandidates || []).map(c => c.id);
    const shortlistedIds = ((latestGoal as ItemGoal).shortlistedCandidates || []).map(c => c.id);

    // Count only main scanner candidates (excluding denied and shortlisted)
    return (latestGoal.candidates || []).filter(c =>
      !deniedIds.includes(c.id) && !shortlistedIds.includes(c.id)
    ).length;
  })();

  // Track search status changes to detect new candidates
  const prevStatusRef = useRef(latestGoal.statusBadge);
  const [newCandidatesCount, setNewCandidatesCount] = useState(0); // Track how many new candidates

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const currentStatus = latestGoal.statusBadge;

    // When entering searching state, store current candidate count
    const isEnteringSearch = (currentStatus === 'pending_search' || currentStatus === 'pending-search') &&
                            prevStatus !== 'pending_search' && prevStatus !== 'pending-search';

    // When leaving searching state, compare candidate counts
    const isLeavingSearch = (prevStatus === 'pending_search' || prevStatus === 'pending-search') &&
                           currentStatus !== 'pending_search' && currentStatus !== 'pending-search';

    if (isEnteringSearch) {
      // Store candidate count before search starts
      setCandidateCountBeforeSearch(latestGoal.candidates?.length ?? 0);
      setScrapeCompleted(false); // Reset completion state when starting new scrape
      setScrapedWithNoResults(false); // Reset no results state when starting new scrape
      console.log('[ItemGoalDetail] Starting search, candidate count:', latestGoal.candidates?.length ?? 0);
    } else if (isLeavingSearch && candidateCountBeforeSearch !== null) {
      // Status changed from pending_search to something else
      // Note: scrapeCompleted is NOT cleared here - it should persist until next scrape starts
      // This ensures "no_candidates" status persists even after backend updates statusBadge
      console.log('[ItemGoalDetail] Status changed from pending_search, scrapeCompleted:', scrapeCompleted);

      // Compare counts after search completes
      const newCount = latestGoal.candidates?.length ?? 0;
      const oldCount = candidateCountBeforeSearch;
      const newCandidatesAdded = newCount - oldCount;
      const hasNew = newCandidatesAdded > 0;

      console.log('[ItemGoalDetail] Search completed, old:', oldCount, 'new:', newCount, 'added:', newCandidatesAdded, 'hasNew:', hasNew);
      setHasNewCandidates(hasNew);
      setNewCandidatesCount(newCandidatesAdded);

      // Mark that we just completed a scrape (to prevent auto-selection)
      if (hasNew) {
        setJustCompletedScrape(true);
        setScrapedWithNoResults(false);
        // Clear the flag after a short delay
        setTimeout(() => setJustCompletedScrape(false), 1000);
      }
      // Note: We don't set scrapedWithNoResults here anymore since it's handled in onScrapeComplete
    }

    prevStatusRef.current = currentStatus;
  }, [latestGoal.statusBadge, latestGoal.candidates, candidateCountBeforeSearch]);

  // Track candidate count changes to clear scrapedWithNoResults when candidates arrive
  const prevCandidateCountRef = useRef(0);
  prevCandidateCountRef.current = candidateCount;

  useEffect(() => {
    // If we had "no results" but now have candidates, clear the flag
    if (scrapedWithNoResults && candidateCount > 0 && prevCandidateCountRef.current === 0) {
      console.log('[ItemGoalDetail] Candidates arrived after no results, clearing scrapedWithNoResults');
      setScrapedWithNoResults(false);
    }
  }, [candidateCount, scrapedWithNoResults]);

  const handleSelectCandidate = (candidate: ProductCandidate) => {
    setSelectedCandidate(candidate);
    setHasNewCandidates(false);
    setNewCandidatesCount(0);
    console.log('[ItemGoalDetail] Selecting candidate:', {
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateImage: candidate.image,
      currentProductImage: latestGoal.productImage,
    });
    // Update the goal with new selected candidate
    updateGoal(latestGoal.id, {
      bestPrice: candidate.price,
      retailerName: candidate.retailer,
      retailerUrl: candidate.url,
      productImage: candidate.image,
      selectedCandidateId: candidate.id,
    } as any);
  };

  const handleShortlistChange = (shortlistedCandidates: ProductCandidate[]) => {
    // Remove denied candidates from the main candidates array
    // DO NOT remove shortlisted candidates - keep candidates as complete source of truth
    // The scanner uses the shortlistedCandidates prop separately to filter display
    const deniedIds = ((latestGoal as ItemGoal).deniedCandidates || []).map(c => c.id);

    const updatedCandidates = (latestGoal.candidates || []).filter(c =>
      c.id !== latestGoal.selectedCandidateId &&
      !deniedIds.includes(c.id)
    );

    // Simply update the shortlist - don't try to auto-select anything
    updateGoal(latestGoal.id, {
      candidates: updatedCandidates,
      shortlistedCandidates,
    } as any);
  };

  const handleDeniedChange = (deniedCandidates: ProductCandidate[]) => {
    // Remove denied candidates from the main candidates array
    // DO NOT remove shortlisted candidates - keep candidates as complete source of truth
    const deniedIds = deniedCandidates.map(c => c.id);

    const updatedCandidates = (latestGoal.candidates || []).filter(c =>
      !deniedIds.includes(c.id) &&
      c.id !== latestGoal.selectedCandidateId
    );

    updateGoal(latestGoal.id, {
      candidates: updatedCandidates,
      deniedCandidates,
    } as any);
  };

  // Listen for close-scanner event from parent ESC handler
  useEffect(() => {
    const handleCloseScanner = () => setIsScannerOpen(false);
    window.addEventListener('close-scanner', handleCloseScanner);
    return () => window.removeEventListener('close-scanner', handleCloseScanner);
  }, []);

  // Get the display image - only show image when a candidate is selected
  const displayImage = selectedCandidate?.image || null;
  const displayPrice = selectedCandidate?.price || latestGoal.bestPrice;
  const displayRetailer = selectedCandidate?.retailer || latestGoal.retailerName;

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Scanner Mode Overlay - Using new Digital Workbench */}
      <AnimatePresence>
        {isScannerOpen && latestGoal.candidates && (
          <>
            <div data-scanner-open="true" style={{display: 'none'}} />
            <CandidateScanner
              key={`${latestGoal.candidates.length}-${goalsVersion}`}
              candidates={latestGoal.candidates}
              selectedCandidateId={selectedCandidate?.id}
              shortlistedCandidates={(latestGoal as ItemGoal).shortlistedCandidates}
              deniedCandidates={(latestGoal as ItemGoal).deniedCandidates}
              isChatMinimized={isChatMinimized}
              onSelect={handleSelectCandidate}
              onShortlistChange={handleShortlistChange}
              onDeniedChange={handleDeniedChange}
              onClose={() => setIsScannerOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Hero Image with Stack Indicator */}
      <motion.div
        variants={itemVariants}
        className="relative h-64 lg:h-80 rounded-2xl overflow-hidden mb-6 group cursor-pointer"
        onClick={() => hasCandidates && setIsScannerOpen(true)}
      >
        {/* Show placeholder if: no selection, no image, image is from unsplash, or goal is in searching state */}
        {!displayImage ||
         displayImage?.includes('unsplash.com') ||
         !selectedCandidate ||
         (!scrapeCompleted && (latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search')) ? (
          <ScannerPlaceholder
            status={
              !scrapeCompleted && (latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search')
                ? 'initiating'
                : latestGoal.statusBadge === 'not_found'
                ? 'no_results'
                : scrapedWithNoResults
                ? 'no_candidates'
                : selectedCandidate
                ? 'acquired'
                : latestGoal.statusBadge === 'candidates_found' || candidateCount > 0
                ? 'decoding'
                : 'initiating'
            }
            signalCount={candidateCount}
            className="h-full"
          />
        ) : (
          <>
            <img
              src={displayImage}
              alt={latestGoal.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </>
        )}

        {/* New Candidate Alert - pulsing magenta indicator */}
        {hasNewCandidates && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 left-4"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(255, 0, 255, 0.7)',
                  '0 0 0 10px rgba(255, 0, 255, 0)',
                ],
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/90 text-accent-foreground cursor-pointer"
              onClick={(e) => { e.stopPropagation(); setIsScannerOpen(true); setHasNewCandidates(false); setNewCandidatesCount(0); }}
            >
              <AlertCircle className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold">
                {newCandidatesCount} NEW CANDIDATE{newCandidatesCount > 1 ? 'S' : ''}
              </span>
            </motion.div>
          </motion.div>
        )}


        {/* Scanner Mode Hint - Bottom Bar */}
        {hasCandidates && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-4 py-3 bg-background/90 backdrop-blur-sm text-sm font-medium text-foreground border-t border-border"
          >
            <Layers className="w-4 h-4" />
            Tap to Open Scanner
          </motion.div>
        )}
      </motion.div>

      {/* Content */}
      <div className="space-y-6">
        <motion.div variants={itemVariants}>
          <span className="badge-info mb-2 inline-block">Item Goal</span>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {latestGoal.title}
          </h1>
          <p className="text-lg text-muted-foreground">{latestGoal.description}</p>
        </motion.div>

        {/* Price Card */}
        <motion.div variants={itemVariants} className="glass-card p-6 neon-border">
          <div className="flex flex-wrap items-end justify-between gap-4">
            {/* Price Section */}
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground mb-1">Best Price</p>
              <p className="text-4xl font-heading font-bold neon-text-cyan">
                ${displayPrice.toLocaleString()}
              </p>
            </div>

            {/* Available at Section */}
            <div className="flex flex-col justify-end text-center">
              <p className="text-sm text-muted-foreground">Available at</p>
              <p className="text-lg font-medium text-foreground">
                {displayRetailer}
              </p>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Scan button */}
            {hasCandidates && (
              <button
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted/50 text-foreground font-medium transition-all hover:bg-muted hover:scale-105"
              >
                <Scan className="w-5 h-5" />
                Scan
              </button>
            )}

            {/* Buy button */}
            <a
              href={selectedCandidate?.url || latestGoal.retailerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-neon text-primary-foreground font-semibold transition-all hover:scale-105 neon-glow-cyan",
                !hasCandidates && "col-span-2"
              )}
            >
              Buy
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        </motion.div>

        {/* Selected Candidate Details */}
        {selectedCandidate && (
          <motion.div variants={itemVariants} className="glass-card p-6">
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Selected Option
            </h3>
            <div className="flex items-start gap-4">
              <img
                src={selectedCandidate.image}
                alt={selectedCandidate.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground line-clamp-2">{selectedCandidate.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedCandidate.retailer}</p>
                {selectedCandidate.condition && (
                  <span className={cn(
                    "inline-block mt-2 px-2 py-0.5 rounded text-xs",
                    selectedCandidate.condition === 'new' && "bg-success/20 text-success",
                    selectedCandidate.condition === 'refurbished' && "bg-warning/20 text-warning",
                    selectedCandidate.condition === 'used' && "bg-muted text-muted-foreground"
                  )}>
                    {selectedCandidate.condition.charAt(0).toUpperCase() + selectedCandidate.condition.slice(1)}
                  </span>
                )}
              </div>
              {selectedCandidate.rating && (
                <div className="text-right">
                  <p className="text-lg font-bold text-warning">★ {Math.round(selectedCandidate.rating * 10) / 10}</p>
                  {selectedCandidate.reviewCount && (
                    <p className="text-xs text-muted-foreground">{selectedCandidate.reviewCount.toLocaleString()} reviews</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Product Specs */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Product Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Status</p>
              <p className="text-foreground font-medium capitalize">
                {latestGoal.statusBadge.replace('-', ' ').replace('_', ' ')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Currency</p>
              <p className="text-foreground font-medium">{latestGoal.currency}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Added</p>
              <p className="text-foreground font-medium">
                {new Date(latestGoal.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Last Updated</p>
              <p className="text-foreground font-medium">
                {new Date(latestGoal.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Scrape Status Card - Shows when searching or has recent jobs */}
        <motion.div variants={itemVariants}>
          <ScrapeStatusCard
            goal={latestGoal}
            onRefresh={() => searchAndUpdateGoal(latestGoal.id)}
            onScrapeComplete={async () => {
              console.log('[ItemGoalDetail] Scrape completed, updating state...');
              // Immediately mark scrape as completed (don't wait for backend statusBadge update)
              setScrapeCompleted(true);
              // Refresh goals to get latest data first
              await fetchGoals();
              // Then check candidate count after goals are refreshed
              // Use setTimeout to ensure state has updated
              setTimeout(() => {
                // Get fresh goals from store
                const store = useAppStore.getState();
                const refreshedGoal = store.goals.find(g => g.id === latestGoal.id);
                if (!refreshedGoal) {
                  console.log('[ItemGoalDetail] Could not find refreshed goal');
                  return;
                }

                const itemGoal = refreshedGoal as ItemGoal;
                const deniedIds = (itemGoal.deniedCandidates || []).map(c => c.id);
                const shortlistedIds = (itemGoal.shortlistedCandidates || []).map(c => c.id);
                const validCandidateCount = (itemGoal.candidates || []).filter(c =>
                  !deniedIds.includes(c.id) && !shortlistedIds.includes(c.id)
                ).length;

                console.log('[ItemGoalDetail] After refresh, valid candidate count:', validCandidateCount);

                if (validCandidateCount === 0) {
                  console.log('[ItemGoalDetail] No valid candidates after scrape, setting scrapedWithNoResults');
                  setScrapedWithNoResults(true);
                } else {
                  // Candidates exist, clear the no results flag
                  setScrapedWithNoResults(false);
                }
              }, 100);
              // Note: scrapeCompleted will be cleared when statusBadge changes from pending_search
              // or when a new scrape starts (see the status tracking useEffect)
            }}
          />
        </motion.div>

        {/* Component Matrix for Build View (Item subgoals) */}
        {goal.subgoals && goal.subgoals.length > 0 && (
          <motion.div variants={itemVariants} className="glass-card p-6">
            <ComponentMatrix
              parentGoal={goal}
              subgoals={goal.subgoals}
              onSubgoalClick={(subgoalId) => {
                // Drill into the subgoal with slide animation
                useAppStore.getState().drillIntoGoal(subgoalId);
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Finance Goal Detail with Nested Progress Bars
const FinanceGoalDetail: React.FC<{ goal: FinanceGoal }> = ({ goal }) => {
  const { drillIntoGoal } = useAppStore();
  const progress = Math.min((goal.currentBalance / goal.targetBalance) * 100, 100);
  const remaining = goal.targetBalance - goal.currentBalance;
  const isComplete = progress >= 100;
  const subgoals = goal.subgoals || [];

  // Calculate weeks to target date
  const weeksToTarget = goal.targetDate
    ? Math.max(0, Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)))
    : null;

  // Calculate estimated weeks based on current savings rate
  const avgSavingsPerWeek = goal.currentBalance > 0 && goal.progressHistory.length > 0
    ? goal.currentBalance / goal.progressHistory.length
    : 0;
  const estWeeksAtCurrentRate = avgSavingsPerWeek > 0
    ? Math.ceil(remaining / avgSavingsPerWeek)
    : null;

  // Navigate to subgoal detail with drill-down animation
  const handleSubgoalClick = (subgoalId: string) => {
    drillIntoGoal(subgoalId);
  };

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-sunset flex items-center justify-center text-3xl">
          {goal.institutionIcon}
        </div>
        <div>
          <span className="badge-accent mb-2 inline-block">Finance Goal</span>
          <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
            {goal.title}
          </h1>
          <p className="text-lg text-muted-foreground">{goal.accountName}</p>
        </div>
      </motion.div>

      {/* Balance Card with Completion Burst */}
      <motion.div variants={itemVariants}>
        <CompletionBurst isComplete={isComplete}>
          <div className="glass-card p-6 neon-border mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                <p className={cn(
                  "text-5xl font-heading font-bold",
                  isComplete ? "text-white" : "neon-text-magenta"
                )}
                style={{
                  textShadow: isComplete ? '0 0 20px white, 0 0 40px white' : undefined,
                }}>
                  ${goal.currentBalance.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Target</p>
                <p className="text-2xl font-heading font-semibold text-foreground">
                  ${goal.targetBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Nested Progress Bar with subgoals */}
            <NestedProgressBar
              parentGoal={goal}
              subgoals={subgoals}
              onSubgoalClick={handleSubgoalClick}
            />
          </div>
        </CompletionBurst>
      </motion.div>

      {/* Chart */}
      <motion.div variants={itemVariants} className="glass-card p-6 mb-6">
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Balance History
        </h3>
        <div className="flex items-end justify-between h-32 gap-2">
          {goal.progressHistory.map((value, index) => {
            const maxVal = Math.max(...goal.progressHistory);
            const height = (value / maxVal) * 100;
            const isLast = index === goal.progressHistory.length - 1;

            return (
              <motion.div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ ...springConfig, delay: 0.4 + index * 0.05 }}
                style={{ originY: 1 }}
              >
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    isLast ? "bg-gradient-neon neon-glow-magenta" : "bg-muted-foreground/40"
                  )}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className={cn(
            "text-2xl font-heading font-bold",
            isComplete ? "text-white" : "neon-text-cyan"
          )}
          style={{
            textShadow: isComplete ? '0 0 10px white' : undefined,
          }}>
            {progress.toFixed(0)}%
          </p>
          <p className="text-sm text-muted-foreground">Complete</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-foreground">
            {goal.progressHistory.length}
          </p>
          <p className="text-sm text-muted-foreground">Updates</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-success">
            {goal.progressHistory.length > 0 && goal.progressHistory[0] > 0
              ? `+${((goal.currentBalance / goal.progressHistory[0] - 1) * 100).toFixed(0)}%`
              : '0%'}
          </p>
          <p className="text-sm text-muted-foreground">Growth</p>
        </motion.div>
        <motion.div variants={itemVariants} className="glass-card p-4 text-center">
          <p className="text-2xl font-heading font-bold text-foreground">
            {estWeeksAtCurrentRate !== null ? estWeeksAtCurrentRate : weeksToTarget ?? '—'}
          </p>
          <p className="text-sm text-muted-foreground">Est. Weeks</p>
          {weeksToTarget !== null && estWeeksAtCurrentRate !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              Target: {weeksToTarget}w
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* Non-finance subgoals section */}
      {subgoals.filter(s => s.type !== 'finance').length > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-semibold text-lg text-foreground">
              Related Goals
            </h3>
          </div>
          <div className="space-y-2">
            {subgoals.filter(s => s.type !== 'finance').map((subgoal) => (
              <motion.button
                key={subgoal.id}
                onClick={() => handleSubgoalClick(subgoal.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-[hsl(var(--neon-magenta)/0.3)] hover:border-[hsl(var(--neon-magenta)/0.6)] transition-all text-left"
              >
                <div className="w-1 h-8 rounded-full bg-[var(--neon-magenta)]" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{subgoal.title}</span>
                  <span className="text-xs text-muted-foreground block">{subgoal.description}</span>
                </div>
                <span className="text-xs text-muted-foreground">{subgoal.type}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Action Goal Detail with Modular Assembly System
const ActionGoalDetail: React.FC<{ goal: ActionGoal }> = ({ goal }) => {
  const { toggleTask, addTask, drillIntoGoal } = useAppStore();
  const [newTask, setNewTask] = React.useState('');

  // Calculate progress using Modular Assembly logic
  const progressBreakdown = getProgressBreakdown(goal);
  const isComplete = isFullyComplete(goal);
  const subgoals = goal.subgoals || [];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      addTask(goal.id, newTask.trim());
      setNewTask('');
    }
  };

  // Navigate to subgoal detail with drill-down animation
  const handleSubgoalClick = (subgoalId: string) => {
    drillIntoGoal(subgoalId);
  };

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <span className="badge-success mb-2 inline-block">Action Goal</span>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-2">
          {goal.title}
        </h1>
        <p className="text-lg text-muted-foreground">{goal.description}</p>
      </motion.div>

      {/* Motivation Card */}
      {goal.motivation && (
        <motion.div variants={itemVariants} className="glass-card p-6 neon-border mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-neon flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💭</span>
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground mb-1">
                Your Why
              </h3>
              <p className="text-muted-foreground">{goal.motivation}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Card with Completion Burst */}
      <motion.div variants={itemVariants}>
        <CompletionBurst isComplete={isComplete}>
          <div className="glass-card p-6 neon-border mb-6">
            <div className="flex items-center gap-6">
              {/* Circular Progress with Modular Assembly */}
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="3"
                  />
                  {/* Cyan arc for tasks */}
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke={isComplete ? "white" : "url(#detailProgressGradient)"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${progressBreakdown.totalProgress}, 100`}
                    initial={{ strokeDasharray: '0, 100' }}
                    animate={{ strokeDasharray: `${progressBreakdown.totalProgress}, 100` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    style={{
                      filter: isComplete ? 'drop-shadow(0 0 10px white)' : undefined,
                    }}
                  />
                  <defs>
                    <linearGradient id="detailProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--neon-lime)" />
                      <stop offset="100%" stopColor="var(--neon-cyan)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn(
                    "font-heading font-bold text-2xl",
                    isComplete ? "text-white" : "text-foreground"
                  )}
                  style={{
                    textShadow: isComplete ? '0 0 10px white' : undefined,
                  }}>
                    {progressBreakdown.totalProgress}%
                  </span>
                </div>
              </div>

              <div className="flex-1">
                {/* Modular Assembly Stats */}
                <p className="text-2xl font-heading font-semibold text-foreground mb-2">
                  Command Center
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--neon-cyan)]" />
                    <span className="text-muted-foreground">
                      Tasks: <span className="text-foreground font-medium">
                        {progressBreakdown.localTasksCompleted}/{progressBreakdown.localTasksTotal}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[var(--neon-magenta)]" />
                    <span className="text-muted-foreground">
                      Subgoals: <span className="text-foreground font-medium">
                        {progressBreakdown.subgoalsCompleted}/{progressBreakdown.subgoalsTotal}
                      </span>
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isComplete 
                    ? "✨ All modules powered up!" 
                    : `${progressBreakdown.localTasksTotal + progressBreakdown.subgoalsTotal - progressBreakdown.localTasksCompleted - progressBreakdown.subgoalsCompleted} objectives remaining`
                  }
                </p>
              </div>
            </div>
          </div>
        </CompletionBurst>
      </motion.div>

      {/* Unified Objective List */}
      <motion.div variants={itemVariants} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-background" />
            </span>
            Objective Stack
          </h3>
          <span className="text-sm text-muted-foreground">
            {progressBreakdown.localTasksTotal} tasks • {progressBreakdown.subgoalsTotal} subgoals
          </span>
        </div>

        {/* Add Task Form */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus-within:border-primary/50 transition-all">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!newTask.trim()}
            className={cn(
              "px-4 py-3 rounded-xl font-medium transition-all",
              newTask.trim()
                ? "bg-gradient-neon text-primary-foreground hover:scale-105"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Add
          </button>
        </form>

        {/* Unified ObjectiveList Component */}
        <ObjectiveList
          tasks={goal.tasks}
          subgoals={subgoals}
          onTaskToggle={(taskId) => toggleTask(goal.id, taskId)}
          onSubgoalClick={handleSubgoalClick}
        />
      </motion.div>
    </div>
  );
};

// Subgoals Section - shared across all goal types
const SubgoalsSection: React.FC<{ goal: Goal }> = ({ goal }) => {
  const { drillIntoGoal } = useAppStore();

  if (!goal.subgoals || goal.subgoals.length === 0) {
    return null;
  }

  return (
    <motion.div variants={itemVariants} className="glass-card p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-primary" />
        <h3 className="font-heading font-semibold text-lg text-foreground">
          Subgoals ({goal.subgoals.length})
        </h3>
      </div>

      <div className="space-y-3">
        {goal.subgoals.map((subgoal, index) => (
          <motion.button
            key={subgoal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-[hsl(var(--neon-magenta)/0.3)] hover:border-[hsl(var(--neon-magenta)/0.6)] hover:shadow-[0_0_15px_hsl(var(--neon-magenta)/0.2)] transition-all cursor-pointer text-left"
            onClick={() => drillIntoGoal(subgoal.id)}
          >
            <div className="w-1 h-8 rounded-full bg-[var(--neon-magenta)]" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground">{subgoal.title}</span>
              <p className="text-xs text-muted-foreground truncate">{subgoal.description}</p>
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full",
              subgoal.type === 'item' && "badge-info",
              subgoal.type === 'finance' && "badge-accent",
              subgoal.type === 'action' && "badge-success"
            )}>
              {subgoal.type}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

const GroupGoalDetail: React.FC<{ goal: GroupGoal }> = ({ goal }) => {
  const { drillIntoGoal } = useAppStore();

  // Navigate to subgoal detail with drill-down animation
  const handleSubgoalClick = (subgoalId: string) => {
    drillIntoGoal(subgoalId);
  };

  // Preview components for each goal type
  const ItemPreview = ({ item }: { item: ItemGoal }) => (
    <div className="flex items-center gap-4">
      {item.productImage && (
        <img src={item.productImage} className="w-16 h-16 rounded-lg object-cover neon-border" alt={item.title} />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{item.title}</h3>
        <p className="text-sm text-primary font-bold">${item.bestPrice?.toLocaleString()}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );

  const FinancePreview = ({ finance }: { finance: FinanceGoal }) => (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-gradient-sunset flex items-center justify-center text-2xl flex-shrink-0">
        {finance.institutionIcon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{finance.title}</h3>
        <p className="text-sm text-muted-foreground">${finance.currentBalance?.toLocaleString()} / ${finance.targetBalance?.toLocaleString()}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );

  const ActionPreview = ({ action }: { action: ActionGoal }) => (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">{Math.round(action.completionPercentage)}%</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{action.title}</h3>
        <p className="text-sm text-muted-foreground">
          {action.tasks?.filter(t => t.completed).length || 0} / {action.tasks?.length || 0} tasks
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );

  const GroupPreview = ({ group }: { group: GroupGoal }) => (
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 neon-border",
        "bg-gradient-to-br", group.color || "from-cyan-500/20 to-purple-500/20"
      )}>
        {group.icon || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{group.title}</h3>
        <p className="text-sm text-muted-foreground">{group.subgoals?.length || 0} items</p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );

  return (
    <div className="w-full lg:max-w-3xl">
      {/* Header with group icon and title */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center text-6xl mb-4",
          "bg-gradient-to-br neon-border",
          goal.color || "from-cyan-500/20 to-purple-500/20"
        )}>
          {goal.icon || '📦'}
        </div>
        <span className="badge-info mb-2 inline-block">Group Goal</span>
        <h1 className="font-heading text-3xl lg:text-4xl font-bold text-foreground">
          {goal.title}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">{goal.description}</p>
      </motion.div>

      {/* Progress Card */}
      <motion.div variants={itemVariants} className="glass-card p-6 neon-border mb-6">
        <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 rounded-full bg-background/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-gradient-to-r from-cyan-500 to-lime-400 neon-glow-cyan"
              />
            </div>
          </div>
          <span className="text-2xl font-bold neon-text-cyan min-w-[4rem] text-right">
            {Math.round(goal.progress)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {goal.subgoals?.filter(s => s.status === 'completed').length || 0} of {goal.subgoals?.length || 0} items completed
        </p>
      </motion.div>

      {/* Child Goals Grid */}
      <motion.div variants={containerVariants} className="space-y-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">Items in this Group</h2>

        <div className="grid gap-4">
          {(goal.subgoals || []).map((subgoal, index) => (
            <motion.div
              key={subgoal.id}
              variants={itemVariants}
              className={cn(
                "glass-card p-4 neon-border cursor-pointer hover:neon-glow-cyan transition-all",
                subgoal.status === 'completed' && "opacity-60"
              )}
              onClick={() => handleSubgoalClick(subgoal.id)}
              whileHover={{ scale: 1.02 }}
            >
              {/* Render preview based on subgoal type */}
              {subgoal.type === 'item' && <ItemPreview item={subgoal as ItemGoal} />}
              {subgoal.type === 'finance' && <FinancePreview finance={subgoal as FinanceGoal} />}
              {subgoal.type === 'action' && <ActionPreview action={subgoal as ActionGoal} />}
              {subgoal.type === 'group' && <GroupPreview group={subgoal as GroupGoal} />}
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {(!goal.subgoals || goal.subgoals.length === 0) && (
          <motion.div variants={itemVariants} className="glass-card p-8 text-center">
            <p className="text-muted-foreground">No items in this group yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Ask the AI to add items to this group!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
