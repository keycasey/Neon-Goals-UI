import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Settings } from '@/types/goals';
import { authService } from '@/services/authService';
import { usersService } from '@/services/usersService';
import { useAppStore } from './useAppStore';
import { ApiClientError } from '@/services/apiClient';

const defaultSettings: Settings = {
  theme: 'miami-vice',
  chatModel: 'gpt-5-nano',
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
        useAppStore.getState().resetUserScopedState();
        set({ user: null, isDemoMode: false, error: null, isLoading: false });
      },

      setDemoMode: (isDemoMode) => set({ isDemoMode }),

      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const profile = await authService.getProfile();
          const { settings, ...user } = profile;
          set((state) => ({
            user,
            settings: settings
              ? { ...state.settings, ...settings }
              : state.settings,
            isLoading: false,
          }));
        } catch (error: unknown) {
          console.error('Failed to fetch user:', error);
          const msg = error instanceof Error ? error.message : '';
          const is401 = (error instanceof ApiClientError && error.status === 401) || msg.includes('Session expired');
          if (is401) {
            authService.logout();
            useAppStore.getState().resetUserScopedState();
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
          useAppStore.getState().resetUserScopedState();
          set({ user: null, isDemoMode: false, error: null, isLoading: false });
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
