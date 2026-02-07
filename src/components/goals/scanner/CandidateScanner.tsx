import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, GitCompare, ChevronLeft, ChevronRight, Heart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductCandidate } from '@/types/goals';
import type { ManagedCandidate, ScannerAnimation } from '@/types/candidates';
import { ProspectFeed } from './ProspectFeed';
import { ShortlistGallery } from './ShortlistGallery';
import { CompareView } from './CompareView';

interface CandidateScannerProps {
  candidates: ProductCandidate[];
  selectedCandidateId?: string;
  shortlistedCandidates?: ProductCandidate[];
  deniedCandidates?: ProductCandidate[];
  isChatMinimized?: boolean;
  onSelect: (candidate: ProductCandidate) => void;
  onShortlistChange?: (candidates: ProductCandidate[]) => void;
  onDeniedChange?: (candidates: ProductCandidate[]) => void;
  onClose: () => void;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

// Convert ProductCandidate to ManagedCandidate
const toManagedCandidate = (
  candidate: ProductCandidate,
  status: ManagedCandidate['status'] = 'prospect'
): ManagedCandidate => ({
  ...candidate,
  status,
});

export const CandidateScanner: React.FC<CandidateScannerProps> = ({
  candidates,
  selectedCandidateId,
  shortlistedCandidates = [],
  deniedCandidates = [],
  isChatMinimized = false,
  onSelect,
  onShortlistChange,
  onDeniedChange,
  onClose,
}) => {
  const [mode, setMode] = useState<'feed' | 'compare'>('feed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animation, setAnimation] = useState<ScannerAnimation>('idle');
  const [focusedShortlistItem, setFocusedShortlistItem] = useState<ManagedCandidate | null>(null);

  // Get IDs of shortlisted and denied candidates for filtering (handle null/undefined)
  const shortlistedIds = (shortlistedCandidates || []).map(c => c.id);
  const deniedIds = (deniedCandidates || []).map(c => c.id);

  // Initialize candidates with status - filter out denied and already selected/shortlisted
  const [prospects, setProspects] = useState<ManagedCandidate[]>(() =>
    candidates
      .filter(c =>
        c.id !== selectedCandidateId &&
        !shortlistedIds.includes(c.id) &&
        !deniedIds.includes(c.id)
      )
      .map(c => toManagedCandidate(c, 'prospect'))
  );

  // Initialize shortlist from saved candidates
  const [shortlist, setShortlist] = useState<ManagedCandidate[]>(() =>
    (shortlistedCandidates || []).map(c => toManagedCandidate(c, 'shortlisted'))
  );

  const [primary, setPrimary] = useState<ManagedCandidate | null>(() => {
    if (selectedCandidateId) {
      const selected = candidates.find(c => c.id === selectedCandidateId);
      return selected ? toManagedCandidate(selected, 'primary') : null;
    }
    return null;
  });

  // Sync local state when props change (after opening scanner again with updated data)
  useEffect(() => {
    // Debug logging
    console.log('[CandidateScanner] Syncing state', {
      totalCandidates: candidates.length,
      selectedCandidateId,
      shortlistedCount: (shortlistedCandidates || []).length,
      deniedCount: (deniedCandidates || []).length,
      // Log all candidates with retailers
      allCandidates: candidates.map(c => ({ id: c.id, retailer: c.retailer, name: c.name })),
      shortlistedIds: (shortlistedCandidates || []).map(c => c.id),
      deniedIds: (deniedCandidates || []).map(c => c.id),
    });

    // Sync primary
    if (selectedCandidateId) {
      const selected = candidates.find(c => c.id === selectedCandidateId);
      setPrimary(selected ? toManagedCandidate(selected, 'primary') : null);
    } else {
      setPrimary(null);
    }

    // Sync shortlist
    setShortlist((shortlistedCandidates || []).map(c => toManagedCandidate(c, 'shortlisted')));

    // Sync prospects - filter out denied, selected, and shortlisted
    const updatedShortlistedIds = (shortlistedCandidates || []).map(c => c.id);
    const updatedDeniedIds = (deniedCandidates || []).map(c => c.id);

    const filteredProspects = candidates
      .filter(c =>
        c.id !== selectedCandidateId &&
        !updatedShortlistedIds.includes(c.id) &&
        !updatedDeniedIds.includes(c.id)
      )
      .map(c => toManagedCandidate(c, 'prospect'));

    console.log('[CandidateScanner] Filtered prospects', {
      filteredCount: filteredProspects.length,
      filteredProspects: filteredProspects.map(p => ({ id: p.id, retailer: p.retailer, name: p.name })),
    });

    setProspects(filteredProspects);

    // Reset current index if out of bounds
    setCurrentIndex(0);
  }, [candidates, selectedCandidateId, shortlistedCandidates, deniedCandidates]);

  // Handle liking a prospect (moves to shortlist with warp animation)
  const handleLike = useCallback((candidate: ManagedCandidate) => {
    setAnimation('warp-to-shortlist');

    // Brief delay for animation
    setTimeout(() => {
      setProspects(prev => {
        const filtered = prev.filter(p => p.id !== candidate.id);
        // Adjust current index if needed to stay in bounds
        if (currentIndex >= filtered.length && filtered.length > 0) {
          setCurrentIndex(filtered.length - 1);
        }
        return filtered;
      });
      setShortlist(prev => {
        const candidateWithTimestamp = {
          ...candidate,
          status: 'shortlisted' as const,
          shortlistedAt: new Date(),
        };
        const updated = [...prev, candidateWithTimestamp];
        // Persist to backend - send full objects with timestamp
        onShortlistChange?.(updated);
        return updated;
      });
      setAnimation('idle');
    }, 300);
  }, [currentIndex, onShortlistChange]);

  // Handle dismissing a prospect
  const handleDismiss = useCallback((candidate: ManagedCandidate) => {
    setProspects(prev => {
      const filtered = prev.filter(p => p.id !== candidate.id);
      // Adjust current index if needed to stay in bounds
      if (currentIndex >= filtered.length && filtered.length > 0) {
        setCurrentIndex(filtered.length - 1);
      }
      return filtered;
    });

    // Add to denied list with timestamp and persist
    const candidateWithTimestamp = {
      ...candidate,
      status: 'dismissed' as const,
      dismissedAt: new Date(),
    };

    // Persist to backend - send full object array (append to existing)
    const updatedDenied = [...(deniedCandidates || []), candidateWithTimestamp];
    onDeniedChange?.(updatedDenied);
  }, [currentIndex, deniedCandidates, onDeniedChange]);

  // Handle promoting to primary (the "install" action)
  const handlePromote = useCallback((candidate: ManagedCandidate) => {
    setAnimation('installing-primary');

    setTimeout(() => {
      let updatedShortlist: ManagedCandidate[];

      // If there's a current primary, move it back to shortlist
      if (primary) {
        setShortlist(prev => {
          updatedShortlist = [
            { ...primary, status: 'shortlisted', shortlistedAt: new Date() },
            ...prev.filter(p => p.id !== candidate.id),
          ];
          // Sync to parent
          onShortlistChange?.(updatedShortlist);
          return updatedShortlist;
        });
      } else {
        setShortlist(prev => {
          updatedShortlist = prev.filter(p => p.id !== candidate.id);
          // Sync to parent
          onShortlistChange?.(updatedShortlist);
          return updatedShortlist;
        });
      }

      // Set new primary
      const newPrimary: ManagedCandidate = {
        ...candidate,
        status: 'primary',
        promotedAt: new Date(),
      };
      setPrimary(newPrimary);

      // Call parent callback to select this candidate
      onSelect(candidate);

      setAnimation('idle');
    }, 800);
  }, [primary, onSelect, onShortlistChange]);

  // Handle removing from shortlist
  const handleRemoveFromShortlist = useCallback((candidate: ManagedCandidate) => {
    setShortlist(prev => {
      const updated = prev.filter(p => p.id !== candidate.id);
      onShortlistChange?.(updated);
      return updated;
    });
    // Clear focused item if it was removed
    if (focusedShortlistItem?.id === candidate.id) {
      setFocusedShortlistItem(null);
    }
  }, [onShortlistChange, focusedShortlistItem]);

  // Handle hot-swap: bring shortlist item to focus
  const handleFocusShortlistItem = useCallback((candidate: ManagedCandidate) => {
    setFocusedShortlistItem(candidate);
  }, []);

  // Handle return to discovery stack
  const handleReturnToStack = useCallback(() => {
    setFocusedShortlistItem(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling to parent handlers
        e.stopImmediatePropagation(); // Stop other handlers on same element
        onClose();
      }
      if (e.key === '1') setMode('feed');
      if (e.key === '2') setMode('compare');
    };

    // Use capture phase to intercept before other handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed top-0 bottom-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col",
        // Start from left edge on mobile, after sidebar handle on desktop (48px)
        "left-0 lg:left-[48px]",
        isChatMinimized ? "right-0" : "lg:right-[400px] right-0"
      )}
    >
      {/* CRT Scanline overlay effect */}
      <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,240,255,0.03)_2px,rgba(0,240,255,0.03)_4px)] z-10" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 px-4 lg:px-6 py-4 flex items-center justify-between border-b border-border/30"
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Exit Scanner</span>
        </button>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30">
          <button
            onClick={() => setMode('feed')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === 'feed'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Feed</span>
          </button>
          <button
            onClick={() => setMode('compare')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === 'compare'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <GitCompare className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-muted/50 text-muted-foreground">
            {prospects.length} prospects
          </span>
          <span className="px-3 py-1 rounded-full bg-warning/20 text-warning">
            {shortlist.length} shortlisted
          </span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {mode === 'feed' ? (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={springConfig}
              className="flex-1 flex flex-col"
            >
              {/* Prospect Feed */}
              <ProspectFeed
                prospects={prospects}
                onLike={handleLike}
                onDismiss={handleDismiss}
                currentIndex={currentIndex}
                onIndexChange={setCurrentIndex}
                focusedShortlistItem={focusedShortlistItem}
                onReturnToStack={handleReturnToStack}
              />

              {/* Action Buttons - Hidden when viewing focused shortlist item or no prospects */}
              {!focusedShortlistItem && prospects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative z-20 p-4 lg:p-6 flex items-center justify-center gap-6"
                >
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className={cn(
                    "p-3 rounded-full transition-all",
                    currentIndex === 0
                      ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const current = prospects[currentIndex];
                    if (current) handleDismiss(current);
                  }}
                  disabled={currentIndex >= prospects.length}
                  className="p-5 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/40 border-2 border-destructive text-destructive hover:neon-glow-magenta transition-all disabled:opacity-50"
                >
                  <X className="w-8 h-8" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const current = prospects[currentIndex];
                    if (current) handleLike(current);
                  }}
                  disabled={currentIndex >= prospects.length}
                  className="p-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-primary text-primary hover:neon-glow-cyan transition-all disabled:opacity-50"
                >
                  <Heart className="w-8 h-8" />
                </motion.button>

                <button
                  onClick={() => setCurrentIndex(Math.min(prospects.length - 1, currentIndex + 1))}
                  disabled={currentIndex >= prospects.length - 1}
                  className={cn(
                    "p-3 rounded-full transition-all",
                    currentIndex >= prospects.length - 1
                      ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
              )}

              {/* Shortlist Gallery */}
              <ShortlistGallery
                shortlist={shortlist}
                primaryId={primary?.id || null}
                onPromote={handlePromote}
                onRemove={handleRemoveFromShortlist}
                onFocus={handleFocusShortlistItem}
                isInstalling={animation === 'installing-primary'}
                focusedItemId={focusedShortlistItem?.id || null}
              />
            </motion.div>
          ) : (
            <motion.div
              key="compare"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={springConfig}
              className="flex-1 flex flex-col"
            >
              <CompareView
                primary={primary}
                shortlist={shortlist}
                onPromote={handlePromote}
                onRemove={handleRemoveFromShortlist}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Warp Animation Overlay */}
        <AnimatePresence>
          {animation === 'warp-to-shortlist' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 1, y: 0 }}
                animate={{ scale: 0.3, y: 300 }}
                transition={{ duration: 0.3, ease: 'easeIn' }}
                className="w-32 h-40 rounded-xl bg-primary/30 backdrop-blur-sm border-2 border-primary"
                style={{
                  boxShadow: '0 0 30px rgba(0, 240, 255, 0.8)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Installing Primary Overlay */}
        <AnimatePresence>
          {animation === 'installing-primary' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="text-center"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(0, 240, 255, 0.5)',
                      '0 0 80px rgba(0, 240, 255, 1)',
                      '0 0 20px rgba(0, 240, 255, 0.5)',
                    ],
                  }}
                  transition={{ duration: 0.4, repeat: 2 }}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary/90 backdrop-blur-lg"
                >
                  <Zap className="w-6 h-6 text-primary-foreground animate-pulse" />
                  <span className="font-heading text-xl font-bold text-primary-foreground">
                    INSTALLING PRIMARY
                  </span>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CandidateScanner;
