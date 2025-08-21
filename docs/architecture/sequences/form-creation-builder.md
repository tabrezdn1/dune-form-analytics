# Form Creation & Builder Flow

## Overview

This document describes the complete form creation workflow in Dune Form Analytics, from initial form creation to field management and form publishing using the drag-and-drop builder interface.

## Form Creation Flow

```mermaid
sequenceDiagram
    participant User as Authenticated User
    participant Builder as Form Builder Page
    participant API as Go Fiber API
    participant FormSvc as Form Service
    participant AnalyticsSvc as Analytics Service
    participant DB as MongoDB
    
    User->>Builder: Navigate to /builder
    Builder->>Builder: Initialize empty form state
    Builder-->>User: Show form builder interface
    
    User->>Builder: Enter form title and description
    User->>Builder: Start adding fields
    
    loop Add fields to form
        User->>Builder: Drag field from palette
        Builder->>Builder: Generate unique field ID
        Builder->>Builder: Add field to local state
        Builder-->>User: Show field in canvas
        
        User->>Builder: Configure field properties
        Note over User,Builder: Label, validation, options, etc.
        
        Builder->>Builder: Update field in local state
        Builder-->>User: Show updated field
    end
    
    User->>Builder: Click "Save Form"
    Builder->>Builder: Validate form structure
    
    alt Form validation fails
        Builder-->>User: Show validation errors
    else Form valid
        Builder->>API: POST /api/forms
        Note over Builder,API: {title, description, fields}<br/>Authorization: Bearer token
        
        API->>API: Authenticate request
        API->>API: Validate request payload
        API->>FormSvc: CreateForm(userID, request)
        
        FormSvc->>FormSvc: Generate unique shareSlug
        FormSvc->>FormSvc: Set form status to "draft"
        FormSvc->>FormSvc: Set timestamps
        
        FormSvc->>DB: Insert form document
        DB-->>FormSvc: Form created with ID
        
        FormSvc->>AnalyticsSvc: InitializeAnalytics(formID, fields)
        AnalyticsSvc->>AnalyticsSvc: Create analytics structure
        AnalyticsSvc->>DB: Insert analytics document
        DB-->>AnalyticsSvc: Analytics initialized
        
        FormSvc-->>API: Form created successfully
        API-->>Builder: 201 Created {form data}
        
        Builder->>Builder: Update local state with form ID
        Builder-->>User: Success notification
        Builder->>Builder: Enable additional actions (publish, preview)
    end
```

## Form Field Management

```mermaid
sequenceDiagram
    participant User as Authenticated User
    participant Builder as Form Builder
    participant FieldPalette as Field Palette
    participant FormCanvas as Form Canvas
    participant FieldInspector as Field Inspector
    participant API as Go Fiber API
    
    Note over User,API: User working with existing form
    
    User->>Builder: Edit existing form
    Builder->>API: GET /api/forms/:id
    API-->>Builder: Form data with fields
    Builder->>FormCanvas: Render existing fields
    
    par Add new field
        User->>FieldPalette: Drag "Text Input" field
        FieldPalette->>FormCanvas: Drop field at position
        FormCanvas->>FormCanvas: Generate field ID and defaults
        FormCanvas->>FieldInspector: Select new field for editing
        FieldInspector-->>User: Show field properties
        
        User->>FieldInspector: Configure field properties
        Note over User,FieldInspector: Label: "Full Name"<br/>Required: true<br/>Validation: minLen=2, maxLen=100
        
        FieldInspector->>FormCanvas: Update field in canvas
        FormCanvas->>Builder: Update form state
    and Reorder fields
        User->>FormCanvas: Drag existing field to new position
        FormCanvas->>FormCanvas: Update field order in state
        FormCanvas-->>User: Show new field order
    and Edit existing field
        User->>FormCanvas: Click on existing field
        FormCanvas->>FieldInspector: Load field properties
        FieldInspector-->>User: Show current field settings
        
        User->>FieldInspector: Modify field properties
        FieldInspector->>FormCanvas: Update field display
        FormCanvas->>Builder: Update form state
    and Delete field
        User->>FormCanvas: Select field and press delete
        FormCanvas->>FormCanvas: Remove field from state
        FormCanvas-->>User: Field removed from canvas
    end
    
    User->>Builder: Click "Save Changes"
    Builder->>API: PATCH /api/forms/:id
    Note over Builder,API: {fields: updatedFields}<br/>Only changed data sent
    
    API->>FormSvc: UpdateForm(formID, updates)
    FormSvc->>DB: Update form document
    FormSvc->>AnalyticsSvc: UpdateAnalyticsStructure(formID, fields)
    
    Note over AnalyticsSvc: Handle field additions/deletions<br/>in analytics structure
    
    FormSvc-->>API: Update successful
    API-->>Builder: 200 OK {updated form}
    Builder-->>User: Changes saved notification
```

