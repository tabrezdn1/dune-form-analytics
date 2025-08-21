/**
 * JWT token utilities for client-side token validation
 */

// JWT Payload interface matching backend token structure
interface JWTPayload {
  exp: number;
  iat: number;
  userID: string;
  email: string;
  name: string;
}

/**
 * Decode JWT token without verification (client-side only)
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload);
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Check if JWT token is expired (with 30 second buffer)
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token);
  if (!payload) return true;

  const now = Math.floor(Date.now() / 1000);
  const buffer = 30; // 30 second buffer

  return payload.exp < now + buffer;
}

/**
 * Get current token from localStorage and check if it's valid
 */
export function getCurrentToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem('authToken');
  if (!token) return null;

  if (isTokenExpired(token)) {
    // Token is expired, clear storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    return null;
  }

  return token;
}

/**
 * Clear auth tokens and redirect to login immediately
 */
export function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');

  // Use window.location.replace for immediate redirect without history entry
  window.location.replace('/login');
}
