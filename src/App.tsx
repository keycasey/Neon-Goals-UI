import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AccountDropdown } from "@/components/auth/AccountDropdown";
import { GoalDetailView } from "@/components/goals/GoalDetailView";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { FloatingBackButton } from "@/components/ui/FloatingBackButton";
import { Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper - redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAppStore((state) => state.user);
  const isDemoMode = useAppStore((state) => state.isDemoMode);
  const location = useLocation();

  // Allow access if user is logged in OR if demo mode is enabled
  if (!user && !isDemoMode) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main layout that persists across routes
const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isGoalRoute = location.pathname.startsWith('/goals/');
  const isSettingsRoute = location.pathname === '/settings';
  const isChatMinimized = useAppStore((state) => state.isChatMinimized);
  const toggleChatMinimized = useAppStore((state) => state.toggleChatMinimized);
  const closeGoal = useAppStore((state) => state.closeGoal);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Don't render layout for auth pages
  if (['/login', '/auth/callback'].includes(location.pathname)) {
    return <Outlet />;
  }

  const handleBackFromGoal = () => {
    closeGoal();
    navigate('/');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background grid-bg">
        {/* Only show Sidebar and ChatSidebar if NOT on settings page */}
        {!isSettingsRoute && <Sidebar isGoalView={isGoalRoute} />}
        {!isSettingsRoute && (
          <Header
            accountDropdownOpen={accountDropdownOpen}
            setAccountDropdownOpen={setAccountDropdownOpen}
          />
        )}
        {!isSettingsRoute && (
          <ChatSidebar
            mode={isGoalRoute ? "goal" : "creation"}
            goalId={isGoalRoute ? location.pathname.split('/')[2] : undefined}
            isMinimized={isChatMinimized}
            onToggleMinimize={toggleChatMinimized}
          />
        )}
        <Outlet />

        {/* Floating back button for mobile goal view */}
        <FloatingBackButton
          isVisible={isGoalRoute}
          onClick={handleBackFromGoal}
        />

        {/* Account dropdown - rendered outside header for full viewport height */}
        {!isSettingsRoute && (
          <AccountDropdown
            isOpen={accountDropdownOpen}
            onClose={() => setAccountDropdownOpen(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

// Inner app component that initializes the store
const AppContent = () => {
  const initializeApp = useAppStore((state) => state.initializeApp);
  useKeyboardShortcuts(); // Initialize keyboard shortcuts

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/goals/:goalId" element={<GoalDetailPageWrapper />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<Callback />} />
    </Routes>
  );
};

// Wrapper component for goal detail page that loads goal from URL parameter
const GoalDetailPageWrapper = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const goals = useAppStore((state) => state.goals);
  const currentGoalId = useAppStore((state) => state.currentGoalId);
  const selectGoal = useAppStore((state) => state.selectGoal);
  const closeGoal = useAppStore((state) => state.closeGoal);

  // Debug: Track component lifecycle
  useEffect(() => {
    console.log('[GoalDetailPageWrapper] MOUNTED', { goalId });
    return () => {
      console.log('[GoalDetailPageWrapper] UNMOUNTED', { goalId });
    };
  }, [goalId]);

  const goal = goals.find(g => g.id === goalId);

  // Update store when URL changes (only sync from URL to store, not the reverse)
  useEffect(() => {
    if (goalId && goalId !== currentGoalId) {
      selectGoal(goalId);
    }
    // Clear goal when navigating away
    return () => {
      if (currentGoalId) {
        closeGoal();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]); // Only depend on goalId (URL param), not currentGoalId (store state)

  if (!goal) {
    return <Navigate to="/" replace />;
  }

  const handleClose = () => {
    closeGoal();
    navigate('/');
  };

  return <GoalDetailView goal={goal} onClose={handleClose} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
