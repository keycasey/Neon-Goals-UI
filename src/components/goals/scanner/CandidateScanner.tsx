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
  onSelect: (candidate: ProductCandidate) => void;
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
  onSelect,
  onClose,
}) => {
  const [mode, setMode] = useState<'feed' | 'compare'>('feed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animation, setAnimation] = useState<ScannerAnimation>('idle');

  // Initialize candidates with status
  const [prospects, setProspects] = useState<ManagedCandidate[]>(() =>
    candidates
      .filter(c => c.id !== selectedCandidateId)
      .map(c => toManagedCandidate(c, 'prospect'))
  );

  const [shortlist, setShortlist] = useState<ManagedCandidate[]>([]);
  const [primary, setPrimary] = useState<ManagedCandidate | null>(() => {
    if (selectedCandidateId) {
      const selected = candidates.find(c => c.id === selectedCandidateId);
      return selected ? toManagedCandidate(selected, 'primary') : null;
    }
    return null;
  });

  // Handle liking a prospect (moves to shortlist with warp animation)
  const handleLike = useCallback((candidate: ManagedCandidate) => {
    setAnimation('warp-to-shortlist');

    // Brief delay for animation
    setTimeout(() => {
      setProspects(prev => prev.filter(p => p.id !== candidate.id));
      setShortlist(prev => [
        ...prev,
        { ...candidate, status: 'shortlisted', shortlistedAt: new Date() },
      ]);
      setAnimation('idle');
    }, 300);
  }, []);

  // Handle dismissing a prospect
  const handleDismiss = useCallback((candidate: ManagedCandidate) => {
    setProspects(prev => prev.filter(p => p.id !== candidate.id));
  }, []);

  // Handle promoting to primary (the "install" action)
  const handlePromote = useCallback((candidate: ManagedCandidate) => {
    setAnimation('installing-primary');

    setTimeout(() => {
      // If there's a current primary, move it back to shortlist
      if (primary) {
        setShortlist(prev => [
          { ...primary, status: 'shortlisted', shortlistedAt: new Date() },
          ...prev.filter(p => p.id !== candidate.id),
        ]);
      } else {
        setShortlist(prev => prev.filter(p => p.id !== candidate.id));
      }

      // Set new primary
      const newPrimary: ManagedCandidate = {
        ...candidate,
        status: 'primary',
        promotedAt: new Date(),
      };
      setPrimary(newPrimary);

      // Call parent callback
      onSelect(candidate);

      setAnimation('idle');
    }, 800);
  }, [primary, onSelect]);

  // Handle removing from shortlist
  const handleRemoveFromShortlist = useCallback((candidate: ManagedCandidate) => {
    setShortlist(prev => prev.filter(p => p.id !== candidate.id));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '1') setMode('feed');
      if (e.key === '2') setMode('compare');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex flex-col"
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
              />

              {/* Action Buttons */}
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

              {/* Shortlist Gallery */}
              <ShortlistGallery
                shortlist={shortlist}
                primaryId={primary?.id || null}
                onPromote={handlePromote}
                onRemove={handleRemoveFromShortlist}
                isInstalling={animation === 'installing-primary'}
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
