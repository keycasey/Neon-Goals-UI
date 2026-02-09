import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  global?: boolean; // If true, works everywhere; otherwise only when not typing
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const {
    currentGoalId,
    closeGoal,
    sidebarOpen,
    setSidebarOpen,
    setActiveCategory,
    user,
    logout,
  } = useAppStore();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Escape',
      description: 'Close goal detail or modal',
      action: () => {
        if (currentGoalId) {
          closeGoal();
        }
      },
      global: true,
    },
    {
      key: 'n',
      description: 'New goal (opens chat)',
      action: () => {
        setActiveCategory('all');
        // Focus on chat input would go here
      },
    },
    {
      key: 'l',
      description: user ? 'Logout' : 'Go to login',
      action: () => {
        if (user) {
          logout();
          navigate('/login');
        } else {
          navigate('/login');
        }
      },
    },
    {
      key: 'h',
      description: 'Toggle sidebar',
      action: () => {
        setSidebarOpen(!sidebarOpen);
      },
    },
    {
      key: '/',
      description: 'Search (coming soon)',
      action: () => {
        // Search functionality would go here
        console.log('Search shortcut pressed');
      },
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {
        // Could show a modal with shortcuts
        alert('Keyboard Shortcuts:\nESC - Close goal detail\nN - New goal\nL - Login/Logout\nH - Toggle sidebar\n/ - Search\n? - Show this help');
      },
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Find matching shortcut
      const shortcut = shortcuts.find((s) => {
        if (s.key.toLowerCase() === e.key.toLowerCase()) {
          // For non-global shortcuts, skip if typing
          return s.global || !isTyping;
        }
        return false;
      });

      if (shortcut) {
        e.preventDefault();
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, currentGoalId, sidebarOpen, user]);

  return { shortcuts };
};

// Export a list of shortcuts for display purposes
export const allShortcuts: Array<{ key: string; description: string }> = [
  { key: 'ESC', description: 'Close goal detail or modal' },
  { key: 'N', description: 'New goal (opens chat)' },
  { key: 'L', description: 'Login / Logout' },
  { key: 'H', description: 'Toggle sidebar' },
  { key: '/', description: 'Search (coming soon)' },
  { key: '?', description: 'Show keyboard shortcuts' },
];
