import React from 'react';
import { motion } from 'framer-motion';
import { Check, Search, AlertCircle, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal, ItemGoal } from '@/types/goals';

interface ComponentMatrixProps {
  parentGoal: ItemGoal;
  subgoals: Goal[];
  onSubgoalClick: (subgoalId: string) => void;
  className?: string;
}

/**
 * Component Matrix for Item Goals (Build View)
 * Shows item subgoals as square cards with Found/Missing status lights
 */
export const ComponentMatrix: React.FC<ComponentMatrixProps> = ({
  parentGoal,
  subgoals,
  onSubgoalClick,
  className,
}) => {
  const itemSubgoals = subgoals.filter(s => s.type === 'item') as ItemGoal[];
  const otherSubgoals = subgoals.filter(s => s.type !== 'item');

  // Calculate total build cost
  const totalCost = itemSubgoals.reduce((sum, item) => sum + (item.bestPrice || 0), 0);
  const foundCount = itemSubgoals.filter(item => item.selectedCandidateId).length;

  const getStatus = (item: ItemGoal): 'found' | 'searching' | 'missing' => {
    if (item.selectedCandidateId) return 'found';
    if (item.statusBadge === 'pending_search' || item.statusBadge === 'pending-search') return 'searching';
    if (item.candidates && item.candidates.length > 0) return 'searching';
    return 'missing';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Blueprint Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--neon-cyan)]/20 flex items-center justify-center">
            <Scan className="w-4 h-4 text-[var(--neon-cyan)]" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">Component Blueprint</h4>
            <p className="text-xs text-muted-foreground">
              {foundCount}/{itemSubgoals.length} components found
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-heading font-bold neon-text-cyan">
            ${totalCost.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">Total Build Cost</p>
        </div>
      </div>

      {/* Component Grid */}
      {itemSubgoals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {itemSubgoals.map((item, index) => {
            const status = getStatus(item);
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSubgoalClick(item.id)}
                className={cn(
                  "relative aspect-square p-3 rounded-xl border-2 transition-all group",
                  "flex flex-col items-center justify-center gap-2 text-center",
                  status === 'found' && "bg-success/10 border-success/50 hover:border-success",
                  status === 'searching' && "bg-[var(--neon-cyan)]/10 border-[var(--neon-cyan)]/30 hover:border-[var(--neon-cyan)]",
                  status === 'missing' && "bg-muted/20 border-border/50 hover:border-[var(--neon-magenta)]"
                )}
              >
                {/* Status Light */}
                <div className={cn(
                  "absolute top-2 right-2 w-3 h-3 rounded-full",
                  status === 'found' && "bg-success shadow-[0_0_8px_var(--neon-lime)]",
                  status === 'searching' && "bg-[var(--neon-cyan)] animate-pulse shadow-[0_0_8px_var(--neon-cyan)]",
                  status === 'missing' && "bg-[var(--neon-magenta)]/50"
                )} />

                {/* Product Image or Icon */}
                {item.productImage && !item.productImage.includes('unsplash.com') ? (
                  <img
                    src={item.productImage}
                    alt={item.title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    status === 'found' && "bg-success/20",
                    status === 'searching' && "bg-[var(--neon-cyan)]/20",
                    status === 'missing' && "bg-muted/30"
                  )}>
                    {status === 'found' && <Check className="w-6 h-6 text-success" />}
                    {status === 'searching' && <Search className="w-6 h-6 text-[var(--neon-cyan)]" />}
                    {status === 'missing' && <AlertCircle className="w-6 h-6 text-[var(--neon-magenta)]" />}
                  </div>
                )}

                {/* Title */}
                <span className={cn(
                  "text-xs font-medium line-clamp-2",
                  status === 'found' ? "text-success" : "text-foreground"
                )}>
                  {item.title}
                </span>

                {/* Price */}
                {item.bestPrice > 0 && (
                  <span className={cn(
                    "text-xs",
                    status === 'found' ? "text-success" : "text-muted-foreground"
                  )}>
                    ${item.bestPrice.toLocaleString()}
                  </span>
                )}

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    boxShadow: status === 'found'
                      ? '0 0 20px var(--neon-lime)'
                      : status === 'searching'
                        ? '0 0 20px var(--neon-cyan)'
                        : '0 0 20px var(--neon-magenta)',
                  }}
                />
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Other subgoals (non-item) */}
      {otherSubgoals.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Related Tasks
          </p>
          {otherSubgoals.map((subgoal) => (
            <motion.button
              key={subgoal.id}
              onClick={() => onSubgoalClick(subgoal.id)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 hover:border-primary/30 transition-all text-left"
            >
              <div className="w-2 h-2 rounded-full bg-[var(--neon-magenta)]" />
              <span className="text-sm text-foreground">{subgoal.title}</span>
              <span className="text-xs text-muted-foreground ml-auto">{subgoal.type}</span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComponentMatrix;
