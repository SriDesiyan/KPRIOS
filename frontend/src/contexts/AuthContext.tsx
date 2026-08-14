/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, User } from '../types/auth';
import { authService } from '../services/authService';
import { clearStoredTokens, getStoredTokens } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const { accessToken } = getStoredTokens();
      const cachedUser = authService.getStoredUser();

      if (accessToken) {
        if (cachedUser) {
          setUser(cachedUser);
        }
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
        } catch {
          // Attempt token refresh if access token expired
          try {
            await authService.refreshToken();
            const freshUser = await authService.getMe();
            setUser(freshUser);
          } catch {
            clearStoredTokens();
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const freshUser = await authService.getMe();
      setUser(freshUser);
    } catch {
      // fallback
    }
  };

  const tokens = getStoredTokens().accessToken
    ? {
        access_token: getStoredTokens().accessToken || '',
        refresh_token: getStoredTokens().refreshToken || '',
        token_type: 'bearer',
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
