import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Trash2, 
  Archive, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  Clock,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal, ItemGoal, FinanceGoal, ActionGoal } from '@/types/goals';

interface GoalListCardProps {
  goal: Goal;
  onViewDetail: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onArchive?: (goalId: string) => void;
  onSync?: (goalId: string) => void;
  animationIndex?: number;
}

// Spring animation config for bouncy feel
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

// Circular progress component
const CircularProgress: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({ 
  progress, 
  size = 56, 
  strokeWidth = 4 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="hsl(var(--muted))"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#progressGradient)"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

// Get progress for each goal type
const getGoalProgress = (goal: Goal): number => {
  switch (goal.type) {
    case 'item':
      return 0; // Items don't have progress, use 0 or based on status
    case 'finance':
      const financeGoal = goal as FinanceGoal;
      return Math.min((financeGoal.currentBalance / financeGoal.targetBalance) * 100, 100);
    case 'action':
      return (goal as ActionGoal).completionPercentage;
    default:
      return 0;
  }
};

// Get category tag styling
const getCategoryStyle = (type: string) => {
  switch (type) {
    case 'item':
      return 'bg-primary/20 text-primary';
    case 'finance':
      return 'bg-accent/20 text-accent';
    case 'action':
      return 'bg-success/20 text-success';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Get category label
const getCategoryLabel = (type: string) => {
  switch (type) {
    case 'item': return 'Item';
    case 'finance': return 'Finance';
    case 'action': return 'Action';
    default: return type;
  }
};

export const GoalListCard: React.FC<GoalListCardProps> = ({
  goal,
  onViewDetail,
  onDelete,
  onArchive,
  onSync,
  animationIndex = -1,
}) => {
  const shouldAnimate = animationIndex >= 0;
  const progress = getGoalProgress(goal);
  
  // Get next task or relevant info
  const getNextInfo = () => {
    switch (goal.type) {
      case 'item':
        const itemGoal = goal as ItemGoal;
        return `Best price: $${itemGoal.bestPrice.toLocaleString()} at ${itemGoal.retailerName}`;
      case 'finance':
        const financeGoal = goal as FinanceGoal;
        const remaining = financeGoal.targetBalance - financeGoal.currentBalance;
        return `$${remaining.toLocaleString()} to reach goal`;
      case 'action':
        const actionGoal = goal as ActionGoal;
        const nextTask = actionGoal.tasks.find(t => !t.completed);
        return nextTask ? `Next: ${nextTask.title}` : 'All tasks complete!';
      default:
        return '';
    }
  };

  // Get trend for finance goals
  const getTrend = () => {
    if (goal.type !== 'finance') return null;
    const financeGoal = goal as FinanceGoal;
    const historyLength = financeGoal.progressHistory.length;
    if (historyLength < 2) return null;
    const previousBalance = financeGoal.progressHistory[historyLength - 2];
    const trend = financeGoal.currentBalance - previousBalance;
    const trendPercent = previousBalance > 0 ? ((trend / previousBalance) * 100).toFixed(1) : '0';
    return { trend, trendPercent };
  };

  const trendData = getTrend();

  return (
    <motion.div
      layout
      initial={shouldAnimate ? { opacity: 0, scale: 0.95, y: 20 } : { opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{
        ...springConfig,
        delay: shouldAnimate ? animationIndex * 0.06 : 0,
      }}
      whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      className="glass-card hover-lift cursor-pointer group flex items-center gap-3 sm:gap-4 p-3 sm:p-4"
      onClick={() => onViewDetail(goal.id)}
    >
      {/* Progress Circle - smaller on mobile */}
      <div className="flex-shrink-0">
        {goal.type === 'item' ? (
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-muted">
            <img
              src={(goal as ItemGoal).productImage}
              alt={goal.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="hidden sm:block">
            <CircularProgress progress={progress} />
          </div>
        )}
        {/* Smaller progress on mobile for non-item goals */}
        {goal.type !== 'item' && (
          <div className="sm:hidden">
            <CircularProgress progress={progress} size={40} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Main Content - full width on mobile */}
      <div className="flex-1 min-w-0">
        {/* Title row with badge */}
        <div className="flex items-start gap-2 mb-0.5">
          <h3 className="font-heading font-semibold text-foreground text-sm sm:text-base flex-1 min-w-0">
            {goal.title}
          </h3>
          {/* Category Badge - always visible, right justified */}
          <span className={cn(
            "px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0",
            getCategoryStyle(goal.type)
          )}>
            <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
            <span className="hidden sm:inline">{getCategoryLabel(goal.type)}</span>
          </span>
        </div>
        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
          {getNextInfo()}
        </p>
      </div>

      {/* Stats/Trend */}
      <div className="flex-shrink-0 text-right hidden sm:block">
        {goal.type === 'finance' && trendData && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium justify-end",
            trendData.trend >= 0 ? "text-success" : "text-destructive"
          )}>
            {trendData.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trendData.trend >= 0 ? '+' : ''}{trendData.trendPercent}%
          </div>
        )}
        {goal.type === 'action' && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground justify-end">
            <CheckCircle2 className="w-4 h-4" />
            {(goal as ActionGoal).tasks.filter(t => t.completed).length}/{(goal as ActionGoal).tasks.length}
          </div>
        )}
        {goal.type === 'item' && (
          <p className="text-lg font-heading font-bold neon-text-cyan">
            ${(goal as ItemGoal).bestPrice.toLocaleString()}
          </p>
        )}
      </div>

      {/* Last Updated */}
      <div className="flex-shrink-0 text-right hidden md:block">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(goal.updatedAt).toLocaleDateString()}
        </p>
      </div>

      {/* Quick Actions - hidden on mobile */}
      <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {goal.type === 'finance' && onSync && (
          <button
            onClick={(e) => { e.stopPropagation(); onSync(goal.id); }}
            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label="Sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {goal.type === 'item' && (
          <a
            href={(goal as ItemGoal).retailerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label="Buy"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {onArchive && (
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(goal.id); }}
            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-warning hover:bg-muted transition-colors"
            aria-label="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
          className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
          aria-label="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30 rounded-b-lg overflow-hidden">
        <motion.div
          className="h-full bg-gradient-neon"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};
