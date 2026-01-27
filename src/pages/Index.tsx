import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { GoalGrid } from '@/components/goals/GoalGrid';
import { GoalDetailView } from '@/components/goals/GoalDetailView';
import { FinancialSummary } from '@/components/goals/FinancialSummary';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const Index = () => {
  const { 
    sidebarOpen, 
    setSidebarOpen,
    currentGoalId, 
    closeGoal,
    goals,
    activeCategory,
  } = useAppStore();

  const currentGoal = currentGoalId ? goals.find(g => g.id === currentGoalId) : null;

  // Handle ESC key to close goal detail
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentGoalId) {
        closeGoal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGoalId, closeGoal]);

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

      {/* Main Content Area */}
      <div 
        className={cn(
          "min-h-screen flex flex-col transition-all duration-300",
          sidebarOpen ? "lg:ml-[280px]" : "lg:ml-0"
        )}
      >
        {/* Header */}
        <Header />

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Goals Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-y-auto scrollbar-neon">
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

          {/* Chat Panel (Desktop) */}
          <aside className="hidden lg:block w-[350px] xl:w-[400px] border-l border-border p-4">
            <ChatPanel mode="creation" className="h-[calc(100vh-8rem)] sticky top-4" />
          </aside>
        </div>

        {/* Mobile Chat FAB */}
        <MobileChatFAB />
      </div>

      {/* Goal Detail Modal */}
      <AnimatePresence>
        {currentGoal && (
          <GoalDetailView goal={currentGoal} onClose={closeGoal} />
        )}
      </AnimatePresence>
    </div>
  );
};

// Mobile Chat Floating Action Button
const MobileChatFAB: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "lg:hidden fixed right-4 bottom-4 z-40",
          "w-14 h-14 rounded-full",
          "bg-gradient-neon text-primary-foreground",
          "flex items-center justify-center",
          "shadow-lg neon-glow-cyan",
          "transition-transform hover:scale-110",
          isOpen && "hidden"
        )}
        aria-label="Open chat"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Mobile Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-background">
            <ChatPanel 
              mode="creation" 
              onClose={() => setIsOpen(false)}
              className="flex-1 rounded-none"
            />
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;
