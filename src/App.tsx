import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { GoalDetailView } from "@/components/goals/GoalDetailView";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main layout that persists across routes
const MainLayout = () => {
  const location = useLocation();
  const isGoalRoute = location.pathname.startsWith('/goals/');
  const isChatMinimized = useAppStore((state) => state.isChatMinimized);
  const toggleChatMinimized = useAppStore((state) => state.toggleChatMinimized);

  // Don't render layout for auth pages
  if (['/login', '/auth/callback'].includes(location.pathname)) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Sidebar />
      <Header />
      <ChatSidebar
        mode={isGoalRoute ? "goal" : "creation"}
        goalId={isGoalRoute ? location.pathname.split('/')[2] : undefined}
        isMinimized={isChatMinimized}
        onToggleMinimize={toggleChatMinimized}
      />
      <Outlet />
    </div>
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

  // Update store when URL changes
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
  }, [goalId, currentGoalId, selectGoal, closeGoal]);

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
