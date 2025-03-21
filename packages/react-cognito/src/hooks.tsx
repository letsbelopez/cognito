import { useState } from 'react';
import { useAuth } from './context';
import type { AuthError, AuthUser, SignUpResult, ConfirmSignUpResult } from './context';

interface UseAuthOperation<T extends any[], R = void> {
  execute: (...args: T) => Promise<R>;
  isLoading: boolean;
  error: AuthError | null;
}

export const useSignUp = (): UseAuthOperation<[string, string, string, Record<string, string>?, boolean?], SignUpResult> => {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const execute = async (
    username: string, 
    password: string, 
    email: string, 
    attributes?: Record<string, string>,
    autoSignIn?: boolean
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signUp(username, password, email, attributes, autoSignIn);
      return result;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useSignIn = (): UseAuthOperation<[string, string]> => {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const execute = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useSignOut = (): UseAuthOperation<[]> => {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const execute = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useConfirmSignUp = (): UseAuthOperation<[string, string], ConfirmSignUpResult> => {
  const { confirmSignUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const execute = async (username: string, code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await confirmSignUp(username, code);
      return result;
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export const useCurrentUser = (): {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
} => {
  const { user, isAuthenticated, isLoading, error } = useAuth();
  return { user, isAuthenticated, isLoading, error };
}; 