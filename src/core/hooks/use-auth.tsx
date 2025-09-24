// auth.tsx
import { TokenExpirationDialog } from '@/components/TokenExpirationDialog';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setTokenExpirationHandler } from '../axios-config';
import type { User } from '../models/dtos/dtos';
import { authApi } from '../repositories/auth-repository';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  signIn: (credentials: { username: string; password: string }) => Promise<boolean>;
  signOut: () => void;
  handleTokenExpired: () => void;
  showTokenExpiredDialog: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_DATA_KEY = "UserData";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
// Backup keys for token restoration on page reload/re-entry
const BACKUP_ACCESS_TOKEN_KEY = "backup_accessToken";
const BACKUP_REFRESH_TOKEN_KEY = "backup_refreshToken";
const BACKUP_USER_DATA_KEY = "backup_UserData";

// Helper function to validate token expiry
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    console.log('Token validation:', { exp: payload.exp, current: currentTime, valid: payload.exp > currentTime });
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTokenExpiredDialog, setShowTokenExpiredDialog] = useState(false);
  const [tokenCheckInterval, setTokenCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  // Set up axios token expiration handler
  useEffect(() => {
    setTokenExpirationHandler(handleTokenExpired);
  }, []);

  // Add window focus/visibility tracking to debug idle logout issues
  useEffect(() => {
    const handleWindowFocus = () => {
      console.log('🔍 Window focused at:', new Date().toISOString());
      console.log('🔍 Auth state on focus:', {
        isAuthenticated,
        hasUser: !!user,
        showDialog: showTokenExpiredDialog
      });

      // Try to restore from backup if main tokens are missing
      const restored = restoreFromBackup();
      if (restored) {
        console.log('🔄 Tokens restored from backup on window focus');
        // Re-initialize auth state if tokens were restored
        const userData = localStorage.getItem(USER_DATA_KEY);
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (userData && accessToken && isTokenValid(accessToken)) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsAuthenticated(true);
          startTokenValidation();
          return; // Skip token expiration check since we just restored
        }
      }

      // Check token validity on window focus
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken) {
        const valid = isTokenValid(accessToken);
        console.log('🔍 Token validity on focus:', { valid, timestamp: new Date().toISOString() });

        if (!valid && isAuthenticated && !showTokenExpiredDialog) {
          console.log('🚨 Token expired detected on window focus');
          handleTokenExpired();
        } else if (valid && isAuthenticated) {
          // Refresh backup tokens if current tokens are valid
          createTokenBackup();
        }
      }
    };

    const handleWindowBlur = () => {
      console.log('🔍 Window blurred at:', new Date().toISOString());
    };

    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      console.log(`🔍 Page ${isHidden ? 'hidden' : 'visible'} at:`, new Date().toISOString());

      if (!isHidden) {
        // Page became visible - try to restore from backup first
        const restored = restoreFromBackup();
        if (restored) {
          console.log('🔄 Tokens restored from backup on page visible');
          // Re-initialize auth state if tokens were restored
          const userData = localStorage.getItem(USER_DATA_KEY);
          const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

          if (userData && accessToken && isTokenValid(accessToken)) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
            startTokenValidation();
            return; // Skip token expiration check since we just restored
          }
        }

        // Page became visible - check token
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (accessToken) {
          const valid = isTokenValid(accessToken);
          console.log('🔍 Token validity on page visible:', { valid, timestamp: new Date().toISOString() });

          if (!valid && isAuthenticated && !showTokenExpiredDialog) {
            console.log('🚨 Token expired detected on page visibility change');
            handleTokenExpired();
          } else if (valid && isAuthenticated) {
            // Refresh backup tokens if current tokens are valid
            createTokenBackup();
          }
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user, showTokenExpiredDialog]);

  // Add activity tracking to debug idle logout issues
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Debug activity tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const minutesIdle = Math.floor((now.getTime() - lastActivity.getTime()) / 1000 / 60);
      console.log(`📊 User activity: last active ${minutesIdle} minutes ago at ${lastActivity.toISOString()}`);
    }, 5 * 60 * 1000); // Log every 5 minutes

    return () => clearInterval(interval);
  }, [lastActivity]);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('🔄 Starting auth initialization...');

    const initializeAuth = async () => {
      try {
        // First try to restore from backup if main tokens are missing
        const restored = restoreFromBackup();
        if (restored) {
          console.log('🔄 Tokens restored from backup');
        }

        const userData = localStorage.getItem(USER_DATA_KEY);
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

        console.log('📦 LocalStorage data:', {
          hasUserData: !!userData,
          hasAccessToken: !!accessToken,
          userDataLength: userData?.length,
          tokenLength: accessToken?.length,
          wasRestored: restored
        });

        if (userData && accessToken) {
          console.log('🔍 Validating token...');

          if (isTokenValid(accessToken)) {
            console.log('✅ Token is valid, parsing user data...');
            const parsedUser = JSON.parse(userData);
            console.log('👤 Parsed user:', parsedUser);

            setUser(parsedUser);
            setIsAuthenticated(true);

            // Create/update backup tokens for valid authentication
            createTokenBackup();

            // Start token validation for already authenticated users
            startTokenValidation();

            console.log('🎉 Auth initialized successfully');
          } else {
            console.log('❌ Token expired during initialization');
            // Set up user state first, then show expiration dialog
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);

            // Now show the token expiration dialog
            setTimeout(() => {
              handleTokenExpired();
            }, 500); // Small delay to ensure UI is ready
          }
        } else {
          console.log('❌ No valid auth data found');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('💥 Failed to initialize auth state:', error);
      } finally {
        console.log('🏁 Setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure localStorage is ready
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, [tokenCheckInterval]);

  const clearAuthData = (reason = 'unknown', clearBackup = false) => {
    console.log(`🧹 Clearing auth data - Reason: ${reason}, Clear backup: ${clearBackup}`);
    console.log('🧹 Current auth state before clearing:', {
      isAuthenticated,
      hasUser: !!user,
      showDialog: showTokenExpiredDialog,
      tokenInterval: !!tokenCheckInterval
    });
    console.trace('🧹 Logout stack trace:');

    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("x-foundation-id");

    // Only clear backup tokens on explicit signout or when both tokens expired
    if (clearBackup) {
      console.log('🧹 Clearing backup tokens');
      localStorage.removeItem(BACKUP_ACCESS_TOKEN_KEY);
      localStorage.removeItem(BACKUP_REFRESH_TOKEN_KEY);
      localStorage.removeItem(BACKUP_USER_DATA_KEY);
    }

    setUser(null);
    setIsAuthenticated(false);
    setShowTokenExpiredDialog(false);

    // Clear token check interval
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      setTokenCheckInterval(null);
    }

    console.log('🧹 Auth data cleared completely');
  };

  // Create backup tokens when user signs in successfully
  const createTokenBackup = () => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);

    if (accessToken && refreshToken && userData) {
      console.log('💾 Creating token backup');
      localStorage.setItem(BACKUP_ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(BACKUP_REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem(BACKUP_USER_DATA_KEY, userData);
    }
  };

  // Restore tokens from backup if main tokens are missing but backup exists
  const restoreFromBackup = () => {
    const currentAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const currentUserData = localStorage.getItem(USER_DATA_KEY);

    // Only restore if current tokens are missing
    if (!currentAccessToken || !currentRefreshToken || !currentUserData) {
      const backupAccessToken = localStorage.getItem(BACKUP_ACCESS_TOKEN_KEY);
      const backupRefreshToken = localStorage.getItem(BACKUP_REFRESH_TOKEN_KEY);
      const backupUserData = localStorage.getItem(BACKUP_USER_DATA_KEY);

      if (backupAccessToken && backupRefreshToken && backupUserData) {
        console.log('🔄 Restoring tokens from backup');

        // Check if backup tokens are still valid
        const isAccessTokenValid = isTokenValid(backupAccessToken);
        const isRefreshTokenValid = isTokenValid(backupRefreshToken);

        if (isAccessTokenValid || isRefreshTokenValid) {
          console.log('✅ Backup tokens are valid, restoring');
          localStorage.setItem(ACCESS_TOKEN_KEY, backupAccessToken);
          localStorage.setItem(REFRESH_TOKEN_KEY, backupRefreshToken);
          localStorage.setItem(USER_DATA_KEY, backupUserData);
          return true;
        } else {
          console.log('❌ Both backup tokens expired, clearing backup');
          localStorage.removeItem(BACKUP_ACCESS_TOKEN_KEY);
          localStorage.removeItem(BACKUP_REFRESH_TOKEN_KEY);
          localStorage.removeItem(BACKUP_USER_DATA_KEY);
          return false;
        }
      }
    }

    return false;
  };

  // Start periodic token validation
  const startTokenValidation = () => {
    console.log('⏰ Starting token validation interval');

    // Clear existing interval
    if (tokenCheckInterval) {
      console.log('⏰ Clearing existing token interval');
      clearInterval(tokenCheckInterval);
    }

    // Check token every 60 seconds (increased from 30 to be less aggressive)
    const interval = setInterval(() => {
      const now = new Date();
      const minutesIdle = Math.floor((now.getTime() - lastActivity.getTime()) / 1000 / 60);

      console.log('⏰ Periodic token check - Current state:', {
        showDialog: showTokenExpiredDialog,
        isAuthenticated,
        minutesIdle,
        lastActivity: lastActivity.toISOString(),
        timestamp: now.toISOString()
      });

      // Don't check if dialog is already shown or user is not authenticated
      if (showTokenExpiredDialog || !isAuthenticated) {
        console.log('⏰ Skipping token check - dialog shown or not authenticated');
        return;
      }

      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken && !isTokenValid(accessToken)) {
        console.log('🚨 Token expired during periodic check at:', now.toISOString());
        console.log('🚨 User was idle for', minutesIdle, 'minutes when token expired');
        handleTokenExpired();
      } else if (accessToken) {
        console.log('✅ Token is still valid during periodic check');
        // Refresh backup tokens periodically if current tokens are valid
        createTokenBackup();
      } else {
        console.log('❌ No access token found during periodic check');
        // Try to restore from backup if main token is missing
        const restored = restoreFromBackup();
        if (restored) {
          console.log('🔄 Tokens restored from backup during periodic check');
          // Re-validate authentication state
          const userData = localStorage.getItem(USER_DATA_KEY);
          const restoredAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

          if (userData && restoredAccessToken && isTokenValid(restoredAccessToken)) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('✅ Auth state restored from backup');
          }
        }
      }
    }, 60000); // 60 seconds (less aggressive than 30 seconds)

    console.log('⏰ Token validation interval set with ID:', interval);
    setTokenCheckInterval(interval);
  };

  const handleTokenExpired = () => {
    console.log('🚨 Handling token expiration at:', new Date().toISOString());
    console.trace('🚨 Token expiration stack trace:');

    // Prevent multiple dialogs from showing
    if (showTokenExpiredDialog) {
      console.log('🚨 Token expiration dialog already shown, ignoring');
      return;
    }

    console.log('🚨 Current auth state before showing dialog:', {
      isAuthenticated,
      hasUser: !!user,
      showDialog: showTokenExpiredDialog
    });

    // Don't clear auth data immediately, just show the dialog
    setShowTokenExpiredDialog(true);
    console.log('🚨 Token expiration dialog will be shown');
  };

  const handleLoginAgain = () => {
    console.log('🔄 User chose to login again from dialog');
    setShowTokenExpiredDialog(false);
    clearAuthData('user-chose-login-again', false); // Don't clear backup, just main tokens
    // Redirect to login will happen automatically due to isAuthenticated becoming false
  };

  const handleSignOutFromDialog = () => {
    console.log('🚪 User chose to sign out from dialog');
    setShowTokenExpiredDialog(false);
    signOut();
  };

  // Optional: Token refresh functionality (currently not used)
  // const refreshTokens = async (): Promise<boolean> => {
  //   try {
  //     const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  //     if (!refreshToken) {
  //       return false;
  //     }

  //     const response = await authApi.refreshToken(refreshToken);
  //     if (response.data?.accessToken && response.data?.refreshToken) {
  //       // Update tokens
  //       localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
  //       localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);

  //       // Restart token validation with new tokens
  //       startTokenValidation();

  //       console.log('Tokens refreshed successfully');
  //       return true;
  //     }
  //     return false;
  //   } catch (error) {
  //     console.error('Token refresh failed:', error);
  //     return false;
  //   }
  // };

  const signIn = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const res = await authApi.login({
        identifier: credentials.username,
        password: credentials.password,
      });

      console.log('Login response:', res.data);

      // Check if login was successful
      if (res.data?.accessToken && res.data?.refreshToken && res.data?.user) {
        // Store tokens and user data synchronously
        localStorage.setItem(ACCESS_TOKEN_KEY, res.data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(res.data.user));

        // Update state synchronously
        setUser(res.data.user);
        setIsAuthenticated(true);

        // Create backup tokens after successful login
        createTokenBackup();

        // Start periodic token validation
        startTokenValidation();

        console.log('Sign in successful, auth state updated, backup created');
        return true;
      }
      
      console.log('Sign in failed - missing required data');
      return false;
    } catch (error) {
      console.error('Sign in failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    console.log('🚪 User manually signing out');
    clearAuthData('user-manual-signout', true); // Clear backup tokens on manual signout
  };

  // Debug current state
  useEffect(() => {
    console.log('🔍 Auth state changed:', { isAuthenticated, user: !!user, isLoading });
  }, [isAuthenticated, user, isLoading]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    signIn,
    signOut,
    handleTokenExpired,
    showTokenExpiredDialog,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <TokenExpirationDialog
        open={showTokenExpiredDialog}
        onLoginAgain={handleLoginAgain}
        onSignOut={handleSignOutFromDialog}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Utility function to get access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Utility function to check if user has specific role/permission
export const useAuthGuard = () => {
  const { isAuthenticated, user } = useAuth();
  
  const hasAccess = isAuthenticated;
  
  return { hasAccess, isAuthenticated, user };
};