# Glossary

This glossary defines technical terms, acronyms, and concepts used throughout the Dune Forms documentation and codebase.

## A

**Access Token**  
A short-lived JWT token (15 minutes) used for authenticating API requests. Must be included in the Authorization header as `Bearer <token>`.

**ADR (Architecture Decision Record)**  
A document that captures an important architectural decision made along with its context and consequences. Used to track the rationale behind design choices.

**Analytics Computation**  
The process of calculating statistics and metrics from form responses, including distribution analysis, averages, medians, and trend calculations.

**API (Application Programming Interface)**  
The REST API provided by the Go backend that enables communication between the frontend and backend services.

**App Router**  
Next.js 14's file-system based router that uses the `app/` directory structure for defining routes and layouts.

## B

**bcrypt**  
A password hashing function used to securely hash user passwords before storing them in the database.

**Broadcasting**  
The process of sending real-time updates to multiple WebSocket clients simultaneously, typically used for analytics updates.

## C

**CORS (Cross-Origin Resource Sharing)**  
A mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the first resource was served.

**CSV Export**  
Feature that allows users to download form responses or analytics data as Comma-Separated Values files for external analysis.

**Conditional Logic**  
Form feature that allows fields to be shown or hidden based on responses to previous fields, enabling dynamic form behavior.

## D

**Docker Compose**  
A tool for defining and running multi-container Docker applications, used to orchestrate the development environment with API, frontend, and database services.

**Drag and Drop**  
User interface interaction pattern implemented with @dnd-kit that allows users to move form fields by dragging them from a palette to a canvas.

## E

**Environment Variables**  
Configuration values stored outside the codebase, prefixed with `DUNE_` for the backend and `NEXT_PUBLIC_` for frontend public variables.

## F

**Field Analytics**  
Statistics computed for individual form fields, including response counts, distributions for multiple choice fields, and averages for rating fields.

**Field Type**  
The type of input field in a form. Supported types include `text`, `mcq` (multiple choice), `checkbox`, and `rating`.

**Fiber**  
A Go web framework inspired by Express.js, used for building the high-performance backend API server.

**Form Builder**  
The visual interface that allows users to create forms by dragging fields from a palette onto a canvas and configuring their properties.

**Form Canvas**  
The central area in the form builder where users arrange form fields and preview the form layout.

**Form Status**  
The current state of a form, either `draft` (not publicly accessible) or `published` (accessible via public URL).

**Fx (Uber Fx)**  
A dependency injection framework for Go applications used to manage service dependencies and application lifecycle.

## G

**Goroutine**  
Lightweight threads managed by the Go runtime, used for concurrent operations like WebSocket connection handling.

## H

**HTTPOnly Cookie**  
A cookie that cannot be accessed through client-side scripts, used to securely store refresh tokens and prevent XSS attacks.

**Health Check**  
An endpoint (`/health`) that returns the current status of the API service and its dependencies, used for monitoring service availability.

## I

**Incremental Analytics**  
A method of updating analytics by processing only new responses rather than recomputing all analytics from scratch.

## J

**JWT (JSON Web Token)**  
A compact, URL-safe means of representing claims to be transferred between two parties, used for authentication and authorization.

## M

**MCQ (Multiple Choice Question)**  
A form field type that allows users to select one option from a predefined list of choices.

**Middleware**  
Software components that sit between the HTTP request/response cycle, used for authentication, logging, error handling, etc.

**MongoDB**  
A document-oriented NoSQL database used to store forms, responses, users, and analytics data.

**Mongo Express**  
A web-based MongoDB admin interface accessible at port 8081 for database management during development.

## N

**Next.js**  
A React framework that provides features like server-side rendering, static site generation, and file-based routing.

## O

**ObjectID**  
MongoDB's 12-byte identifier consisting of a timestamp, machine identifier, process ID, and counter, used as primary keys.

**OpenAPI**  
A specification for describing REST APIs, implemented through Swagger annotations in the Go codebase.

## P

**Public Form**  
A published form accessible via a public URL (`/f/[slug]`) that allows anonymous users to submit responses without authentication.

**pprof**  
A Go profiling tool available at `/debug/pprof` for analyzing CPU usage, memory allocation, and goroutine behavior.

## R

**Rating Field**  
A form field type that allows users to provide numeric ratings, typically on a scale (e.g., 1-5 stars).

**Real-time Updates**  
Live data synchronization between the backend and frontend using WebSocket connections, enabling instant analytics updates.

**Refresh Token**  
A long-lived token (7 days) stored in HTTPOnly cookies used to obtain new access tokens without requiring user re-authentication.

