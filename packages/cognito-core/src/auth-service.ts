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
} from '@aws-sdk/client-cognito-identity-provider';
import type { CognitoConfig, SignUpParams, SignInParams, AuthUser, AuthError } from './types';

export class CognitoAuthService {
  private client: CognitoIdentityProviderClient;
  private config: CognitoConfig;

  constructor(config: CognitoConfig) {
    this.config = config;
    this.client = new CognitoIdentityProviderClient({
      region: config.region,
    });
  }

  async signUp({ username, password, email, attributes = {} }: SignUpParams): Promise<AuthUser> {
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

      return {
        username,
        email,
        attributes,
        tokens: {
          accessToken: '',
          idToken: '',
          refreshToken: '',
        },
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

  async confirmSignUp(username: string, code: string): Promise<void> {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: this.config.clientId,
        Username: username,
        ConfirmationCode: code,
      });

      await this.client.send(command);
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