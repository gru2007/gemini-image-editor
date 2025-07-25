// Define the interface for conversation history items
export interface HistoryItem {
  // Role can be either "user" or "model"
  role: "user" | "model";
  // Parts can contain text and/or images
  parts: HistoryPart[];
}

// Define the interface for history parts
export interface HistoryPart {
  // Text content (optional)
  text?: string;
  // Image content as data URL (optional)
  // Format: data:image/png;base64,... or data:image/jpeg;base64,...
  image?: string;
}

// Note: When sending to the Gemini API:
// 1. User messages can contain both text and images (as inlineData)
// 2. Model messages should only contain text parts
// 3. Images in history are stored as data URLs in our app, but converted to base64 for the API

// Token validation API types
export interface TokenValidationRequest {
  token: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  balance: string | number; // Laravel sends as string, but can be number
  telegram_id: string | null;
  is_active: boolean;
  email_verified_at: string | null;
}

export interface TokenInfo {
  id: number;
  name: string;
  abilities: string[] | Record<string, string>; // Laravel sends as object sometimes
  created_at: string;
  last_used_at: string | null;
}

export interface TokenValidationResponse {
  valid: boolean;
  message: string;
  user: User | null;
  token_info: TokenInfo | null;
}

// Utility function to safely convert balance to number
export function parseBalance(balance: string | number | undefined): number {
  if (typeof balance === 'number') {
    return balance;
  }
  if (typeof balance === 'string') {
    const parsed = parseFloat(balance);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}