## Field Configuration Flow

```mermaid
sequenceDiagram
    participant User as User
    participant FieldInspector as Field Inspector
    participant ValidationEngine as Validation Engine
    participant PreviewPane as Live Preview
    
    User->>FieldInspector: Select field type "Rating"
    FieldInspector->>FieldInspector: Load field type defaults
    FieldInspector-->>User: Show rating field properties
    
    User->>FieldInspector: Set label: "How satisfied are you?"
    User->>FieldInspector: Set required: true
    User->>FieldInspector: Set validation: min=1, max=5
    
    FieldInspector->>ValidationEngine: Validate field configuration
    
    alt Configuration invalid
        ValidationEngine-->>FieldInspector: Validation errors
        FieldInspector-->>User: Show errors (e.g., max > 10)
    else Configuration valid
        ValidationEngine-->>FieldInspector: Configuration OK
        FieldInspector->>PreviewPane: Update field preview
        PreviewPane-->>User: Show live field preview
        
        User->>FieldInspector: Add conditional logic
        Note over User,FieldInspector: Show field only if<br/>previous field equals "Yes"
        
        FieldInspector->>ValidationEngine: Validate conditional logic
        ValidationEngine->>ValidationEngine: Check field references exist
        ValidationEngine-->>FieldInspector: Logic validation result
        
        FieldInspector->>PreviewPane: Update preview with conditions
        PreviewPane-->>User: Show conditional behavior
    end
    
    User->>FieldInspector: Apply changes
    FieldInspector->>FieldInspector: Commit field configuration
    FieldInspector-->>User: Field updated successfully
```

## Form Publishing Flow

```mermaid
sequenceDiagram
    participant User as Form Owner
    participant Builder as Form Builder
    participant API as Go Fiber API
    participant FormSvc as Form Service
    participant DB as MongoDB
    participant CDN as Content Distribution
    
    User->>Builder: Click "Publish Form"
    Builder->>Builder: Validate form is ready for publishing
    
    alt Form not ready (no fields, validation errors)
        Builder-->>User: Show publishing requirements
        Note over User: - At least one field required<br/>- All fields must be valid<br/>- Form must have title
    else Form ready
        Builder->>Builder: Show publish confirmation dialog
        Builder-->>User: Confirm publishing with public URL preview
        
        User->>Builder: Confirm publish
        Builder->>API: POST /api/forms/:id/publish
        
        API->>FormSvc: PublishForm(formID, userID)
        FormSvc->>DB: Find form and verify ownership
        DB-->>FormSvc: Form document
        
        FormSvc->>FormSvc: Validate form is publishable
        FormSvc->>FormSvc: Update form status to "published"
        FormSvc->>FormSvc: Set publishedAt timestamp
        
        FormSvc->>DB: Update form document
        DB-->>FormSvc: Update confirmed
        
        FormSvc->>CDN: Cache form for public access (future)
        Note over FormSvc,CDN: Preload form at /f/{shareSlug}
        
        FormSvc-->>API: Form published successfully
        API-->>Builder: 200 OK {published form data}
        
        Builder->>Builder: Update UI to show published state
        Builder-->>User: Show success with public URL
        Note over User: Form URL: /f/customer-feedback-2024<br/>QR code and sharing options
        
        Builder->>Builder: Enable additional options
        Note over Builder: - Unpublish option<br/>- Analytics access<br/>- Response monitoring
    end
```

## Form Preview & Testing

