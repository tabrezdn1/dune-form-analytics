# REST API Documentation

## Overview

The Dune Form Analytics REST API provides comprehensive endpoints for form management, response submission, analytics computation, and user authentication. All endpoints return JSON responses and follow RESTful conventions.

**Base URL**: `http://localhost:8080/api` (development)  
**Authentication**: JWT Bearer tokens for protected endpoints  
**Content Type**: `application/json` for all requests and responses  

## Authentication

### JWT Token System
- **Access Tokens**: Short-lived (15 minutes) for API authentication
- **Refresh Tokens**: Long-lived (7 days) stored in HTTPOnly cookies
- **Authorization Header**: `Authorization: Bearer <access_token>`

### Token Management Flow
1. Login/Register to receive access + refresh tokens
2. Include access token in Authorization header for protected endpoints
3. Use refresh endpoint when access token expires
4. Logout to invalidate tokens

---

## Authentication Endpoints

### Register User
**POST** `/auth/signup`

Creates a new user account with email verification.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60f7b1b9e1234567890abcde",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- Email: Valid format and unique
- Password: Minimum 6 characters
- Name: 2-50 characters

### Login User
**POST** `/auth/login`

Authenticates user and returns JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60f7b1b9e1234567890abcde",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Refresh Token
**POST** `/auth/refresh`

Generates new access token using refresh token from HTTPOnly cookie.

**Request**: No body required (refresh token in cookie)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60f7b1b9e1234567890abcde",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

### Logout User
**POST** `/auth/logout`  
🔒 **Requires Authentication**

Invalidates refresh token and clears cookie.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Get Current User
**GET** `/auth/me`  
🔒 **Requires Authentication**

Returns current user profile information.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "60f7b1b9e1234567890abcde",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Form Management Endpoints

### Create Form
**POST** `/forms`  
🔒 **Requires Authentication**

Creates a new form with fields and validation rules.

**Request Body:**
```json
{
  "title": "Customer Feedback Form",
  "description": "Help us improve our service",
  "fields": [
    {
      "id": "field_1",
      "type": "text",
      "label": "Full Name",
      "required": true,
      "validation": {
        "minLen": 2,
        "maxLen": 100
      }
    },
    {
      "id": "field_2",
      "type": "mcq",
      "label": "How satisfied are you?",
      "required": true,
      "options": [
        {"id": "opt_1", "label": "Very Satisfied"},
        {"id": "opt_2", "label": "Satisfied"},
        {"id": "opt_3", "label": "Neutral"},
        {"id": "opt_4", "label": "Dissatisfied"}
      ]
    },
    {
      "id": "field_3",
      "type": "rating",
      "label": "Rate our service (1-5)",
      "required": false,
      "validation": {
        "min": 1,
        "max": 5
      }
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "60f7b1b9e1234567890abcde",
    "ownerId": "60f7b1b9e1234567890abcdf",
    "title": "Customer Feedback Form",
    "description": "Help us improve our service",
    "status": "draft",
    "shareSlug": "customer-feedback-form-2024",
    "fields": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Form
**GET** `/forms/:id`  
🔒 **Requires Authentication**

Retrieves a form by ID with ownership validation.

**Path Parameters:**
- `id` (string): Form ObjectId

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "60f7b1b9e1234567890abcde",
    "title": "Customer Feedback Form",
    "status": "published",
    "shareSlug": "customer-feedback-form-2024",
    "fields": [...],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update Form
**PATCH** `/forms/:id`  
🔒 **Requires Authentication**

Updates form fields, metadata, or status.

**Request Body (Partial Update):**
```json
{
  "title": "Updated Customer Feedback Form",
  "fields": [
    {
      "id": "field_1",
      "type": "text",
      "label": "Your Full Name",
      "required": true,
      "validation": {
        "minLen": 2,
        "maxLen": 150
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "60f7b1b9e1234567890abcde",
    "title": "Updated Customer Feedback Form",
    "fields": [...],
    "updatedAt": "2024-01-15T14:45:00Z"
  }
}
```

### Delete Form
**DELETE** `/forms/:id`  
🔒 **Requires Authentication**

Permanently deletes a form and all associated responses.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Form deleted successfully"
}
```

### List User Forms
**GET** `/forms`  
🔒 **Requires Authentication**

Retrieves paginated list of user's forms.

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 10): Items per page
- `status` (string, optional): Filter by status ('draft', 'published')

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b1b9e1234567890abcde",
      "title": "Customer Feedback Form",
      "status": "published",
      "shareSlug": "customer-feedback-form-2024",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Publish Form
**POST** `/forms/:id/publish`  
🔒 **Requires Authentication**

Makes form publicly accessible for submissions.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "60f7b1b9e1234567890abcde",
    "status": "published",
    "shareSlug": "customer-feedback-form-2024",
    "publicUrl": "/f/customer-feedback-form-2024"
  }
}
```

### Unpublish Form
**POST** `/forms/:id/unpublish`  
🔒 **Requires Authentication**

Removes form from public access.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "60f7b1b9e1234567890abcde",
    "status": "draft"
  }
}
```

