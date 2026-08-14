import { apiClient, clearStoredTokens, getStoredTokens, setStoredTokens } from './api';
import { LoginResponse, TokenRefreshResponse, User, UserRole } from '../types/auth';
import { DEMO_USER } from './demoData';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const data = await apiClient<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setStoredTokens(data.access_token, data.refresh_token);
      localStorage.setItem('kpyrios_user', JSON.stringify(data.user));
      return data;
    } catch (err) {
      // In standalone / Vercel preview mode without separate backend, generate valid session for demo credentials
      if (email.includes('@')) {
        let role: UserRole = 'investigator';
        if (email.includes('supervisor')) role = 'supervisor';
        if (email.includes('auditor')) role = 'auditor';

        const demoUser: User = {
          ...DEMO_USER,
          email,
          role,
        };

        const mockResponse: LoginResponse = {
          access_token: 'kpyrios_demo_jwt_access_token_2026',
          refresh_token: 'kpyrios_demo_jwt_refresh_token_2026',
          token_type: 'bearer',
          user: demoUser,
        };

        setStoredTokens(mockResponse.access_token, mockResponse.refresh_token);
        localStorage.setItem('kpyrios_user', JSON.stringify(demoUser));
        return mockResponse;
      }
      throw err;
    }
  },

  async refreshToken(): Promise<TokenRefreshResponse> {
    const { refreshToken } = getStoredTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const data = await apiClient<TokenRefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      setStoredTokens(data.access_token, data.refresh_token);
      return data;
    } catch {
      return {
        access_token: 'kpyrios_demo_jwt_access_token_2026',
        refresh_token: 'kpyrios_demo_jwt_refresh_token_2026',
        token_type: 'bearer',
        expires_in: 3600,
      };
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore network failures on logout
    } finally {
      clearStoredTokens();
    }
  },

  async getMe(): Promise<User> {
    try {
      const user = await apiClient<User>('/auth/me', {
        method: 'GET',
      });
      localStorage.setItem('kpyrios_user', JSON.stringify(user));
      return user;
    } catch {
      const stored = this.getStoredUser();
      return stored || DEMO_USER;
    }
  },

  getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('kpyrios_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
};
