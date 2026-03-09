import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useViewStore } from "@/store/useViewStore";
import { useGoalsStore } from "@/store/useGoalsStore";
import { useBillingStore } from "@/store/useBillingStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AccountDropdown } from "@/components/auth/AccountDropdown";
import { GoalDetailView } from "@/components/goals/GoalDetailView";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { FloatingBackButton } from "@/components/ui/FloatingBackButton";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Callback from "./pages/Callback";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { apiClient } from "./services/apiClient";
import { authService } from "./services/authService";
import { toast } from "sonner";

const queryClient = new QueryClient();

// Protected route wrapper - redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user);
  const isDemoMode = useAuthStore((state) => state.isDemoMode);
  const location = useLocation();

  // Wait for Zustand persist to rehydrate from localStorage before making auth
  // decisions. Without this, the first render sees user=null and flashes /login.
  const [hasHydrated, setHasHydrated] = useState(
    () => useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    if (!hasHydrated) {
      return useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
    }
  }, [hasHydrated]);

  if (!hasHydrated) return null;

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
  const isChatMinimized = useViewStore((state) => state.isChatMinimized);
  const toggleChatMinimized = useViewStore((state) => state.toggleChatMinimized);
  const closeGoal = useViewStore((state) => state.closeGoal);
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

        {/* Global UpgradeModal */}
        <UpgradeModal />
      </div>
    </ProtectedRoute>
  );
};

// Inner app component that initializes the store
const AppContent = () => {
  const initializeApp = useAuthStore((state) => state.initializeApp);
  const logout = useAuthStore((state) => state.logout);
  const fetchGoals = useGoalsStore((state) => state.fetchGoals);
  const fetchBilling = useBillingStore((state) => state.fetchBilling);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  useKeyboardShortcuts(); // Initialize keyboard shortcuts

  // Register 401 callback to properly log out (clear user state + redirect)
  useEffect(() => {
    apiClient.setUnauthorizedCallback(() => {
      logout();
      navigate('/login', { state: { from: location }, replace: true });
    });
    return () => {
      apiClient.setUnauthorizedCallback(null);
    };
  }, [logout, navigate, location]);

  useEffect(() => {
    initializeApp().then(() => {
      if (useAuthStore.getState().user) {
        fetchGoals();
        fetchBilling();
      }
    });
  }, [initializeApp, fetchGoals, fetchBilling]);

  // Handle Stripe checkout success redirect — refetch billing + clean URL
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast.success('Subscription activated! Your plan has been upgraded.', { duration: 5000 });
      fetchBilling();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('checkout');
        return next;
      });
    }
  }, [searchParams, fetchBilling, setSearchParams]);

  // Re-validate auth when app returns to foreground (e.g. mobile tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && authService.isAuthenticated()) {
        authService.getProfile().catch(() => {
          // 401 will be handled by apiClient's unauthorized callback
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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
  const goals = useGoalsStore((state) => state.goals);
  const currentGoalId = useViewStore((state) => state.currentGoalId);
  const selectGoal = useViewStore((state) => state.selectGoal);
  const closeGoal = useViewStore((state) => state.closeGoal);

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
