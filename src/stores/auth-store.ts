import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi } from '@/core/repositories/auth-repository';
import type { User } from '@/core/models/dtos/dtos';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number; // End of day timestamp
}

interface AuthActions {
  signIn: (credentials: { username: string; password: string }) => Promise<boolean>;
  signOut: () => void;
  checkAuthValidity: () => boolean;
  initializeAuth: () => void;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

// Helper function to get end of current day timestamp
const getEndOfDayTimestamp = (): number => {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfDay.getTime();
};

// Helper function to validate token expiry
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Start periodic auth validity checks when the store is created
let authCheckInterval: NodeJS.Timeout | null = null;

const startAuthValidityCheck = () => {
  if (authCheckInterval) return; // Already running

  authCheckInterval = setInterval(() => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      const isValid = state.checkAuthValidity();
      if (!isValid) {
        console.log('Auth validity check failed, user will be signed out');
      }
    }
  }, 60000); // Check every minute

  console.log('Started auth validity check interval');
};

const stopAuthValidityCheck = () => {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
    authCheckInterval = null;
    console.log('Stopped auth validity check interval');
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      isLoading: true,
      accessToken: null,
      refreshToken: null,
      expiresAt: 0,

      // Actions
      signIn: async (credentials) => {
        try {
          set({ isLoading: true });

          const res = await authApi.login({
            identifier: credentials.username,
            password: credentials.password,
          });

          console.log('Login response:', res.data);

          if (res.data?.accessToken && res.data?.refreshToken && res.data?.user) {
            const expiresAt = getEndOfDayTimestamp();

            set({
              isAuthenticated: true,
              user: res.data.user,
              accessToken: res.data.accessToken,
              refreshToken: res.data.refreshToken,
              expiresAt,
              isLoading: false,
            });

            // Start periodic auth checks
            startAuthValidityCheck();

            console.log('Sign in successful, session expires at:', new Date(expiresAt).toISOString());
            return true;
          }

          console.log('Sign in failed - missing required data');
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('Sign in failed:', error);
          set({ isLoading: false });
          return false;
        }
      },

      signOut: () => {
        console.log('User signing out');

        // Stop periodic checks
        stopAuthValidityCheck();

        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: 0,
          isLoading: false,
        });
      },

      checkAuthValidity: () => {
        const state = get();
        const now = Date.now();

        // Check if session has expired (past end of day)
        if (now > state.expiresAt) {
          console.log('Session expired (past end of day)');
          get().signOut();
          return false;
        }

        // Check if access token is still valid
        if (state.accessToken && !isTokenValid(state.accessToken)) {
          console.log('Access token expired');
          get().signOut();
          return false;
        }

        return state.isAuthenticated && !!state.accessToken && !!state.user;
      },

      initializeAuth: () => {
        const state = get();

        // Check if we have auth data and if it's still valid
        if (state.accessToken && state.user) {
          const isValid = get().checkAuthValidity();
          if (isValid) {
            // Auth is still valid, start periodic checks
            startAuthValidityCheck();
          }
        }

        set({ isLoading: false });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('Auth store rehydrated:', {
          isAuthenticated: state?.isAuthenticated,
          hasUser: !!state?.user,
          hasToken: !!state?.accessToken,
          expiresAt: state?.expiresAt ? new Date(state.expiresAt).toISOString() : 'none'
        });

        // Initialize auth after rehydration
        if (state) {
          state.initializeAuth();
        }
      },
    }
  )
);

// Utility function to get access token
export const getAccessToken = (): string | null => {
  return useAuthStore.getState().accessToken;
};

// Utility hook for auth guard functionality
export const useAuthGuard = () => {
  const { isAuthenticated, user, checkAuthValidity } = useAuthStore();

  const hasAccess = checkAuthValidity();

  return { hasAccess, isAuthenticated, user };
};