```mermaid
sequenceDiagram
    participant User as Form Creator
    participant Builder as Form Builder
    participant PreviewModal as Preview Modal
    participant FormRenderer as Form Renderer
    participant ValidationEngine as Validation
    
    User->>Builder: Click "Preview Form"
    Builder->>PreviewModal: Open preview modal
    PreviewModal->>FormRenderer: Render form with current fields
    FormRenderer-->>PreviewModal: Show form as end-users see it
    PreviewModal-->>User: Display form preview
    
    User->>PreviewModal: Test form by filling fields
    PreviewModal->>FormRenderer: Update field values
    FormRenderer->>ValidationEngine: Validate input in real-time
    
    alt Field validation fails
        ValidationEngine-->>FormRenderer: Show validation errors
        FormRenderer-->>User: Display error messages
    else Fields valid
        ValidationEngine-->>FormRenderer: All fields valid
        FormRenderer->>FormRenderer: Update form state
        FormRenderer-->>User: Show valid input state
    end
    
    User->>PreviewModal: Test conditional logic
    Note over User,PreviewModal: Change field that triggers<br/>conditional visibility
    
    FormRenderer->>FormRenderer: Evaluate visibility conditions
    FormRenderer->>FormRenderer: Show/hide dependent fields
    FormRenderer-->>User: Demonstrate dynamic behavior
    
    User->>PreviewModal: Test form submission
    PreviewModal->>PreviewModal: Simulate submission process
    PreviewModal-->>User: Show success/error states
    
    User->>PreviewModal: Close preview
    PreviewModal->>Builder: Return to builder
    Builder-->>User: Back to editing mode
```

## Real-time Collaboration (Future Enhancement)

```mermaid
sequenceDiagram
    participant User1 as User 1
    participant User2 as User 2
    participant Builder1 as Builder Instance 1
    participant Builder2 as Builder Instance 2
    participant WSManager as WebSocket Manager
    participant FormSvc as Form Service
    
    Note over User1,FormSvc: Multiple users editing same form
    
    User1->>Builder1: Connect to form builder
    Builder1->>WSManager: Join form editing room
    WSManager-->>Builder1: Connected to room
    
    User2->>Builder2: Connect to same form
    Builder2->>WSManager: Join form editing room  
    WSManager-->>Builder2: Connected to room
    WSManager->>Builder1: Notify: User 2 joined
    
    User1->>Builder1: Add new field
    Builder1->>WSManager: Broadcast field change
    WSManager->>Builder2: Send field update
    Builder2->>Builder2: Apply field change
    Builder2-->>User2: Show new field (live update)
    
    User2->>Builder2: Modify field properties
    Builder2->>WSManager: Broadcast property change
    WSManager->>Builder1: Send property update
    Builder1->>Builder1: Apply property change
    Builder1-->>User1: Show updated field
    
    par Conflict resolution
        User1->>Builder1: Modify same field
        User2->>Builder2: Modify same field simultaneously
        
        Builder1->>WSManager: Send change with timestamp
        Builder2->>WSManager: Send change with timestamp
        
        WSManager->>WSManager: Resolve conflict (last write wins)
        WSManager->>Builder1: Send resolved state
        WSManager->>Builder2: Send resolved state
        
        Builder1-->>User1: Show conflict resolution
        Builder2-->>User2: Show conflict resolution
    end
    
    User1->>Builder1: Save form
    Builder1->>FormSvc: Save form state
    FormSvc->>WSManager: Broadcast save confirmation
    WSManager->>Builder2: Form saved notification
    Builder2-->>User2: Show saved state
```

## Performance Optimizations

### Builder Performance
- **Debounced Updates**: Avoid excessive API calls during rapid editing
- **Local State Management**: Immediate UI feedback before server sync
- **Field Virtualization**: Efficient rendering of forms with many fields
- **Undo/Redo Stack**: Client-side action history management

### Drag & Drop Optimization
- **Ghost Elements**: Lightweight drag previews
- **Drop Zone Highlighting**: Visual feedback during drag operations
- **Snap to Grid**: Consistent field positioning
- **Collision Detection**: Prevent overlapping field placement

### Form Validation
- **Schema Validation**: Compile-time validation for field configurations
- **Real-time Validation**: Immediate feedback on field changes
- **Dependency Tracking**: Efficient conditional logic evaluation
- **Validation Caching**: Cache complex validation results

## Error Handling

### Builder Error States
- **Network Errors**: Graceful handling of API failures
- **Validation Errors**: Clear field-level error messaging  
- **Conflict Resolution**: Handle simultaneous editing conflicts
- **Recovery Mechanisms**: Auto-save and recovery from crashes

### User Experience
- **Progressive Enhancement**: Graceful degradation without JavaScript
- **Accessibility**: Full keyboard navigation and screen reader support
- **Mobile Optimization**: Touch-friendly drag and drop
- **Loading States**: Clear progress indicators for all operations

---

**Related Documentation:**
- [Frontend Overview](../../frontend/overview.md#form-builder) - Frontend implementation details
- [Backend Overview](../../backend/overview.md#service-layer-architecture) - Backend service logic
- [API Documentation](../../backend/api-rest.md#form-management-endpoints) - Complete API reference