### Get Public Form
**GET** `/forms/slug/:slug`

Retrieves published form for public submission (no authentication required).

**Path Parameters:**
- `slug` (string): Form share slug

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "60f7b1b9e1234567890abcde",
    "title": "Customer Feedback Form",
    "description": "Help us improve our service",
    "fields": [...]
  }
}
```

---

## Response Submission Endpoints

### Submit Form Response
**POST** `/forms/:id/submit`

Submits response to published form (anonymous, no authentication required).

**Request Body:**
```json
{
  "answers": [
    {
      "fieldId": "field_1",
      "value": "John Smith"
    },
    {
      "fieldId": "field_2", 
      "value": "opt_1"
    },
    {
      "fieldId": "field_3",
      "value": 4
    }
  ],
  "meta": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "referrer": "https://example.com"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "id": "60f7b1b9e1234567890abcef",
  "message": "Response submitted successfully"
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "field_1",
      "message": "Full Name is required"
    },
    {
      "field": "field_3", 
      "message": "Rating must be between 1 and 5"
    }
  ]
}
```

### Get Form Responses
**GET** `/forms/:id/responses`  
🔒 **Requires Authentication**

Retrieves paginated responses for a form.

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 20): Items per page
- `startDate` (ISO date, optional): Filter from date
- `endDate` (ISO date, optional): Filter to date

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "60f7b1b9e1234567890abcef",
      "formId": "60f7b1b9e1234567890abcde",
      "answers": [
        {
          "fieldId": "field_1",
          "value": "John Smith"
        },
        {
          "fieldId": "field_2",
          "value": "opt_1"
        }
      ],
      "submittedAt": "2024-01-15T14:30:00Z",
      "meta": {
        "ip": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Export Responses CSV
**GET** `/forms/:id/export.csv`  
🔒 **Requires Authentication**

Downloads responses as CSV file.

**Query Parameters:**
- `startDate` (ISO date, optional): Filter from date
- `endDate` (ISO date, optional): Filter to date

**Response (200 OK):**
- **Content-Type**: `text/csv`
- **Content-Disposition**: `attachment; filename="form_responses_2024-01-15.csv"`

**CSV Format:**
```csv
Response ID,Submitted At,Full Name,Satisfaction,Service Rating
60f7b1b9e1234567890abcef,2024-01-15T14:30:00Z,John Smith,Very Satisfied,4
60f7b1b9e1234567890abcf0,2024-01-15T15:15:00Z,Jane Doe,Satisfied,5
```

---

## Analytics Endpoints

### Get Form Analytics
**GET** `/forms/:id/analytics`  
🔒 **Requires Authentication**

Retrieves comprehensive analytics for a form.

**Query Parameters:**
- `startDate` (ISO date, optional): Filter from date
- `endDate` (ISO date, optional): Filter to date
- `fields` (string[], optional): Specific field IDs to analyze

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "formId": "60f7b1b9e1234567890abcde",
    "totalResponses": 156,
    "completionRate": 0.89,
    "averageTimeToComplete": 180,
    "byField": {
      "field_1": {
        "count": 156,
        "topKeywords": [
          {"keyword": "excellent", "count": 23},
          {"keyword": "good", "count": 18}
        ]
      },
      "field_2": {
        "count": 156,
        "distribution": {
          "opt_1": 89,
          "opt_2": 45,
          "opt_3": 15,
          "opt_4": 7
        }
      },
      "field_3": {
        "count": 142,
        "average": 3.8,
        "median": 4.0,
        "trend": [
          {
            "date": "2024-01-01T00:00:00Z",
            "value": 3.5,
            "count": 25
          },
          {
            "date": "2024-01-02T00:00:00Z",
            "value": 3.7,
            "count": 31
          }
        ]
      }
    },
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

### Compute Analytics
**POST** `/forms/:id/analytics/compute`  
🔒 **Requires Authentication**

Triggers full analytics recomputation for a form.

**Request Body (Optional):**
```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "fields": ["field_1", "field_2"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "formId": "60f7b1b9e1234567890abcde",
    "status": "completed",
    "computedAt": "2024-01-15T14:30:00Z",
    "responsesCounted": 156
  }
}
```

### Get Real-time Metrics
**GET** `/forms/:id/metrics`  
🔒 **Requires Authentication**

Retrieves real-time form metrics.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "activeUsers": 3,
    "responsesToday": 12,
    "responsesThisHour": 3,
    "lastUpdate": "2024-01-15T14:30:00Z"
  }
}
```

