import type { User } from '@/core/models/dtos/dtos';
import { authApi } from '@/core/repositories/auth-repository';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
  expiresAt: number; // JWT expiration timestamp
}

interface AuthActions {
  signIn: (credentials: { username: string; password: string }) => Promise<boolean>;
  signOut: () => void;
  checkAuthValidity: () => boolean;
  initializeAuth: () => void;
  setLoading: (loading: boolean) => void;
  refreshTokenIfNeeded: () => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

// Helper function to get JWT expiration timestamp
const getJwtExpirationTimestamp = (token: string): number => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationMs = payload.exp * 1000; // Convert to milliseconds

    console.log('JWT Payload:', {
      sub: payload.sub,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
      issuedAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(expirationMs).toISOString()
    });

    return expirationMs;
  } catch (error) {
    console.error('Failed to parse JWT expiration:', error);
    return 0;
  }
};

// Helper function to validate token expiry
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const isValid = payload.exp > currentTime;

    console.log('Token validation:', {
      currentTime,
      tokenExp: payload.exp,
      currentTimeReadable: new Date(currentTime * 1000).toISOString(),
      tokenExpReadable: new Date(payload.exp * 1000).toISOString(),
      isValid,
      timeUntilExpiry: payload.exp - currentTime + ' seconds'
    });

    return isValid;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Helper function to check if token will expire soon (within 5 minutes)
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes in seconds
    const isExpiringSoon = payload.exp <= fiveMinutesFromNow;

    console.log('Token expiring soon check:', {
      currentTime,
      fiveMinutesFromNow,
      tokenExp: payload.exp,
      timeUntilExpiry: payload.exp - currentTime + ' seconds',
      isExpiringSoon
    });

    return isExpiringSoon;
  } catch (error) {
    console.error('Token expiration check error:', error);
    return false;
  }
};

// Start periodic auth validity checks when the store is created
let authCheckInterval: NodeJS.Timeout | null = null;

const startAuthValidityCheck = () => {
  if (authCheckInterval) return; // Already running

  authCheckInterval = setInterval(async () => {
    const state = useAuthStore.getState();
    if (state.isAuthenticated) {
      // Try to refresh token if needed first
      const refreshSuccess = await state.refreshTokenIfNeeded();

      if (refreshSuccess) {
      // Then check overall validity
        const isValid = state.checkAuthValidity();
        if (!isValid) {
          console.log('Auth validity check failed, user will be signed out');
        }
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
            const expiresAt = getJwtExpirationTimestamp(res.data.accessToken);

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

        // Check if JWT token has expired
        if (now > state.expiresAt) {
          console.log('JWT token expired at:', new Date(state.expiresAt).toISOString());
          get().signOut();
          return false;
        }

        // Double-check access token validity
        if (state.accessToken && !isTokenValid(state.accessToken)) {
          console.log('Access token is invalid');
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

      refreshTokenIfNeeded: async () => {
        const state = get();

        if (!state.accessToken || !state.refreshToken) {
          console.log('No tokens available for refresh');
          return false;
        }

        // Check if access token is expiring soon
        if (!isTokenExpiringSoon(state.accessToken)) {
          return true; // Token is still good
        }

        try {
          console.log('Attempting to refresh token...');

          const refreshResponse = await authApi.refreshToken(state.refreshToken);

          if (refreshResponse.data?.accessToken && refreshResponse.data?.refreshToken) {
            const expiresAt = getJwtExpirationTimestamp(refreshResponse.data.accessToken);

            set({
              accessToken: refreshResponse.data.accessToken,
              refreshToken: refreshResponse.data.refreshToken,
              expiresAt,
              user: refreshResponse.data.user || state.user, // Keep existing user if not provided
            });

            console.log('Token refreshed successfully, new expiration:', new Date(expiresAt).toISOString());
            return true;
          }

          console.log('Token refresh failed - invalid response');
          get().signOut();
          return false;
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().signOut();
          return false;
        }
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

// Utility function to get time remaining until token expiration in minutes
export const getTokenExpirationTimeRemaining = (): number => {
  const state = useAuthStore.getState();
  if (!state.expiresAt || !state.isAuthenticated) {
    return 0;
  }

  const now = Date.now();
  const timeRemaining = state.expiresAt - now;
  return Math.max(0, Math.floor(timeRemaining / (1000 * 60))); // Convert to minutes
};

// Utility function for debugging JWT tokens - you can use this in the console
export const debugJwtToken = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationMs = payload.exp * 1000;

    return {
      payload,
      currentTime,
      currentTimeReadable: new Date(currentTime * 1000).toISOString(),
      issuedAt: new Date(payload.iat * 1000).toISOString(),
      expiresAt: new Date(expirationMs).toISOString(),
      isValid: payload.exp > currentTime,
      timeUntilExpiry: payload.exp - currentTime,
      timeUntilExpiryReadable: `${Math.floor((payload.exp - currentTime) / 60)} minutes`
    };
  } catch (error) {
    console.error('Failed to debug JWT token:', error);
    return null;
  }
};

// Utility hook for auth guard functionality
export const useAuthGuard = () => {
  const { isAuthenticated, user, checkAuthValidity } = useAuthStore();

  const hasAccess = checkAuthValidity();

  return { hasAccess, isAuthenticated, user };
};