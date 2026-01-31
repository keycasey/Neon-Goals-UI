import React from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { X, Heart, Package, Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ManagedCandidate } from '@/types/candidates';

interface ProspectFeedProps {
  prospects: ManagedCandidate[];
  onLike: (candidate: ManagedCandidate) => void;
  onDismiss: (candidate: ManagedCandidate) => void;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export const ProspectFeed: React.FC<ProspectFeedProps> = ({
  prospects,
  onLike,
  onDismiss,
  currentIndex,
  onIndexChange,
}) => {
  const visibleCards = prospects.slice(currentIndex, currentIndex + 3);

  const handleSwipe = (direction: 'left' | 'right', candidate: ManagedCandidate) => {
    if (direction === 'right') {
      onLike(candidate);
    } else {
      onDismiss(candidate);
    }
    // Move to next card
    if (currentIndex < prospects.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  if (prospects.length === 0 || currentIndex >= prospects.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">Feed Empty</p>
          <p className="text-sm text-muted-foreground">No more prospects to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex items-center justify-center">
      <div className="relative w-full max-w-md aspect-[3/4]">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((candidate, stackIndex) => (
            <ProspectCard
              key={candidate.id}
              candidate={candidate}
              stackIndex={stackIndex}
              isActive={stackIndex === 0}
              onSwipe={(dir) => handleSwipe(dir, candidate)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Individual Prospect Card
interface ProspectCardProps {
  candidate: ManagedCandidate;
  stackIndex: number;
  isActive: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
}

const ProspectCard: React.FC<ProspectCardProps> = ({
  candidate,
  stackIndex,
  isActive,
  onSwipe,
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  const stackScale = 1 - stackIndex * 0.05;
  const stackY = stackIndex * 12;

  return (
    <motion.div
      style={{
        x: isActive ? x : 0,
        rotate: isActive ? rotate : 0,
        zIndex: 10 - stackIndex,
      }}
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{
        opacity: 1 - stackIndex * 0.2,
        scale: stackScale,
        y: stackY,
      }}
      exit={{
        opacity: 0,
        x: 300,
        rotate: 15,
        transition: { duration: 0.3 },
      }}
      transition={springConfig}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute inset-0 glass-card rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing",
        isActive && "neon-border"
      )}
    >
      {/* Swipe Indicators */}
      {isActive && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 right-6 z-20 px-4 py-2 rounded-xl bg-primary/90 text-primary-foreground font-heading font-bold text-lg rotate-12 border-2 border-primary"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-6 left-6 z-20 px-4 py-2 rounded-xl bg-destructive/90 text-destructive-foreground font-heading font-bold text-lg -rotate-12 border-2 border-destructive"
          >
            NOPE
          </motion.div>
        </>
      )}

      {/* Image */}
      <div className="h-[50%] relative overflow-hidden">
        <img
          src={candidate.image}
          alt={candidate.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* New Badge */}
        {candidate.isNew && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-full bg-accent/90 text-accent-foreground text-xs font-bold animate-pulse">
              NEW
            </span>
          </div>
        )}

        {/* Condition Badge */}
        {candidate.condition && (
          <div className="absolute top-3 right-3">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              candidate.condition === 'new' && "bg-success/20 text-success border border-success/30",
              candidate.condition === 'refurbished' && "bg-warning/20 text-warning border border-warning/30",
              candidate.condition === 'used' && "bg-muted/50 text-muted-foreground border border-border"
            )}>
              {candidate.condition.charAt(0).toUpperCase() + candidate.condition.slice(1)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-heading text-lg font-bold text-foreground line-clamp-2">
            {candidate.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" />
            {candidate.retailer}
          </p>
        </div>

        <div className="flex items-end justify-between">
          <p className="text-3xl font-heading font-bold neon-text-cyan">
            ${candidate.price.toLocaleString()}
          </p>

          {candidate.rating && (
            <div className="flex items-center gap-1 text-warning">
              <Star className="w-4 h-4 fill-current" />
              <span className="font-medium text-sm">{candidate.rating}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {candidate.features && candidate.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {candidate.features.slice(0, 2).map((feature, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-muted/50 text-xs text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProspectFeed;
