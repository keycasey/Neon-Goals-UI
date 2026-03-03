import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Settings, X, User, Mail, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

interface AccountDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on ESC key & prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when dropdown is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    onClose();
  };

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - starts below header, covers entire page width */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 bg-black/40 backdrop-blur-sm z-[50]"
            onClick={onClose}
          />

          {/* Dropdown Content - Bottom sheet on mobile, right sidebar on desktop */}
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed z-[61]",
              // Mobile: bottom sheet with max height
              "bottom-0 left-0 right-0",
              "max-h-[85vh]",
              "rounded-t-3xl",
              "p-6 pt-4",
              // Desktop: fixed-width right sidebar panel
              "lg:top-16 lg:bottom-0 lg:left-auto lg:right-0 lg:w-[450px]",
              "lg:max-h-none lg:h-full lg:overflow-y-auto",
              "lg:rounded-none lg:rounded-l-3xl",
              "lg:pt-8 lg:pb-8 lg:pr-8 lg:pl-8",
              "glass-card neon-border"
            )}
          >
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="h-full flex flex-col">
              {/* Desktop Close Button */}
              <button
                onClick={onClose}
                className="hidden lg:flex absolute top-6 right-8 p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="mb-8">
                <h2 className="font-heading text-3xl font-bold gradient-text mb-2">
                  Account
                </h2>
                <p className="text-muted-foreground">
                  Manage your account settings and preferences
                </p>
              </div>

              {/* User Profile Card */}
              <div className="glass-card rounded-2xl p-6 mb-6 neon-border">
                <div className="flex items-start gap-4">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/50"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-neon flex items-center justify-center text-2xl font-bold text-primary-foreground ring-2 ring-primary/50">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-heading text-xl font-bold text-foreground mb-1">
                      {user.name}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </div>
                  <div className="hidden sm:block p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>

              {/* Account Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary mb-1">12</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Goals</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-accent mb-1">85%</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Completion</p>
                </div>
                <div className="glass-card rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                  <p className="text-2xl font-bold text-secondary mb-1">47</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleSettings}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4",
                    "rounded-xl glass-card hover:bg-muted/50",
                    "transition-all duration-200",
                    "group"
                  )}
                >
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Customize your experience
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                <button
                  onClick={handleLogout}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4",
                    "rounded-xl glass-card hover:bg-destructive/10",
                    "transition-all duration-200",
                    "group border-destructive/30 hover:border-destructive/50"
                  )}
                >
                  <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                    <LogOut className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-destructive">Sign Out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account
                    </p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-border/50">
                <p className="text-xs text-muted-foreground text-center">
                  Goals-AF v1.0 • Made with 💜 in Miami
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
