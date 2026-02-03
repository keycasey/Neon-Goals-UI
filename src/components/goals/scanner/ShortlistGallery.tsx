import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crown, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagedCandidate } from '@/types/candidates';

interface ShortlistGalleryProps {
  shortlist: ManagedCandidate[];
  primaryId: string | null;
  onPromote: (candidate: ManagedCandidate) => void;
  onRemove: (candidate: ManagedCandidate) => void;
  onFocus?: (candidate: ManagedCandidate) => void;
  isInstalling: boolean;
  focusedItemId?: string | null;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const ShortlistGallery: React.FC<ShortlistGalleryProps> = ({
  shortlist,
  primaryId,
  onPromote,
  onRemove,
  onFocus,
  isInstalling,
  focusedItemId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position
  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10); // Small threshold to account for rounding
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  // Check scroll on mount and when shortlist changes
  useEffect(() => {
    checkScroll();
  }, [shortlist.length, checkScroll]);

  // Also check on scroll and resize
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => checkScroll();
    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (shortlist.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center border-t border-border/30 bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Swipe right on prospects to add them to your shortlist
        </p>
      </div>
    );
  }

  return (
    <div className="relative border-t border-border/30 bg-muted/20">
      {/* Installing Overlay */}
      <AnimatePresence>
        {isInstalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0, 240, 255, 0.5)',
                  '0 0 60px rgba(0, 240, 255, 0.8)',
                  '0 0 20px rgba(0, 240, 255, 0.5)',
                ],
              }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="px-6 py-3 rounded-xl bg-primary/90 backdrop-blur-lg"
            >
              <span className="font-heading text-lg font-bold text-primary-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 animate-pulse" />
                SYNCING DATA...
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient Overlays & Scroll Controls */}
      {shortlist.length > 3 && (
        <>
          {/* Left Gradient & Chevron */}
          <div className={cn(
            "absolute left-0 top-0 bottom-0 z-10 flex items-center pointer-events-none transition-opacity duration-200",
            !canScrollLeft && "opacity-0"
          )}>
            <div className="relative h-full">
              {/* Gradient overlay */}
              <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-muted/20 to-transparent pointer-events-none" />
              {/* Chevron button on opaque portion */}
              <button
                onClick={() => scroll('left')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors pointer-events-auto"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Gradient & Chevron */}
          <div className={cn(
            "absolute right-0 top-0 bottom-0 z-10 flex items-center pointer-events-none transition-opacity duration-200",
            !canScrollRight && "opacity-0"
          )}>
            <div className="relative h-full">
              {/* Gradient overlay */}
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-muted/20 to-transparent pointer-events-none" />
              {/* Chevron button on opaque portion */}
              <button
                onClick={() => scroll('right')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors pointer-events-auto"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Gallery Label */}
      <div className="px-4 py-2 border-b border-border/30">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" />
          Shortlist ({shortlist.length})
          <span className="text-xs text-muted-foreground/70 ml-2">
            Tap to focus • Double-tap to promote
          </span>
        </h4>
      </div>

      {/* Scrollable Gallery */}
      <div
        ref={scrollRef}
        className="flex gap-3 p-4 overflow-x-auto scrollbar-hide"
      >
        <AnimatePresence mode="popLayout">
          {shortlist.map((candidate, index) => (
            <ShortlistCard
              key={candidate.id}
              candidate={candidate}
              isPrimary={candidate.id === primaryId}
              isFocused={candidate.id === focusedItemId}
              onPromote={() => onPromote(candidate)}
              onRemove={() => onRemove(candidate)}
              onFocus={onFocus ? () => onFocus(candidate) : undefined}
              index={index}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Individual Shortlist Card
interface ShortlistCardProps {
  candidate: ManagedCandidate;
  isPrimary: boolean;
  isFocused: boolean;
  onPromote: () => void;
  onRemove: () => void;
  onFocus?: () => void;
  index: number;
}

const ShortlistCard: React.FC<ShortlistCardProps> = ({
  candidate,
  isPrimary,
  isFocused,
  onPromote,
  onRemove,
  onFocus,
  index,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, x: 50 }}
      animate={{
        opacity: 1,
        scale: isFocused ? 1.1 : 1,
        x: 0
      }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ ...springConfig, delay: index * 0.05 }}
      onClick={onFocus}
      onDoubleClick={onPromote}
      className={cn(
        "relative flex-shrink-0 w-36 rounded-xl overflow-hidden cursor-pointer transition-all group",
        isPrimary && "ring-2 ring-primary neon-glow-cyan",
        isFocused && "ring-2 ring-warning neon-glow-yellow scale-110",
        !isPrimary && !isFocused && "glass-card hover:scale-105"
      )}
    >
      {/* Primary Crown */}
      {isPrimary && (
        <div className="absolute top-1 left-1 z-10">
          <Crown className="w-4 h-4 text-primary fill-primary" />
        </div>
      )}

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/80 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
      >
        <span className="text-xs">✕</span>
      </button>

      {/* Image */}
      <div className="aspect-square overflow-hidden">
        <img
          src={candidate.image}
          alt={candidate.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Info */}
      <div className="p-2 bg-background/90">
        <p className="text-xs font-medium text-foreground line-clamp-1">
          {candidate.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-bold neon-text-cyan">
            ${candidate.price}
          </span>
          {candidate.rating && (
            <span className="text-xs text-warning flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-current" />
              {Math.round(candidate.rating * 10) / 10}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ShortlistGallery;
