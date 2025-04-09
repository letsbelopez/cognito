import React, { useMemo } from 'react';
import { useActorRef, useSelector } from '@xstate/react';
import { createAuthMachine } from '../state-machine';
import { createBrowserInspector } from '@statelyai/inspect';
import type { AuthUser, CognitoConfig } from '@letsbelopez/cognito-core/src/types';

// Create the inspector (only in development mode)
const inspector = typeof window !== 'undefined' && process.env.NODE_ENV === 'development' 
  ? createBrowserInspector()
  : undefined;

// Sub-components for different auth forms
import SignInForm from './auth-forms/SignInForm';
import SignUpForm from './auth-forms/SignUpForm';
import ConfirmationForm from './auth-forms/ConfirmationForm';
import ResendConfirmationForm from './auth-forms/ResendConfirmationForm';

// Props interface for the Authenticator component
interface AuthenticatorProps {
  children?: (props: { user: AuthUser; signOut: () => void; actor: ReturnType<typeof useActorRef> }) => React.ReactNode;
  cognitoConfig: CognitoConfig;
}

export const Authenticator: React.FC<AuthenticatorProps> = ({ children, cognitoConfig }) => {
  // Memoize the auth machine creation 
  const authMachine = useMemo(() => createAuthMachine(cognitoConfig), [cognitoConfig]);
  
  // Initialize the auth state machine with inspection
  const authActor = useActorRef(authMachine, {
    inspect: inspector?.inspect
  });
  
  // Subscribe to state changes
  const state = useSelector(authActor, (state) => state);
  const currentUser = useSelector(authActor, (state) => state.context.currentUser);
  const validationErrors = useSelector(authActor, (state) => state.context.validationErrors);
  const email = useSelector(authActor, (state) => state.context.email);
  
  // Handle auth events
  const handleSignIn = (email: string, password: string) => {
    authActor.send({ type: 'SIGN_IN', email, password });
  };
  
  const handleSignUp = (email: string, password: string) => {
    authActor.send({ type: 'SIGN_UP', email, password });
  };
  
  const handleSignOut = () => {
    authActor.send({ type: 'SIGN_OUT' });
  };
  
  const handleConfirmationCode = (code: string) => {
    authActor.send({ type: 'SUBMIT_CONFIRMATION_CODE', code });
  };
  
  const handleResendConfirmation = () => {
    authActor.send({ type: 'RESEND_CONFIRMATION_CODE' });
  };
  
  // Add this handler function
  const handleNavigateToSignup = () => {
    authActor.send({ type: 'NAVIGATE_TO_SIGNUP' });
  };
  
  // Render the appropriate form based on the current state
  const renderAuthForm = () => {
    switch (state.value) {
      case 'unauthenticated':
        return (
          <div className="auth-forms">
            <SignInForm 
              onSubmit={handleSignIn} 
              errors={validationErrors}
              onCreateAccount={handleNavigateToSignup}
            />
          </div>
        );
        
      case 'signUpForm':
        return (
          <div className="auth-forms">
            <SignUpForm 
              onSubmit={handleSignUp} 
              errors={validationErrors}
              onBackToSignIn={() => authActor.send({ type: 'NAVIGATE_TO_SIGNIN' })}
            />
          </div>
        );
        
      case 'creatingAccount':
        return (
          <div className="auth-forms">
            <div className="loading-state">
              <h2>Creating Account</h2>
              <p>Please wait while we set up your account...</p>
              {/* You could add a spinner/loader component here */}
            </div>
          </div>
        );
        
      case 'needsConfirmation':
        return (
          <div className="auth-forms">
            <ConfirmationForm 
              email={email}
              onSubmit={handleConfirmationCode}
              onResend={handleResendConfirmation}
              errors={validationErrors}
            />
          </div>
        );
        
      case 'confirmationExpired':
        return (
          <div className="auth-forms">
            <ResendConfirmationForm 
              email={email}
              onResend={handleResendConfirmation}
              errors={validationErrors}
            />
          </div>
        );
        
      case 'authenticated':
        return children && currentUser 
          ? children({ user: currentUser, signOut: handleSignOut, actor: authActor })
          : null;
          
      default:
        // Loading states, etc.
        return <div className="auth-loading">Loading...</div>;
    }
  };
  
  return (
    <div className="authenticator-container">
      {renderAuthForm()}
    </div>
  );
};

export default Authenticator; 