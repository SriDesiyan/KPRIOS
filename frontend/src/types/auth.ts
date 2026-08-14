export type UserRole = 'investigator' | 'supervisor' | 'auditor';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
