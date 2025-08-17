'use client'

import React from 'react'
import { FormField } from '@/lib/types'

interface TextInputProps {
  field: FormField
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  disabled?: boolean
}

export function TextInput({
  field,
  value = '',
  onChange,
  onBlur,
  error,
  disabled = false
}: TextInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const isTextarea = field.validation?.maxLen && field.validation.maxLen > 100

  const inputProps = {
    id: field.id,
    value,
    onChange: handleChange,
    onBlur,
    disabled,
    placeholder: `Enter ${field.label.toLowerCase()}...`,
    className: `form-input ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`,
    'aria-describedby': error ? `${field.id}-error` : undefined,
    'aria-invalid': !!error,
  }

  return (
    <div className="form-group">
      <label htmlFor={field.id} className="form-label">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {isTextarea ? (
        <textarea
          {...inputProps}
          rows={4}
          className="form-textarea"
          minLength={field.validation?.minLen}
          maxLength={field.validation?.maxLen}
        />
      ) : (
        <input
          {...inputProps}
          type="text"
          minLength={field.validation?.minLen}
          maxLength={field.validation?.maxLen}
          pattern={field.validation?.pattern}
        />
      )}
      
      {/* Character count for text fields with max length */}
      {field.validation?.maxLen && (
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span></span>
          <span>
            {value.length} / {field.validation.maxLen}
          </span>
        </div>
      )}
      
      {/* Validation hints */}
      {!error && (field.validation?.minLen || field.validation?.maxLen || field.validation?.pattern) && (
        <div className="form-help">
          {field.validation?.minLen && field.validation?.maxLen && (
            <span>Length: {field.validation.minLen}-{field.validation.maxLen} characters</span>
          )}
          {field.validation?.minLen && !field.validation?.maxLen && (
            <span>Minimum {field.validation.minLen} characters</span>
          )}
          {!field.validation?.minLen && field.validation?.maxLen && (
            <span>Maximum {field.validation.maxLen} characters</span>
          )}
          {field.validation?.pattern && (
            <span className="block mt-1">Must match the required format</span>
          )}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div id={`${field.id}-error`} className="form-error">
          {error}
        </div>
      )}
    </div>
  )
}
