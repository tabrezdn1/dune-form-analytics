import React, { useReducer, useCallback } from 'react'
import { FormField } from './types'
import { nanoid } from 'nanoid'

// Form Builder State Types
export interface FormBuilderState {
  title: string
  description: string
  fields: FormField[]
  selectedFieldId: string | null
  isDirty: boolean
  isSaving: boolean
  errors: Record<string, string>
}

export type FormBuilderAction = 
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'ADD_FIELD'; payload: { type: FormField['type']; index?: number } }
  | { type: 'UPDATE_FIELD'; payload: { id: string; updates: Partial<FormField> } }
  | { type: 'DELETE_FIELD'; payload: { id: string } }
  | { type: 'REORDER_FIELDS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'SELECT_FIELD'; payload: { id: string | null } }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_ERROR'; payload: { field: string } }
  | { type: 'RESET_FORM' }
  | { type: 'LOAD_FORM'; payload: { title: string; description: string; fields: FormField[] } }

// Initial state
const initialState: FormBuilderState = {
  title: '',
  description: '',
  fields: [],
  selectedFieldId: null,
  isDirty: false,
  isSaving: false,
  errors: {},
}

// Form builder reducer
function formBuilderReducer(state: FormBuilderState, action: FormBuilderAction): FormBuilderState {
  switch (action.type) {
    case 'SET_TITLE':
      return {
        ...state,
        title: action.payload,
        isDirty: true,
      }

    case 'SET_DESCRIPTION':
      return {
        ...state,
        description: action.payload,
        isDirty: true,
      }

    case 'ADD_FIELD': {
      const newField: FormField = createDefaultField(action.payload.type)
      const newFields = [...state.fields]
      
      if (action.payload.index !== undefined) {
        newFields.splice(action.payload.index, 0, newField)
      } else {
        newFields.push(newField)
      }

      return {
        ...state,
        fields: newFields,
        selectedFieldId: newField.id,
        isDirty: true,
      }
    }

    case 'UPDATE_FIELD': {
      const { id, updates } = action.payload
      const newFields = state.fields.map(field =>
        field.id === id ? { ...field, ...updates } : field
      )

      return {
        ...state,
        fields: newFields,
        isDirty: true,
      }
    }

    case 'DELETE_FIELD': {
      const newFields = state.fields.filter(field => field.id !== action.payload.id)
      const newSelectedId = state.selectedFieldId === action.payload.id 
        ? (newFields.length > 0 ? newFields[0].id : null)
        : state.selectedFieldId

      return {
        ...state,
        fields: newFields,
        selectedFieldId: newSelectedId,
        isDirty: true,
      }
    }

    case 'REORDER_FIELDS': {
      const { fromIndex, toIndex } = action.payload
      const newFields = [...state.fields]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)

      return {
        ...state,
        fields: newFields,
        isDirty: true,
      }
    }

    case 'SELECT_FIELD':
      return {
        ...state,
        selectedFieldId: action.payload.id,
      }

    case 'SET_SAVING':
      return {
        ...state,
        isSaving: action.payload,
      }

    case 'SET_ERROR': {
      const { field, error } = action.payload
      return {
        ...state,
        errors: { ...state.errors, [field]: error },
      }
    }

    case 'CLEAR_ERROR': {
      const { field } = action.payload
      const newErrors = { ...state.errors }
      delete newErrors[field]
      
      return {
        ...state,
        errors: newErrors,
      }
    }

    case 'RESET_FORM':
      return initialState

    case 'LOAD_FORM':
      return {
        ...state,
        title: action.payload.title,
        description: action.payload.description,
        fields: action.payload.fields,
        selectedFieldId: action.payload.fields.length > 0 ? action.payload.fields[0].id : null,
        isDirty: false,
        errors: {},
      }

    default:
      return state
  }
}

