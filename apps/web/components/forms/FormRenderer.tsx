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
    <div className={`max-w-none ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Progress bar */}
        {showProgress && visibleFields.length > 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span>Form Progress</span>
              <span className="text-primary-600 dark:text-primary-400">{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-6">
          {visibleFields.map(renderField)}
        </div>

        {/* Submit button */}
        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`
              w-full btn-primary py-3.5 text-base font-semibold
              rounded-lg shadow-lg hover:shadow-xl
              transform transition-all duration-200
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700 hover:-translate-y-0.5'}
            `}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-3" />
                Submitting your response...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span>Submit Response</span>
                <svg className="w-4 h-4 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
