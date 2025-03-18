![React Cognito Header](https://raw.githubusercontent.com/letsbelopez/cognito/master/media/repo-header.png)

# Cognito

A lightweight wrapper around AWS Cognito User Pools that provides a simple authentication solution for React applications.

## Packages

This monorepo contains two main packages:

- `@letsbelopez/cognito-core`: Core authentication functionality wrapping AWS Cognito User Pools
- `@letsbelopez/react-cognito`: React hooks and components for easy Cognito integration

## Installation

```sh
# Install the React package (recommended for React applications)
npm install @letsbelopez/react-cognito

# Or if you only need the core functionality
npm install @letsbelopez/cognito-core
```

## Quick Start

1. Wrap your app with the `AuthProvider`:

```tsx
import { AuthProvider } from '@letsbelopez/react-cognito';

function App() {
  return (
    <AuthProvider
      region="us-east-1"
      userPoolId="us-east-1_xxxxxx"
      clientId="your-client-id"
    >
      <YourApp />
    </AuthProvider>
  );
}
```

2. Use the authentication hooks in your components:

```tsx
import { 
  useSignIn, 
  useSignUp, 
  useSignOut,
  useCurrentUser 
} from '@letsbelopez/react-cognito';

function LoginComponent() {
  const { signIn, isLoading, error } = useSignIn();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn({
        username: 'user@example.com',
        password: 'password123'
      });
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  return (
    // Your login form
  );
}

function UserProfile() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>Welcome, {user.email}</div>;
}
```

## Available Hooks

- `useSignIn()`: Handle user sign in
- `useSignUp()`: Handle new user registration
- `useConfirmSignUp()`: Confirm user registration with verification code
- `useSignOut()`: Handle user sign out
- `useCurrentUser()`: Access the current authenticated user

## Token Storage

By default, tokens are stored in memory. You can customize the storage strategy when setting up the AuthProvider:

```tsx
import { AuthProvider } from '@letsbelopez/react-cognito';

const customStorage: TokenStorageStrategy = {
  getRefreshToken: () => // your custom get logic,
  setRefreshToken: (token) => // your custom set logic,
  removeToken: () => // your custom remove logic
};

function App() {
  return (
    <AuthProvider
      region="us-east-1"
      userPoolId="us-east-1_xxxxxx"
      clientId="your-client-id"
      tokenStorage={customStorage}
    >
      <YourApp />
    </AuthProvider>
  );
}
```

## Development

This project uses a monorepo structure managed with pnpm and Nx. To contribute:

```sh
# Install dependencies
pnpm install

# Build all packages
pnpm nx run-many -t=build

# Run examples
cd examples/simple
pnpm install
pnpm dev
```

## License

MIT
