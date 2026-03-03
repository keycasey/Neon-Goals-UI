import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Palette, MessageSquare, Bell, Shield, Database, ArrowLeft, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const Settings = () => {
  const navigate = useNavigate();
  const { user, settings, updateSettings } = useAuthStore();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

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

  // Prevent body scroll when dropdown is open
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

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Custom Header with logo, notifications, account */}
      <header className="fixed top-0 right-0 left-0 h-16 px-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border z-[60]">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img
              src="/logo.png"
              alt="Neon Goals"
              className="w-16 h-16 rounded-lg"
            />
            <div className="hidden sm:block -ml-3">
              <h1 className="font-heading font-bold text-lg gradient-text">Neon Goals</h1>
              <p className="text-xs text-muted-foreground">Crush your goals</p>
            </div>
          </Link>
        </div>

        {/* Right Section - Notifications & Account */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button 
            className="relative p-3 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
          </button>

          {/* User Avatar or Login Button */}
          {user ? (
            <button
              onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              className={cn(
                "flex items-center gap-2 p-2 pr-3 rounded-full min-h-[44px]",
                "bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50",
                accountDropdownOpen && "bg-muted/50"
              )}
              aria-label="Account menu"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="hidden lg:block text-sm font-medium text-foreground">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <Link
              to="/login"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-gradient-neon text-primary-foreground font-medium",
                "hover:shadow-lg hover:neon-glow-cyan",
                "transition-all duration-200"
              )}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Account Dropdown (rendered here for settings page) */}
      {user && (
        <>
          {/* Backdrop */}
          {accountDropdownOpen && (
            <div
              className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-[50]"
              onClick={() => setAccountDropdownOpen(false)}
            />
          )}

          {/* Dropdown Panel */}
          {accountDropdownOpen && (
            <div className="fixed inset-0 lg:top-16 lg:bottom-0 lg:right-0 lg:left-auto lg:w-[400px] z-[80] bg-background lg:border-l border-border overflow-y-auto">
              <div className="p-6 pt-20 lg:pt-6">
                <button
                  onClick={() => setAccountDropdownOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
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
          )}
        </>
      )}

      {/* Content - centered */}
      <div className="fixed inset-0 lg:static lg:pt-16 lg:min-h-screen overflow-y-auto z-[80] lg:z-auto bg-background">
        <div className="max-w-4xl mx-auto p-4 lg:p-8 pt-20 lg:pt-4">
          {/* Settings Sections */}
          <div className="space-y-6">
            {/* Profile Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 neon-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Profile</h3>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/50"
                  />
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
            </motion.div>

            {/* Appearance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card rounded-2xl p-6 neon-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Palette className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">Appearance</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => updateSettings({ theme: theme.id })}
                        className={cn(
                          "relative p-4 rounded-xl border-2 transition-all",
                          "bg-gradient-to-br " + theme.colors,
                          settings.theme === theme.id
                            ? "border-white scale-105 shadow-lg"
                            : "border-transparent opacity-60 hover:opacity-100"
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
            </motion.div>

            {/* Chat Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6 neon-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <MessageSquare className="w-5 h-5 text-secondary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">AI Chat</h3>
              </div>

              <div className="space-y-4">
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
            </motion.div>

            {/* Notifications Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card rounded-2xl p-6 neon-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Bell className="w-5 h-5 text-pink-500" />
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
                    <button className={cn(
                      "w-12 h-6 rounded-full transition-colors relative",
                      "bg-primary"
                    )}>
                      <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Data Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card rounded-2xl p-6 neon-border"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Database className="w-5 h-5 text-orange-500" />
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
            </motion.div>

            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center py-8"
            >
              <p className="text-sm text-muted-foreground">
                Goals-AF v1.0 • Made with 💜 in Miami
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
