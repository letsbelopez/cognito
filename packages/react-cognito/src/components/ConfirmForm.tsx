import React, { useState, useEffect } from 'react';
import { useConfirmSignUp } from '../hooks';
import { ResendConfirmationCode } from './ResendConfirmationCode';
import type { AuthError } from '@letsbelopez/cognito-core';
import styles from './AuthForms.module.css';

interface ConfirmFormProps {
  onSwitchForm: (formType: 'signin' | 'signup' | 'confirm', email?: string) => void;
  pendingEmail: string | null;
}

export const ConfirmForm: React.FC<ConfirmFormProps> = ({ onSwitchForm, pendingEmail }) => {
  const [confirmationEmail, setConfirmationEmail] = useState(pendingEmail || '');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [codeResent, setCodeResent] = useState(false);
  const [showResendSection, setShowResendSection] = useState(false);
  
  const { execute: confirmSignUp, isLoading, error: confirmError } = useConfirmSignUp();
  
  // Handle confirmation errors
  useEffect(() => {
    if (confirmError) {
      const errorMessage = (confirmError as AuthError).message || 'An error occurred during confirmation';
      setLocalError(errorMessage);
      
      // Check if error indicates expired code and show resend section
      if (isCodeExpiredError(errorMessage)) {
        setShowResendSection(true);
      }
    }
  }, [confirmError]);

  // Reset the codeResent flag after 5 seconds
  useEffect(() => {
    if (codeResent) {
      const timer = setTimeout(() => {
        setCodeResent(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [codeResent]);
  
  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setCodeResent(false);
    setShowResendSection(false);
    
    if (!confirmationEmail) {
      setLocalError('Please enter your email address.');
      console.log('[DEBUG] No email to confirm with');
      return;
    }

    try {
      console.log('[DEBUG] Calling confirmSignUp API with code and email:', confirmationCode, confirmationEmail);
      const result = await confirmSignUp(confirmationEmail, confirmationCode);
      console.log('[DEBUG] confirmSignUp API result:', result);
      
      if (result && result.userConfirmed) {
        // If confirmation was successful, redirect to sign-in
        console.log('[DEBUG] Confirmation successful, redirecting to sign-in');
        localStorage.removeItem('pendingConfirmation');
        localStorage.removeItem('authFormType');
        // Clear any previous error messages
        setLocalError(null);
        onSwitchForm('signin', confirmationEmail);
      }
    } catch (err) {
      console.log('[DEBUG] Error during confirmation:', err);
      const errorMessage = (err as AuthError)?.message || 'An error occurred during confirmation';
      setLocalError(errorMessage);
      
      // Check if error indicates expired code and show resend section
      if (isCodeExpiredError(errorMessage)) {
        setShowResendSection(true);
      }
    }
  };

  const handleCodeResent = () => {
    setCodeResent(true);
    // Clear error when code is resent successfully
    setLocalError(null);
    // Reset the confirmation code field
    setConfirmationCode('');
    // Hide the resend section after successful resend
    setShowResendSection(false);
  };

  const handleResendError = (errorMessage: string) => {
    setLocalError(errorMessage);
    setCodeResent(false);
  };

  // Check if error message indicates expired code
  const isCodeExpiredError = (error: string) => {
    return error.includes('expired') || 
           error.includes('Invalid code') || 
           error.includes('request a code again');
  };
  
  // Function to manually show the resend section
  const handleShowResendSection = () => {
    setShowResendSection(true);
  };
  
  if (showResendSection) {
    return (
      <div className={styles['auth-forms__form']}>
        <h2 className={styles['auth-forms__title']}>Resend Confirmation Code</h2>
        
        {localError && (
          <div className={styles['auth-forms__error']}>
            {localError}
          </div>
        )}

        {codeResent && (
          <div className={styles['auth-forms__success']}>
            A new confirmation code has been sent to your email.
          </div>
        )}
        
        <p className={styles['auth-forms__description']}>
          Your confirmation code has expired or is invalid. Please request a new code.
        </p>
        
        <div className={styles['auth-forms__field']}>
          <label htmlFor="resend-email" className={styles['auth-forms__label']}>
            Email
          </label>
          <input
            id="resend-email"
            type="email"
            value={confirmationEmail}
            onChange={(e) => setConfirmationEmail(e.target.value)}
            placeholder="Enter your email"
            className={styles['auth-forms__input']}
            required
          />
        </div>
        
        <div className={styles['auth-forms__actions']}>
          <ResendConfirmationCode 
            email={confirmationEmail}
            onCodeResent={handleCodeResent}
            onError={handleResendError}
          />
          
          {codeResent && (
            <button 
              type="button" 
              className={styles['auth-forms__button']}
              onClick={() => setShowResendSection(false)}
            >
              Enter Confirmation Code
            </button>
          )}
        </div>
        
        <p className={styles['auth-forms__switch']}>
          Back to{' '}
          <button 
            type="button"
            onClick={() => onSwitchForm('signin')}
            className={styles['auth-forms__link']}
          >
            Sign In
          </button>
          {' '}or{' '}
          <button 
            type="button"
            onClick={() => onSwitchForm('signup')}
            className={styles['auth-forms__link']}
          >
            Sign Up
          </button>
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleConfirmSignUp} className={styles['auth-forms__form']}>
      <h2 className={styles['auth-forms__title']}>Confirm Account</h2>
      
      {localError && (
        <div className={styles['auth-forms__error']}>
          {localError}
          {isCodeExpiredError(localError) && (
            <button
              type="button"
              onClick={handleShowResendSection}
              className={styles['auth-forms__link-button']}
            >
              Click here to request a new code
            </button>
          )}
        </div>
      )}

      {codeResent && (
        <div className={styles['auth-forms__success']}>
          A new confirmation code has been sent to your email.
        </div>
      )}
      
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
        disabled={isLoading}
      >
        {isLoading ? 'Confirming...' : 'Confirm'}
      </button>
      
      <div className={styles['auth-forms__helper-links']}>
        <button 
          type="button"
          onClick={handleShowResendSection}
          className={styles['auth-forms__link-button']}
        >
          Need a new code?
        </button>
      </div>
      
      <p className={styles['auth-forms__switch']}>
        Back to{' '}
        <button 
          type="button"
          onClick={() => onSwitchForm('signin')}
          className={styles['auth-forms__link']}
        >
          Sign In
        </button>
        {' '}or{' '}
        <button 
          type="button"
          onClick={() => onSwitchForm('signup')}
          className={styles['auth-forms__link']}
        >
          Sign Up
        </button>
      </p>
    </form>
  );
}; 