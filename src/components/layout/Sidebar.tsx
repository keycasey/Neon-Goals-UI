import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ShoppingBag,
  Wallet,
  Target,
  Settings,
  User,
  LayoutGrid,
  List,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { GoalCategory } from '@/types/goals';

// SIDEBAR WIDTH - exported for use in other components
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_HANDLE_WIDTH = 48;

const categories: { id: GoalCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Goals', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'items', label: 'Items', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'finances', label: 'Finances', icon: <Wallet className="w-5 h-5" /> },
  { id: 'actions', label: 'Actions', icon: <Target className="w-5 h-5" /> },
];

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    activeCategory,
    setActiveCategory,
    goals,
    user,
    viewMode,
    setViewMode,
    selectGoal,
    currentGoalId,
    closeGoal,
  } = useAppStore();

  // Determine if we're in goal view mode
  const isInGoalView = currentGoalId !== null;

  // Track previous goal view state for animation direction
  const wasInGoalViewRef = React.useRef(isInGoalView);

  // Determine if we're entering or exiting goal view
  const isEnteringGoalView = isInGoalView && !wasInGoalViewRef.current;
  const isExitingGoalView = !isInGoalView && wasInGoalViewRef.current;

  // Debug: Track component lifecycle
  useEffect(() => {
    console.log('[Sidebar] MOUNTED');
    return () => {
      console.log('[Sidebar] UNMOUNTED');
    };
  }, []);

  // Debug: Track state changes
  useEffect(() => {
    console.log('[Sidebar] State changed:', {
      sidebarOpen,
      isInGoalView,
      isEnteringGoalView,
      isExitingGoalView,
      isOnGoalRoute: location.pathname.startsWith('/goals/'),
      targetX: isInGoalView
        ? -(SIDEBAR_WIDTH - SIDEBAR_HANDLE_WIDTH)
        : sidebarOpen
          ? 0
          : -SIDEBAR_WIDTH
    });
  }, [sidebarOpen, isInGoalView, isEnteringGoalView, isExitingGoalView, location.pathname]);

  // Update ref after render
  useEffect(() => {
    wasInGoalViewRef.current = isInGoalView;
  }, [isInGoalView]);

  // Calculate target X position
  const targetX = isInGoalView
    ? -(SIDEBAR_WIDTH - SIDEBAR_HANDLE_WIDTH)
    : sidebarOpen
      ? 0
      : -SIDEBAR_WIDTH;

  // Check if we're on a goal URL route (vs modal overlay)
  const isOnGoalRoute = location.pathname.startsWith('/goals/');

  // Handle returning from goal view to overview
  const handleReturnToOverview = () => {
    closeGoal();
    // Ensure sidebar opens when returning to overview
    setSidebarOpen(true);
    // If on a goal URL route, navigate back to home
    if (isOnGoalRoute) {
      navigate('/');
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (activeCategory === 'all') return goal.status === 'active';
    if (activeCategory === 'items') return goal.type === 'item' && goal.status === 'active';
    if (activeCategory === 'finances') return goal.type === 'finance' && goal.status === 'active';
    if (activeCategory === 'actions') return goal.type === 'action' && goal.status === 'active';
    return false;
  });

  const getCategoryCount = (category: GoalCategory) => {
    if (category === 'all') return goals.filter(g => g.status === 'active').length;
    const typeMap: Record<string, string> = {
      items: 'item',
      finances: 'finance',
      actions: 'action',
    };
    return goals.filter(g => g.type === typeMap[category] && g.status === 'active').length;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: sidebarOpen ? 0 : -SIDEBAR_WIDTH }}
        animate={{ x: targetX }}
        transition={
          isEnteringGoalView
            ? {
                type: 'tween',
                duration: 0.4,
                ease: [0.4, 0, 1, 1], // ease-in for entering
              }
            : isExitingGoalView
              ? {
                  type: 'tween',
                  duration: 0.5,
                  ease: [0, 0, 0.2, 1], // ease-out for exiting
                }
              : {
                  type: 'spring',
                  damping: 20,
                  stiffness: 200,
                }
        }
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] z-50",
          "bg-sidebar border-r border-sidebar-border",
          "flex flex-col",
          "scrollbar-neon overflow-y-auto",
          className
        )}
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Header - Close button only */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <span className="font-heading font-semibold text-foreground">Menu</span>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* View Toggle */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center bg-sidebar-accent rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                viewMode === 'list' 
                  ? "bg-primary text-primary-foreground neon-glow-cyan" 
                  : "text-sidebar-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                viewMode === 'card' 
                  ? "bg-primary text-primary-foreground neon-glow-cyan" 
                  : "text-sidebar-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
          </div>
        </div>

        {/* Categories */}
        <nav className="p-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Categories
          </p>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all",
                activeCategory === category.id
                  ? "bg-sidebar-accent neon-border text-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  activeCategory === category.id && "neon-text-cyan"
                )}>
                  {category.icon}
                </span>
                <span className="font-medium">{category.label}</span>
              </div>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                activeCategory === category.id
                  ? "bg-primary/20 text-primary"
                  : "bg-sidebar-accent text-muted-foreground"
              )}>
                {getCategoryCount(category.id)}
              </span>
            </button>
          ))}
        </nav>

        {/* Goals List (always visible) */}
        <div className="flex-1 p-4 border-t border-sidebar-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Your Goals
            </p>
            <div className="space-y-2">
              {filteredGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => selectGoal(goal.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-all",
                    currentGoalId === goal.id
                      ? "bg-sidebar-accent neon-border"
                      : "hover:bg-sidebar-accent/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {goal.type === 'item' && '🛒'}
                      {goal.type === 'finance' && '💰'}
                      {goal.type === 'action' && '🎯'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {goal.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        

        {/* Footer */}
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-all mb-2">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          
          {user && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/30">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Toggle Button (when sidebar is closed) */}
      <AnimatePresence>
        {!sidebarOpen && !isInGoalView && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={toggleSidebar}
            className="fixed left-4 top-4 z-40 p-3 rounded-lg glass-card neon-border lg:hidden"
          >
            <Menu className="w-5 h-5 text-primary" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Goal View Toggle Handle - the slim "ghost" handle visible when sidebar slides out */}
      <AnimatePresence>
        {isInGoalView && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={cn(
              "fixed left-0 top-16 h-[calc(100vh-4rem)] z-[60]", // Higher z-index than GoalDetailView (z-50)
              "flex items-center justify-center",
              "bg-sidebar/80 backdrop-blur-sm border-r border-sidebar-border",
              "cursor-pointer group",
              "hover:bg-sidebar/90 transition-colors"
            )}
            style={{ width: SIDEBAR_HANDLE_WIDTH }}
            onClick={handleReturnToOverview}
            aria-label="Return to overview"
          >
            <motion.div
              className="flex flex-col items-center gap-2 text-sidebar-foreground group-hover:text-primary transition-colors pointer-events-none"
              initial={false}
              animate={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <ChevronRight className="w-5 h-5 neon-text-cyan opacity-60 group-hover:opacity-100 transition-opacity" />
              <span
                className="text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                Back
              </span>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
