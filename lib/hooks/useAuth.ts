import { useState, useEffect } from 'react';
import { authenticateUser, isUserAuthenticated, getUserBalance } from '../auth';
import type { User, TokenInfo } from '../types';

export interface AuthState {
  user: User | null;
  token_info: TokenInfo | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  balance: number;
}

export interface AuthActions {
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  refresh: () => Promise<void>;
  checkBalance: () => number;
  hasEnoughBalance: (amount: number) => boolean;
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    token_info: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    balance: 0,
  });

  // Login with token
  const login = async (token: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authenticateUser(token);
      
      if (response.success && response.user) {
        // Store token in localStorage for future use
        localStorage.setItem('auth_token', token);
        
        setState(prev => ({
          ...prev,
          user: response.user!,
          token_info: response.token_info || null,
          isAuthenticated: true,
          isLoading: false,
          balance: response.user!.balance,
          error: null,
        }));
        
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Authentication failed',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Network error during authentication',
      }));
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('auth_token');
    setState({
      user: null,
      token_info: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      balance: 0,
    });
  };

  // Refresh user data
  const refresh = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await login(token);
    }
  };

  // Check current balance
  const checkBalance = (): number => {
    return getUserBalance(state.user);
  };

  // Check if user has enough balance
  const hasEnoughBalance = (amount: number): boolean => {
    return state.balance >= amount;
  };

  // Auto-login on mount if token exists
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      login(token);
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    refresh,
    checkBalance,
    hasEnoughBalance,
  };
} 