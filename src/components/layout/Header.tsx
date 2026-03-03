import React from 'react';
import { Menu, LayoutGrid, List, Bell, Search, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useViewStore } from '@/store/useViewStore';
import { useAuthStore } from '@/store/useAuthStore';

interface HeaderProps {
  className?: string;
  accountDropdownOpen: boolean;
  setAccountDropdownOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ className, accountDropdownOpen, setAccountDropdownOpen }) => {
  const { toggleSidebar, sidebarOpen, viewMode, setViewMode } = useViewStore();
  const { user } = useAuthStore();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 h-16 px-4 flex items-center justify-between",
        "bg-background/80 backdrop-blur-md",
        "border-b border-border",
        "z-[60] lg:pl-[292px] lg:px-4",
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-3 rounded-lg transition-colors lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center",
            "hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo & Title - Aligned with sidebar content */}
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

        {/* Search (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border w-64 lg:w-80 lg:ml-[92px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search goals..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            /
          </kbd>
        </div>
      </div>

      {/* Center Section - View Toggle (Mobile/Tablet) */}
      <div className="flex md:hidden items-center">
        <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-3 rounded-md transition-all min-w-[44px] min-h-[44px] flex items-center justify-center",
              viewMode === 'list' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="List view"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={cn(
              "p-3 rounded-md transition-all min-w-[44px] min-h-[44px] flex items-center justify-center",
              viewMode === 'card' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Card view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Section */}
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
  );
};