// Create default field based on type
function createDefaultField(type: FormField['type']): FormField {
  const id = nanoid(8)
  
  const baseField: FormField = {
    id,
    type,
    label: `New ${type} field`,
    required: false,
  }

  switch (type) {
    case 'text':
      return {
        ...baseField,
        label: 'Text Field',
        validation: { maxLen: 500 },
      }

    case 'mcq':
      return {
        ...baseField,
        label: 'Multiple Choice',
        options: [
          { id: nanoid(6), label: 'Option 1' },
          { id: nanoid(6), label: 'Option 2' },
        ],
      }

    case 'checkbox':
      return {
        ...baseField,
        label: 'Checkboxes',
        options: [
          { id: nanoid(6), label: 'Option 1' },
          { id: nanoid(6), label: 'Option 2' },
        ],
      }

    case 'rating':
      return {
        ...baseField,
        label: 'Rating',
        validation: { min: 1, max: 5 },
      }

    default:
      return baseField
  }
}

// Custom hook for form builder state
export function useFormBuilder(initialForm?: {
  title: string
  description: string
  fields: FormField[]
}) {
  const [state, dispatch] = useReducer(formBuilderReducer, initialState)

  // Initialize with existing form if provided
  React.useEffect(() => {
    if (initialForm) {
      dispatch({ type: 'LOAD_FORM', payload: initialForm })
    }
  }, [initialForm])

  // Actions
  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_TITLE', payload: title })
  }, [])

  const setDescription = useCallback((description: string) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: description })
  }, [])

  const addField = useCallback((type: FormField['type'], index?: number) => {
    dispatch({ type: 'ADD_FIELD', payload: { type, index } })
  }, [])

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { id, updates } })
  }, [])

  const deleteField = useCallback((id: string) => {
    dispatch({ type: 'DELETE_FIELD', payload: { id } })
  }, [])

  const reorderFields = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_FIELDS', payload: { fromIndex, toIndex } })
  }, [])

  const selectField = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_FIELD', payload: { id } })
  }, [])

  const setSaving = useCallback((isSaving: boolean) => {
    dispatch({ type: 'SET_SAVING', payload: isSaving })
  }, [])

  const setError = useCallback((field: string, error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { field, error } })
  }, [])

  const clearError = useCallback((field: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: { field } })
  }, [])

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' })
  }, [])

  // Utility functions
  const getSelectedField = useCallback(() => {
    return state.fields.find(field => field.id === state.selectedFieldId) || null
  }, [state.fields, state.selectedFieldId])

  const canSave = useCallback(() => {
    return state.title.trim() !== '' && state.fields.length > 0 && Object.keys(state.errors).length === 0
  }, [state.title, state.fields, state.errors])

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}

    if (!state.title.trim()) {
      errors.title = 'Form title is required'
    }

    if (state.fields.length === 0) {
      errors.fields = 'At least one field is required'
    }

    // Validate each field
    state.fields.forEach(field => {
      if (!field.label.trim()) {
        errors[`field-${field.id}-label`] = 'Field label is required'
      }

      if ((field.type === 'mcq' || field.type === 'checkbox') && (!field.options || field.options.length < 2)) {
        errors[`field-${field.id}-options`] = 'At least 2 options are required'
      }

      if (field.type === 'rating' && (!field.validation?.min || !field.validation?.max)) {
        errors[`field-${field.id}-rating`] = 'Rating range is required'
      }
    })

    // Set all errors at once
    Object.entries(errors).forEach(([field, error]) => {
      dispatch({ type: 'SET_ERROR', payload: { field, error } })
    })

    return Object.keys(errors).length === 0
  }, [state])

  const getFormData = useCallback(() => {
    return {
      title: state.title,
      description: state.description,
      fields: state.fields,
    }
  }, [state])

  return {
    // State
    ...state,

    // Actions
    setTitle,
    setDescription,
    addField,
    updateField,
    deleteField,
    reorderFields,
    selectField,
    setSaving,
    setError,
    clearError,
    resetForm,

    // Utilities
    getSelectedField,
    canSave,
    validateForm,
    getFormData,
  }
}
