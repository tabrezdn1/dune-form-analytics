import { useReducer, useCallback } from 'react'
import { FormState, FormAction, FormField, ValidationError } from './types'

// Initial form state
const initialFormState: FormState = {
  values: {},
  errors: {},
  touched: {},
  isSubmitting: false,
  isValid: false,
}

// Form reducer
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': {
      const { fieldId, value } = action.payload
      const newValues = { ...state.values, [fieldId]: value }
      const newErrors = { ...state.errors }
      
      // Clear error when field value changes
      if (newErrors[fieldId]) {
        delete newErrors[fieldId]
      }
      
      return {
        ...state,
        values: newValues,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      }
    }
    
    case 'SET_ERROR': {
      const { fieldId, error } = action.payload
      const newErrors = { ...state.errors, [fieldId]: error }
      
      return {
        ...state,
        errors: newErrors,
        isValid: false,
      }
    }
    
    case 'CLEAR_ERROR': {
      const { fieldId } = action.payload
      const newErrors = { ...state.errors }
      delete newErrors[fieldId]
      
      return {
        ...state,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      }
    }
    
    case 'SET_TOUCHED': {
      const { fieldId } = action.payload
      return {
        ...state,
        touched: { ...state.touched, [fieldId]: true },
      }
    }
    
    case 'SET_SUBMITTING': {
      return {
        ...state,
        isSubmitting: action.payload,
      }
    }
    
    case 'SET_ERRORS': {
      return {
        ...state,
        errors: action.payload,
        isValid: Object.keys(action.payload).length === 0,
      }
    }
    
    case 'RESET_FORM': {
      return initialFormState
    }
    
    default:
      return state
  }
}

// Custom hook for form state management
export function useFormState(fields: FormField[] = []) {
  const [state, dispatch] = useReducer(formReducer, initialFormState)

  // Set field value
  const setFieldValue = useCallback((fieldId: string, value: any) => {
    dispatch({ type: 'SET_FIELD', payload: { fieldId, value } })
  }, [])

  // Set field error
  const setFieldError = useCallback((fieldId: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { fieldId, error } })
  }, [])

  // Clear field error
  const clearFieldError = useCallback((fieldId: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: { fieldId } })
  }, [])

  // Set field as touched
  const setFieldTouched = useCallback((fieldId: string) => {
    dispatch({ type: 'SET_TOUCHED', payload: { fieldId } })
  }, [])

  // Set submitting state
  const setSubmitting = useCallback((isSubmitting: boolean) => {
    dispatch({ type: 'SET_SUBMITTING', payload: isSubmitting })
  }, [])

  // Set multiple errors at once
  const setErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: 'SET_ERRORS', payload: errors })
  }, [])

  // Reset form
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' })
  }, [])

  // Validate single field
  const validateField = useCallback((field: FormField, value: any): string | null => {
    // Required validation
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`
    }

    // Skip validation if field is empty and not required
    if (!field.required && (value === undefined || value === null || value === '')) {
      return null
    }

    // Type-specific validation
    switch (field.type) {
      case 'text':
        if (typeof value !== 'string') return 'Invalid text value'
        
        if (field.validation?.minLen && value.length < field.validation.minLen) {
          return `Minimum length is ${field.validation.minLen} characters`
        }
        
        if (field.validation?.maxLen && value.length > field.validation.maxLen) {
          return `Maximum length is ${field.validation.maxLen} characters`
        }
        
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            return 'Invalid format'
          }
        }
        break

      case 'rating':
        if (typeof value !== 'number') return 'Invalid rating value'
        
        if (field.validation?.min && value < field.validation.min) {
          return `Minimum rating is ${field.validation.min}`
        }
        
        if (field.validation?.max && value > field.validation.max) {
          return `Maximum rating is ${field.validation.max}`
        }
        break

      case 'mcq':
        if (typeof value !== 'string') return 'Invalid selection'
        
        const validOptions = field.options?.map(opt => opt.id) || []
        if (!validOptions.includes(value)) {
          return 'Invalid option selected'
        }
        break

      case 'checkbox':
        if (!Array.isArray(value)) return 'Invalid selection'
        
        const validCheckboxOptions = field.options?.map(opt => opt.id) || []
        const invalidSelections = value.filter(v => !validCheckboxOptions.includes(v))
        if (invalidSelections.length > 0) {
          return 'Invalid options selected'
        }
        break
    }

    return null
  }, [])

  // Validate all fields
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}
    
    fields.forEach(field => {
      // Check if field should be visible based on conditional logic
      if (field.visibility && !isFieldVisible(field, state.values)) {
        return // Skip validation for hidden fields
      }

      const value = state.values[field.id]
      const error = validateField(field, value)
      
      if (error) {
        errors[field.id] = error
      }
    })

    setErrors(errors)
    return Object.keys(errors).length === 0
  }, [fields, state.values, validateField, setErrors])

  // Check if field should be visible based on conditional logic
  const isFieldVisible = useCallback((field: FormField, values: Record<string, any>): boolean => {
    if (!field.visibility) return true

    const { whenFieldId, op, value: conditionValue } = field.visibility
    const fieldValue = values[whenFieldId]

    switch (op) {
      case 'eq':
        return fieldValue === conditionValue
      case 'ne':
        return fieldValue !== conditionValue
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
      case 'gt':
        return typeof fieldValue === 'number' && fieldValue > conditionValue
      case 'lt':
        return typeof fieldValue === 'number' && fieldValue < conditionValue
      default:
        return true
    }
  }, [])

  // Get visible fields
  const getVisibleFields = useCallback(() => {
    return fields.filter(field => isFieldVisible(field, state.values))
  }, [fields, state.values, isFieldVisible])

  // Convert form state to submission format
  const getSubmissionData = useCallback(() => {
    const visibleFields = getVisibleFields()
    const answers = visibleFields
      .filter(field => state.values[field.id] !== undefined && state.values[field.id] !== null && state.values[field.id] !== '')
      .map(field => ({
        fieldId: field.id,
        value: state.values[field.id],
      }))

    return { answers }
  }, [state.values, getVisibleFields])

  // Handle validation errors from API
  const handleValidationErrors = useCallback((validationErrors: ValidationError[]) => {
    const errorMap: Record<string, string> = {}
    validationErrors.forEach(error => {
      errorMap[error.field] = error.message
    })
    setErrors(errorMap)
  }, [setErrors])

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,

    // Actions
    setFieldValue,
    setFieldError,
    clearFieldError,
    setFieldTouched,
    setSubmitting,
    setErrors,
    resetForm,

    // Validation
    validateField,
    validateForm,
    handleValidationErrors,

    // Utilities
    isFieldVisible,
    getVisibleFields,
    getSubmissionData,
  }
}
