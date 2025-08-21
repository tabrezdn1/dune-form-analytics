# Frontend Overview

## Purpose & Architecture

The Dune Forms frontend is a React application built with Next.js 14, providing an interface for form creation, real-time analytics visualization, and form response submission. It features a drag-and-drop form builder, live analytics dashboards, and responsive design.

**Core Responsibilities:**
- Visual drag-and-drop form builder with live preview
- Real-time analytics dashboard with WebSocket integration
- Public form submission interface for anonymous users
- User authentication and account management
- Responsive design for mobile, tablet, and desktop

## Technology Stack

### Core Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 14.0.4 | React framework with App Router and SSR |
| **React** | 18.2.0 | Component-based UI library |
| **TypeScript** | 5.3.3 | Type safety and developer experience |
| **Tailwind CSS** | 3.3.6 | Utility-first CSS framework |
| **HTML5 Drag & Drop** | Native | Drag-and-drop functionality |
| **Recharts** | 2.8.0 | Data visualization and charts |
| **React Hot Toast** | 2.4.1 | User notifications (8 files) |
| **nanoid** | 5.0.4 | Unique ID generation |
| **clsx** | 2.0.0 | Conditional className composition |
| **html2canvas + jsPDF** | 1.4.1 + 3.0.1 | PDF export functionality |

### Development Tools
| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting and style enforcement |
| **Prettier** | Code formatting |

## Project Structure

```
apps/web/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/page.tsx        # Login page
│   │   └── signup/page.tsx       # Registration page
│   ├── builder/                  # Form builder routes
│   │   ├── page.tsx              # New form builder
│   │   └── [id]/                 # Edit existing form
│   ├── dashboard/page.tsx        # User dashboard
│   ├── f/[slug]/                 # Public form submission
│   ├── forms/                    # Form management
│   │   ├── [id]/page.tsx         # Form analytics
│   │   └── page.tsx              # Forms list
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # Context providers
├── components/                   # Reusable components
│   ├── auth/                     # Authentication components
│   ├── builder/                  # Form builder components
│   ├── charts/                   # Analytics components
│   ├── forms/                    # Form rendering components
│   ├── navigation/               # Navigation components
│   └── ui/                       # Basic UI components
├── lib/                          # Utilities and hooks
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom hooks
│   ├── api.ts                    # API client
│   ├── types.ts                  # TypeScript definitions
│   └── websocket.ts              # WebSocket client
└── public/                       # Static assets
```

## Core Features

### 1. Form Builder (`/builder`)

**Visual Interface:**
- Field palette with text, MCQ, checkbox, and rating fields
- Form construction with native HTML5 drag-and-drop
- Real-time form preview
- Field configuration panel with validation rules

**Key Components:**
- `FormBuilderClient` - Main builder orchestration
- `FieldPalette` - Available field types
- `FormCanvas` - Drag-and-drop area
- `FieldInspector` - Field configuration panel

```typescript
// Form builder state management
const {
  title, description, fields,
  selectedFieldId, isDirty, isSaving,
  addField, updateField, deleteField,
  reorderFields, selectField
} = useFormBuilder(initialForm);
```

### 2. Analytics Dashboard (`/forms/[id]`)

**Real-time Analytics Visualization:**
- Live response counters with WebSocket updates
- Interactive charts for response distribution
- Trend analysis with time-series data
- Export functionality for data portability

**Key Components:**
- `FormAnalytics` - Main dashboard component
- `AnalyticsCard` - Individual metric cards
- `DistributionChart` - Response distribution visualization
- `RatingChart` - Rating field analysis

```typescript
// Real-time analytics with WebSocket
useEffect(() => {
  const ws = new WebSocket(`ws://localhost:8080/ws/forms/${formId}`);
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    if (update.type === 'analytics:update') {
      setAnalytics(prev => ({...prev, ...update.data}));
    }
  };
  
  return () => ws.close();
}, [formId]);
```

### 3. Public Form Submission (`/f/[slug]`)

**Anonymous Form Submission:**
- Mobile-optimized responsive design
- Client-side validation with real-time feedback
- Progress indicators for multi-step forms
- Conditional field display based on responses

**Key Components:**
- `PublicFormView` - Public form container
- `FormRenderer` - Universal form rendering engine
- Field components for each input type

```typescript
// Form submission with validation
const handleSubmit = async (formData: FormSubmission) => {
  const response = await api.submitForm(formId, formData);
  if (response.success) {
    setSubmitted(true);
  } else {
    setErrors(response.errors);
  }
};
```

## State Management Architecture

### Global Application State

**App Context (`AppContext.tsx`):**
```typescript
interface AppContextType {
  user: User | null;
  theme: 'light' | 'dark' | 'system';
  setUser: (user: User | null) => void;
  setTheme: (theme: Theme) => void;
}

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('system');
  
  return (
    <AppContext.Provider value={{ user, theme, setUser, setTheme }}>
      {children}
    </AppContext.Provider>
  );
};
```

### Form Builder State

**Form Builder Hook (`useFormBuilder`):**
```typescript
interface FormBuilderState {
  title: string;
  description: string;
  fields: FormField[];
  selectedFieldId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
}

