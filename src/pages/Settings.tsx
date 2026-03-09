import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Palette, MessageSquare, Bell, Database, ArrowLeft, LogIn, CreditCard, Code, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useBillingStore } from '@/store/useBillingStore';
import { BillingPlanCards } from '@/components/billing/BillingPlanCards';
import { UsageMeter } from '@/components/billing/UsageMeter';
import { ApiAccessGate } from '@/components/billing/ApiAccessGate';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'appearance' | 'chat' | 'notifications' | 'billing' | 'developer' | 'data';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'chat', label: 'AI Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'developer', label: 'Developer', icon: <Code className="w-4 h-4" /> },
  { id: 'data', label: 'Data & Privacy', icon: <Database className="w-4 h-4" /> },
];

const Settings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, settings, updateSettings } = useAuthStore();
  const { subscription, usage, openCustomerPortal, isLoading: billingLoading } = useBillingStore();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const activeTab = (searchParams.get('tab') as SettingsTab) || 'profile';

  const setTab = (tab: SettingsTab) => {
    setSearchParams({ tab });
  };

  // ESC key to go back
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [navigate]);

  useEffect(() => {
    if (accountDropdownOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [accountDropdownOpen]);

  const themes = [
    { id: 'miami-vice', name: 'Miami Vice', colors: 'from-cyan-400 to-pink-500' },
    { id: 'cyberpunk', name: 'Cyberpunk', colors: 'from-purple-500 to-cyan-400' },
    { id: 'synthwave', name: 'Synthwave', colors: 'from-pink-500 to-orange-400' },
  ] as const;

  const handleBack = () => navigate(-1);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const url = await openCustomerPortal();
      window.location.href = url;
    } catch (error) {
      console.error('[Settings] Portal failed:', error);
      setPortalLoading(false);
    }
  };

  const currentPlan = subscription?.plan || 'free';
  const currentPlanLabel = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="fixed top-0 right-0 left-0 h-16 px-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border z-[60]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Neon Goals" className="w-16 h-16 rounded-lg" />
            <div className="hidden sm:block -ml-3">
              <h1 className="font-heading font-bold text-lg gradient-text">Neon Goals</h1>
              <p className="text-xs text-muted-foreground">Crush your goals</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="relative p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
          </button>
          {user ? (
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className={cn(
                'flex items-center gap-2 p-2 pr-3 rounded-full min-h-[44px]',
                'bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50',
                accountDropdownOpen && 'bg-muted/50'
              )}
              aria-label="Account menu"
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="hidden lg:block text-sm font-medium text-foreground">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-neon text-primary-foreground font-medium hover:shadow-lg hover:neon-glow-cyan transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Account Dropdown */}
      {user && accountDropdownOpen && (
        <>
          <div className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-[50]" onClick={() => setAccountDropdownOpen(false)} />
          <div className="fixed inset-0 lg:top-16 lg:bottom-0 lg:right-0 lg:left-auto lg:w-[400px] z-[80] bg-background lg:border-l border-border overflow-y-auto">
            <div className="p-6 pt-20 lg:pt-6">
              <button
                onClick={() => setAccountDropdownOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
              <div className="glass-card rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-neon flex items-center justify-center text-lg font-bold">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setAccountDropdownOpen(false); handleBack(); }}
                className="w-full flex items-center gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors mb-2 text-left"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Previous Page</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="fixed inset-0 lg:static lg:pt-16 lg:min-h-screen overflow-y-auto z-[80] lg:z-auto bg-background">
        <div className="max-w-5xl mx-auto p-4 lg:p-8 pt-20 lg:pt-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Tabs */}
            <div className="lg:w-56 flex-shrink-0">
              <div className="glass-card rounded-2xl p-2 lg:sticky lg:top-8">
                <nav className="space-y-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTab(tab.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                        activeTab === tab.id
                          ? 'bg-primary/20 text-primary neon-glow-cyan'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      <span className={activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}>{tab.icon}</span>
                      {tab.label}
                      {tab.id === 'billing' && currentPlan !== 'free' && (
                        <span className="ml-auto text-xs badge-info">{currentPlanLabel}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {/* Profile */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="glass-card rounded-2xl p-6 neon-border">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <User className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-heading text-lg font-bold text-foreground">Profile</h3>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/50" />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-neon flex items-center justify-center text-2xl font-bold text-primary-foreground ring-2 ring-primary/50">
                              {user?.name.charAt(0)}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{user?.name}</p>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <button className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors">
                              Edit Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Appearance */}
                  {activeTab === 'appearance' && (
                    <div className="glass-card rounded-2xl p-6 neon-border">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Palette className="w-5 h-5 text-accent" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-foreground">Appearance</h3>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-3 block">Theme</label>
                        <div className="grid grid-cols-3 gap-3">
                          {themes.map((theme) => (
                            <button
                              key={theme.id}
                              onClick={() => updateSettings({ theme: theme.id })}
                              className={cn(
                                'relative p-4 rounded-xl border-2 transition-all',
                                'bg-gradient-to-br ' + theme.colors,
                                settings.theme === theme.id ? 'border-white scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                              )}
                            >
                              <div className="text-center">
                                <p className="text-sm font-bold text-white drop-shadow-lg">{theme.name}</p>
                              </div>
                              {settings.theme === theme.id && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Chat */}
                  {activeTab === 'chat' && (
                    <div className="glass-card rounded-2xl p-6 neon-border">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <MessageSquare className="w-5 h-5 text-secondary" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-foreground">AI Chat</h3>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">AI Model</label>
                        <select
                          value={settings.chatModel}
                          onChange={(e) => updateSettings({ chatModel: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="gpt-4">GPT-4 (Recommended)</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="claude-3-opus">Claude 3 Opus</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  {activeTab === 'notifications' && (
                    <div className="glass-card rounded-2xl p-6 neon-border">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Bell className="w-5 h-5 text-accent" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-foreground">Notifications</h3>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Goal reminders', description: 'Get reminded about your goals' },
                          { label: 'Price alerts', description: 'Notify when item prices drop' },
                          { label: 'Progress updates', description: 'Weekly progress summaries' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                            <div>
                              <p className="font-medium text-foreground">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                            <button className="w-12 h-6 rounded-full transition-colors relative bg-primary">
                              <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-foreground shadow" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Billing */}
                  {activeTab === 'billing' && (
                    <div className="space-y-6">
                      {/* Current Plan Summary */}
                      <div className="glass-card rounded-2xl p-6 neon-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <CreditCard className="w-5 h-5 text-primary" />
                          </div>
                          <h3 className="font-heading text-lg font-bold text-foreground">Current Plan</h3>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                          <div>
                            <p className="font-heading text-2xl font-bold neon-text-cyan">{currentPlanLabel}</p>
                            {subscription?.renewsAt && (
                              <p className="text-sm text-muted-foreground">
                                {subscription.cancelAtPeriodEnd ? 'Cancels on ' : 'Renews '}
                                {new Date(subscription.renewsAt).toLocaleDateString()}
                              </p>
                            )}
                            {subscription?.status === 'past_due' && (
                              <p className="text-sm text-destructive font-medium mt-1">⚠ Payment past due — update billing</p>
                            )}
                          </div>
                          {currentPlan !== 'free' && (
                            <button
                              onClick={handleManageBilling}
                              disabled={portalLoading}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm font-medium"
                            >
                              {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              Manage Billing
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Usage Meters */}
                      {usage && (
                        <div className="space-y-3">
                          <h4 className="font-heading font-semibold text-foreground">This Month's Usage</h4>
                          <UsageMeter type="messages" />
                          {(subscription?.plan === 'pro' || subscription?.plan === 'power') && (
                            <>
                              <UsageMeter type="email_alerts" />
                              <UsageMeter type="sms_alerts" />
                            </>
                          )}
                        </div>
                      )}

                      {/* Plan Cards */}
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-4">
                          {currentPlan === 'free' ? 'Upgrade Your Plan' : 'Available Plans'}
                        </h4>
                        <BillingPlanCards />
                      </div>
                    </div>
                  )}

                  {/* Developer */}
                  {activeTab === 'developer' && (
                    <div className="space-y-6">
                      <div className="glass-card rounded-2xl p-6 neon-border">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <Code className="w-5 h-5 text-secondary" />
                          </div>
                          <h3 className="font-heading text-lg font-bold text-foreground">Developer & API</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                          Integrate Neon Goals into your own tools and automation workflows using the API.
                        </p>
                        <ApiAccessGate />
                      </div>
                    </div>
                  )}

                  {/* Data & Privacy */}
                  {activeTab === 'data' && (
                    <div className="glass-card rounded-2xl p-6 neon-border">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-muted/30">
                          <Database className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <h3 className="font-heading text-lg font-bold text-foreground">Data & Privacy</h3>
                      </div>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-muted/30 transition-colors text-left">
                          <div>
                            <p className="font-medium text-foreground">Export Data</p>
                            <p className="text-xs text-muted-foreground">Download all your data</p>
                          </div>
                          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-destructive/10 transition-colors text-left">
                          <div>
                            <p className="font-medium text-destructive">Delete Account</p>
                            <p className="text-xs text-muted-foreground">Permanently delete your account</p>
                          </div>
                          <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Goals-AF v1.0 • Made with 💜 in Miami</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
