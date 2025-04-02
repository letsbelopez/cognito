import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AuthFlowType,
  SignUpCommandOutput,
  InitiateAuthCommandOutput,
  GetUserCommandOutput,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import type { 
  CognitoConfig, 
  SignUpParams, 
  SignInParams, 
  AuthUser, 
  AuthError, 
  SignUpResult, 
  ConfirmSignUpResult 
} from './types';

export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;
  // Add a map to track users who should be auto-signed in after confirmation
  private pendingAutoSignIn: Map<string, string> = new Map();

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({
      region: config.region,
    });
  }

  async signUp({ username, password, email, attributes = {}, autoSignIn = false }: SignUpParams): Promise<SignUpResult> {
    try {
      const command = new SignUpCommand({
        ClientId: this.config.clientId,
        Username: username,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          ...Object.entries(attributes).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        ],
      });

      const response: SignUpCommandOutput = await this.client.send(command);

      if (!response.UserSub) {
        throw new Error('Failed to create user');
      }

      // If autoSignIn is enabled, store credentials for later use after confirmation
      if (autoSignIn) {
        this.pendingAutoSignIn.set(username, password);
      }

      return {
        user: {
          username,
          email,
          attributes,
        },
        userConfirmed: response.UserConfirmed || false,
        autoSignInEnabled: autoSignIn,
      };
    } catch (error) {
      throw this.handleError(error as Error);
    }
  }

  async signIn({ username, password }: SignInParams): Promise<AuthUser> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: this.config.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      const response: InitiateAuthCommandOutput = await this.client.send(command);
      const authResult = response.AuthenticationResult;

      if (!authResult?.AccessToken || !authResult.IdToken || !authResult.RefreshToken) {
        throw new Error('Invalid authentication result');
      }

      const user = await this.getCurrentUser(authResult.AccessToken);

      return {
        ...user,
        tokens: {
          accessToken: authResult.AccessToken,
          idToken: authResult.IdToken,
          refreshToken: authResult.RefreshToken,
        },
      };
    } catch (error) {
      throw this.handleError(error as Error);
    }
  }

  async signOut(accessToken: string): Promise<void> {
    try {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });

      await this.client.send(command);
    } catch (error) {
      throw this.handleError(error as Error);
    }
  }

  async getCurrentUser(accessToken: string): Promise<Omit<AuthUser, 'tokens'>> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response: GetUserCommandOutput = await this.client.send(command);

      if (!response.Username || !response.UserAttributes) {
        throw new Error('Invalid user data');
      }

      const attributes = response.UserAttributes.reduce((acc, attr) => {
        if (attr.Name && attr.Value) {
          acc[attr.Name] = attr.Value;
        }
        return acc;
      }, {} as Record<string, string>);

      return {
        username: response.Username,
        email: attributes['email'],
        attributes,
      };
    } catch (error) {
      throw this.handleError(error as Error);
    }
  }

  async confirmSignUp(username: string, code: string): Promise<ConfirmSignUpResult> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.config.clientId,
        Username: username,
        ConfirmationCode: code,
      });

      await this.client.send(command);
      
      // Check if this user should be auto-signed in
      const autoSignInEnabled = this.pendingAutoSignIn.has(username);
      
      return {
        userConfirmed: true,
        autoSignInEnabled,
      };
    } catch (error) {
      throw this.handleError(error as Error);
    }
  }

  // New method to perform auto sign-in after confirmation
  async autoSignIn(username: string): Promise<AuthUser | null> {
    try {
      // Get stored password if available
      const password = this.pendingAutoSignIn.get(username);
      if (!password) {
        return null;
      }
      
      // Call sign-in with stored credentials
      const user = await this.signIn({ username, password });
      
      // Clean up stored credentials
      this.pendingAutoSignIn.delete(username);
      
      return user;
    } catch (error) {
      // If auto sign-in fails, clean up but don't throw
      this.pendingAutoSignIn.delete(username);
      console.error('Auto sign-in failed:', error);
      return null;
    }
  }

  async refreshSession(refreshToken: string): Promise<{ accessToken: string; idToken: string; refreshToken: string } | null> {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        ClientId: this.config.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      });

      const response = await this.client.send(command);
      const authResult = response.AuthenticationResult;

      if (!authResult?.AccessToken || !authResult.IdToken) {
        return null;
      }

      return {
        accessToken: authResult.AccessToken,
        idToken: authResult.IdToken,
        refreshToken: authResult.RefreshToken || refreshToken, // Use existing refresh token if not provided
      };
    } catch (error) {
      throw this.handleError(error as Error);
    }
  }

  async resendConfirmationCode(username: string): Promise<boolean> {
    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.config.clientId,
        Username: username,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      throw this.handleError(error as Error);
    }
  }

  private handleError(error: Error): AuthError {
    return {
      code: (error as any).name || 'UnknownError',
      name: (error as any).name || 'Error',
      message: error.message,
    };
  }
} 