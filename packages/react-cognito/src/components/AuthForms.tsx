import React, { useState } from 'react';
import { useSignIn, useSignUp, useConfirmSignUp } from '../hooks';
import type { AuthError } from '@letsbelopez/cognito-core';
import styles from './AuthForms.module.css';

interface AuthFormsProps {
  useModal?: boolean;
  className?: string;
  initialFormType?: FormType;
}

type FormType = 'signin' | 'signup' | 'confirm';

export const AuthForms: React.FC<AuthFormsProps> = ({ 
  useModal = false,
  className = '',
  initialFormType = 'signin'
}) => {
  const [formType, setFormType] = useState<FormType>(initialFormType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const { execute: signIn, isLoading: isSigningIn, error: signInError } = useSignIn();
  const { execute: signUp, isLoading: isSigningUp, error: signUpError } = useSignUp();
  const { execute: confirmSignUp, isLoading: isConfirming, error: confirmError } = useConfirmSignUp();
  
  // Check for pending confirmation on mount
  React.useEffect(() => {
    const storedEmail = localStorage.getItem('pendingConfirmation');
    if (storedEmail) {
      setPendingEmail(storedEmail);
    }
  }, []);
  
  // Update error when authentication errors occur
  React.useEffect(() => {
    const currentError = signInError || signUpError || confirmError;
    if (currentError) {
      const errorMessage = (currentError as AuthError).message || 'An authentication error occurred';
      setError(errorMessage);
      
      // Check if this is an unconfirmed user error
      if (signInError && 
          (errorMessage.includes('not confirmed') || 
           errorMessage.includes('UserNotConfirmedException'))) {
        setNeedsConfirmation(true);
        // Store the email for confirmation
        if (email) {
          localStorage.setItem('pendingConfirmation', email);
          setPendingEmail(email);
        }
      }
    }
  }, [signInError, signUpError, confirmError, email]);

  // Update confirmation email when pending email changes
  React.useEffect(() => {
    if (pendingEmail) {
      setConfirmationEmail(pendingEmail);
    }
  }, [pendingEmail]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsConfirmation(false);
    
    try {
      await signIn(email, password);
    } catch (err) {
      // Error is already handled in the effect
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const result = await signUp(email, password, email, undefined, true);
      
      if (result && result.userConfirmed) {
        // User is already confirmed, no need for confirmation step
        await signIn(email, password);
      } else {
        // User needs to confirm their account
        setPendingEmail(email);
        localStorage.setItem('pendingConfirmation', email);
        setFormType('confirm');
      }
    } catch (err) {
      // Error is already handled in the effect
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Use the confirmation email input if available, otherwise fall back to stored values
    const emailToConfirm = confirmationEmail || pendingEmail || localStorage.getItem('pendingConfirmation');
    
    if (!emailToConfirm) {
      setError('Please enter your email address.');
      return;
    }

    try {
      const result = await confirmSignUp(emailToConfirm, confirmationCode);
      if (result && result.userConfirmed) {
        // If confirmation was successful, redirect to sign-in
        localStorage.removeItem('pendingConfirmation');
        setFormType('signin');
      }
    } catch (err) {
      // Error is already handled in the effect
    }
  };

  const transitionToConfirm = () => {
    if (email) {
      localStorage.setItem('pendingConfirmation', email);
      setPendingEmail(email);
    }
    setFormType('confirm');
    setNeedsConfirmation(false);
  };

  const containerClass = useModal 
    ? `${styles['auth-forms']} ${styles['auth-forms--modal']} ${className}`
    : `${styles['auth-forms']} ${className}`;

  return (
    <div className={containerClass}>
      <div className={styles['auth-forms__container']}>
        {error && (
          <div className={styles['auth-forms__error']}>
            {error}
          </div>
        )}

        {formType === 'signin' && (
          <form onSubmit={handleSignIn} className={styles['auth-forms__form']}>
            <h2 className={styles['auth-forms__title']}>Sign In</h2>
            
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
              disabled={isSigningIn}
            >
              {isSigningIn ? 'Signing In...' : 'Sign In'}
            </button>
            
            {needsConfirmation && (
              <div className={styles['auth-forms__confirmation-needed']}>
                <p>Your account needs to be confirmed before signing in.</p>
                <button 
                  type="button"
                  onClick={transitionToConfirm}
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
                onClick={() => setFormType('signup')}
                className={styles['auth-forms__link']}
              >
                Sign Up
              </button>
            </p>
            <p className={styles['auth-forms__switch']}>
              Already signed up but need to confirm your account?{' '}
              <button 
                type="button"
                onClick={() => {
                  if (email) {
                    localStorage.setItem('pendingConfirmation', email);
                    setPendingEmail(email);
                  }
                  setFormType('confirm');
                }}
                className={styles['auth-forms__link']}
              >
                Confirm Account
              </button>
            </p>
          </form>
        )}

        {formType === 'signup' && (
          <form onSubmit={handleSignUp} className={styles['auth-forms__form']}>
            <h2 className={styles['auth-forms__title']}>Sign Up</h2>
            
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
              disabled={isSigningUp}
            >
              {isSigningUp ? 'Signing Up...' : 'Sign Up'}
            </button>
            
            <p className={styles['auth-forms__switch']}>
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => setFormType('signin')}
                className={styles['auth-forms__link']}
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {formType === 'confirm' && (
          <form onSubmit={handleConfirmSignUp} className={styles['auth-forms__form']}>
            <h2 className={styles['auth-forms__title']}>Confirm Account</h2>
            <p className={styles['auth-forms__description']}>
              Please enter the confirmation code sent to your email.
            </p>
            
            <div className={styles['auth-forms__field']}>
              <label htmlFor="confirmation-email" className={styles['auth-forms__label']}>
                Email
              </label>
              <input
                id="confirmation-email"
                type="email"
                value={confirmationEmail}
                onChange={(e) => setConfirmationEmail(e.target.value)}
                placeholder={pendingEmail || "Enter your email"}
                className={styles['auth-forms__input']}
                required
              />
            </div>
            
            <div className={styles['auth-forms__field']}>
              <label htmlFor="confirmation-code" className={styles['auth-forms__label']}>
                Confirmation Code
              </label>
              <input
                id="confirmation-code"
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className={styles['auth-forms__input']}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className={styles['auth-forms__button']}
              disabled={isConfirming}
            >
              {isConfirming ? 'Confirming...' : 'Confirm'}
            </button>
            
            <p className={styles['auth-forms__switch']}>
              Back to{' '}
              <button 
                type="button"
                onClick={() => setFormType('signin')}
                className={styles['auth-forms__link']}
              >
                Sign In
              </button>
              {' '}or{' '}
              <button 
                type="button"
                onClick={() => setFormType('signup')}
                className={styles['auth-forms__link']}
              >
                Sign Up
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}; 