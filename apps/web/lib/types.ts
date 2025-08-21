// Form Types (matching backend models)
export interface FormField {
  id: string;
  type: 'text' | 'mcq' | 'checkbox' | 'rating';
  label: string;
  required: boolean;
  options?: Array<{
    id: string;
    label: string;
  }>;
  validation?: {
    minLen?: number;
    maxLen?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  visibility?: {
    whenFieldId: string;
    op: 'eq' | 'ne' | 'in' | 'gt' | 'lt';
    value: any;
  };
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

export interface PublicForm {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

// Response Types
export interface FormAnswer {
  fieldId: string;
  value: string | number | string[];
}

export interface FormResponse {
  id: string;
  formId: string;
  answers: FormAnswer[];
  submittedAt: string;
  meta?: {
    ip?: string;
    userAgent?: string;
    referrer?: string;
  };
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface SubmitResponseResult {
  success: boolean;
  id?: string;
  errors?: ValidationError[];
  message: string;
}

// Analytics Types
export interface FieldAnalytics {
  count: number;
  distribution?: Record<string, number>;
  average?: number;
  median?: number;
  trend?: Array<{
    date: string;
    value: number;
    count: number;
  }>;
  topKeywords?: Array<{
    keyword: string;
    count: number;
  }>;
}

export interface Analytics {
  formId: string;
  byField: Record<string, FieldAnalytics>;
  totalResponses: number;
  completionRate?: number;
  averageTimeToComplete?: number;
  updatedAt: string;
}

// WebSocket Analytics Update Type
export interface AnalyticsUpdate {
  byField?: Record<string, FieldAnalytics>;
  totalResponses?: number;
  completionRate?: number;
  averageTimeToComplete?: number;
  updatedAt?: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  formId?: string;
  data?: any;
}

// Form State Management Types
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export type FormAction =
  | { type: 'SET_FIELD'; payload: { fieldId: string; value: any } }
  | { type: 'SET_ERROR'; payload: { fieldId: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: { fieldId: string } }
  | { type: 'SET_TOUCHED'; payload: { fieldId: string } }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'RESET_FORM' }
  | { type: 'SET_ERRORS'; payload: Record<string, string> };

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// UI Component Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system';

// Form Builder Types (for future use)
export interface DragItem {
  id: string;
  type: string;
  index: number;
}

export interface DropResult {
  dragIndex: number;
  dropIndex: number;
}
