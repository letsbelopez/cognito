# @letsbelopez/react-cognito

React components and hooks for AWS Cognito authentication

## Installation

```bash
pnpm add @letsbelopez/react-cognito
```

## Usage

### Setting up the AuthProvider

First, wrap your application with the `AuthProvider` to configure the authentication context:

```tsx
import { AuthProvider } from '@letsbelopez/react-cognito';

function App() {
  return (
    <AuthProvider config={{
      userPoolId: 'your-user-pool-id',
      clientId: 'your-client-id',
      region: 'your-region',
      autoRefreshTokens: true
    }}>
      <YourApp />
    </AuthProvider>
  );
}
```

### Using the AuthGuard Component

The `AuthGuard` component protects content until a user is authenticated. If the user is not authenticated, it displays sign-in and sign-up forms:

```tsx
import { AuthGuard } from '@letsbelopez/react-cognito';

function PrivateArea() {
  return (
    <AuthGuard>
      {/* This content will only be shown when the user is authenticated */}
      <h1>Private Content</h1>
      <p>Welcome to the protected area!</p>
    </AuthGuard>
  );
}
```

With render props for accessing user data and sign-out function:

```tsx
import { AuthGuard } from '@letsbelopez/react-cognito';

function PrivateArea() {
  return (
    <AuthGuard>
      {({ user, signOut }) => (
        <div>
          <h1>Welcome, {user.username}!</h1>
          <p>Your email: {user.email}</p>
          <button onClick={signOut}>Sign Out</button>
          
          {/* Rest of your protected content */}
          <Dashboard userData={user} />
        </div>
      )}
    </AuthGuard>
  );
}
```

### Using Hooks

The package provides several hooks for authentication operations:

```tsx
import { 
  useSignUp, 
  useSignIn, 
  useSignOut, 
  useConfirmSignUp, 
  useCurrentUser 
} from '@letsbelopez/react-cognito';

function AuthExample() {
  const { execute: signUp } = useSignUp();
  const { execute: signIn } = useSignIn();
  const { execute: signOut } = useSignOut();
  const { execute: confirmSignUp } = useConfirmSignUp();
  const { user, isAuthenticated } = useCurrentUser();
  
  // Your component logic here
}
```

## API Reference

### Components

#### `AuthProvider`

Configures the authentication context for your application.

Props:
- `config`: Configuration object for Cognito
  - `userPoolId`: Your Cognito User Pool ID
  - `clientId`: Your Cognito App Client ID
  - `region`: AWS region
  - `autoRefreshTokens`: (optional) Whether to automatically refresh tokens
  - `refreshInterval`: (optional) Interval in ms for refreshing tokens
  - `tokenStorage`: (optional) Custom token storage implementation
  - `onRefreshError`: (optional) Callback for token refresh errors
  - `onSignOut`: (optional) Callback when user signs out

#### `AuthGuard`

Protects content until a user is authenticated.

Props:
- `children`: React nodes or render function `({ signOut, user }) => ReactNode`
- `loadingComponent`: (optional) Custom loading component
- `useModal`: (optional) Show auth forms in a modal
- `className`: (optional) Custom CSS class for the container
- `onError`: (optional) Custom error handler

### Hooks

#### `useSignUp`

```tsx
const { execute, isLoading, error } = useSignUp();
const result = await execute(username, password, email, attributes?, autoSignIn?);
```

#### `useSignIn`

```tsx
const { execute, isLoading, error } = useSignIn();
await execute(username, password);
```

#### `useSignOut`

```tsx
const { execute, isLoading, error } = useSignOut();
await execute();
```

#### `useConfirmSignUp`

```tsx
const { execute, isLoading, error } = useConfirmSignUp();
const result = await execute(username, confirmationCode);
```

#### `useCurrentUser`

```tsx
const { user, isAuthenticated, isLoading, error } = useCurrentUser();
```

## License

MIT
