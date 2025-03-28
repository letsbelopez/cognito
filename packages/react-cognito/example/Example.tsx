import React from 'react';
import { AuthProvider, AuthGuard } from '../src';

/**
 * Example of using the AuthGuard component with render props
 */
function RenderPropsExample() {
  return (
    <AuthGuard>
      {({ user, signOut }) => (
        <div>
          <h1>Welcome, {user.username}!</h1>
          <p>Email: {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
          
          <div>
            <h2>Your Dashboard</h2>
            <p>This is your private dashboard content.</p>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

/**
 * Example of using the AuthGuard component with children
 */
function ChildrenExample() {
  return (
    <AuthGuard>
      <h1>Protected Content</h1>
      <p>This content is only visible to authenticated users.</p>
    </AuthGuard>
  );
}

/**
 * Complete example showing AuthProvider setup and AuthGuard usage
 */
export function Example() {
  return (
    <AuthProvider config={{
      userPoolId: 'us-east-1_abcdefg',
      clientId: '1234567890abcdefghijklmno',
      region: 'us-east-1',
      autoRefreshTokens: true
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1>My Protected App</h1>
          <p>This is a public header visible to everyone</p>
        </header>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: '1', padding: '20px', backgroundColor: '#f5f5f5' }}>
            <h2>Public Content</h2>
            <p>This content is visible to everyone, even unauthenticated users.</p>
          </div>
          
          <div style={{ flex: '2', padding: '20px', border: '1px solid #ddd' }}>
            <AuthGuard>
              {({ user, signOut }) => (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Welcome, {user.username}!</h2>
                    <button 
                      onClick={signOut}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#f44336', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                  
                  <div>
                    <h3>Your Dashboard</h3>
                    <p>This is your private dashboard content that only authenticated users can see.</p>
                    
                    <h3>User Profile</h3>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    
                    <h3>Account Settings</h3>
                    <p>You can manage your account settings here.</p>
                  </div>
                </>
              )}
            </AuthGuard>
          </div>
        </div>
        
        <footer style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ddd' }}>
          <p>&copy; 2023 My Protected App. All rights reserved.</p>
          <p>This is a public footer visible to everyone</p>
        </footer>
      </div>
    </AuthProvider>
  );
} 