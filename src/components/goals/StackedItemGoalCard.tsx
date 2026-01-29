import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Trash2, Archive, TrendingDown, Package, Clock, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemGoal } from '@/types/goals';

interface StackedItemGoalCardProps {
  goals: ItemGoal[];
  onViewDetail: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onArchive: (goalId: string) => void;
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

const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const StackedItemGoalCard: React.FC<StackedItemGoalCardProps> = ({
  goals,
  onViewDetail,
  onDelete,
  onArchive,
  animationIndex,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldAnimate = animationIndex >= 0;
  
  // Sort by stackOrder
  const sortedGoals = [...goals].sort((a, b) => (a.stackOrder ?? 0) - (b.stackOrder ?? 0));
  const frontGoal = sortedGoals[0];
  const stackedGoals = sortedGoals.slice(1);
  
  // Calculate total price of stack
  const totalPrice = sortedGoals.reduce((sum, g) => sum + g.bestPrice, 0);
  
  const status = statusConfig[frontGoal.statusBadge];

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, scale: 0.8, y: 30 } : { opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        ...springConfig,
        delay: shouldAnimate ? animationIndex * 0.08 : 0,
      }}
      className="relative"
    >
      {/* Stacked cards behind (visible when collapsed) */}
      {!isExpanded && stackedGoals.map((_, idx) => (
        <motion.div
          key={`stack-shadow-${idx}`}
          className="absolute inset-0 glass-card rounded-lg"
          style={{
            transform: `translateY(${(idx + 1) * 6}px) scale(${1 - (idx + 1) * 0.02})`,
            zIndex: -idx - 1,
            opacity: 0.7 - idx * 0.2,
          }}
        />
      ))}

      {/* Main Card */}
      <motion.div
        whileHover={!isExpanded ? { y: -4, scale: 1.02, transition: springConfig } : undefined}
        whileTap={!isExpanded ? { scale: 0.98 } : undefined}
        className="glass-card hover-lift cursor-pointer group relative z-10"
        onClick={() => !isExpanded && onViewDetail(frontGoal.id)}
      >
        {/* Image Section */}
        <div className="relative h-40 overflow-hidden rounded-t-lg">
          <img
            src={frontGoal.productImage}
            alt={frontGoal.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {status ? (
              <span className={cn(status.class, "flex items-center gap-1")}>
                {frontGoal.statusBadge.includes('price') && <TrendingDown className="w-3 h-3" />}
                {frontGoal.statusBadge.includes('stock') && <Package className="w-3 h-3" />}
                {frontGoal.statusBadge.includes('pending') && <Clock className="w-3 h-3" />}
                {status.label}
              </span>
            ) : null}
          </div>

          {/* Stack Indicator */}
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-primary font-medium text-xs transition-all hover:bg-primary/20"
            >
              <Layers className="w-3.5 h-3.5" />
              {sortedGoals.length} items
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-heading font-semibold text-foreground truncate mb-1">
            {frontGoal.stackId?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? frontGoal.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate mb-3">
            {sortedGoals.length} items for your build
          </p>

          {/* Total Price */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-heading font-bold neon-text-cyan">
                ${totalPrice.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Total for all {sortedGoals.length} items
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/20 text-primary font-medium text-sm transition-all hover:bg-primary/30 hover:scale-105"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Expanded Stack Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springConfig}
            className="mt-3 space-y-2 overflow-hidden"
          >
            {sortedGoals.map((goal, idx) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ ...springConfig, delay: idx * 0.05 }}
                onClick={() => onViewDetail(goal.id)}
                className="glass-card p-3 flex items-center gap-3 cursor-pointer hover:neon-border transition-all group/item"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={goal.productImage}
                    alt={goal.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate text-sm">
                    {goal.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {goal.retailerName}
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="font-heading font-bold text-primary">
                    ${goal.bestPrice.toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                  <a
                    href={goal.retailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    aria-label="Buy"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); onArchive(goal.id); }}
                    className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-warning transition-colors"
                    aria-label="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
                    className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
