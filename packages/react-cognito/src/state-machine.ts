import { createMachine, assign, fromPromise } from 'xstate';
import { CognitoAuthService } from '@letsbelopez/cognito-core';
import type { AuthUser, CognitoConfig } from '@letsbelopez/cognito-core';

// Helper for token storage
const TokenStorage = {
  storeTokens: (tokens: { accessToken: string; idToken?: string; refreshToken?: string }) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('auth_access_token', tokens.accessToken);
    if (tokens.idToken) localStorage.setItem('auth_id_token', tokens.idToken);
    if (tokens.refreshToken) localStorage.setItem('auth_refresh_token', tokens.refreshToken);
    
    // Store expiration time (default to 50 minutes from now to refresh before the typical 1 hour expiration)
    const expiresIn = 50 * 60 * 1000;
    const expirationTime = Date.now() + expiresIn;
    localStorage.setItem('auth_expiration', expirationTime.toString());
  },
  
  getTokens: () => {
    if (typeof window === 'undefined') return null;
    
    const accessToken = localStorage.getItem('auth_access_token');
    const idToken = localStorage.getItem('auth_id_token');
    const refreshToken = localStorage.getItem('auth_refresh_token');
    const expirationTimeStr = localStorage.getItem('auth_expiration');
    
    if (!accessToken || !refreshToken) return null;
    
    return {
      accessToken,
      idToken: idToken || undefined,
      refreshToken,
      expiresAt: expirationTimeStr ? parseInt(expirationTimeStr, 10) : undefined
    };
  },
  
  clearTokens: () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_id_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_expiration');
  },
  
  isTokenExpiring: () => {
    const tokens = TokenStorage.getTokens();
    if (!tokens || !tokens.expiresAt) return false;
    
    // Check if token is about to expire (within 5 minutes)
    const bufferTime = 5 * 60 * 1000;
    return Date.now() + bufferTime > tokens.expiresAt;
  }
};

// TypeScript interfaces for the machine
interface AuthContext {
  email: string;
  password: string;
  confirmationCode: string;
  validationErrors: {
    email?: string;
    password?: string;
    confirmationCode?: string;
    form?: string;
  };
  currentUser: AuthUser | null;
  authService?: CognitoAuthService;
  accessToken?: string;
  refreshToken?: string;
  isRefreshing: boolean; // Track if token refresh is in progress
}

type AuthEvent =
  | { type: 'SIGN_IN'; email: string; password: string }
  | { type: 'SIGN_UP'; email: string; password: string; username?: string }
  | { type: 'SIGN_OUT' }
  | { type: 'SUBMIT_CONFIRMATION_CODE'; code: string }
  | { type: 'RESEND_CONFIRMATION_CODE' }
  | { type: 'AUTH_SUCCESS'; user: AuthUser }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'NEEDS_CONFIRMATION' }
  | { type: 'CONFIRMATION_SUCCESS' }
  | { type: 'CONFIRMATION_ERROR'; error: string }
  | { type: 'CONFIRMATION_EXPIRED' }
  | { type: 'NAVIGATE_TO_SIGNUP' }
  | { type: 'NAVIGATE_TO_SIGNIN' }
  | { type: 'REFRESH_TOKEN' }
  | { type: 'REFRESH_SUCCESS'; tokens: { accessToken: string; idToken: string; refreshToken: string } }
  | { type: 'REFRESH_ERROR' };

type AuthTypestate =
  | { value: 'unauthenticated'; context: AuthContext }
  | { value: 'authenticating'; context: AuthContext }
  | { value: 'creatingAccount'; context: AuthContext }
  | { value: 'needsConfirmation'; context: AuthContext }
  | { value: 'verifyingConfirmation'; context: AuthContext }
  | { value: 'authenticated'; context: AuthContext & { currentUser: AuthUser } }
  | { value: 'confirmationExpired'; context: AuthContext }
  | { value: 'sendingConfirmation'; context: AuthContext }
  | { value: 'signingOut'; context: AuthContext }
  | { value: 'signUpForm'; context: AuthContext };

