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

  // Set up axios token expiration handler
  useEffect(() => {
    setTokenExpirationHandler(handleTokenExpired);
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    console.log('🔄 Starting auth initialization...');

    const initializeAuth = async () => {
      try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        
        console.log('📦 LocalStorage data:', { 
          hasUserData: !!userData, 
          hasAccessToken: !!accessToken,
          userDataLength: userData?.length,
          tokenLength: accessToken?.length
        });
        
        if (userData && accessToken) {
          console.log('🔍 Validating token...');
          
          if (isTokenValid(accessToken)) {
            console.log('✅ Token is valid, parsing user data...');
            const parsedUser = JSON.parse(userData);
            console.log('👤 Parsed user:', parsedUser);

            setUser(parsedUser);
            setIsAuthenticated(true);

            // Start token validation for already authenticated users
            startTokenValidation();

            console.log('🎉 Auth initialized successfully');
          } else {
            console.log('❌ Token expired during initialization');
            // Token is expired, show expiration dialog
            handleTokenExpired();
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

  const clearAuthData = () => {
    console.log('🧹 Clearing auth data');
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("x-foundation-id");
    setUser(null);
    setIsAuthenticated(false);
    setShowTokenExpiredDialog(false);

    // Clear token check interval
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
      setTokenCheckInterval(null);
    }
  };

  // Start periodic token validation
  const startTokenValidation = () => {
    // Clear existing interval
    if (tokenCheckInterval) {
      clearInterval(tokenCheckInterval);
    }

    // Check token every 30 seconds
    const interval = setInterval(() => {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken && !isTokenValid(accessToken) && isAuthenticated) {
        console.log('🚨 Token expired during periodic check');
        handleTokenExpired();
      }
    }, 30000); // 30 seconds

    setTokenCheckInterval(interval);
  };

  const handleTokenExpired = () => {
    console.log('🚨 Handling token expiration');
    // Don't clear auth data immediately, just show the dialog
    setShowTokenExpiredDialog(true);
  };

  const handleLoginAgain = () => {
    setShowTokenExpiredDialog(false);
    clearAuthData();
    // Redirect to login will happen automatically due to isAuthenticated becoming false
  };

  const handleSignOutFromDialog = () => {
    setShowTokenExpiredDialog(false);
    signOut();
  };

  // Optional: Token refresh functionality (currently not used)
  const refreshTokens = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return false;
      }

      const response = await authApi.refreshToken(refreshToken);
      if (response.data?.accessToken && response.data?.refreshToken) {
        // Update tokens
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);

        // Restart token validation with new tokens
        startTokenValidation();

        console.log('Tokens refreshed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

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

        // Start periodic token validation
        startTokenValidation();

        console.log('Sign in successful, auth state updated');
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
    console.log('Signing out');
    clearAuthData();
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