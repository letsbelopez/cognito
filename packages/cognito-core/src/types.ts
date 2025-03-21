export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

export interface SignUpParams {
  username: string;
  password: string;
  email: string;
  attributes?: Record<string, string>;
  autoSignIn?: boolean;
}

export interface SignUpResult {
  user: Omit<AuthUser, 'tokens'>;
  userConfirmed: boolean;
  autoSignInEnabled: boolean;
}

export interface ConfirmSignUpResult {
  userConfirmed: boolean;
  autoSignInEnabled: boolean;
}

export interface SignInParams {
  username: string;
  password: string;
}

export interface AuthUser {
  username: string;
  email?: string;
  attributes?: Record<string, string>;
  tokens: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
  };
}

export interface AuthError extends Error {
  code: string;
  name: string;
  message: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: AuthError | null;
} 