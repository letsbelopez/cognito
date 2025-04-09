import { Authenticator } from '@letsbelopez/react-cognito';
import { cognitoConfig } from './config/cognitoConfig';

export function WithAuthGuard() {
  return (
    <Authenticator cognitoConfig={cognitoConfig}>
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
    </Authenticator>
  )
}