**Room**  
A WebSocket concept where clients are grouped by form ID, allowing targeted broadcasting of analytics updates only to relevant dashboard viewers.

## S

**Server-Side Rendering (SSR)**  
Next.js feature that renders pages on the server before sending them to the client, improving initial page load performance and SEO.

**Share Slug**  
A URL-friendly string that uniquely identifies a published form, used in public form URLs like `/f/customer-feedback-2024`.

**Swagger**  
An implementation of OpenAPI specification providing interactive API documentation at `/swagger/index.html`.

## T

**Tailwind CSS**  
A utility-first CSS framework used for styling the frontend application with predefined CSS classes.

**TypeScript**  
A typed superset of JavaScript that compiles to plain JavaScript, used throughout the frontend for type safety and better developer experience.

## V

**Validation Rules**  
Constraints applied to form fields such as minimum/maximum length for text fields or minimum/maximum values for rating fields.

**Viper**  
A Go configuration library that handles environment variables, configuration files, and default values for application configuration.

## W

**WebSocket**  
A communication protocol that provides full-duplex communication channels over a single TCP connection, used for real-time analytics updates.

**WebSocket Manager**  
The backend component responsible for managing WebSocket connections, client registration/deregistration, and message broadcasting.

**writePump/readPump**  
Goroutines that handle outgoing and incoming WebSocket messages respectively, managing the message flow for each connected client.

---

## Acronyms Reference

| Acronym | Full Form | Context |
|---------|-----------|---------|
| **ADR** | Architecture Decision Record | Documentation |
| **API** | Application Programming Interface | Backend |
| **CORS** | Cross-Origin Resource Sharing | Security |
| **CSV** | Comma-Separated Values | Data Export |
| **HTTP** | Hypertext Transfer Protocol | Networking |
| **JWT** | JSON Web Token | Authentication |
| **MCQ** | Multiple Choice Question | Form Fields |
| **REST** | Representational State Transfer | API Design |
| **SSR** | Server-Side Rendering | Frontend |
| **UI** | User Interface | Frontend |
| **UX** | User Experience | Design |
| **WS** | WebSocket | Real-time Communication |

## Data Types Reference

### Form Field Types
- **`text`**: Single-line text input field
- **`mcq`**: Multiple choice with single selection
- **`checkbox`**: Multiple choice with multiple selections allowed
- **`rating`**: Numeric rating input (1-10 scale)

### Form Status Values
- **`draft`**: Form is being edited and not publicly accessible
- **`published`**: Form is live and accessible via public URL

### User Roles (Future Enhancement)
- **`owner`**: Can create, edit, and delete forms
- **`viewer`**: Can view analytics but not edit forms
- **`admin`**: Full system access including user management

## API Response Codes

| Code | Meaning | Usage |
|------|---------|--------|
| **200** | OK | Successful GET requests |
| **201** | Created | Successful POST requests |
| **400** | Bad Request | Invalid request data |
| **401** | Unauthorized | Authentication required |
| **403** | Forbidden | Access denied |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists |
| **500** | Internal Server Error | Server-side error |

## Configuration Prefixes

| Prefix | Usage | Example |
|--------|-------|---------|
| **`DUNE_`** | Backend environment variables | `DUNE_DATABASE_URI` |
| **`NEXT_PUBLIC_`** | Frontend public variables | `NEXT_PUBLIC_API_URL` |

## Database Collections

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| **`forms`** | Form definitions and metadata | `title`, `fields`, `status`, `shareSlug` |
| **`responses`** | Form submission responses | `formId`, `answers`, `submittedAt` |
| **`users`** | User accounts and authentication | `email`, `password`, `name` |
| **`analytics`** | Computed analytics data | `formId`, `totalResponses`, `byField` |

## WebSocket Message Types

| Type | Purpose | Data Structure |
|------|---------|----------------|
| **`analytics:update`** | Analytics data changed | `{totalResponses, byField, updatedAt}` |
| **`connection:status`** | Connection established/changed | `{status, clientId, activeConnections}` |
| **`metrics:update`** | Real-time metrics update | `{responsesToday, responsesThisHour}` |
| **`error`** | Error occurred | `{code, message, timestamp}` |

---

**Related Documentation:**
- [Architecture Overview](architecture/overview.md) - System design concepts
- [API Documentation](backend/api-rest.md) - Complete API reference
- [Data Model](architecture/data-model.md) - Database structure details
- [Frontend Types](frontend/overview.md#typescript-integration) - TypeScript definitions
