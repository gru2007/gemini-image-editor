import type { User, TokenInfo, TokenValidationResponse } from "./types";

// Authentication response interface
export interface AuthResponse {
  success: boolean;
  user?: User;
  token_info?: TokenInfo;
  message?: string;
  error?: string;
}

// Authenticate user with token
export async function authenticateUser(token: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Authentication failed',
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: 'Network error during authentication',
    };
  }
}

// Validate token directly (same as authenticate but returns different format)
export async function validateToken(token: string): Promise<TokenValidationResponse> {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        valid: false,
        message: data.error || 'Token validation failed',
        user: null,
        token_info: null,
      };
    }

    // Convert from AuthResponse to TokenValidationResponse format
    return {
      valid: data.success,
      message: data.message || 'Token is valid',
      user: data.user,
      token_info: data.token_info,
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Network error during token validation',
      user: null,
      token_info: null,
    };
  }
}

// Check if user is authenticated and active
export function isUserAuthenticated(user: User | null): boolean {
  return user !== null && user.is_active;
}

// Get user balance
export function getUserBalance(user: User | null): number {
  return user?.balance || 0;
}

// Check if user has sufficient balance
export function hasEnoughBalance(user: User | null, requiredAmount: number): boolean {
  const balance = getUserBalance(user);
  return balance >= requiredAmount;
} 