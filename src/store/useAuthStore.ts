import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Settings } from '@/types/goals';
import { authService } from '@/services/authService';
import { usersService } from '@/services/usersService';

const defaultSettings: Settings = {
  theme: 'miami-vice',
  chatModel: 'gpt-4',
  displayName: 'User',
};

interface AuthState {
  user: User | null;
  settings: Settings;
  isDemoMode: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  logout: () => void;
  setDemoMode: (enabled: boolean) => void;
  fetchUser: () => Promise<void>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;
  initializeApp: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      settings: defaultSettings,
      isDemoMode: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      logout: () => {
        authService.logout();
        set({ user: null, isDemoMode: false });
      },

      setDemoMode: (isDemoMode) => set({ isDemoMode }),

      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const user = await authService.getProfile();
          set({ user, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch user:', error);
          const msg = error?.message || '';
          const is401 = error?.response?.status === 401 || error?.status === 401 || msg.includes('Session expired');
          if (is401) {
            authService.logout();
            set({ user: null, error: null, isLoading: false, isDemoMode: false });
          } else {
            set({ error: 'Failed to fetch user profile', isLoading: false });
          }
        }
      },

      saveSettings: async (newSettings) => {
        try {
          set({ isLoading: true, error: null });
          await usersService.updateSettings(newSettings);
          set((state) => ({
            settings: { ...state.settings, ...newSettings },
            isLoading: false,
          }));
        } catch (error) {
          console.error('Failed to save settings:', error);
          set({ error: 'Failed to save settings', isLoading: false });
        }
      },

      initializeApp: async () => {
        const token = authService.initializeAuth();
        if (token) {
          await get().fetchUser();
        } else {
          if (get().user && !get().isDemoMode) {
            set({ user: null });
          }
        }
      },
    }),
    {
      name: 'goals-auth-storage',
      partialize: (state) => ({
        user: state.user,
        settings: state.settings,
        isDemoMode: state.isDemoMode,
      }),
    }
  )
);
