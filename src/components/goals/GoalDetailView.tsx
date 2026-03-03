import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useViewStore } from '@/store/useViewStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { SIDEBAR_HANDLE_WIDTH } from '@/components/layout/Sidebar';
import { GoalBreadcrumb } from './GoalBreadcrumb';
import { GroupGoalDetail, ActionGoalDetail, FinanceGoalDetail, ItemGoalDetail, containerVariants, springConfig } from './detail';
import type { Goal, ItemGoal, FinanceGoal, ActionGoal, GroupGoal } from '@/types/goals';

interface GoalDetailViewProps {
  goal: Goal;
  onClose: () => void;
}

// Recursively find a goal by ID in the goals array (including nested subgoals)
const findGoalById = (goals: Goal[], id: string): Goal | null => {
  for (const goal of goals) {
    if (goal.id === id) return goal;
    if (goal.subgoals && goal.subgoals.length > 0) {
      const found = findGoalById(goal.subgoals, id);
      if (found) return found;
    }
  }
  return null;
};

export const GoalDetailView: React.FC<GoalDetailViewProps> = ({ goal, onClose }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const {
    isChatMinimized,
    goalNavigationStack,
    navigationDirection,
    navigateToGoal,
    navigateBack,
  } = useViewStore();
  const { goals } = useGoalsStore();

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Build navigation stack as Goal objects for breadcrumb (search recursively)
  const navigationStackGoals = useMemo(() => {
    return goalNavigationStack
      .map(id => findGoalById(goals, id))
      .filter((g): g is Goal => g !== null);
  }, [goalNavigationStack, goals]);

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (goalId: string | null) => {
    if (goalId === null) {
      onCloseRef.current(); // Navigate to root (close goal view)
    } else {
      navigateToGoal(goalId);
    }
  };

  // Close handler that closes scanner first if open, or navigates back if in stack
  const handleClose = () => {
    const scannerOpen = document.querySelector('[data-scanner-open="true"]');
    if (scannerOpen) {
      window.dispatchEvent(new CustomEvent('close-scanner'));
    } else if (goalNavigationStack.length > 0) {
      navigateBack();
    } else {
      onCloseRef.current();
    }
  };

  // ESC key to close goal view or scanner
  useEffect(() => {
    console.log('[GoalDetailView] ESC handler effect mounted');
    const handleEsc = (e: KeyboardEvent) => {
      console.log('[GoalDetailView] Key pressed:', e.key);
      if (e.key === 'Escape') {
        const scannerOpen = document.querySelector('[data-scanner-open="true"]');
        if (scannerOpen) {
          window.dispatchEvent(new CustomEvent('close-scanner'));
        } else if (goalNavigationStack.length > 0) {
          navigateBack();
        } else {
          onCloseRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    console.log('[GoalDetailView] ESC handler cleanup');
    return () => {
      console.log('[GoalDetailView] Removing ESC handler');
      window.removeEventListener('keydown', handleEsc);
    };
  }, [goalNavigationStack.length, navigateBack]);

  // Track desktop breakpoint for sidebar handle margin
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Animation variants based on navigation direction
  const slideVariants = {
    initial: (direction: 'forward' | 'back' | null) => ({
      opacity: 0,
      x: direction === 'forward' ? 100 : direction === 'back' ? -100 : 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: 'forward' | 'back' | null) => ({
      opacity: 0,
      x: direction === 'forward' ? -100 : direction === 'back' ? 100 : 0,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.4, delay: 0.2 },
      }}
      className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md overflow-hidden"
    >
      {/* Breadcrumb Navigation */}
      <div
        className="absolute top-0 z-30"
        style={{
          left: isDesktop ? SIDEBAR_HANDLE_WIDTH : 0,
          right: isChatMinimized ? 0 : undefined,
          width: isChatMinimized ? undefined : isDesktop ? 'calc(100% - 48px - 416px)' : '100%',
        }}
      >
        <GoalBreadcrumb
          navigationStack={navigationStackGoals}
          currentGoal={goal}
          onNavigate={handleBreadcrumbNavigate}
        />
      </div>


      {/* Goal Details Content - respects sidebar handle on desktop */}
      <AnimatePresence mode="wait" custom={navigationDirection}>
        <motion.div
          key={goal.id}
          custom={navigationDirection}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={springConfig}
          style={{
            left: isDesktop ? SIDEBAR_HANDLE_WIDTH : 0,
          }}
          className="absolute top-20 bottom-0 right-0 overflow-y-auto p-6 lg:p-8 scrollbar-neon"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {goal.type === 'item' && <ItemGoalDetail goal={goal as ItemGoal} />}
            {goal.type === 'finance' && <FinanceGoalDetail goal={goal as FinanceGoal} />}
            {goal.type === 'action' && <ActionGoalDetail goal={goal as ActionGoal} />}
            {goal.type === 'group' && <GroupGoalDetail goal={goal as GroupGoal} />}
          </motion.div>
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
};
