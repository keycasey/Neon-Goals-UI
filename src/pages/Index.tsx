import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, SIDEBAR_WIDTH, SIDEBAR_HANDLE_WIDTH } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { GoalGrid } from '@/components/goals/GoalGrid';
import { GoalDetailView } from '@/components/goals/GoalDetailView';
import { FinancialSummary } from '@/components/goals/FinancialSummary';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const Index = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const hasClearedGoal = React.useRef(false);

  const {
    sidebarOpen,
    setSidebarOpen,
    currentGoalId,
    closeGoal,
    goals,
    activeCategory,
    isChatMinimized,
    toggleChatMinimized,
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

  const currentGoal = currentGoalId ? goals.find(g => g.id === currentGoalId) : null;

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
    };

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
    <div className="min-h-screen bg-background grid-bg">
      {/* Sidebar */}
      <Sidebar />

      {/* Header - Fixed at top */}
      <Header />

      {/* Chat Sidebar (handles both desktop and mobile) - outside main container for fixed positioning */}
      <ChatSidebar
        mode={currentGoalId ? "goal" : "creation"}
        goalId={currentGoalId || undefined}
        isMinimized={isChatMinimized}
        onToggleMinimize={toggleChatMinimized}
      />

      {/* Main Content Area - animates with sidebar push/pull */}
      <motion.div
        initial={false}
        animate={{
          // Desktop: animated margin based on sidebar/goal state
          // Mobile: no margin (sidebar is overlay)
          marginLeft: isDesktop
            ? currentGoalId
              ? SIDEBAR_HANDLE_WIDTH // Goal view: only handle width
              : sidebarOpen
                ? SIDEBAR_WIDTH // Home with sidebar open
                : 0 // Sidebar closed
            : 0, // Mobile: always 0
        }}
        transition={
          currentGoalId
            ? {
                // Sync with sidebar exit: ease-in (accelerates out)
                type: 'tween',
                duration: 0.4,
                ease: [0.4, 0, 1, 1],
              }
            : {
                // Sync with sidebar entry: ease-out-back (settles with bounce)
                type: 'spring',
                damping: 15,
                stiffness: 150,
                mass: 0.8,
              }
        }
        className="h-screen flex flex-col pt-16"
      >
        {/* Goals Content */}
        <main
          className={cn(
            "flex-1 min-w-0 p-4 lg:p-6 overflow-y-auto scrollbar-neon transition-all duration-500",
            !isChatMinimized && "lg:pr-[416px]"
          )}
        >
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="font-heading text-2xl lg:text-3xl font-bold text-foreground mb-1">
              {getCategoryTitle()}
            </h1>
            <p className="text-muted-foreground">
              Track your progress and crush your goals 🌴
            </p>
          </div>

          {/* Financial Summary (only show on all or finance category) */}
          {(activeCategory === 'all' || activeCategory === 'finances') && (
            <FinancialSummary className="mb-6" />
          )}

          {/* Goal Cards Grid */}
          <GoalGrid />
        </main>
      </motion.div>

      {/* Goal Detail Modal */}
      <AnimatePresence>
        {currentGoal && (
          <GoalDetailView goal={currentGoal} onClose={closeGoal} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
