import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { ItemGoalCard } from './ItemGoalCard';
import { FinanceGoalCard } from './FinanceGoalCard';
import { ActionGoalCard } from './ActionGoalCard';
import { GoalListCard } from './GoalListCard';
import type { Goal, ItemGoal, FinanceGoal, ActionGoal } from '@/types/goals';
import { cn } from '@/lib/utils';

interface GoalGridProps {
  className?: string;
}

// Module-level flag to track if initial animation has played
let hasAnimatedOnce = false;

export const GoalGrid: React.FC<GoalGridProps> = ({ className }) => {
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
  } = useAppStore();

  // Mark as animated after initial animation completes
  useEffect(() => {
    if (shouldAnimate) {
      hasAnimatedRef.current = true;
      hasAnimatedOnce = true;
    }
  }, [shouldAnimate]);

  const handleViewDetail = (goalId: string) => {
    navigate(`/goals/${goalId}`);
  };

  const filteredGoals = goals.filter(goal => {
    if (goal.status !== 'active') return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'items') return goal.type === 'item';
    if (activeCategory === 'finances') return goal.type === 'finance';
    if (activeCategory === 'actions') return goal.type === 'action';
    return false;
  });

  if (filteredGoals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
          <span className="text-4xl">🎯</span>
        </div>
        <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
          No goals yet
        </h3>
        <p className="text-muted-foreground max-w-sm">
          Start a conversation with the AI assistant to create your first goal!
        </p>
      </div>
    );
  }

  // List View - wide horizontal cards
  if (viewMode === 'list') {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className={cn("flex flex-col gap-3", className)}
      >
        <AnimatePresence mode="popLayout">
          {filteredGoals.map((goal) => (
            <GoalListCard
              key={goal.id}
              goal={goal}
              onViewDetail={handleViewDetail}
              onDelete={deleteGoal}
              onArchive={archiveGoal}
              onSync={syncFinanceGoal}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Card View - grid of cards
  return (
    <div
      className={cn(
        "grid gap-4 md:gap-6",
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {filteredGoals.map((goal, index) => (
          <GoalCardWrapper
            key={goal.id}
            goal={goal}
            onViewDetail={handleViewDetail}
            onDelete={deleteGoal}
            onArchive={archiveGoal}
            onSync={syncFinanceGoal}
            onSearch={searchAndUpdateGoal}
            animationIndex={shouldAnimate ? index : -1}
          />
        ))}
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

const GoalCardWrapper: React.FC<GoalCardWrapperProps> = ({
  goal,
  onViewDetail,
  onDelete,
  onArchive,
  onSync,
  onSearch,
  animationIndex,
}) => {
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
    default:
      return null;
  }
};
