'use client'

import React from 'react'
import { FormField } from '@/lib/types'

interface CheckboxGroupProps {
  field: FormField
  value: string[]
  onChange: (value: string[]) => void
  onBlur: () => void
  error?: string
  disabled?: boolean
}

export function CheckboxGroup({
  field,
  value = [],
  onChange,
  onBlur,
  error,
  disabled = false
}: CheckboxGroupProps) {
  const handleChange = (optionId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionId])
    } else {
      onChange(value.filter(id => id !== optionId))
    }
  }

  return (
    <div className="form-group">
      <fieldset onBlur={onBlur}>
        <legend className="form-label">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </legend>
        
        <div className="space-y-3 mt-3">
          {field.options?.map((option) => {
            const isChecked = value.includes(option.id)
            
            return (
              <div key={option.id} className="flex items-center">
                <input
                  id={`${field.id}-${option.id}`}
                  name={`${field.id}[]`}
                  type="checkbox"
                  value={option.id}
                  checked={isChecked}
                  onChange={(e) => handleChange(option.id, e.target.checked)}
                  disabled={disabled}
                  className={`form-checkbox ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  aria-describedby={error ? `${field.id}-error` : undefined}
                />
                <label
                  htmlFor={`${field.id}-${option.id}`}
                  className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            )
          })}
        </div>
        
        {/* Selection count */}
        {value.length > 0 && (
          <div className="text-sm text-gray-500 mt-2">
            {value.length} selected
          </div>
        )}
        
        {/* Empty state */}
        {!field.options || field.options.length === 0 && (
          <div className="text-gray-500 text-sm italic py-4">
            No options available
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div id={`${field.id}-error`} className="form-error mt-2">
            {error}
          </div>
        )}
      </fieldset>
    </div>
  )
}
