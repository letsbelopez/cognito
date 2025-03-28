import { type AuthError } from '@letsbelopez/react-cognito'
import { LocalStorageStrategy } from '../storage/LocalStorageStrategy'

export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  region: import.meta.env.VITE_COGNITO_REGION,
  // Add new configuration options
  tokenStorage: new LocalStorageStrategy(),
  autoRefreshTokens: true,
  refreshInterval: 1000 * 60 * 15, // 15 minutes
  onRefreshError: (error: AuthError) => {
    console.error('Token refresh failed:', error);
  },
  onSignOut: () => {
    console.log('User signed out');
  },
}

// Debug Cognito configuration
console.log('Cognito Config:', cognitoConfig) 