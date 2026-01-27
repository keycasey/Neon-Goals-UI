import React from 'react';
import { Menu, LayoutGrid, List, Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { 
    toggleSidebar, 
    sidebarOpen,
    viewMode, 
    setViewMode, 
    user 
  } = useAppStore();

  return (
    <header 
      className={cn(
        "h-16 px-4 lg:px-6 flex items-center justify-between",
        "bg-background/80 backdrop-blur-md",
        "border-b border-border",
        "sticky top-0 z-30",
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Hamburger Menu */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "p-2 rounded-lg transition-colors",
            "hover:bg-muted text-muted-foreground hover:text-foreground",
            sidebarOpen && "lg:hidden"
          )}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border w-64 lg:w-80">
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
              "p-2 rounded-md transition-all",
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
              "p-2 rounded-md transition-all",
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
          className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
        </button>

        {/* User Avatar */}
        {user && (
          <button className="flex items-center gap-2 p-1 pr-3 rounded-full bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
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
        )}
      </div>
    </header>
  );
};
