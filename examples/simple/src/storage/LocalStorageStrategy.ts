import { TokenStorageStrategy } from '@letsbelopez/react-cognito'

export class LocalStorageStrategy implements TokenStorageStrategy {
  getAccessToken = () => localStorage.getItem('cognito_access_token');
  getIdToken = () => localStorage.getItem('cognito_id_token');
  getRefreshToken = () => localStorage.getItem('cognito_refresh_token');
  setAccessToken = (token: string | null) => 
    token ? localStorage.setItem('cognito_access_token', token) : localStorage.removeItem('cognito_access_token');
  setIdToken = (token: string | null) => 
    token ? localStorage.setItem('cognito_id_token', token) : localStorage.removeItem('cognito_id_token');
  setRefreshToken = (token: string | null) => 
    token ? localStorage.setItem('cognito_refresh_token', token) : localStorage.removeItem('cognito_refresh_token');
  clearTokens = () => {
    localStorage.removeItem('cognito_access_token');
    localStorage.removeItem('cognito_id_token');
    localStorage.removeItem('cognito_refresh_token');
  };
} 