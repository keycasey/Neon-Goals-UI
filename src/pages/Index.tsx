import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SIDEBAR_WIDTH, SIDEBAR_HANDLE_WIDTH } from '@/components/layout/Sidebar';
import { GoalGrid } from '@/components/goals/GoalGrid';
import { GoalDetailView } from '@/components/goals/GoalDetailView';
import { FinancialSummary } from '@/components/goals/FinancialSummary';
import { GoalSortBar } from '@/components/goals/GoalSortBar';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import type { Goal } from '@/types/goals';

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

const Index = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const hasClearedGoal = React.useRef(false);

  const {
    sidebarOpen,
    setSidebarOpen,
    currentGoalId,
    closeGoal,
    goals,
    activeCategory,
    isChatMinimized,
  } = useAppStore();

  // Track desktop breakpoint for responsive sidebar margin
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Clear any lingering goal state when navigating to homepage (only once)
  useEffect(() => {
    if (!hasClearedGoal.current && currentGoalId) {
      closeGoal();
      hasClearedGoal.current = true;
    }
  }, [currentGoalId, closeGoal]);

  // Find current goal - search recursively through subgoals
  const currentGoal = useMemo(() => {
    if (!currentGoalId) return null;
    return findGoalById(goals, currentGoalId);
  }, [currentGoalId, goals]);

  // Handle sidebar open/close based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state based on screen size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'items': return 'Item Goals';
      case 'finances': return 'Financial Goals';
      case 'actions': return 'Action Goals';
      default: return 'All Goals';
    }
  };

  return (
    <>
      {/* Main Content Area - animates with sidebar push/pull */}
      <motion.div
        initial={false}
        layout="position"
        style={{
          marginLeft: isDesktop
            ? currentGoalId
              ? SIDEBAR_HANDLE_WIDTH
              : sidebarOpen
                ? SIDEBAR_WIDTH
                : 0
            : 0
        }}
        transition={{
          type: 'spring',
          stiffness: 80,
          damping: 18,
          mass: 0.6
        }}
        className="h-screen flex flex-col pt-16"
      >
        {/* Goals Content */}
        <main
          className={cn(
            "flex-1 min-w-0 p-4 lg:p-6 overflow-y-auto scrollbar-neon",
            !isChatMinimized && "lg:pr-[416px]"
          )}
        >
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {getCategoryTitle()}
            </h1>
            <p className="text-muted-foreground">
              Build your reality 🌴
            </p>
          </div>

          {/* Financial Summary (only show on all or finance category) */}
          {(activeCategory === 'all' || activeCategory === 'finances') && (
            <FinancialSummary className="mb-6" />
          )}

          {/* Sort Bar */}
          <GoalSortBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            className="mb-4"
          />

          {/* Goal Cards Grid */}
          <GoalGrid sortBy={sortBy} />
        </main>
      </motion.div>

      {/* Goal Detail Modal */}
      <AnimatePresence>
        {currentGoal && (
          <GoalDetailView goal={currentGoal} onClose={closeGoal} />
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;
