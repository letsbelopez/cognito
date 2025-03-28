import React, { ReactNode, useState } from 'react';
import { useCurrentUser, useSignOut } from '../hooks';
import { AuthForms } from './AuthForms';
import styles from './AuthGuard.module.css';
import { AuthUser } from '@letsbelopez/cognito-core';

export interface AuthGuardProps {
  /**
   * The content to render when the user is authenticated
   */
  children: ((props: { signOut: () => Promise<void>; user: AuthUser }) => ReactNode) | ReactNode;
  
  /**
   * Custom loading component to show while checking authentication status
   */
  loadingComponent?: ReactNode;
  
  /**
   * If true, the authentication forms will be shown in a modal
   * @default false
   */
  useModal?: boolean;
  
  /**
   * Custom classes to apply to the container
   */
  className?: string;
  
  /**
   * Custom error handler for authentication errors
   */
  onError?: (error: Error) => void;
}

/**
 * AuthGuard component that protects content until the user is authenticated
 * If the user is not authenticated, it shows sign-in and sign-up forms
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  loadingComponent,
  useModal = false,
  className = '',
  onError
}) => {
  const { user, isAuthenticated, isLoading, error } = useCurrentUser();
  const { execute: signOut } = useSignOut();
  const [initialFormType, setInitialFormType] = useState<'signin' | 'signup' | 'confirm'>('signin');
  
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Listen for auth state changes from localStorage
  React.useEffect(() => {
    const checkPendingConfirmation = () => {
      const pendingEmail = localStorage.getItem('pendingConfirmation');
      if (pendingEmail) {
        setInitialFormType('confirm');
      }
    };

    checkPendingConfirmation();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pendingConfirmation') {
        checkPendingConfirmation();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`${styles['auth-guard']} ${styles['auth-guard--loading']} ${className}`}>
        {loadingComponent || <div className={styles['auth-guard__loader']}>Loading...</div>}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className={`${styles['auth-guard']} ${styles['auth-guard--unauthenticated']} ${className}`}>
        <AuthForms useModal={useModal} initialFormType={initialFormType} />
      </div>
    );
  }

  return (
    <div className={`${styles['auth-guard']} ${styles['auth-guard--authenticated']} ${className}`}>
      {typeof children === 'function' 
        ? children({ 
            signOut, 
            user
          }) 
        : children}
    </div>
  );
}; 