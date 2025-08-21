/**
 * @jest-environment jsdom
 */

import {
  isTokenExpired,
  getCurrentToken,
  clearAuthAndRedirect,
} from '../auth-utils';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window.location.replace
const mockLocationReplace = jest.fn();

// Helper to create a valid JWT token for testing
function createMockJWT(payload: any): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  return `${header}.${payloadStr}.${signature}`;
}

describe('Auth Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset localStorage mock implementation
    localStorageMock.getItem.mockReset();
    localStorageMock.removeItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.clear.mockReset();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock window.location.replace
    Object.defineProperty(window, 'location', {
      value: { replace: mockLocationReplace },
      writable: true,
    });

    // Reset Date.now mock if it exists
    if (jest.isMockFunction(Date.now)) {
      (Date.now as jest.MockedFunction<typeof Date.now>).mockRestore();
    }
  });

  describe('isTokenExpired', () => {
    it('should return true for malformed tokens', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
      expect(isTokenExpired('too.few.parts')).toBe(true);
      expect(isTokenExpired('too.many.parts.here.extra')).toBe(true);
      expect(isTokenExpired('')).toBe(true);
    });

    it('should return true for tokens with invalid JSON payload', () => {
      const invalidJWT = 'header.invalid-json.signature';
      expect(isTokenExpired(invalidJWT)).toBe(true);
    });

    it('should return true for expired tokens', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredPayload = {
        exp: now - 3600, // Expired 1 hour ago
        iat: now - 7200, // Issued 2 hours ago
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const expiredToken = createMockJWT(expiredPayload);
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for tokens expiring within 30 second buffer', () => {
      const now = Math.floor(Date.now() / 1000);
      const payloadExpiringSoon = {
        exp: now + 15, // Expires in 15 seconds (within 30s buffer)
        iat: now - 3600,
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const tokenExpiringSoon = createMockJWT(payloadExpiringSoon);
      expect(isTokenExpired(tokenExpiringSoon)).toBe(true);
    });

    it('should return false for valid tokens with sufficient time', () => {
      const now = Math.floor(Date.now() / 1000);
      const validPayload = {
        exp: now + 3600, // Expires in 1 hour
        iat: now - 3600, // Issued 1 hour ago
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const validToken = createMockJWT(validPayload);
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should return false for tokens expiring exactly at 30 second buffer', () => {
      const now = Math.floor(Date.now() / 1000);
      const payloadAtBuffer = {
        exp: now + 31, // Expires in 31 seconds (just outside 30s buffer)
        iat: now - 3600,
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const tokenAtBuffer = createMockJWT(payloadAtBuffer);
      expect(isTokenExpired(tokenAtBuffer)).toBe(false);
    });

    it('should handle tokens without exp field', () => {
      const payloadWithoutExp = {
        iat: Math.floor(Date.now() / 1000),
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        // Missing exp field - undefined < (now + buffer) evaluates to false
      };

      const tokenWithoutExp = createMockJWT(payloadWithoutExp);
      expect(isTokenExpired(tokenWithoutExp)).toBe(false);
    });
  });

  describe('getCurrentToken', () => {
    it('should return null when no token exists in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getCurrentToken();

      expect(result).toBeNull();
      expect(localStorageMock.getItem).toHaveBeenCalledWith('authToken');
    });

    it('should return null and clear storage when token is expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredPayload = {
        exp: now - 3600, // Expired 1 hour ago
        iat: now - 7200,
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const expiredToken = createMockJWT(expiredPayload);
      localStorageMock.getItem.mockReturnValue(expiredToken);

      const result = getCurrentToken();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should return valid token when not expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const validPayload = {
        exp: now + 3600, // Expires in 1 hour
        iat: now - 3600,
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const validToken = createMockJWT(validPayload);
      localStorageMock.getItem.mockReturnValue(validToken);

      const result = getCurrentToken();

      expect(result).toBe(validToken);
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('should return null for malformed token and clear storage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');

      const result = getCurrentToken();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    it('should return null when running on server side (window undefined)', () => {
      // Mock server-side environment
      const originalWindow = window;
      // @ts-ignore
      delete global.window;

      const result = getCurrentToken();

      expect(result).toBeNull();
      expect(localStorageMock.getItem).not.toHaveBeenCalled();

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('clearAuthAndRedirect', () => {
    it('should clear both tokens and redirect to login', () => {
      clearAuthAndRedirect();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocationReplace).toHaveBeenCalledWith('/login');
    });

    it('should not crash when running on server side', () => {
      // Mock server-side environment
      const originalWindow = window;
      // @ts-ignore
      delete global.window;

      expect(() => clearAuthAndRedirect()).not.toThrow();
      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
      expect(mockLocationReplace).not.toHaveBeenCalled();

      // Restore window
      global.window = originalWindow;
    });

    it('should call localStorage.removeItem for both tokens', () => {
      clearAuthAndRedirect();

      expect(localStorageMock.removeItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(
        1,
        'authToken'
      );
      expect(localStorageMock.removeItem).toHaveBeenNthCalledWith(
        2,
        'refreshToken'
      );
      expect(mockLocationReplace).toHaveBeenCalledWith('/login');
    });
  });

  describe('JWT decoding edge cases', () => {
    it('should handle tokens with special characters in payload', () => {
      const now = Math.floor(Date.now() / 1000);
      const payloadWithSpecialChars = {
        exp: now + 3600,
        iat: now,
        userID: 'user-123_special',
        email: 'test+special@example.com',
        name: 'Test "User" with quotes',
      };

      const tokenWithSpecialChars = createMockJWT(payloadWithSpecialChars);
      expect(isTokenExpired(tokenWithSpecialChars)).toBe(false);
    });

    it('should handle very large exp values', () => {
      const payloadWithLargeExp = {
        exp: Number.MAX_SAFE_INTEGER,
        iat: Math.floor(Date.now() / 1000),
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const tokenWithLargeExp = createMockJWT(payloadWithLargeExp);
      expect(isTokenExpired(tokenWithLargeExp)).toBe(false);
    });

    it('should handle zero or negative exp values', () => {
      const payloadWithZeroExp = {
        exp: 0,
        iat: Math.floor(Date.now() / 1000),
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const tokenWithZeroExp = createMockJWT(payloadWithZeroExp);
      expect(isTokenExpired(tokenWithZeroExp)).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      // Fresh mocks for integration tests
      jest.clearAllMocks();
      localStorageMock.getItem.mockReset();
      localStorageMock.removeItem.mockReset();
      mockLocationReplace.mockReset();
    });

    it('should complete full auth flow: store token, validate, then clear', () => {
      const now = Math.floor(Date.now() / 1000);
      const validPayload = {
        exp: now + 3600,
        iat: now,
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const validToken = createMockJWT(validPayload);

      // Simulate storing a token
      localStorageMock.getItem.mockReturnValue(validToken);

      // Validate it's not expired
      expect(isTokenExpired(validToken)).toBe(false);

      // Get current token should return it
      expect(getCurrentToken()).toBe(validToken);

      // Clear auth should remove everything
      clearAuthAndRedirect();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(mockLocationReplace).toHaveBeenCalledWith('/login');
    });

    it('should handle expired token discovery during getCurrentToken', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredPayload = {
        exp: now - 1, // Expired 1 second ago
        iat: now - 3600,
        userID: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const expiredToken = createMockJWT(expiredPayload);
      localStorageMock.getItem.mockReturnValue(expiredToken);

      // Should detect expiration and clean up automatically
      const result = getCurrentToken();

      expect(result).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });
});
