# Form Submission & Real-time Analytics Flow

## Overview

This document describes the complete flow from form submission to real-time analytics updates, showcasing how Dune Form Analytics processes responses and broadcasts live updates to connected dashboards via WebSocket.

## Form Submission Flow

```mermaid
sequenceDiagram
    participant Submitter as Form Submitter
    participant PublicForm as Public Form View
    participant API as Go Fiber API
    participant ResponseSvc as Response Service
    participant AnalyticsSvc as Analytics Service
    participant WSManager as WebSocket Manager
    participant Dashboard as Analytics Dashboard
    participant DB as MongoDB
    
    Submitter->>PublicForm: Fill out form
    Submitter->>PublicForm: Click Submit
    
    PublicForm->>PublicForm: Client-side validation
    
    alt Validation fails
        PublicForm-->>Submitter: Show validation errors
    else Validation passes
        PublicForm->>API: POST /api/forms/:id/submit
        Note over PublicForm,API: {answers: [{fieldId, value}], meta: {ip, userAgent, referrer}}
        
        API->>API: Validate request structure
        API->>ResponseSvc: SubmitResponse(formId, request)
        
        ResponseSvc->>DB: Find form by ID
        DB-->>ResponseSvc: Form document
        
        alt Form not found or not published
            ResponseSvc-->>API: Error: Form not accessible
            API-->>PublicForm: 404 Not Found
            PublicForm-->>Submitter: Error message
        else Form valid
            ResponseSvc->>ResponseSvc: Validate answers against form schema
            
            alt Answer validation fails
                ResponseSvc-->>API: Validation errors
                API-->>PublicForm: 400 Bad Request with field errors
                PublicForm-->>Submitter: Show field-specific errors
            else Answers valid
                ResponseSvc->>DB: Insert response document
                DB-->>ResponseSvc: Response ID
                
                ResponseSvc->>AnalyticsSvc: TriggerAnalyticsUpdate(formId, response)
                Note over ResponseSvc,AnalyticsSvc: Async analytics computation
                
                ResponseSvc-->>API: Success response
                API-->>PublicForm: 201 Created {success: true, id: responseId}
                PublicForm-->>Submitter: Thank you message
            end
        end
    end
```

## Real-time Analytics Computation

```mermaid
sequenceDiagram
    participant ResponseSvc as Response Service
    participant AnalyticsSvc as Analytics Service
    participant DB as MongoDB
    participant WSManager as WebSocket Manager
    participant Dashboard as Connected Dashboards
    
    ResponseSvc->>AnalyticsSvc: TriggerAnalyticsUpdate(formId, response)
    
    AnalyticsSvc->>DB: Find current analytics for form
    DB-->>AnalyticsSvc: Current analytics document
    
    alt Analytics document not found
        AnalyticsSvc->>AnalyticsSvc: InitializeAnalytics(formId, formFields)
        AnalyticsSvc->>DB: Insert new analytics document
    end
    
    AnalyticsSvc->>AnalyticsSvc: Process new response
    Note over AnalyticsSvc: Update field-specific analytics:<br/>- Increment counts<br/>- Update distributions<br/>- Recalculate averages<br/>- Add trend points
    
    par Field-specific updates
        AnalyticsSvc->>AnalyticsSvc: Update text field analytics
        Note over AnalyticsSvc: Extract keywords, update top terms
    and
        AnalyticsSvc->>AnalyticsSvc: Update MCQ/Checkbox analytics
        Note over AnalyticsSvc: Update option distribution counts
    and
        AnalyticsSvc->>AnalyticsSvc: Update rating analytics
        Note over AnalyticsSvc: Recalculate average, median, trends
    end
    
    AnalyticsSvc->>AnalyticsSvc: Update form-level metrics
    Note over AnalyticsSvc: Total responses, completion rate,<br/>average completion time
    
    AnalyticsSvc->>DB: Update analytics document
    DB-->>AnalyticsSvc: Update confirmation
    
    AnalyticsSvc->>AnalyticsSvc: Prepare real-time update payload
    AnalyticsSvc->>WSManager: BroadcastAnalyticsUpdate(formId, analytics)
    
    WSManager->>WSManager: Get all connections for form room
    
    par Broadcast to all connected clients
        WSManager->>Dashboard: Analytics update event
        Note over Dashboard: Update charts and metrics<br/>without page refresh
    and
        WSManager->>Dashboard: Analytics update event
        Note over Dashboard: Live counter updates
    end
    
    Dashboard->>Dashboard: Update UI components
    Note over Dashboard: Smooth animations for<br/>counter increments and chart updates
```

