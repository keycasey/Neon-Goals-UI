import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Trash2, Archive, TrendingDown, Package, Clock, Search, RefreshCw } from 'lucide-react';
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

  // Get the latest goal from store to ensure reactivity
  const latestGoal = useMemo(() => {
    const found = goals.find(g => g.id === goal.id);
    return (found as ItemGoal) || goal;
  }, [goals, goal.id]);

  // Verify the selected candidate actually exists (not stale)
  const hasValidSelection = useMemo(() => {
    if (!latestGoal.selectedCandidateId) return false;
    return latestGoal.candidates?.some(c => c.id === latestGoal.selectedCandidateId) ?? false;
  }, [latestGoal.selectedCandidateId, latestGoal.candidates]);

  // Calculate candidate count (only main scanner candidates, exclude denied and shortlisted)
  const candidateCount = (() => {
    if (!latestGoal.candidates) return 0;

    const deniedIds = (latestGoal.deniedCandidates || []).map(c => c.id);
    const shortlistedIds = ((latestGoal as ItemGoal).shortlistedCandidates || []).map(c => c.id);

    // Count only main scanner candidates (excluding denied and shortlisted)
    return latestGoal.candidates.filter(c =>
      !deniedIds.includes(c.id) && !shortlistedIds.includes(c.id)
    ).length;
  })();

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
        delay: shouldAnimate ? animationIndex * 0.08 : 0,
      }}
      whileHover={{ y: -4, scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card hover-lift cursor-pointer group"
      onClick={() => onViewDetail(latestGoal.id)}
    >
      {/* Image Section */}
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        {/* Show scanner placeholder when: no valid selection, no image, placeholder image, or searching */}
        {!latestGoal.productImage ||
         latestGoal.productImage?.includes('unsplash.com') ||
         !hasValidSelection ||
         latestGoal.statusBadge === 'pending_search' ||
         latestGoal.statusBadge === 'pending-search' ? (
          <ScannerPlaceholder
            status={
              latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search'
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
          </>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {status ? (
            <span className={cn(status.class, "flex items-center gap-1")}>
              {(latestGoal.statusBadge === 'price_drop' || latestGoal.statusBadge === 'price-drop') && <TrendingDown className="w-3 h-3" />}
              {(latestGoal.statusBadge === 'in_stock' || latestGoal.statusBadge === 'in-stock') && <Package className="w-3 h-3" />}
              {(latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search') && <Clock className="w-3 h-3" />}
              {status.label}
            </span>
          ) : null}
        </div>

        {/* Quick Actions */}
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

        {/* Search Button */}
        {onSearch && (
          <button
            onClick={handleSearch}
            disabled={isSearching || latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search'}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all mb-3",
              isSearching || latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search'
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary/20 text-primary hover:bg-primary/30 hover:scale-105"
            )}
          >
            {isSearching || latestGoal.statusBadge === 'pending_search' || latestGoal.statusBadge === 'pending-search' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Searching...
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
        <div className="pt-3 border-t border-border/30 space-y-2">
          {hasValidSelection ? (
            <>
              <p className="text-2xl font-heading font-bold neon-text-cyan">
                {latestGoal.currency === 'USD' ? '$' : latestGoal.currency}
                {latestGoal.bestPrice.toLocaleString()}
              </p>
              <div className="flex items-center justify-between">
                <div>
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
            <div className="h-16 flex items-center justify-center text-muted-foreground/50 text-sm">
              Select an option to see details
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
