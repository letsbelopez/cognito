import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { CognitoAuthService, CognitoConfig, AuthState, AuthUser, AuthError } from '@letsbelopez/cognito-core';

export type { AuthState, AuthUser, AuthError };

// Define storage strategy interface
export interface TokenStorageStrategy {
  getAccessToken: () => string | null;
  getIdToken: () => string | null;
  getRefreshToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  setIdToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  clearTokens: () => void;
}

// Default in-memory storage strategy
export class InMemoryTokenStorage implements TokenStorageStrategy {
  private accessToken: string | null = null;
  private idToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken = () => this.accessToken;
  getIdToken = () => this.idToken;
  getRefreshToken = () => this.refreshToken;
  setAccessToken = (token: string | null) => { this.accessToken = token; };
  setIdToken = (token: string | null) => { this.idToken = token; };
  setRefreshToken = (token: string | null) => { this.refreshToken = token; };
  clearTokens = () => {
    this.accessToken = null;
    this.idToken = null;
    this.refreshToken = null;
  };
}

export interface AuthProviderConfig extends CognitoConfig {
  tokenStorage?: TokenStorageStrategy;
  autoRefreshTokens?: boolean;
  refreshInterval?: number;
  onRefreshError?: (error: AuthError) => void;
  onSignOut?: () => void;
}

export type AuthContextValue = AuthState & {
  signUp: (username: string, password: string, email: string, attributes?: Record<string, string>) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: AuthUser | null }
  | { type: 'SET_ERROR'; payload: AuthError | null };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: null,
        isLoading: false,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

interface AuthProviderProps {
  children: React.ReactNode;
  config: AuthProviderConfig;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, config }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = React.useMemo(() => new CognitoAuthService(config), [config]);
  
  const tokenStorage = React.useMemo(() => 
    config.tokenStorage || new InMemoryTokenStorage(),
    [config.tokenStorage]
  );

  const refreshTokens = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return;

    try {
      const tokens = await authService.refreshSession(refreshToken);
      if (tokens) {
        tokenStorage.setAccessToken(tokens.accessToken);
        tokenStorage.setIdToken(tokens.idToken);
        tokenStorage.setRefreshToken(tokens.refreshToken);

        const user = await authService.getCurrentUser(tokens.accessToken);
        dispatch({ 
          type: 'SET_USER',
          payload: { ...user, tokens }
        });
      }
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'SET_ERROR', payload: authError });
      config.onRefreshError?.(authError);
      handleSignOut();
    }
  }, [authService, tokenStorage, config.onRefreshError]);

  const handleSignOut = useCallback(async () => {
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
      try {
        await authService.signOut(accessToken);
      } catch (error) {
        console.error('Error during sign out:', error);
      }
    }
    
    tokenStorage.clearTokens();
    dispatch({ type: 'SET_USER', payload: null });
    config.onSignOut?.();
  }, [authService, tokenStorage, config.onSignOut]);

  const signUp = async (
    username: string,
    password: string,
    email: string,
    attributes?: Record<string, string>
  ) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authService.signUp({ username, password, email, attributes });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  };

  const signIn = async (username: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const user = await authService.signIn({ username, password });
      
      tokenStorage.setAccessToken(user.tokens.accessToken);
      tokenStorage.setIdToken(user.tokens.idToken);
      tokenStorage.setRefreshToken(user.tokens.refreshToken);
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  };

  const signOut = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await handleSignOut();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  };

  // Set up automatic token refresh if enabled
  useEffect(() => {
    if (!config.autoRefreshTokens) return;

    const interval = setInterval(
      refreshTokens,
      config.refreshInterval || 1000 * 60 * 10 // Default: 10 minutes
    );
    return () => clearInterval(interval);
  }, [refreshTokens, config.autoRefreshTokens, config.refreshInterval]);

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();
      if (!accessToken) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const user = await authService.getCurrentUser(accessToken);
        dispatch({
          type: 'SET_USER',
          payload: {
            ...user,
            tokens: {
              accessToken,
              idToken: tokenStorage.getIdToken() || '',
              refreshToken: tokenStorage.getRefreshToken() || '',
            },
          },
        });
      } catch (error) {
        // If current session is invalid, try to refresh
        await refreshTokens();
      }
    };

    checkAuth();
  }, [authService, tokenStorage, refreshTokens]);

  const confirmSignUp = async (username: string, code: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authService.confirmSignUp(username, code);
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  };

  const value = {
    ...state,
    signUp,
    signIn,
    signOut,
    confirmSignUp,
    refreshSession: refreshTokens,
  } satisfies AuthContextValue;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 