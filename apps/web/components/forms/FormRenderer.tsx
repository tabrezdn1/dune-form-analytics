'use client'

import React from 'react'
import { FormField } from '@/lib/types'
import { useFormState } from '@/lib/form-state'
import { TextInput } from './field-inputs/TextInput'
import { RadioGroup } from './field-inputs/RadioGroup'
import { CheckboxGroup } from './field-inputs/CheckboxGroup'
import { Rating } from './field-inputs/Rating'

interface FormRendererProps {
  fields: FormField[]
  onSubmit: (data: { answers: Array<{ fieldId: string; value: any }> }) => Promise<void>
  isSubmitting?: boolean
  className?: string
  showProgress?: boolean
}

export function FormRenderer({
  fields,
  onSubmit,
  isSubmitting = false,
  className = '',
  showProgress = true
}: FormRendererProps) {
  const {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    setSubmitting,
    validateForm,
    getVisibleFields,
    getSubmissionData,
    handleValidationErrors,
  } = useFormState(fields)

  const visibleFields = getVisibleFields()
  const progress = visibleFields.length > 0 
    ? (Object.keys(values).filter(key => values[key] !== undefined && values[key] !== null && values[key] !== '').length / visibleFields.length) * 100 
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSubmitting) return

    setSubmitting(true)

    try {
      // Validate form
      const isValid = validateForm()
      if (!isValid) {
        return
      }

      // Get submission data
      const submissionData = getSubmissionData()
      
      // Submit form
      await onSubmit(submissionData)
    } catch (error: any) {
      console.error('Form submission error:', error)
      
      // Handle validation errors from API
      if (error.validationErrors) {
        handleValidationErrors(error.validationErrors)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const fieldValue = values[field.id]
    const fieldError = touched[field.id] ? errors[field.id] : undefined

    const commonProps = {
      field,
      onChange: (value: any) => setFieldValue(field.id, value),
      onBlur: () => setFieldTouched(field.id),
      error: fieldError,
      disabled: isSubmitting,
    }

    switch (field.type) {
      case 'text':
        return (
          <TextInput
            key={field.id}
            {...commonProps}
            value={fieldValue || ''}
          />
        )

      case 'mcq':
        return (
          <RadioGroup
            key={field.id}
            {...commonProps}
            value={fieldValue || ''}
          />
        )

      case 'checkbox':
        return (
          <CheckboxGroup
            key={field.id}
            {...commonProps}
            value={fieldValue || []}
          />
        )

      case 'rating':
        return (
          <Rating
            key={field.id}
            {...commonProps}
            value={fieldValue || 0}
          />
        )

      default:
        return (
          <div key={field.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              Unsupported field type: {field.type}
            </p>
          </div>
        )
    }
  }

  if (visibleFields.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">
          No fields to display
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`} noValidate>
      {/* Progress bar */}
      {showProgress && visibleFields.length > 1 && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-8">
        {visibleFields.map(renderField)}
      </div>

      {/* Submit button */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full btn-primary
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700'}
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="loading-spinner mr-2" />
              Submitting...
            </div>
          ) : (
            'Submit Response'
          )}
        </button>
      </div>

      {/* Form summary for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            Debug Info (Development Only)
          </summary>
          <div className="mt-2 text-xs space-y-2">
            <div>
              <strong>Values:</strong> {JSON.stringify(values, null, 2)}
            </div>
            <div>
              <strong>Errors:</strong> {JSON.stringify(errors, null, 2)}
            </div>
            <div>
              <strong>Touched:</strong> {JSON.stringify(touched, null, 2)}
            </div>
            <div>
              <strong>Visible Fields:</strong> {visibleFields.map(f => f.id).join(', ')}
            </div>
          </div>
        </details>
      )}
    </form>
  )
}
