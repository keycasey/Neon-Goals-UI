import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { GoalCategory, ViewMode } from '@/types/goals';

export type SortOption = {
  label: string;
  value: string;
};

const sortOptionsByCategory: Record<GoalCategory, SortOption[]> = {
  all: [
    { label: 'Created Date', value: 'createdAt' },
    { label: 'Target Date', value: 'targetDate' },
  ],
  items: [
    { label: 'Created Date', value: 'createdAt' },
    { label: 'Price', value: 'price' },
  ],
  finances: [
    { label: 'Created Date', value: 'createdAt' },
    { label: 'Amount', value: 'amount' },
  ],
  actions: [
    { label: 'Target Date', value: 'targetDate' },
    { label: 'Tasks', value: 'taskCount' },
  ],
  groups: [
    { label: 'Created Date', value: 'createdAt' },
    { label: 'Target Date', value: 'targetDate' },
  ],
};

interface GoalSortBarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  className?: string;
}

export const GoalSortBar: React.FC<GoalSortBarProps> = ({
  sortBy,
  onSortChange,
  className,
}) => {
  const { activeCategory, viewMode, setViewMode } = useAppStore();
  const options = sortOptionsByCategory[activeCategory] || sortOptionsByCategory.all;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        "flex items-center justify-between px-1 py-2",
        className
      )}
    >
      {/* Sort Options */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground mr-1" />
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              sortBy === option.value
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setViewMode('card')}
          className={cn(
            "p-1.5 rounded-lg transition-all",
            viewMode === 'card'
              ? "text-primary bg-primary/15"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="Card view"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            "p-1.5 rounded-lg transition-all",
            viewMode === 'list'
              ? "text-primary bg-primary/15"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-label="List view"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
