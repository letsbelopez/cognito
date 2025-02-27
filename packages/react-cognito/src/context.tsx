import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CognitoAuthService, CognitoConfig, AuthState, AuthUser, AuthError } from '@letsbelopez/cognito-core';

interface AuthContextValue extends AuthState {
  signUp: (username: string, password: string, email: string, attributes?: Record<string, string>) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

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
  config: CognitoConfig;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, config }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = React.useMemo(() => new CognitoAuthService(config), [config]);

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
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  };

  const signOut = async () => {
    if (!state.user?.tokens.accessToken) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await authService.signOut(state.user.tokens.accessToken);
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as AuthError });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('cognito_access_token');
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
              idToken: localStorage.getItem('cognito_id_token') || '',
              refreshToken: localStorage.getItem('cognito_refresh_token') || '',
            },
          },
        });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error as AuthError });
      }
    };

    checkAuth();
  }, [authService]);

  const value: AuthContextValue = {
    ...state,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 