// Create the authentication machine
export const createAuthMachine = (config: CognitoConfig) => {
  // Create the auth service
  const authService = new CognitoAuthService(config);
  
  // Get stored tokens if they exist
  const storedTokens = TokenStorage.getTokens();
  const initialState = storedTokens ? 'checkingAuth' : 'unauthenticated';
  
  return createMachine({
    id: 'auth',
    initial: initialState,
    context: {
      email: '',
      password: '',
      confirmationCode: '',
      validationErrors: {},
      currentUser: null,
      authService,
      accessToken: storedTokens?.accessToken,
      refreshToken: storedTokens?.refreshToken,
      isRefreshing: false
    },
    states: {
      // State to check stored auth on app load
      checkingAuth: {
        invoke: {
          src: 'validateStoredAuth',
          input: ({ context }) => context,
          onDone: {
            target: 'authenticated',
            actions: assign({
              currentUser: ({event}) => event.output,
              accessToken: ({event}) => event.output?.tokens?.accessToken,
              refreshToken: ({event}) => event.output?.tokens?.refreshToken,
            })
          },
          onError: {
            target: 'unauthenticated',
            actions: TokenStorage.clearTokens
          }
        }
      },
      
      // Initial state when user is not authenticated
      unauthenticated: {
        entry: TokenStorage.clearTokens,
        on: {
          // Transition to authenticating when user attempts to sign in
          SIGN_IN: {
            target: 'authenticating',
            // Store credentials in context and clear any validation errors
            actions: assign({
              email: ({context, event}) => {
                if (event.type === 'SIGN_IN') {
                  return event.email;
                }
                return '';
              },
              password: ({event}) => {
                if (event.type === 'SIGN_IN') {
                  return event.password;
                }
                return '';
              },
              validationErrors: {} 
            }),
            // Guard to check if email and password are valid
            guard: 'validateCredentials'
          },
          // Navigate to sign up form
          NAVIGATE_TO_SIGNUP: {
            target: 'signUpForm',
            actions: assign({
              email: '',
              password: '',
              validationErrors: {}
            })
          },
          // Keep SIGN_UP for direct submissions
          SIGN_UP: {
            target: 'creatingAccount',
            // Store user information in context
            actions: [
              assign({
                email: ({event}) => {
                  if (event.type === 'SIGN_UP') {
                    return event.email;
                  }
                  return '';
                },
                password: ({event}) => {
                  if (event.type === 'SIGN_UP') {
                    return event.password;
                  }
                  return '';
                },
                validationErrors: {}
              })
            ],
            // Guard to check if registration data is valid
            guard: 'validateRegistration'
          }
        }
      },
      
      // New state for displaying the sign up form
      signUpForm: {
        on: {
          // Submit sign up form data
          SIGN_UP: {
            target: 'creatingAccount',
            actions: [
              assign({
                email: ({event}) => {
                  if (event.type === 'SIGN_UP') {
                    return event.email;
                  }
                  return '';
                },
                password: ({event}) => {
                  if (event.type === 'SIGN_UP') {
                    return event.password;
                  }
                  return '';
                },
                validationErrors: {}
              })
            ],
            guard: 'validateRegistration'
          },
          // Navigate back to sign in form
          NAVIGATE_TO_SIGNIN: {
            target: 'unauthenticated',
            actions: assign({
              email: '',
              password: '',
              validationErrors: {}
            })
          }
        }
      },
      
      // State when user is attempting to sign in
      authenticating: {
        // Invoke the sign-in service
        invoke: {
          src: 'signInService',
          input: ({ context }) => context,
          onDone: {
            target: 'authenticated',
            // Store user data in context upon successful authentication
            actions: assign({
              currentUser: ({event}) => event.output,
              accessToken: ({event}) => event.output?.tokens?.accessToken,
              refreshToken: ({event}) => event.output?.tokens?.refreshToken
            })
          },
          onError: [
            // Check for user not confirmed error
            {
              target: 'needsConfirmation',
              guard: ({event}) => {
                // Check for UserNotConfirmedException or similar error
                return event.error?.name === 'UserNotConfirmedException' || 
                       event.error?.message?.includes('not confirmed') ||
                       /user.*not.*confirmed/i.test(event.error?.message || '');
              }
            },
            // Handle other errors
            {
              target: 'unauthenticated',
              actions: assign({
                validationErrors: ({event}) => ({
                  form: event.error || 'An error occurred during authentication'
                })
              })
            }
          ]
        },
        on: {
          // Transition to needsConfirmation if account needs verification
          NEEDS_CONFIRMATION: 'needsConfirmation',
          // Handle authentication success explicitly
          AUTH_SUCCESS: {
            target: 'authenticated',
            actions: assign({
              currentUser: ({event}) => {
                if (event.type === 'AUTH_SUCCESS') {
                  return event.user;
                }
                return null;
              },
              accessToken: ({event}) => {
                if (event.type === 'AUTH_SUCCESS') {
                  return event.user?.tokens?.accessToken;
                }
                return undefined;
              }
            })
          },
          // Handle authentication error explicitly
          AUTH_ERROR: {
            target: 'unauthenticated',
            actions: assign({
              validationErrors: ({event}) => {
                if (event.type === 'AUTH_ERROR') {
                  return { form: event.error };
                }
                return {};
              }
            })
          }
        }
      },
      
      // State when user is creating a new account
      creatingAccount: {
        // Invoke the sign-up service
        invoke: {
          src: 'signUpService',
          input: ({ context }) => context,
          onDone: {
            // If sign-up requires confirmation, transition to needsConfirmation
            target: 'needsConfirmation',
          },
          onError: {
            target: 'unauthenticated',
            actions: assign({
              validationErrors: ({event}) => ({
                form: event.error || 'An error occurred during signup'
              })
            })
          }
        }
      },
      
      // State when user needs to confirm their account
      needsConfirmation: {
        on: {
          // Process confirmation code submission
          SUBMIT_CONFIRMATION_CODE: {
            target: 'verifyingConfirmation',
            actions: assign({
              confirmationCode: ({event}) => {
                if (event.type === 'SUBMIT_CONFIRMATION_CODE') {
                  return event.code;
                }
                return '';
              }
            }),
            guard: ({event}) => {
              return event.type === 'SUBMIT_CONFIRMATION_CODE' && 
                     event.code && 
                     event.code.length > 0;
            }
          },
          // Transition to sendingConfirmation when user requests a new code
          RESEND_CONFIRMATION_CODE: 'sendingConfirmation',
          // Transition to confirmationExpired if the confirmation code has expired
          CONFIRMATION_EXPIRED: 'confirmationExpired'
        }
      },
      
      // New state for verifying the confirmation code
      verifyingConfirmation: {
        invoke: {
          src: 'confirmSignUpService',
          input: ({ context }) => context,
          onDone: {
            target: 'authenticating',
          },
          onError: {
            target: 'needsConfirmation',
            actions: assign({
              validationErrors: ({event}) => ({
                confirmationCode: event.error || 'Invalid confirmation code'
              })
            })
          }
        }
      },
      
      // State when user is successfully authenticated
      authenticated: {
        entry: [
          assign({ isRefreshing: false }),
          ({ context, event }) => {
            // Store tokens when authenticated
            if (context.accessToken && context.refreshToken) {
              TokenStorage.storeTokens({
                accessToken: context.accessToken,
                idToken: context.currentUser?.tokens?.idToken,
                refreshToken: context.refreshToken
              });
            }
          }
        ],
        on: {
          // Transition to signingOut when user attempts to sign out
          SIGN_OUT: 'signingOut',
          // Add token refresh events that don't interrupt the UI
          REFRESH_TOKEN: {
            actions: [
              assign({ isRefreshing: true }),
              'refreshTokenInBackground'
            ]
          },
          REFRESH_SUCCESS: {
            actions: [
              assign({
                accessToken: ({event}) => event.tokens?.accessToken,
                refreshToken: ({event}) => event.tokens?.refreshToken,
                isRefreshing: false
              }),
              ({ event }) => {
                // Update stored tokens
                TokenStorage.storeTokens({
                  accessToken: event.tokens.accessToken,
                  idToken: event.tokens.idToken,
                  refreshToken: event.tokens.refreshToken
                });
              }
            ]
          },
          REFRESH_ERROR: {
            actions: assign({ isRefreshing: false })
            // We stay in authenticated state even if refresh fails - we'll try again later
          }
        },
        // Start a timer to check if token needs refreshing
        after: {
          // Check token expiration every minute in background
          '60000': {
            actions: ({context, self}) => {
              // Only refresh if not already refreshing and token is expiring
              if (!context.isRefreshing && TokenStorage.isTokenExpiring() && context.refreshToken) {
                self.send({ type: 'REFRESH_TOKEN' });
              }
            }
          }
        }
      },
      
      // State when the confirmation code has expired
      confirmationExpired: {
        on: {
          // Transition to sendingConfirmation when user requests a new code
          RESEND_CONFIRMATION_CODE: 'sendingConfirmation'
        }
      },
      
      // State when a new confirmation code is being sent
      sendingConfirmation: {
        // Invoke the resend confirmation code service
        invoke: {
          src: 'resendConfirmationService',
          input: ({ context }) => context,
          onDone: 'needsConfirmation',
          onError: {
            target: 'confirmationExpired',
            actions: assign({
              validationErrors: ({event}) => ({
                confirmationCode: event.error || 'An error occurred while sending the confirmation code'
              })
            })
          }
        }
      },
      
      // State when user is signing out
      signingOut: {
        entry: TokenStorage.clearTokens,
        // Invoke the sign-out service
        invoke: {
          src: 'signOutService',
          input: ({ context }) => context,
          onDone: {
            target: 'unauthenticated',
            // Clear user data and form data from context
            actions: assign({
              email: '',
              password: '',
              confirmationCode: '',
              validationErrors: {},
              currentUser: null,
              accessToken: undefined
            })
          },
          onError: 'authenticated'
        }
      }
    }
  }, {
    // Guards (conditions) for the state machine
    guards: {
      // Validate sign-in credentials
      validateCredentials: ({event}) => {
        if (event.type !== 'SIGN_IN') return false;
        
        const errors: Record<string, string> = {};
        let isValid = true;
        
        if (!event.email || !event.email.includes('@')) {
          errors.email = 'Please enter a valid email address';
          isValid = false;
        }
        
        if (!event.password || event.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
          isValid = false;
        }
        
        // If validation fails, assign errors to context
        if (!isValid) {
          assign({
            validationErrors: errors
          });
        }
        
        return isValid;
      },
      
      // Validate sign-up information
      validateRegistration: ({event}) => {
        if (event.type !== 'SIGN_UP') return false;
        
        const errors: Record<string, string> = {};
        let isValid = true;
        
        if (!event.email || !event.email.includes('@')) {
          errors.email = 'Please enter a valid email address';
          isValid = false;
        }
        
        if (!event.password || event.password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
          isValid = false;
        }
        
        // If validation fails, assign errors to context
        if (!isValid) {
          assign({
            validationErrors: errors
          });
        }
        
        return isValid;
      }
    },
    
    // Actors (formerly services) for the state machine
    actors: {
      // Actor for signing in using the auth service
      signInService: fromPromise<AuthUser, AuthContext>(async ({ input }) => {
        const { authService, email, password } = input;
        if (!authService) {
          throw new Error('Auth service not available');
        }
        
        return authService.signIn({ username: email, password });
      }),
      
      // Actor for signing up using the auth service
      signUpService: fromPromise<any, AuthContext>(async ({ input }) => {
        const { authService, email, password } = input;
        if (!authService) {
          throw new Error('Auth service not available');
        }
        
        return authService.signUp({
          username: email,
          password,
          email,
          autoSignIn: true
        });
      }),
      
      // Actor for confirming sign-up using the auth service
      confirmSignUpService: fromPromise<any, AuthContext>(async ({ input }) => {
        const { authService, email, confirmationCode } = input;
        if (!authService) {
          throw new Error('Auth service not available');
        }
        
        const result = await authService.confirmSignUp(email, confirmationCode);

        return result;
      }),
      
      // Actor for resending confirmation code using the auth service
      resendConfirmationService: fromPromise<boolean, AuthContext>(async ({ input }) => {
        const { authService, email } = input;
        if (!authService) {
          throw new Error('Auth service not available');
        }
        
        return authService.resendConfirmationCode(email);
      }),
      
      // Actor for signing out using the auth service
      signOutService: fromPromise<void, AuthContext>(async ({ input }) => {
        const { authService, accessToken } = input;
        if (!authService || !accessToken) {
          throw new Error('Cannot sign out: missing auth service or access token');
        }
        
        return authService.signOut(accessToken);
      }),
      
      // Service to validate stored authentication 
      validateStoredAuth: fromPromise<AuthUser, AuthContext>(async ({ input }) => {
        const { authService, accessToken, refreshToken } = input;
        if (!authService || !accessToken || !refreshToken) {
          throw new Error('Missing required auth data');
        }
        
        try {
          // Try to get user with current access token
          const userData = await authService.getCurrentUser(accessToken);
          
          return {
            ...userData,
            tokens: {
              accessToken,
              refreshToken
            }
          } as AuthUser;
        } catch (error) {
          // If access token is invalid, try to refresh
          try {
            const tokens = await authService.refreshSession(refreshToken);
            if (!tokens) throw new Error('Failed to refresh session');
            
            // Get user data with new token
            const userData = await authService.getCurrentUser(tokens.accessToken);
            
            return {
              ...userData,
              tokens
            } as AuthUser;
          } catch (refreshError) {
            // If refresh also fails, authentication is invalid
            TokenStorage.clearTokens();
            throw refreshError;
          }
        }
      })
    },
    
    // Add actions for background token refresh
    actions: {
      refreshTokenInBackground: ({ context, self }) => {
        if (!context.authService || !context.refreshToken) return;
        
        // Execute token refresh in background without changing state
        context.authService.refreshSession(context.refreshToken)
          .then(tokens => {
            if (tokens) {
              self.send({ type: 'REFRESH_SUCCESS', tokens });
            } else {
              self.send({ type: 'REFRESH_ERROR' });
            }
          })
          .catch(() => {
            self.send({ type: 'REFRESH_ERROR' });
          });
      }
    }
  });
};