### Get Analytics Summary
**GET** `/analytics/summary`  
🔒 **Requires Authentication**

Retrieves analytics summary for all user forms.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "formId": "60f7b1b9e1234567890abcde",
      "formTitle": "Customer Feedback Form",
      "totalResponses": 156,
      "completionRate": 0.89,
      "lastResponse": "2024-01-15T14:25:00Z"
    },
    {
      "formId": "60f7b1b9e1234567890abcdf",
      "formTitle": "Product Survey",
      "totalResponses": 89,
      "completionRate": 0.94,
      "lastResponse": "2024-01-15T13:45:00Z"
    }
  ]
}
```

### Get Trend Analytics
**GET** `/forms/:id/trends`  
🔒 **Requires Authentication**

Retrieves trend analytics over time periods.

**Query Parameters:**
- `period` (string, required): 'day', 'week', 'month', 'year'

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "formId": "60f7b1b9e1234567890abcde",
    "period": "week",
    "startDate": "2024-01-08T00:00:00Z",
    "endDate": "2024-01-15T00:00:00Z",
    "trendData": [
      {
        "date": "2024-01-08T00:00:00Z",
        "value": 15,
        "count": 15
      },
      {
        "date": "2024-01-09T00:00:00Z",
        "value": 23,
        "count": 23
      }
    ],
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

### Export Analytics CSV
**GET** `/forms/:id/analytics.csv`  
🔒 **Requires Authentication**

Downloads analytics data as CSV file.

**Response (200 OK):**
- **Content-Type**: `text/csv`
- **Content-Disposition**: `attachment; filename="form_analytics_2024-01-15.csv"`

---

## Field Types

### Text Field
```json
{
  "id": "field_1",
  "type": "text",
  "label": "Full Name",
  "required": true,
  "validation": {
    "minLen": 2,
    "maxLen": 100,
    "pattern": "^[A-Za-z\\s]+$"
  }
}
```

### Multiple Choice (MCQ)
```json
{
  "id": "field_2",
  "type": "mcq",
  "label": "Preferred Contact Method",
  "required": true,
  "options": [
    {"id": "email", "label": "Email"},
    {"id": "phone", "label": "Phone"},
    {"id": "sms", "label": "SMS"}
  ]
}
```

### Checkbox (Multiple Selection)
```json
{
  "id": "field_3",
  "type": "checkbox",
  "label": "Services Used",
  "required": false,
  "options": [
    {"id": "web", "label": "Web Development"},
    {"id": "mobile", "label": "Mobile Apps"},
    {"id": "design", "label": "UI/UX Design"}
  ]
}
```

### Rating Field
```json
{
  "id": "field_4",
  "type": "rating",
  "label": "Rate our service (1-5)",
  "required": true,
  "validation": {
    "min": 1,
    "max": 5
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional error details"
}
```

### HTTP Status Codes
- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required or invalid
- **403 Forbidden**: Access denied
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (email taken)
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server error

### Common Error Scenarios

**Authentication Errors:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**Validation Errors:**
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password", 
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

**Resource Not Found:**
```json
{
  "success": false,
  "error": "Form not found",
  "code": "FORM_NOT_FOUND"
}
```

## Rate Limiting (Future Enhancement)

**Headers:**
- `X-RateLimit-Limit`: Requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Window reset time

**Rate Limit Exceeded (429):**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

## API Versioning (Future Enhancement)

**URL Versioning:**
- `/api/v1/forms` - Version 1 endpoints
- `/api/v2/forms` - Version 2 endpoints

**Header Versioning:**
```
Accept: application/json; version=1
```

---

**Testing the API:**
- **Interactive Documentation**: http://localhost:8082/swagger/index.html
- **Health Check**: http://localhost:8080/health
- **Postman Collection**: Available in repository `/docs/postman/`

**Related Documentation:**
- [WebSocket API](websockets.md) - Real-time communication protocols
- [Backend Overview](overview.md#security-implementation) - Security details
- [Data Model](../architecture/data-model.md) - Database schema and relationships