const useFormBuilder = (initialForm?: Form) => {
  const [state, setState] = useState<FormBuilderState>({
    title: initialForm?.title || '',
    description: initialForm?.description || '',
    fields: initialForm?.fields || [],
    selectedFieldId: null,
    isDirty: false,
    isSaving: false,
    errors: {},
  });
  
  const actions = {
    addField: (type: FieldType) => { /* ... */ },
    updateField: (id: string, updates: Partial<FormField>) => { /* ... */ },
    deleteField: (id: string) => { /* ... */ },
    reorderFields: (fromIndex: number, toIndex: number) => { /* ... */ },
  };
  
  return { ...state, ...actions };
};
```

### Form Submission State

**Form State Hook (`useFormState`):**
```typescript
interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

const useFormState = (fields: FormField[]) => {
  const [state, dispatch] = useReducer(formReducer, {
    values: {},
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
  });
  
  const setFieldValue = (fieldId: string, value: any) => {
    dispatch({ type: 'SET_FIELD', payload: { fieldId, value } });
  };
  
  return { ...state, setFieldValue };
};
```

## Component Architecture

### Component Hierarchy

```
App Layout
├── Header (Navigation)
├── Breadcrumbs
└── Page Content
    ├── Form Builder
    │   ├── FieldPalette
    │   ├── FormCanvas
    │   │   └── FieldCard[]
    │   └── FieldInspector
    ├── Analytics Dashboard
    │   ├── AnalyticsCard[]
    │   ├── DistributionChart
    │   └── RatingChart
    └── Public Form
        ├── FormRenderer
        └── Field Components
            ├── TextInput
            ├── RadioGroup
            ├── CheckboxGroup
            └── Rating
```

### Component Patterns

#### Container/Presentation Pattern
```typescript
// Container Component (logic)
function FormBuilderContainer({ formId }: { formId: string }) {
  const { form, loading, saveForm } = useForm(formId);
  
  if (loading) return <Loading />;
  
  return (
    <FormBuilderPresentation
      form={form}
      onSave={saveForm}
    />
  );
}

// Presentation Component (UI)
function FormBuilderPresentation({ form, onSave }: Props) {
  return (
    <div className="form-builder">
      <FieldPalette />
      <FormCanvas fields={form.fields} />
      <FieldInspector />
    </div>
  );
}
```

#### Compound Component Pattern
```typescript
// Form renderer with compound components
function FormRenderer({ form }: { form: Form }) {
  return (
    <Form onSubmit={handleSubmit}>
      {form.fields.map(field => (
        <Field key={field.id} {...field}>
          <Field.Label>{field.label}</Field.Label>
          <Field.Input />
          <Field.Error />
        </Field>
      ))}
      <Form.Submit>Submit</Form.Submit>
    </Form>
  );
}
```

## API Integration

### API Client (`lib/api.ts`)

```typescript
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.post('/auth/login', { email, password });
    if (response.success) {
      this.setAccessToken(response.data.accessToken);
    }
    return response;
  }
  
  // Forms
  async createForm(form: CreateFormRequest): Promise<ApiResponse<Form>> {
    return this.post('/forms', form);
  }
  
  async getForm(id: string): Promise<ApiResponse<Form>> {
    return this.get(`/forms/${id}`);
  }
  
  // Analytics
  async getAnalytics(formId: string): Promise<ApiResponse<Analytics>> {
    return this.get(`/forms/${formId}/analytics`);
  }
  
  // Generic HTTP methods
  private async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.accessToken ? `Bearer ${this.accessToken}` : '',
      },
      body: JSON.stringify(data),
    });
    
    return response.json();
  }
}

