import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Trash2, Archive, TrendingDown, Package, Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemGoal } from '@/types/goals';
import { ScannerPlaceholder } from './ScannerPlaceholder';
import { useAppStore } from '@/store/useAppStore';

interface ItemGoalCardProps {
  goal: ItemGoal;
  onViewDetail: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onArchive: (goalId: string) => void;
  onSearch?: (goalId: string) => void;
  animationIndex: number;
}

const statusConfig = {
  'in_stock': { label: 'In Stock', class: 'badge-success' },
  'in-stock': { label: 'In Stock', class: 'badge-success' },
  'price_drop': { label: 'Price Drop!', class: 'badge-warning' },
  'price-drop': { label: 'Price Drop!', class: 'badge-warning' },
  'pending_search': { label: 'Searching...', class: 'badge-info' },
  'pending-search': { label: 'Searching...', class: 'badge-info' },
};

export const ItemGoalCard: React.FC<ItemGoalCardProps> = ({
  goal,
  onViewDetail,
  onDelete,
  onArchive,
  onSearch,
  animationIndex,
}) => {
  const { goals } = useAppStore();
  const [isSearching, setIsSearching] = useState(false);

  const latestGoal = useMemo(() => {
    const found = goals.find(g => g.id === goal.id);
    return (found as ItemGoal) || goal;
  }, [goals, goal.id]);

  const hasValidSelection = useMemo(() => {
    if (!latestGoal.selectedCandidateId) return false;
    return latestGoal.candidates?.some(c => c.id === latestGoal.selectedCandidateId) ?? false;
  }, [latestGoal.selectedCandidateId, latestGoal.candidates]);

  const candidateCount = useMemo(() => {
    if (!latestGoal.candidates) return 0;
    const deniedIds = (latestGoal.deniedCandidates || []).map(c => c.id);
    const shortlistedIds = (latestGoal.shortlistedCandidates || []).map(c => c.id);
    return latestGoal.candidates.filter(c =>
      !deniedIds.includes(c.id) && !shortlistedIds.includes(c.id)
    ).length;
  }, [latestGoal.candidates, latestGoal.deniedCandidates, latestGoal.shortlistedCandidates]);

  const isSearchingState = latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search';
  const hasNoResults = !isSearchingState && candidateCount === 0 && !hasValidSelection && latestGoal.candidates && latestGoal.candidates.length === 0;
  const status = statusConfig[latestGoal.statusBadge];
  const shouldAnimate = animationIndex >= 0;

  const handleSearch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSearch || isSearching) return;
    setIsSearching(true);
    try {
      await onSearch(goal.id);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 30 } : { opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: shouldAnimate ? animationIndex * 0.03 : 0,
      }}
      whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card hover-lift cursor-pointer group relative"
      onClick={() => onViewDetail(latestGoal.id)}
    >
      {/* Image Section */}
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        {/* No results: TV static */}
        {hasNoResults ? (
          <ScannerPlaceholder
            status="no_results"
            signalCount={0}
            className="h-full"
          />
        ) : !latestGoal.productImage ||
           latestGoal.productImage?.includes('unsplash.com') ||
           !hasValidSelection ||
           isSearchingState ? (
          <ScannerPlaceholder
            status={
              isSearchingState
                ? 'initiating'
                : hasValidSelection
                ? 'acquired'
                : candidateCount > 0
                ? 'decoding'
                : 'initiating'
            }
            signalCount={candidateCount}
            className="h-full"
          />
        ) : (
          <>
            <img
              src={latestGoal.productImage}
              alt={latestGoal.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

            {/* TARGET ACQUIRED overlay on product image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(0, 240, 255, 0.5)',
                    '0 0 60px rgba(0, 240, 255, 0.8)',
                    '0 0 20px rgba(0, 240, 255, 0.5)',
                  ],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="px-4 py-2 rounded-lg bg-background/70 backdrop-blur-sm border border-primary/50"
              >
                <motion.span
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="font-mono font-bold text-sm tracking-wider text-primary neon-text-cyan block"
                >
                  TARGET ACQUIRED
                </motion.span>
              </motion.div>
            </div>
          </>
        )}

        {/* Quick Actions - absolute top-right, doesn't affect layout */}
        <div className="absolute top-3 right-3 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(latestGoal.id); }}
            className="p-3 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-warning transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(latestGoal.id); }}
            className="p-3 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground truncate mb-1">
          {latestGoal.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate mb-3">
          {latestGoal.description}
        </p>

        {/* Search Button - styled as searching badge when in searching state */}
        {onSearch && (
          <button
            onClick={handleSearch}
            disabled={isSearching || isSearchingState}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all mb-3",
              isSearching || isSearchingState
                ? "bg-[hsl(var(--primary)/0.15)] text-primary/60 cursor-not-allowed border border-primary/20"
                : "bg-primary/20 text-primary hover:bg-primary/30 hover:scale-105"
            )}
          >
            {isSearching || isSearchingState ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="animate-pulse">Scanning...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search for better prices
              </>
            )}
          </button>
        )}

        {/* Price & Buy */}
        <div className="pt-3 border-t border-border/30">
          {hasValidSelection ? (
            <>
              <p className="text-2xl font-heading font-bold neon-text-cyan mb-2">
                {latestGoal.currency === 'USD' ? '$' : latestGoal.currency}
                {latestGoal.bestPrice.toLocaleString()}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  {/* Status Badge - vertically centered with price */}
                  {status && !isSearchingState && (
                    <span className={cn(status.class, "flex items-center gap-1 w-fit mb-1")}>
                      {(latestGoal.statusBadge === 'price_drop' || latestGoal.statusBadge === 'price-drop') && <TrendingDown className="w-3 h-3" />}
                      {(latestGoal.statusBadge === 'in_stock' || latestGoal.statusBadge === 'in-stock') && <Package className="w-3 h-3" />}
                      {status.label}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Best price at
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {latestGoal.retailerName}
                  </p>
                </div>
                <a
                  href={latestGoal.retailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-neon text-primary-foreground font-medium text-sm transition-all hover:scale-105 neon-glow-cyan"
                >
                  Buy
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="text-2xl font-heading font-bold text-muted-foreground/50 mb-2">
                TBD
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground pr-4">
                    Select an option to see details
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