## WebSocket Connection Management

```mermaid
sequenceDiagram
    participant Dashboard as Analytics Dashboard
    participant WSManager as WebSocket Manager
    participant FormSvc as Form Service
    participant DB as MongoDB
    
    Dashboard->>WSManager: Connect to WebSocket
    Note over Dashboard,WSManager: GET /ws/forms/:formId<br/>Upgrade to WebSocket connection
    
    WSManager->>WSManager: Validate connection request
    WSManager->>FormSvc: ValidateFormAccess(formId, userContext)
    
    FormSvc->>DB: Verify form exists and user has access
    DB-->>FormSvc: Form access validation
    
    alt User not authorized for form
        FormSvc-->>WSManager: Access denied
        WSManager-->>Dashboard: 403 Forbidden
        Dashboard->>Dashboard: Show error message
    else Access granted
        FormSvc-->>WSManager: Access granted
        WSManager->>WSManager: Add connection to form room
        WSManager->>WSManager: Set up connection event handlers
        
        WSManager-->>Dashboard: Connection established
        Note over Dashboard: WebSocket onopen event fired
        
        Dashboard->>WSManager: Request initial analytics
        WSManager->>AnalyticsSvc: GetCurrentAnalytics(formId)
        AnalyticsSvc->>DB: Fetch latest analytics
        DB-->>AnalyticsSvc: Current analytics data
        AnalyticsSvc-->>WSManager: Analytics payload
        WSManager-->>Dashboard: Initial analytics data
        
        Dashboard->>Dashboard: Render initial charts and metrics
        
        Note over Dashboard,WSManager: Connection maintained for real-time updates
        
        loop Real-time updates
            Note over WSManager: New response triggers update
            WSManager->>Dashboard: Analytics update event
            Dashboard->>Dashboard: Update UI without refresh
        end
        
        alt Dashboard closed or navigated away
            Dashboard->>WSManager: Close connection
            WSManager->>WSManager: Remove from form room
            WSManager->>WSManager: Cleanup connection resources
        end
    end
```

## Analytics Data Processing

```mermaid
sequenceDiagram
    participant AnalyticsSvc as Analytics Service
    participant DB as MongoDB
    
    Note over AnalyticsSvc,DB: Processing a new form response
    
    AnalyticsSvc->>AnalyticsSvc: Extract field answers from response
    
    loop For each field answer
        AnalyticsSvc->>AnalyticsSvc: Determine field type
        
        alt Text field
            AnalyticsSvc->>AnalyticsSvc: Extract keywords using NLP
            AnalyticsSvc->>AnalyticsSvc: Update keyword frequency map
            AnalyticsSvc->>AnalyticsSvc: Calculate sentiment (future enhancement)
        else MCQ field
            AnalyticsSvc->>AnalyticsSvc: Increment option distribution count
            AnalyticsSvc->>AnalyticsSvc: Update percentage calculations
        else Checkbox field
            AnalyticsSvc->>AnalyticsSvc: Increment each selected option count
            AnalyticsSvc->>AnalyticsSvc: Update co-occurrence matrix (future)
        else Rating field
            AnalyticsSvc->>AnalyticsSvc: Add to running average calculation
            AnalyticsSvc->>AnalyticsSvc: Update median calculation
            AnalyticsSvc->>AnalyticsSvc: Add trend point with timestamp
        end
        
        AnalyticsSvc->>AnalyticsSvc: Increment field response count
    end
    
    AnalyticsSvc->>AnalyticsSvc: Update form-level metrics
    Note over AnalyticsSvc: - Total response count<br/>- Completion rate<br/>- Average completion time
    
    AnalyticsSvc->>DB: Atomic update of analytics document
    Note over AnalyticsSvc,DB: Using MongoDB $inc, $set, $push operators<br/>for efficient partial updates
    
    DB-->>AnalyticsSvc: Update acknowledged
```

## Error Handling & Resilience

