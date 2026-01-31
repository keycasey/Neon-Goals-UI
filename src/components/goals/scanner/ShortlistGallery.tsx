import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Crown, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagedCandidate } from '@/types/candidates';

interface ShortlistGalleryProps {
  shortlist: ManagedCandidate[];
  primaryId: string | null;
  onPromote: (candidate: ManagedCandidate) => void;
  onRemove: (candidate: ManagedCandidate) => void;
  isInstalling: boolean;
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
  isInstalling,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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

      {/* Scroll Controls */}
      {shortlist.length > 3 && (
        <>
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Gallery Label */}
      <div className="px-4 py-2 border-b border-border/30">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" />
          Shortlist ({shortlist.length})
          <span className="text-xs text-muted-foreground/70 ml-2">
            Double-tap to promote to Primary
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
              onPromote={() => onPromote(candidate)}
              onRemove={() => onRemove(candidate)}
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
  onPromote: () => void;
  onRemove: () => void;
  index: number;
}

const ShortlistCard: React.FC<ShortlistCardProps> = ({
  candidate,
  isPrimary,
  onPromote,
  onRemove,
  index,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, x: 50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ ...springConfig, delay: index * 0.05 }}
      onDoubleClick={onPromote}
      className={cn(
        "relative flex-shrink-0 w-36 rounded-xl overflow-hidden cursor-pointer transition-all group",
        isPrimary
          ? "ring-2 ring-primary neon-glow-cyan"
          : "glass-card hover:scale-105"
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
              {candidate.rating}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ShortlistGallery;
