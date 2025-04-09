# React Cognito Source Code

## Integration with Stately Inspector

This codebase has been integrated with the Stately Inspector to provide visual debugging for the authentication state machine.

### Key Files:

1. `state-machine.ts` - Contains the XState state machine definition for authentication
2. `components/Authenticator.tsx` - The main authentication component with inspector integration
3. `examples/AuthWithInspector.tsx` - Example demonstrating how to use the Authenticator with the inspector

### How the Inspector Integration Works:

1. We use `createBrowserInspector()` from `@statelyai/inspect` to create an inspector instance
2. The inspector is created conditionally only in development mode
3. The `inspect` option is passed to the `useActorRef` hook when creating the state machine actor
4. When the app runs in development mode, a new window opens with the Stately Inspector
5. All state transitions are automatically tracked and visualized in the inspector

### Benefits of Using Stately Inspector:

- Visual representation of the state machine
- Real-time updates as users interact with authentication forms
- Ability to see the current context values
- History of events and transitions
- Sequence diagrams showing actor communication

The Stately Inspector is far more powerful than a custom debugging component, providing deep insights into the state machine's behavior without requiring additional code. 