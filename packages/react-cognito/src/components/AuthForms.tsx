import React, { useState, useEffect } from 'react';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ConfirmForm } from './ConfirmForm';
import { FormType } from './types';
import styles from './AuthForms.module.css';

interface AuthFormsProps {
  useModal?: boolean;
  className?: string;
  initialFormType?: FormType;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ 
  useModal = false,
  className = '',
  initialFormType = 'signin'
}) => {
  // Use localStorage to persist the form type if we have a pending confirmation
  const getInitialFormType = (): FormType => {
    const pendingConfirmation = localStorage.getItem('pendingConfirmation');
    const savedFormType = localStorage.getItem('authFormType');
    
    if (pendingConfirmation && savedFormType === 'confirm') {
      return 'confirm';
    }
    
    return initialFormType;
  };

  const [formType, setFormType] = useState<FormType>(getInitialFormType());
  const [pendingEmail, setPendingEmail] = useState<string | null>(
    localStorage.getItem('pendingConfirmation')
  );

  // Clean up form type switching logic
  const switchToForm = (newType: FormType, email?: string) => {
    console.log('[DEBUG] Switching to form:', newType);
    
    if (email && (newType === 'confirm')) {
      localStorage.setItem('pendingConfirmation', email);
      setPendingEmail(email);
    }
    
    localStorage.setItem('authFormType', newType);
    setFormType(newType);
  };

  const containerClass = useModal 
    ? `${styles['auth-forms']} ${styles['auth-forms--modal']} ${className}`
    : `${styles['auth-forms']} ${className}`;

  return (
    <div className={containerClass}>
      <div className={styles['auth-forms__container']}>
        {formType === 'signin' && (
          <SignInForm 
            onSwitchForm={switchToForm}
            pendingEmail={pendingEmail} 
          />
        )}

        {formType === 'signup' && (
          <SignUpForm 
            onSwitchForm={switchToForm}
          />
        )}

        {formType === 'confirm' && (
          <ConfirmForm 
            onSwitchForm={switchToForm}
            pendingEmail={pendingEmail}
          />
        )}
      </div>
    </div>
  );
}; 