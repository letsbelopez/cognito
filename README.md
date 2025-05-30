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

#### Development
 
 When making changes to core packages:
 
 1. **Active Development (Recommended)**:
    - Keep the example's dev server running (`pnpm dev`)
    - Make changes to core packages
    - Vite will automatically reload with your changes
    - No rebuild needed for most changes
 
 2. **Testing Built Packages**:
    ```sh
    # From root directory
    pnpm nx run-many -t=build  # Build core packages
    cd examples/simple
    pnpm install  # Reinstall to get fresh builds
    pnpm dev
    ```
 
 3. **Troubleshooting**:
    If changes aren't reflecting:
    ```sh
    # From examples/simple directory
    rm -rf node_modules/.vite  # Clear Vite cache
    # or
    rm -rf node_modules  # Clean install
    pnpm install
    pnpm dev
    ```

## Releasing New Versions

This project uses Nx to manage releases. The following steps are used to publish a new version:

### Prerequisites

- Access to the npm registry with publish rights for the packages
- Git configured with appropriate access to commit and push to the repository

### Release Process

1. Ensure all packages are built with the latest changes:
   ```sh
   pnpm nx run-many -t build
   ```

2. Bump the versions of all packages. Use one of the following options:
   - `patch` - for backwards-compatible bug fixes
   - `minor` - for new backwards-compatible functionality
   - `major` - for incompatible API changes
   ```sh
   pnpm dlx nx release version minor
   ```

3. Generate a changelog for the new version:
   ```sh
   pnpm dlx nx release changelog <version>
   ```
   Replace `<version>` with the new version number (e.g., `0.4.0`).

4. Publish the packages to npm:
   ```sh
   pnpm dlx nx release publish
   ```

For a dry run to see what would happen without making changes, add the `--dry-run` flag to any of the commands:
```sh
pnpm dlx nx release --dry-run
```

## License

MIT