export const api = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);
```

### WebSocket Integration (`lib/websocket.ts`)

```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private formId: string;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(formId: string) {
    this.formId = formId;
    this.connect();
  }
  
  private connect() {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/forms/${this.formId}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.emit(message.type, message.data);
    };
    
    this.ws.onclose = () => {
      this.attemptReconnect();
    };
  }
  
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }
}
```

## TypeScript Integration

### Type Definitions (`lib/types.ts`)

```typescript
// Form Types
export interface FormField {
  id: string;
  type: 'text' | 'mcq' | 'checkbox' | 'rating';
  label: string;
  required: boolean;
  options?: Option[];
  validation?: FieldValidation;
  visibility?: VisibilityCondition;
}

export interface Form {
  id: string;
  ownerId?: string;
  title: string;
  description?: string;
  status: 'draft' | 'published';
  shareSlug: string;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

// Analytics Types
export interface Analytics {
  formId: string;
  totalResponses: number;
  byField: Record<string, FieldAnalytics>;
  completionRate?: number;
  updatedAt: string;
}

// API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Component Props Types

```typescript
// Form Builder Props
interface FormBuilderProps {
  initialForm?: Form;
}

// Field Component Props
interface FieldProps {
  field: FormField;
  value?: any;
  error?: string;
  onChange: (value: any) => void;
  onBlur?: () => void;
}

// Chart Component Props
interface ChartProps {
  data: any[];
  title: string;
  loading?: boolean;
  error?: string;
}
```

## Next.js Configuration

### App Router Setup (`app/layout.tsx`)

```typescript
import { Inter } from 'next/font/google';
import { AppProvider } from '@/lib/contexts/AppContext';
import { ThemeScript } from '@/components/ui/ThemeScript';
import { Header } from '@/components/navigation/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <AppProvider>
          <Header />
          <main>{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
```

### Environment Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
  },
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://localhost:8080/api'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

## Styling & Design System

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### Design Tokens

```typescript
// Design system constants
export const colors = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

export const spacing = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};
```

## Performance Optimizations

### Code Splitting

```typescript
// Dynamic imports for large components
const FormBuilder = dynamic(() => import('@/components/builder/FormBuilderClient'), {
  loading: () => <Loading />,
  ssr: false, // Client-side only for complex interactions
});

const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard'), {
  loading: () => <Loading />,
});
```

### Image Optimization

```typescript
import Image from 'next/image';

function UserAvatar({ user }: { user: User }) {
  return (
    <Image
      src={user.avatar || '/default-avatar.png'}
      alt={user.name}
      width={40}
      height={40}
      className="rounded-full"
    />
  );
}
```

### Memory Management

```typescript
// Cleanup WebSocket connections
useEffect(() => {
  const wsClient = new WebSocketClient(formId);
  
  return () => {
    wsClient.disconnect(); // Cleanup on unmount
  };
}, [formId]);

// Debounced API calls
const debouncedSave = useMemo(
  () => debounce(saveForm, 1000),
  [saveForm]
);
```

## Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }
    
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
const useApiCall = <T>(apiCall: () => Promise<ApiResponse<T>>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall();
      
      if (response.success) {
        setData(response.data || null);
      } else {
        setError(response.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, execute };
};
```

## Accessibility

### ARIA Labels and Roles

```typescript
function FormField({ field, value, onChange }: FieldProps) {
  return (
    <div className="form-field">
      <label 
        htmlFor={field.id}
        className="block text-sm font-medium text-gray-700"
      >
        {field.label}
        {field.required && (
          <span className="text-red-500" aria-label="required">*</span>
        )}
      </label>
      
      <input
        id={field.id}
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={`${field.id}-error`}
        aria-invalid={!!error}
        className="mt-1 block w-full border-gray-300 rounded-md"
      />
      
      {error && (
        <p id={`${field.id}-error`} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Keyboard Navigation

```typescript
// Keyboard event handling for form builder
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Escape') {
    setSelectedField(null);
  } else if (e.key === 'Delete' && selectedFieldId) {
    deleteField(selectedFieldId);
  } else if (e.key === 'Tab') {
    // Handle tab navigation between fields
    focusNextField(e.shiftKey);
  }
};
```



---

**Related Documentation:**
- [Backend API](../backend/api-rest.md) - Complete API reference
- [WebSocket Integration](../backend/websockets.md) - Real-time communication
- [System Architecture](../architecture/overview.md) - Overall system design
