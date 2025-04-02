import React, { useState } from 'react';
import { useResendConfirmationCode } from '../hooks';
import type { AuthError } from '@letsbelopez/cognito-core';
import styles from './AuthForms.module.css';

interface ResendConfirmationCodeProps {
  email: string;
  onCodeResent: () => void;
  onError: (error: string) => void;
}

export const ResendConfirmationCode: React.FC<ResendConfirmationCodeProps> = ({
  email,
  onCodeResent,
  onError,
}) => {
  const { 
    execute: resendConfirmationCode, 
    isLoading: isResending,
  } = useResendConfirmationCode();

  const handleResendCode = async () => {
    if (!email) {
      onError('Please enter your email address to request a new code.');
      return;
    }

    try {
      console.log('[DEBUG] Resending confirmation code to:', email);
      await resendConfirmationCode(email);
      onCodeResent();
      console.log('[DEBUG] Confirmation code resent successfully');
    } catch (err) {
      console.log('[DEBUG] Error resending confirmation code:', err);
      const errorMessage = (err as AuthError)?.message || 'Failed to resend confirmation code';
      onError(errorMessage);
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleResendCode}
      className={styles['auth-forms__link-button']}
      disabled={isResending}
    >
      {isResending ? 'Sending...' : 'Resend confirmation code'}
    </button>
  );
}; 