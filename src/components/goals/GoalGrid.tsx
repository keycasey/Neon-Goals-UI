import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { ItemGoalCard } from './ItemGoalCard';
import { StackedItemGoalCard } from './StackedItemGoalCard';
import { FinanceGoalCard } from './FinanceGoalCard';
import { ActionGoalCard } from './ActionGoalCard';
import { GroupGoalCard } from './GroupGoalCard';
import { GoalListCard } from './GoalListCard';
import type { Goal, ItemGoal, FinanceGoal, ActionGoal, GroupGoal } from '@/types/goals';
import { cn } from '@/lib/utils';

interface GoalGridProps {
  className?: string;
  sortBy?: string;
}

// Module-level flag to track if initial animation has played
let hasAnimatedOnce = false;

// Spring animation config for consistent bouncy feel
const springConfig = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
};

export const GoalGrid: React.FC<GoalGridProps> = ({ className, sortBy = 'createdAt' }) => {
  const navigate = useNavigate();
  // Always animate on mount - use ref to track if THIS instance has animated
  const hasAnimatedRef = React.useRef(false);
  const [shouldAnimate] = React.useState(() => !hasAnimatedRef.current);

  const {
    goals,
    activeCategory,
    viewMode,
    deleteGoal,
    archiveGoal,
    syncFinanceGoal,
    searchAndUpdateGoal,
    fetchGoals,
  } = useAppStore();

  // Mark as animated after initial animation completes
  useEffect(() => {
    if (shouldAnimate) {
      hasAnimatedRef.current = true;
      hasAnimatedOnce = true;
    }
  }, [shouldAnimate]);

  // Poll for updates when there are active scrapes
  useEffect(() => {
    const POLL_INTERVAL = 5000; // Poll every 5 seconds

    const checkAndRefresh = async () => {
      // Check if any goals are in searching state
      const hasActiveScrapes = goals.some(g =>
        'statusBadge' in g && (g.statusBadge === 'pending_search' || g.statusBadge === 'pending-search')
      );

      if (hasActiveScrapes) {
        console.log('[GoalGrid] Active scrapes detected, refreshing goals...');
        await fetchGoals();
      }
    };

    const interval = setInterval(checkAndRefresh, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [goals, fetchGoals]);

  const handleViewDetail = (goalId: string) => {
    navigate(`/goals/${goalId}`);
  };

  const filteredGoals = useMemo(() => {
    const filtered = goals.filter(goal => {
      if (goal.status !== 'active') return false;
      if (goal.parentGoalId) return false;
      if (activeCategory === 'all') return true;
      if (activeCategory === 'items') return goal.type === 'item';
      if (activeCategory === 'finances') return goal.type === 'finance';
      if (activeCategory === 'actions') return goal.type === 'action';
      return false;
    });

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'targetDate': {
          const aDate = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
          const bDate = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
          return aDate - bDate;
        }
        case 'price': {
          const aPrice = a.type === 'item' ? (a as ItemGoal).bestPrice || 0 : 0;
          const bPrice = b.type === 'item' ? (b as ItemGoal).bestPrice || 0 : 0;
          return bPrice - aPrice;
        }
        case 'amount': {
          const aAmt = a.type === 'finance' ? (a as FinanceGoal).targetBalance || 0 : 0;
          const bAmt = b.type === 'finance' ? (b as FinanceGoal).targetBalance || 0 : 0;
          return bAmt - aAmt;
        }
        case 'taskCount': {
          const aTasks = a.type === 'action' ? ((a as ActionGoal).tasks?.length || 0) : 0;
          const bTasks = b.type === 'action' ? ((b as ActionGoal).tasks?.length || 0) : 0;
          return bTasks - aTasks;
        }
        case 'createdAt':
        default: {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return bTime - aTime;
        }
      }
    });
  }, [goals, activeCategory, sortBy]);

  // Group item goals by stackId
  const { stackedGoals, individualGoals } = useMemo(() => {
    const itemGoals = filteredGoals.filter(g => g.type === 'item') as ItemGoal[];
    const otherGoals = filteredGoals.filter(g => g.type !== 'item');
    
    const stacks = new Map<string, ItemGoal[]>();
    const individuals: ItemGoal[] = [];
    
    itemGoals.forEach(goal => {
      if (goal.stackId) {
        const existing = stacks.get(goal.stackId) || [];
        stacks.set(goal.stackId, [...existing, goal]);
      } else {
        individuals.push(goal);
      }
    });
    
    return {
      stackedGoals: Array.from(stacks.values()).filter(stack => stack.length > 1),
      individualGoals: [
        ...individuals,
        ...Array.from(stacks.values()).filter(stack => stack.length === 1).flat(),
        ...otherGoals,
      ] as Goal[],
    };
  }, [filteredGoals]);

  if (filteredGoals.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springConfig}
        className="flex flex-col items-center justify-center h-[400px] text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...springConfig, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4"
        >
          <span className="text-4xl">🎯</span>
        </motion.div>
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="font-heading text-xl font-semibold text-foreground mb-2"
        >
          No goals yet
        </motion.h3>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground max-w-sm"
        >
          Start a conversation with the AI assistant to create your first goal!
        </motion.p>
      </motion.div>
    );
  }

  // List View - wide horizontal cards
  if (viewMode === 'list') {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <AnimatePresence mode="popLayout">
          {filteredGoals.map((goal, index) => (
            <GoalListCard
              key={goal.id}
              goal={goal}
              onViewDetail={handleViewDetail}
              onDelete={deleteGoal}
              onArchive={archiveGoal}
              onSync={syncFinanceGoal}
              animationIndex={shouldAnimate ? index : -1}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Card View - masonry layout with stacking support
  let animationCounter = 0;

  return (
    <div
      className={cn(
        // Masonry layout using CSS columns
        "columns-1 md:columns-2 lg:columns-2 xl:columns-3 2xl:columns-4",
        // Gap between columns (horizontal only)
        "gap-4 md:gap-6",
        // Prevent container from collapsing
        "w-full",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {/* Render stacked item goals */}
        {stackedGoals.map((stack) => {
          const idx = animationCounter++;
          return (
            <div key={`stack-${stack[0].stackId}`} className="mb-4 md:mb-6 break-inside-avoid">
              <StackedItemGoalCard
                goals={stack}
                onViewDetail={handleViewDetail}
                onDelete={deleteGoal}
                onArchive={archiveGoal}
                animationIndex={shouldAnimate ? idx : -1}
              />
            </div>
          );
        })}

        {/* Render individual goals */}
        {individualGoals.map((goal) => {
          const idx = animationCounter++;
          return (
            <div key={goal.id} className="mb-4 md:mb-6 break-inside-avoid">
              <GoalCardWrapper
                goal={goal}
                onViewDetail={handleViewDetail}
                onDelete={deleteGoal}
                onArchive={archiveGoal}
                onSync={syncFinanceGoal}
                onSearch={searchAndUpdateGoal}
                animationIndex={shouldAnimate ? idx : -1}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

interface GoalCardWrapperProps {
  goal: Goal;
  onViewDetail: (id: string) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onSync: (id: string) => void;
  onSearch?: (id: string) => Promise<void>;
  animationIndex: number; // -1 = skip animation, >= 0 = animate with stagger
}

const GoalCardWrapper = React.forwardRef<
  HTMLDivElement,
  GoalCardWrapperProps
>(({
  goal,
  onViewDetail,
  onDelete,
  onArchive,
  onSync,
  onSearch,
  animationIndex,
}, ref) => {
  switch (goal.type) {
    case 'item':
      return (
        <ItemGoalCard
          goal={goal as ItemGoal}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
          onArchive={onArchive}
          onSearch={onSearch}
          animationIndex={animationIndex}
        />
      );
    case 'finance':
      return (
        <FinanceGoalCard
          goal={goal as FinanceGoal}
          onViewDetail={onViewDetail}
          onSync={onSync}
          onDelete={onDelete}
          animationIndex={animationIndex}
        />
      );
    case 'action':
      return (
        <ActionGoalCard
          goal={goal as ActionGoal}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
          animationIndex={animationIndex}
        />
      );
    case 'group':
      return (
        <GroupGoalCard
          goal={goal as GroupGoal}
          onViewDetail={onViewDetail}
          onDelete={onDelete}
          onArchive={onArchive}
          animationIndex={animationIndex}
        />
      );
    default:
      return null;
  }
});

GoalCardWrapper.displayName = 'GoalCardWrapper';
