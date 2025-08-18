// Application environment configuration
export interface EnvironmentConfig {
  apiUrl: string
  wsUrl: string
  environment: 'development' | 'staging' | 'production'
  features: {
    analytics: boolean
    realTime: boolean
    export: boolean
    darkMode: boolean
  }
  limits: {
    maxFileSize: number
    maxFields: number
    maxOptions: number
  }
}

// Load and validate environment configuration
export function getEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
    environment: (process.env.NODE_ENV as any) || 'development',
    features: {
      analytics: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS !== 'false',
      realTime: process.env.NEXT_PUBLIC_FEATURE_REALTIME !== 'false',
      export: process.env.NEXT_PUBLIC_FEATURE_EXPORT !== 'false',
      darkMode: process.env.NEXT_PUBLIC_FEATURE_DARK_MODE !== 'false',
    },
    limits: {
      maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB
      maxFields: parseInt(process.env.NEXT_PUBLIC_MAX_FIELDS || '50'),
      maxOptions: parseInt(process.env.NEXT_PUBLIC_MAX_OPTIONS || '20'),
    },
  }

  // Validate configuration
  validateConfig(config)
  
  return config
}

// Validate configuration values
function validateConfig(config: EnvironmentConfig): void {
  if (!config.apiUrl) {
    throw new Error('API URL is required')
  }
  
  if (!config.wsUrl) {
    throw new Error('WebSocket URL is required')
  }
  
  if (!['development', 'staging', 'production'].includes(config.environment)) {
    console.warn(`Invalid environment: ${config.environment}. Defaulting to development.`)
    config.environment = 'development'
  }
  
  if (config.limits.maxFileSize < 1024) {
    console.warn('Max file size is too small. Setting to 1MB minimum.')
    config.limits.maxFileSize = 1024 * 1024
  }
}

// Global config instance
export const config = getEnvironmentConfig()

// Feature flags
export const features = config.features

// Environment checks
export const isDevelopment = config.environment === 'development'
export const isProduction = config.environment === 'production'
export const isStaging = config.environment === 'staging'

// API endpoints
export const apiEndpoints = {
  forms: `${config.apiUrl}/api/forms`,
  analytics: (formId: string) => `${config.apiUrl}/api/forms/${formId}/analytics`,
  submit: (formId: string) => `${config.apiUrl}/api/forms/${formId}/submit`,
  export: (formId: string) => `${config.apiUrl}/api/forms/${formId}/export.csv`,
  websocket: (formId: string) => `${config.wsUrl}/ws/forms/${formId}`,
  health: `${config.apiUrl}/health`,
}
