import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Heart, X, Star, ExternalLink, Package, RefreshCw, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductCandidate } from '@/types/goals';

interface CandidateStackProps {
  candidates: ProductCandidate[];
  onSelect: (candidate: ProductCandidate) => void;
  onDismiss: (candidate: ProductCandidate) => void;
  selectedId?: string;
  onClose: () => void;
}

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

export const CandidateStack: React.FC<CandidateStackProps> = ({
  candidates,
  onSelect,
  onDismiss,
  selectedId,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(selectedId || null);
  const [showTargetAcquired, setShowTargetAcquired] = useState(false);
  
  // Filter out dismissed candidates
  const activeCandidates = candidates.filter(c => !dismissed.has(c.id));
  const currentCandidate = activeCandidates[currentIndex];
  
  const handleSwipe = useCallback((direction: 'left' | 'right', candidate: ProductCandidate) => {
    if (direction === 'right') {
      // Like - select this candidate
      setSelected(candidate.id);
      setShowTargetAcquired(true);
      setTimeout(() => {
        setShowTargetAcquired(false);
        onSelect(candidate);
      }, 1200);
    } else {
      // Dismiss
      setDismissed(prev => new Set([...prev, candidate.id]));
      onDismiss(candidate);
      
      // Move to next if we dismissed the current one
      if (currentIndex >= activeCandidates.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    }
  }, [currentIndex, activeCandidates.length, onSelect, onDismiss]);
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < activeCandidates.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (activeCandidates.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-full p-8 text-center"
      >
        <RefreshCw className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
          No more candidates
        </h3>
        <p className="text-muted-foreground mb-6">
          You've reviewed all available options
        </p>
        <button
          onClick={onClose}
          className="px-6 py-3 rounded-xl bg-gradient-neon text-primary-foreground font-semibold"
        >
          Close Scanner
        </button>
      </motion.div>
    );
  }

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
        className="relative z-20 px-6 py-4 flex items-center justify-between border-b border-border/30"
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="text-sm">Exit Scanner</span>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
            {currentIndex + 1} / {activeCandidates.length}
          </span>
        </div>
      </motion.div>
      
      {/* Main Stack Area */}
      <div className="flex-1 relative overflow-hidden p-6 lg:p-12">
        {/* Card Stack */}
        <div className="relative h-full max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {activeCandidates.slice(currentIndex, currentIndex + 3).map((candidate, stackIndex) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                stackIndex={stackIndex}
                isActive={stackIndex === 0}
                isSelected={selected === candidate.id}
                onSwipe={(dir) => handleSwipe(dir, candidate)}
              />
            ))}
          </AnimatePresence>
        </div>
        
        {/* Target Acquired Animation */}
        <AnimatePresence>
          {showTargetAcquired && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
            >
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(0, 240, 255, 0.5)',
                    '0 0 60px rgba(0, 240, 255, 0.8)',
                    '0 0 20px rgba(0, 240, 255, 0.5)',
                  ]
                }}
                transition={{ duration: 0.6, repeat: 1 }}
                className="px-8 py-4 rounded-2xl bg-primary/90 backdrop-blur-lg"
              >
                <span className="font-heading text-2xl font-bold text-primary-foreground flex items-center gap-3">
                  <Zap className="w-7 h-7" />
                  TARGET ACQUIRED
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Action Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 p-6 flex items-center justify-center gap-6"
      >
        {/* Navigation */}
        <button
          onClick={handlePrev}
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
        
        {/* Dismiss Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => currentCandidate && handleSwipe('left', currentCandidate)}
          className="p-5 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/40 border-2 border-destructive text-destructive hover:neon-glow-magenta transition-all"
        >
          <X className="w-8 h-8" />
        </motion.button>
        
        {/* Select Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => currentCandidate && handleSwipe('right', currentCandidate)}
          className="p-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-primary text-primary hover:neon-glow-cyan transition-all"
        >
          <Heart className="w-8 h-8" />
        </motion.button>
        
        {/* Navigation */}
        <button
          onClick={handleNext}
          disabled={currentIndex >= activeCandidates.length - 1}
          className={cn(
            "p-3 rounded-full transition-all",
            currentIndex >= activeCandidates.length - 1
              ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
              : "bg-muted/50 text-foreground hover:bg-muted"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
};

// Individual Candidate Card with swipe gesture
interface CandidateCardProps {
  candidate: ProductCandidate;
  stackIndex: number;
  isActive: boolean;
  isSelected: boolean;
  onSwipe: (direction: 'left' | 'right') => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  stackIndex,
  isActive,
  isSelected,
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
  
  // Stack offset calculations
  const stackScale = 1 - stackIndex * 0.05;
  const stackY = stackIndex * 15;
  const stackBlur = stackIndex > 0 ? 2 : 0;
  
  return (
    <motion.div
      style={{ 
        x: isActive ? x : 0, 
        rotate: isActive ? rotate : 0,
        zIndex: 10 - stackIndex,
      }}
      initial={{ 
        opacity: 0, 
        scale: 0.8, 
        y: 50 
      }}
      animate={{ 
        opacity: 1 - stackIndex * 0.2, 
        scale: stackScale, 
        y: stackY,
        filter: `blur(${stackBlur}px)`,
      }}
      exit={{ 
        opacity: 0,
        x: isSelected ? 300 : -300,
        rotate: isSelected ? 15 : -15,
        transition: { duration: 0.3 }
      }}
      transition={springConfig}
      drag={isActive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className={cn(
        "absolute inset-0 glass-card rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing",
        isActive && "neon-border"
      )}
    >
      {/* Swipe Indicators */}
      {isActive && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 right-8 z-20 px-6 py-3 rounded-xl bg-primary/90 text-primary-foreground font-heading font-bold text-xl rotate-12 border-2 border-primary"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-8 left-8 z-20 px-6 py-3 rounded-xl bg-destructive/90 text-destructive-foreground font-heading font-bold text-xl -rotate-12 border-2 border-destructive"
          >
            NOPE
          </motion.div>
        </>
      )}
      
      {/* Image */}
      <div className="h-[45%] relative overflow-hidden">
        <img
          src={candidate.image}
          alt={candidate.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Condition Badge */}
        {candidate.condition && (
          <div className="absolute top-4 left-4">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              candidate.condition === 'new' && "bg-success/20 text-success border border-success/30",
              candidate.condition === 'refurbished' && "bg-warning/20 text-warning border border-warning/30",
              candidate.condition === 'used' && "bg-muted/50 text-muted-foreground border border-border"
            )}>
              {candidate.condition.charAt(0).toUpperCase() + candidate.condition.slice(1)}
            </span>
          </div>
        )}
        
        {/* Savings Badge */}
        {candidate.savings && candidate.savings > 0 && (
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-accent/20 text-accent border border-accent/30 text-xs font-medium">
              Save ${candidate.savings}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Title & Retailer */}
        <div>
          <h3 className="font-heading text-xl font-bold text-foreground line-clamp-2 mb-1">
            {candidate.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Package className="w-4 h-4" />
            {candidate.retailer}
          </p>
        </div>
        
        {/* Price */}
        <div className="flex items-end justify-between">
          <p className="text-4xl font-heading font-bold neon-text-cyan">
            ${candidate.price.toLocaleString()}
          </p>
          
          {candidate.rating && (
            <div className="flex items-center gap-1.5 text-warning">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-medium">{candidate.rating}</span>
              {candidate.reviewCount && (
                <span className="text-xs text-muted-foreground">
                  ({candidate.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Features */}
        {candidate.features && candidate.features.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidate.features.slice(0, 3).map((feature, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
        
        {/* Delivery & Stock */}
        <div className="flex items-center justify-between text-sm">
          {candidate.estimatedDelivery && (
            <span className="text-muted-foreground">
              📦 {candidate.estimatedDelivery}
            </span>
          )}
          {candidate.inStock !== undefined && (
            <span className={cn(
              "font-medium",
              candidate.inStock ? "text-success" : "text-destructive"
            )}>
              {candidate.inStock ? '✓ In Stock' : '✗ Out of Stock'}
            </span>
          )}
        </div>
        
        {/* View Link */}
        <a
          href={candidate.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-muted/50 text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View on {candidate.retailer}
        </a>
      </div>
    </motion.div>
  );
};

export default CandidateStack;
