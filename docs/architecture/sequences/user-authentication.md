# User Authentication Flow

## Overview

This document describes the complete authentication flow in Dune Form Analytics, including user registration, login, token refresh, and logout processes using JWT-based authentication.

## Registration Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant API as Go Fiber API
    participant AuthSvc as Auth Service
    participant DB as MongoDB
    
    Client->>API: POST /api/auth/signup
    Note over Client,API: {email, password, name}
    
    API->>API: Validate request body
    API->>AuthSvc: Register(request)
    
    AuthSvc->>DB: Check if email exists
    DB-->>AuthSvc: Email availability
    
    alt Email already exists
        AuthSvc-->>API: Error: Email taken
        API-->>Client: 409 Conflict
    else Email available
        AuthSvc->>AuthSvc: Hash password with bcrypt
        AuthSvc->>DB: Insert new user
        DB-->>AuthSvc: User created successfully
        
        AuthSvc->>AuthSvc: Generate JWT access token (15min)
        AuthSvc->>AuthSvc: Generate refresh token (7 days)
        
        AuthSvc-->>API: AuthResponse with tokens
        API->>API: Set refresh token in HTTPOnly cookie
        API-->>Client: 201 Created with user data + access token
    end
```

## Login Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant API as Go Fiber API
    participant AuthSvc as Auth Service
    participant DB as MongoDB
    
    Client->>API: POST /api/auth/login
    Note over Client,API: {email, password}
    
    API->>API: Validate request body
    API->>AuthSvc: Login(email, password)
    
    AuthSvc->>DB: Find user by email
    DB-->>AuthSvc: User document or null
    
    alt User not found
        AuthSvc-->>API: Error: Invalid credentials
        API-->>Client: 401 Unauthorized
    else User found
        AuthSvc->>AuthSvc: Compare password with bcrypt
        
        alt Password incorrect
            AuthSvc-->>API: Error: Invalid credentials
            API-->>Client: 401 Unauthorized
        else Password correct
            AuthSvc->>AuthSvc: Generate JWT access token (15min)
            AuthSvc->>AuthSvc: Generate refresh token (7 days)
            
            AuthSvc-->>API: AuthResponse with tokens
            API->>API: Set refresh token in HTTPOnly cookie
            API-->>Client: 200 OK with user data + access token
        end
    end
```

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant API as Go Fiber API
    participant AuthSvc as Auth Service
    participant DB as MongoDB
    
    Note over Client: Access token expires (15min)
    
    Client->>API: POST /api/auth/refresh
    Note over Client,API: HTTPOnly cookie with refresh token
    
    API->>API: Extract refresh token from cookie
    API->>AuthSvc: RefreshToken(refreshToken)
    
    AuthSvc->>AuthSvc: Validate refresh token signature
    
    alt Refresh token invalid/expired
        AuthSvc-->>API: Error: Invalid token
        API->>API: Clear refresh cookie
        API-->>Client: 401 Unauthorized
        Note over Client: Redirect to login
    else Refresh token valid
        AuthSvc->>AuthSvc: Extract user ID from token
        AuthSvc->>DB: Find user by ID
        DB-->>AuthSvc: User document
        
        alt User not found/inactive
            AuthSvc-->>API: Error: User not found
            API->>API: Clear refresh cookie
            API-->>Client: 401 Unauthorized
        else User valid
            AuthSvc->>AuthSvc: Generate new JWT access token (15min)
            AuthSvc->>AuthSvc: Generate new refresh token (7 days)
            
            AuthSvc-->>API: New tokens
            API->>API: Set new refresh token in cookie
            API-->>Client: 200 OK with new access token
        end
    end
```

## Protected Route Access Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant API as Go Fiber API
    participant AuthMiddleware as Auth Middleware
    participant AuthSvc as Auth Service
    participant Handler as Route Handler
    
    Client->>API: GET /api/forms (protected)
    Note over Client,API: Authorization: Bearer <access_token>
    
    API->>AuthMiddleware: Intercept request
    AuthMiddleware->>AuthMiddleware: Extract Bearer token
    
    alt No token provided
        AuthMiddleware-->>Client: 401 Unauthorized
    else Token provided
        AuthMiddleware->>AuthSvc: ValidateToken(token)
        AuthSvc->>AuthSvc: Verify JWT signature
        AuthSvc->>AuthSvc: Check token expiration
        
        alt Token invalid/expired
            AuthSvc-->>AuthMiddleware: Error: Invalid token
            AuthMiddleware-->>Client: 401 Unauthorized
        else Token valid
            AuthSvc-->>AuthMiddleware: User claims (ID, email, etc.)
            AuthMiddleware->>AuthMiddleware: Set user context
            AuthMiddleware->>Handler: Continue to route handler
            Handler->>Handler: Process request with user context
            Handler-->>Client: 200 OK with response data
        end
    end
```

