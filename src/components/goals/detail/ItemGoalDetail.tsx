import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Layers, Scan, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewStore } from '@/store/useViewStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { CandidateScanner } from '../scanner/CandidateScanner';
import { ScannerPlaceholder } from '../ScannerPlaceholder';
import { ScrapeStatusCard } from '../ScrapeStatusCard';
import { ComponentMatrix } from '../ComponentMatrix';
import { itemVariants } from './animations';
import type { ItemGoal, ProductCandidate } from '@/types/goals';

interface ItemGoalDetailProps {
  goal: ItemGoal;
}

export const ItemGoalDetail: React.FC<ItemGoalDetailProps> = ({ goal }) => {
  const { isChatMinimized } = useViewStore();
  const { updateGoal, searchAndUpdateGoal, fetchGoals } = useGoalsStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Subscribe directly to this specific goal from the store for reactivity
  const latestGoal = useGoalsStore(state => state.goals.find(g => g.id === goal.id) as ItemGoal) || goal;

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
              key={`${latestGoal.candidates.length}-${latestGoal.updatedAt || ''}`}
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
                const store = useGoalsStore.getState();
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
                useViewStore.getState().drillIntoGoal(subgoalId);
              }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};
