# React Cognito Authentication

A React component library for AWS Cognito authentication with XState state management.

## Installation

```bash
npm install @letsbelopez/react-cognito
```

## Usage

```jsx
import { Authenticator } from '@letsbelopez/react-cognito';

const cognitoConfig = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_example',
  clientId: 'your-client-id',
};

function App() {
  return (
    <Authenticator cognitoConfig={cognitoConfig}>
      {({ user, signOut }) => (
        <div>
          <h1>Welcome, {user.email}!</h1>
          <button onClick={signOut}>Sign Out</button>
        </div>
      )}
    </Authenticator>
  );
}
```

## Debugging with Stately Inspector

This library integrates with [Stately Inspector](https://stately.ai/docs/inspector) to visualize the authentication state machine and help with debugging.

### Setup

1. Install the Stately Inspector package:

```bash
npm install @statelyai/inspect
```

2. The Authenticator component is already configured to connect to the Stately Inspector in development mode.

3. When you render the Authenticator component in development, a new browser window will automatically open with the Stately Inspector, showing a visual representation of the auth state machine.

4. As you interact with the auth forms (sign-in, sign-up, confirmation, etc.), you'll see the state transitions in real-time in the Inspector.

### Example

See an example implementation in `src/examples/AuthWithInspector.tsx`.

### Features of the Stately Inspector

- **State Machine Visualization**: See the entire auth state machine as an interactive diagram
- **Current State Highlighting**: The current state is highlighted in the diagram
- **Event History**: Track all events that have been sent to the state machine
- **Context Inspection**: View the current context values (email, validation errors, etc.)
- **Sequence Diagrams**: Automatically generated diagrams showing the flow of events between actors

### Turning Off the Inspector

The Inspector only runs in development mode (`process.env.NODE_ENV === 'development'`). In production, the Inspector is automatically disabled.

## API Reference

### Authenticator Component

```jsx
<Authenticator 
  cognitoConfig={cognitoConfig}
  children={({ user, signOut }) => ReactNode}
/>
```

#### Props

- `cognitoConfig`: Configuration object for AWS Cognito
  - `region`: AWS region
  - `userPoolId`: Cognito User Pool ID
  - `clientId`: Cognito App Client ID
- `children`: Function that receives the authenticated user and signOut function

## License

MIT
