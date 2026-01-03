/**
 * JWT Token Utilities
 * Provides functions to decode and validate JWT tokens on the client side
 */

export interface JWTPayload {
  sub: string; // user id
  role: string;
  exp: number; // expiration timestamp
  type: 'access' | 'refresh';
}

/**
 * Decode JWT token without verification (client-side only)
 * Used to check expiration and extract payload
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid JWT format');
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    return decoded as JWTPayload;
  } catch (error) {
    console.error('❌ Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * Returns true if expired, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true; // Consider invalid token as expired
  }

  // Add 10 second buffer to avoid edge cases
  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired = payload.exp < currentTime + 10;
  
  if (isExpired) {
    console.warn('⚠️ Token expired at:', new Date(payload.exp * 1000).toISOString());
  }
  
  return isExpired;
}

/**
 * Check if token is valid (exists and not expired)
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  return !isTokenExpired(token);
}

/**
 * Get token expiration time in human readable format
 */
export function getTokenExpiry(token: string): Date | null {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return null;
  }
  return new Date(payload.exp * 1000);
}

/**
 * Get remaining time until token expires (in seconds)
 */
export function getTokenRemainingTime(token: string): number {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - currentTime;
  
  return remaining > 0 ? remaining : 0;
}
