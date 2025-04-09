import React, { useState } from 'react';
import { Authenticator } from '../components/Authenticator';
import type { CognitoConfig } from '@letsbelopez/cognito-core/src/types';
import { useSelector } from '@xstate/react';

interface AuthWithInspectorProps {
  cognitoConfig: CognitoConfig;
}

/**
 * Example component demonstrating how to use the Authenticator with Stately Inspector
 * 
 * The Stately Inspector will automatically open in a new window/tab when this 
 * component renders in development mode, showing a visualization of the auth state machine.
 */
export const AuthWithInspector: React.FC<AuthWithInspectorProps> = ({ cognitoConfig }) => {
  // For more advanced debugging, we can add a simple state viewer
  const [showStateViewer, setShowStateViewer] = useState(false);
  
  return (
    <div className="auth-container">
      <h2>Authentication with XState Inspector</h2>
      <p className="inspector-note">
        The Stately Inspector will automatically open in a separate window.
        You can use it to visualize the state machine and debug the authentication flow.
      </p>
      <div className="auth-form">
        <Authenticator cognitoConfig={cognitoConfig}>
          {({ user, signOut, actor }) => (
            <div className="authenticated-content">
              <h3>Welcome, {user.email || 'User'}!</h3>
              <p>You are now authenticated.</p>
              
              {/* Toggle a simple state viewer */}
              <div className="debug-controls">
                <button onClick={signOut} className="sign-out-btn">Sign Out</button>
                <button 
                  onClick={() => setShowStateViewer(prev => !prev)}
                  className="toggle-state-btn"
                >
                  {showStateViewer ? 'Hide' : 'Show'} State
                </button>
              </div>
              
              {/* Simple state viewer for in-app debugging alongside the inspector */}
              {showStateViewer && <StateViewer actor={actor} />}
            </div>
          )}
        </Authenticator>
      </div>
      
      <style>{`
        .auth-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .inspector-note {
          padding: 0.75rem;
          background-color: #f0f0f0;
          border-left: 4px solid #3498db;
          margin-bottom: 1rem;
        }
        
        .auth-form {
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 1.5rem;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .authenticated-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        
        .debug-controls {
          display: flex;
          gap: 0.5rem;
        }
        
        .sign-out-btn {
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .sign-out-btn:hover {
          background-color: #c0392b;
        }
        
        .toggle-state-btn {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .toggle-state-btn:hover {
          background-color: #2980b9;
        }
      `}</style>
    </div>
  );
};

// Simple component to show the current state in the app
// This is just for demonstration purposes - the Stately Inspector is far more powerful
const StateViewer = ({ actor }: { actor: any }) => {
  const state = useSelector(actor, (state: any) => state);
  const context = useSelector(actor, (state: any) => state.context);
  
  return (
    <div className="state-viewer">
      <h4>Current State</h4>
      <div className="state-value">{String(state.value)}</div>
      
      <h4>Current Context</h4>
      <pre className="context-json">
        {JSON.stringify(
          {
            ...context,
            // Filter out sensitive/circular data
            password: '********',
            authService: '[AuthService]'
          }, 
          null, 
          2
        )}
      </pre>
      
      <style>{`
        .state-viewer {
          width: 100%;
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 4px;
          text-align: left;
        }
        
        .state-value {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background-color: #3498db;
          color: white;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .context-json {
          background-color: #f0f0f0;
          padding: 0.5rem;
          border-radius: 4px;
          overflow: auto;
          max-height: 200px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
};

export default AuthWithInspector; 