## Logout Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant API as Go Fiber API
    participant AuthSvc as Auth Service
    
    Client->>API: POST /api/auth/logout
    Note over Client,API: Authorization: Bearer <access_token>
    
    API->>AuthSvc: Logout(userID)
    
    Note over AuthSvc: Token blacklisting could be implemented here<br/>for enhanced security (future enhancement)
    
    AuthSvc->>API: Clear refresh token cookie
    API->>API: Set refresh cookie with past expiry
    API-->>Client: 200 OK
    
    Note over Client: Clear access token from client storage<br/>(localStorage/memory)
```

## Get Current User Flow

```mermaid
sequenceDiagram
    participant Client as Web Client
    participant API as Go Fiber API
    participant AuthMiddleware as Auth Middleware
    participant AuthSvc as Auth Service
    participant DB as MongoDB
    
    Client->>API: GET /api/auth/me
    Note over Client,API: Authorization: Bearer <access_token>
    
    API->>AuthMiddleware: Validate token
    AuthMiddleware->>AuthSvc: ValidateToken(token)
    AuthSvc-->>AuthMiddleware: User claims
    
    AuthMiddleware->>AuthSvc: GetCurrentUser(userID)
    AuthSvc->>DB: Find user by ID
    DB-->>AuthSvc: User document
    
    AuthSvc->>AuthSvc: Convert to safe UserResponse
    AuthSvc-->>API: User data (without password)
    API-->>Client: 200 OK with user profile
```

## Security Considerations

### Token Security
- **Access Token Lifetime**: 15 minutes to minimize exposure window
- **Refresh Token Lifetime**: 7 days with automatic rotation on use
- **HTTPOnly Cookies**: Refresh tokens stored in HTTPOnly cookies to prevent XSS
- **Secure Cookies**: HTTPS-only cookies in production environment

### Password Security
- **Bcrypt Hashing**: Strong password hashing with salt rounds
- **Password Requirements**: Minimum 6 characters (could be enhanced)
- **No Password Storage**: Passwords never returned in API responses

### API Security
- **Bearer Token Authentication**: Standard Authorization header format
- **CORS Configuration**: Restrictive cross-origin policies
- **Request Validation**: Comprehensive input validation on all endpoints

## Error Handling

### Authentication Errors
- **Invalid Credentials**: 401 Unauthorized with generic message
- **Expired Tokens**: 401 Unauthorized with token refresh instruction
- **Missing Authentication**: 401 Unauthorized for protected routes
- **Malformed Requests**: 400 Bad Request with validation errors

### Error Response Format
```json
{
  "success": false,
  "error": "Invalid credentials",
  "message": "Please check your email and password"
}
```

## Client-Side Integration

### Token Storage
```typescript
// Access token in memory or localStorage
const accessToken = localStorage.getItem('accessToken');

// Refresh token in HTTPOnly cookie (handled automatically)
// Client cannot access refresh token directly
```

### API Client Authentication
```typescript
// Automatic token attachment
const apiCall = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
```

### Automatic Token Refresh
```typescript
// Intercept 401 responses and refresh token
const handleTokenRefresh = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include HTTPOnly cookies
    });
    
    if (response.ok) {
      const { accessToken } = await response.json();
      setAccessToken(accessToken);
      return true;
    }
  } catch (error) {
    // Redirect to login page
    window.location.href = '/login';
  }
  return false;
};
```

## Performance Considerations

### JWT Validation
- **In-Memory Validation**: JWT tokens validated without database queries
- **Signature Verification**: RSA/HMAC signature validation for token integrity
- **Claim Extraction**: Efficient user ID extraction from token payload

### Database Queries
- **User Lookup Optimization**: Indexed queries on email and ObjectId
- **Minimal User Data**: Only essential fields returned in authentication responses
- **Connection Pooling**: Efficient database connection management



---

**Related Documentation:**
- [Backend Overview](../../backend/overview.md#authentication--authorization) - Security implementation
- [API Documentation](../../backend/api-rest.md#authentication-endpoints) - API endpoint documentation
- [WebSocket Security](../../backend/websockets.md#security-considerations) - Real-time security
