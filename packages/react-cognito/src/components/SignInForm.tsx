import React, { useState, useEffect } from 'react';
import { useSignIn } from '../hooks';
import type { AuthError } from '@letsbelopez/cognito-core';
import styles from './AuthForms.module.css';

interface SignInFormProps {
  onSwitchForm: (formType: 'signin' | 'signup' | 'confirm', email?: string) => void;
  pendingEmail: string | null;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSwitchForm, pendingEmail }) => {
  const [email, setEmail] = useState(pendingEmail || '');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  
  const { execute: signIn, isLoading, error: signInError } = useSignIn();
  
  // Clean error effect - only deals with sign-in errors
  useEffect(() => {
    if (signInError) {
      const errorMessage = (signInError as AuthError).message || 'An authentication error occurred';
      setLocalError(errorMessage);
      
      // Check for user confirmation needed
      if ((signInError as AuthError).code === 'UserNotConfirmedException' || 
          errorMessage.includes('not confirmed')) {
        // setNeedsConfirmation(true);
        onSwitchForm('confirm', email);
      }
    } else {
      setLocalError(null);
    }
  }, [signInError]);
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setNeedsConfirmation(false);
    
    try {
      await signIn(email, password);
    } catch (err) {
      // Error already handled in effect
      console.log('[DEBUG] Error during signin:', err);
    }
  };
  
  return (
    <form onSubmit={handleSignIn} className={styles['auth-forms__form']}>
      <h2 className={styles['auth-forms__title']}>Sign In</h2>
      
      {localError && (
        <div className={styles['auth-forms__error']}>
          {localError}
        </div>
      )}
      
      <div className={styles['auth-forms__field']}>
        <label htmlFor="signin-email" className={styles['auth-forms__label']}>
          Email
        </label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles['auth-forms__input']}
          required
        />
      </div>
      
      <div className={styles['auth-forms__field']}>
        <label htmlFor="signin-password" className={styles['auth-forms__label']}>
          Password
        </label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles['auth-forms__input']}
          required
        />
      </div>
      
      <button 
        type="submit" 
        className={styles['auth-forms__button']}
        disabled={isLoading}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
      
      {needsConfirmation && (
        <div className={styles['auth-forms__confirmation-needed']}>
          <p>Your account needs to be confirmed before signing in.</p>
          <button 
            type="button"
            onClick={() => onSwitchForm('confirm', email)}
            className={`${styles['auth-forms__button']} ${styles['auth-forms__button--secondary']}`}
          >
            Confirm Account
          </button>
        </div>
      )}
      
      <p className={styles['auth-forms__switch']}>
        Don't have an account?{' '}
        <button 
          type="button"
          onClick={() => onSwitchForm('signup')}
          className={styles['auth-forms__link']}
        >
          Sign Up
        </button>
      </p>
      <p className={styles['auth-forms__switch']}>
        Already signed up but need to confirm your account?{' '}
        <button 
          type="button"
          onClick={() => onSwitchForm('confirm', email)}
          className={styles['auth-forms__link']}
        >
          Confirm Account
        </button>
      </p>
    </form>
  );
}; 