import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SIDEBAR_WIDTH, SIDEBAR_HANDLE_WIDTH } from '@/components/layout/Sidebar';
import { GoalGrid } from '@/components/goals/GoalGrid';
import { GoalDetailView } from '@/components/goals/GoalDetailView';
import { FinancialSummary } from '@/components/goals/FinancialSummary';
import { OverviewProjectionCard } from '@/components/goals/OverviewProjectionCard';
import { GoalSortBar } from '@/components/goals/GoalSortBar';
import { TodayDashboard } from '@/components/today/TodayDashboard';
import { WishlistView } from '@/components/wishlist/WishlistView';
import { useViewStore } from '@/store/useViewStore';
import { useGoalsStore } from '@/store/useGoalsStore';
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
  const [showArchived, setShowArchived] = useState(false);
  const hasClearedGoal = React.useRef(false);

  const { sidebarOpen, setSidebarOpen, currentGoalId, closeGoal, activeCategory, isChatMinimized } = useViewStore();
  const { goals } = useGoalsStore();

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
      case 'today': return 'Today';
      case 'wishlist': return 'Wishlist';
      case 'items': return 'Item Goals';
      case 'finances': return 'Financial Goals';
      case 'actions': return 'Action Goals';
      default: return 'All Goals';
    }
  };

  const isFocusView = activeCategory === 'today' || activeCategory === 'wishlist';

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
            !isChatMinimized && "2xl:pr-[416px]"
          )}
        >
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {getCategoryTitle()}
            </h1>
            <p className="text-muted-foreground">
              {activeCategory === 'today'
                ? 'Move what matters without losing the horizon.'
                : activeCategory === 'wishlist'
                  ? 'Keep the want. Delay the commitment.'
                  : 'Build your reality 🌴'}
            </p>
          </div>

          {activeCategory === 'today' && <TodayDashboard />}
          {activeCategory === 'wishlist' && <WishlistView />}

          {/* Projection Card on overview (motivation-first, lightweight) */}
          {!isFocusView && activeCategory === 'all' && (
            <OverviewProjectionCard className="mb-6" />
          )}

          {/* Full Financial Summary on finance category (detailed, analytical) */}
          {!isFocusView && activeCategory === 'finances' && (
            <FinancialSummary className="mb-6" />
          )}

          {/* Sort Bar */}
          {!isFocusView && (
            <GoalSortBar
              sortBy={sortBy}
              onSortChange={setSortBy}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
              className="mb-4"
            />
          )}

          {/* Goal Cards Grid */}
          {!isFocusView && <GoalGrid sortBy={sortBy} showArchived={showArchived} />}
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
