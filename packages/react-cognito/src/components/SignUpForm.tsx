import React, { useState, useEffect } from 'react';
import { useSignUp } from '../hooks';
import type { AuthError } from '@letsbelopez/cognito-core';
import styles from './AuthForms.module.css';

interface SignUpFormProps {
  onSwitchForm: (formType: 'signin' | 'signup' | 'confirm', email?: string) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { execute: signUp, isLoading, error: signUpError } = useSignUp();
  
  // Handle sign-up errors
  useEffect(() => {
    if (signUpError) {
      const errorMessage = (signUpError as AuthError).message || 'An authentication error occurred';
      setLocalError(errorMessage);
      
      // Check if we need to show confirmation even after error
      if (errorMessage.includes('UserNotConfirmedException') || 
          errorMessage.includes('not confirmed')) {
        onSwitchForm('confirm', email);
      }
    } else {
      setLocalError(null);
    }
  }, [signUpError, email, onSwitchForm]);
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    console.log('[DEBUG] Starting signup with email:', email);
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      console.log('[DEBUG] Password mismatch');
      return;
    }

    try {
      console.log('[DEBUG] Calling signUp API...');
      const result = await signUp(email, password, email, undefined, true);
      console.log('[DEBUG] signUp API result:', result);
      
      // Store email for confirmation
      localStorage.setItem('pendingConfirmation', email);
      
      if (result && result.userConfirmed) {
        console.log('[DEBUG] User already confirmed, attempting auto sign-in');
        // User is already confirmed, switching to sign-in
        onSwitchForm('signin', email);
      } else {
        console.log('[DEBUG] User needs confirmation, switching to confirm form');
        // User needs to confirm their account
        onSwitchForm('confirm', email);
      }
    } catch (err) {
      console.log('[DEBUG] Error during signup:', err);
      
      // Check if we need to show confirmation even after error
      // const errorMessage = (err as AuthError)?.message || '';
      // console.log('[DEBUG] Error message:', errorMessage);
      
      // if (errorMessage.includes('UserNotConfirmedException') || 
      //     errorMessage.includes('not confirmed')) {
      //   console.log('[DEBUG] Error indicates user needs confirmation');
      //   localStorage.setItem('pendingConfirmation', email);
      //   onSwitchForm('confirm', email);
      // }
      // Other errors are handled in the effect
    }
  };
  
  return (
    <form onSubmit={handleSignUp} className={styles['auth-forms__form']}>
      <h2 className={styles['auth-forms__title']}>Sign Up</h2>
      
      {localError && (
        <div className={styles['auth-forms__error']}>
          {localError}
        </div>
      )}
      
      <div className={styles['auth-forms__field']}>
        <label htmlFor="signup-email" className={styles['auth-forms__label']}>
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles['auth-forms__input']}
          required
        />
      </div>
      
      <div className={styles['auth-forms__field']}>
        <label htmlFor="signup-password" className={styles['auth-forms__label']}>
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles['auth-forms__input']}
          required
        />
      </div>
      
      <div className={styles['auth-forms__field']}>
        <label htmlFor="signup-confirm-password" className={styles['auth-forms__label']}>
          Confirm Password
        </label>
        <input
          id="signup-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles['auth-forms__input']}
          required
        />
      </div>
      
      <button 
        type="submit" 
        className={styles['auth-forms__button']}
        disabled={isLoading}
      >
        {isLoading ? 'Signing Up...' : 'Sign Up'}
      </button>
      
      <p className={styles['auth-forms__switch']}>
        Already have an account?{' '}
        <button 
          type="button"
          onClick={() => onSwitchForm('signin')}
          className={styles['auth-forms__link']}
        >
          Sign In
        </button>
      </p>
    </form>
  );
}; 