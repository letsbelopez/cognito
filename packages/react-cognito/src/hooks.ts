import { useCallback } from 'react';
import { useAuth } from './context';
import type { AuthUser, AuthError, SignUpResult, ConfirmSignUpResult } from '@letsbelopez/cognito-core';

interface UseAuthHookResult<T, R = void> {
  execute: T;
  isLoading: boolean;
  error: AuthError | null;
}

export const useSignUp = (): UseAuthHookResult<
  (username: string, password: string, email: string, attributes?: Record<string, string>, autoSignIn?: boolean) => Promise<SignUpResult>
> => {
  const { signUp, isLoading, error } = useAuth();
  const execute = useCallback(signUp, [signUp]);

  return { execute, isLoading, error };
};

export const useSignIn = (): UseAuthHookResult<(username: string, password: string) => Promise<void>> => {
  const { signIn, isLoading, error } = useAuth();
  const execute = useCallback(signIn, [signIn]);

  return { execute, isLoading, error };
};

export const useSignOut = (): UseAuthHookResult<() => Promise<void>> => {
  const { signOut, isLoading, error } = useAuth();
  const execute = useCallback(signOut, [signOut]);

  return { execute, isLoading, error };
};

export const useConfirmSignUp = (): UseAuthHookResult<(username: string, code: string) => Promise<ConfirmSignUpResult>> => {
  const { confirmSignUp, isLoading, error } = useAuth();
  const execute = useCallback(confirmSignUp, [confirmSignUp]);

  return { execute, isLoading, error };
};

export const useResendConfirmationCode = (): UseAuthHookResult<(username: string) => Promise<boolean>> => {
  const { resendConfirmationCode, isLoading, error } = useAuth();
  const execute = useCallback(resendConfirmationCode, [resendConfirmationCode]);

  return { execute, isLoading, error };
};

export const useCurrentUser = (): {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
} => {
  const { user, isAuthenticated, isLoading, error } = useAuth();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
  };
}; 