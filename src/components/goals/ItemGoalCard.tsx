import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Trash2, Archive, TrendingDown, Package, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ItemGoal } from '@/types/goals';

interface ItemGoalCardProps {
  goal: ItemGoal;
  onViewDetail: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onArchive: (goalId: string) => void;
}

const statusConfig = {
  'in-stock': { label: 'In Stock', class: 'badge-success' },
  'price-drop': { label: 'Price Drop!', class: 'badge-warning' },
  'pending-search': { label: 'Searching...', class: 'badge-info' },
};

export const ItemGoalCard: React.FC<ItemGoalCardProps> = ({
  goal,
  onViewDetail,
  onDelete,
  onArchive,
}) => {
  const status = statusConfig[goal.statusBadge];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="glass-card hover-lift cursor-pointer group"
      onClick={() => onViewDetail(goal.id)}
    >
      {/* Image Section */}
      <div className="relative h-40 overflow-hidden rounded-t-lg">
        <img
          src={goal.productImage}
          alt={goal.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(status.class, "flex items-center gap-1")}>
            {goal.statusBadge === 'price-drop' && <TrendingDown className="w-3 h-3" />}
            {goal.statusBadge === 'in-stock' && <Package className="w-3 h-3" />}
            {goal.statusBadge === 'pending-search' && <Clock className="w-3 h-3" />}
            {status.label}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(goal.id); }}
            className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-warning transition-colors"
            aria-label="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
            className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground truncate mb-1">
          {goal.title}
        </h3>
        <p className="text-sm text-muted-foreground truncate mb-3">
          {goal.description}
        </p>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-heading font-bold neon-text-cyan">
              {goal.currency === 'USD' ? '$' : goal.currency}
              {goal.bestPrice.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Best price at {goal.retailerName}
            </p>
          </div>
          
          <a
            href={goal.retailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-neon text-primary-foreground font-medium text-sm transition-all hover:scale-105 neon-glow-cyan"
          >
            Buy
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};