```mermaid
sequenceDiagram
    participant PublicForm as Public Form View
    participant API as Go Fiber API
    participant ResponseSvc as Response Service
    participant AnalyticsSvc as Analytics Service
    participant WSManager as WebSocket Manager
    participant Dashboard as Analytics Dashboard
    
    PublicForm->>API: Submit form response
    API->>ResponseSvc: Process submission
    
    alt Database connection error
        ResponseSvc->>DB: Insert response
        DB-->>ResponseSvc: Connection timeout
        ResponseSvc->>ResponseSvc: Log error with context
        ResponseSvc-->>API: 503 Service Unavailable
        API-->>PublicForm: Error response
        PublicForm->>PublicForm: Show retry option
    else Analytics computation error
        ResponseSvc->>DB: Insert response (succeeds)
        ResponseSvc->>AnalyticsSvc: Trigger analytics update
        AnalyticsSvc->>AnalyticsSvc: Computation fails
        AnalyticsSvc->>AnalyticsSvc: Log error, mark for retry
        Note over AnalyticsSvc: Response saved but analytics delayed
        ResponseSvc-->>API: Success (response saved)
        API-->>PublicForm: Success response
        
        Note over AnalyticsSvc: Background job will retry<br/>analytics computation
    else WebSocket broadcast error
        AnalyticsSvc->>WSManager: Broadcast update
        WSManager->>WSManager: Connection error for some clients
        WSManager->>WSManager: Remove failed connections
        WSManager->>WSManager: Continue broadcast to healthy connections
        
        Dashboard->>Dashboard: Connection lost, attempt reconnect
        Dashboard->>WSManager: Reconnect with exponential backoff
    end
```

## Performance Optimization

### Efficient Analytics Updates
- **Incremental Computation**: Only recalculate changed metrics
- **Atomic Operations**: MongoDB atomic updates prevent race conditions
- **Background Processing**: Heavy computations run asynchronously
- **Caching Strategy**: Frequently accessed analytics cached in memory

### WebSocket Optimization
- **Room-based Broadcasting**: Only notify relevant dashboard connections
- **Message Batching**: Combine multiple updates into single broadcast
- **Connection Pooling**: Efficient management of WebSocket connections
- **Automatic Reconnection**: Client-side reconnection with backoff

### Database Performance
- **Compound Indexes**: Optimized queries for form-response relationships
- **Aggregation Pipelines**: Efficient bulk analytics computation
- **Connection Pooling**: Optimal database connection management
- **Write Batching**: Batch multiple analytics updates when possible

## Real-time Update Types

### Analytics Update Events
```json
{
  "type": "analytics:update",
  "formId": "60f7b1b9e1234567890abcde",
  "payload": {
    "totalResponses": 156,
    "byField": {
      "field_1": {
        "count": 156,
        "distribution": {"opt_1": 89, "opt_2": 67}
      }
    },
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

### Connection Status Events
```json
{
  "type": "connection:status",
  "formId": "60f7b1b9e1234567890abcde",
  "payload": {
    "activeConnections": 3,
    "connectedAt": "2024-01-15T14:30:00Z"
  }
}
```

### Error Events
```json
{
  "type": "error",
  "payload": {
    "message": "Connection lost, attempting to reconnect...",
    "code": "CONNECTION_ERROR",
    "retry": true
  }
}
```

## Integration with Frontend

### Dashboard Component Updates
```typescript
// Real-time analytics updates
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8080/ws/forms/${formId}`);
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    
    switch (update.type) {
      case 'analytics:update':
        setAnalytics(prev => ({
          ...prev,
          ...update.payload
        }));
        break;
        
      case 'connection:status':
        setConnectionStatus(update.payload);
        break;
    }
  };
  
  return () => ws.close();
}, [formId]);
```

### Form Submission Handling
```typescript
const handleSubmit = async (formData: FormSubmission) => {
  try {
    setSubmitting(true);
    
    const response = await fetch(`/api/forms/${formId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (response.ok) {
      setSubmitSuccess(true);
      // Analytics will update automatically via WebSocket
    } else {
      const errors = await response.json();
      setFormErrors(errors);
    }
  } finally {
    setSubmitting(false);
  }
};
```

---

**Related Documentation:**
- [WebSocket Implementation](../../backend/websockets.md) - Technical WebSocket details
- [Backend Overview](../../backend/overview.md#service-layer-architecture) - Service implementation details
- [API Documentation](../../backend/api-rest.md#analytics-endpoints) - Analytics API endpoints
- [Frontend Overview](../../frontend/overview.md#analytics-dashboard) - Dashboard architecture
