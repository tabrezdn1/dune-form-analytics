'use client'

import React, { useState } from 'react'
import { FormField } from '@/lib/types'
import { nanoid } from 'nanoid'

interface FieldInspectorProps {
  field: FormField | null
  onUpdate: (updates: Partial<FormField>) => void
  className?: string
}

export function FieldInspector({ field, onUpdate, className = '' }: FieldInspectorProps) {
  const [localField, setLocalField] = useState<FormField | null>(field)

  React.useEffect(() => {
    setLocalField(field)
  }, [field])

  if (!field || !localField) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Field Selected
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Select a field from the canvas to edit its properties
        </p>
      </div>
    )
  }

  const updateLocalField = (updates: Partial<FormField>) => {
    const updated = { ...localField, ...updates }
    setLocalField(updated)
    onUpdate(updates)
  }

  const addOption = () => {
    if (!localField.options) return
    
    const newOption = {
      id: nanoid(6),
      label: `Option ${localField.options.length + 1}`
    }
    
    updateLocalField({
      options: [...localField.options, newOption]
    })
  }

  const updateOption = (optionId: string, label: string) => {
    if (!localField.options) return
    
    const updatedOptions = localField.options.map(option =>
      option.id === optionId ? { ...option, label } : option
    )
    
    updateLocalField({ options: updatedOptions })
  }

  const deleteOption = (optionId: string) => {
    if (!localField.options || localField.options.length <= 2) return
    
    const updatedOptions = localField.options.filter(option => option.id !== optionId)
    updateLocalField({ options: updatedOptions })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Field Properties
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="capitalize">{localField.type} field</span>
          <span>•</span>
          <span>ID: {localField.id}</span>
        </div>
      </div>

      {/* Basic Properties */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Field Label *
          </label>
          <input
            type="text"
            value={localField.label}
            onChange={(e) => updateLocalField({ label: e.target.value })}
            className="form-input"
            placeholder="Enter field label..."
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id={`required-${localField.id}`}
            checked={localField.required}
            onChange={(e) => updateLocalField({ required: e.target.checked })}
            className="form-checkbox"
          />
          <label htmlFor={`required-${localField.id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Required field
          </label>
        </div>
      </div>

      {/* Type-specific properties */}
      {localField.type === 'text' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Text Validation</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Length
              </label>
              <input
                type="number"
                value={localField.validation?.minLen || ''}
                onChange={(e) => updateLocalField({
                  validation: {
                    ...localField.validation,
                    minLen: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="form-input"
                placeholder="0"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Length
              </label>
              <input
                type="number"
                value={localField.validation?.maxLen || ''}
                onChange={(e) => updateLocalField({
                  validation: {
                    ...localField.validation,
                    maxLen: e.target.value ? parseInt(e.target.value) : undefined
                  }
                })}
                className="form-input"
                placeholder="500"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Pattern (Regex)
            </label>
            <input
              type="text"
              value={localField.validation?.pattern || ''}
              onChange={(e) => updateLocalField({
                validation: {
                  ...localField.validation,
                  pattern: e.target.value || undefined
                }
              })}
              className="form-input"
              placeholder="^[a-zA-Z0-9]+$"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Optional regex pattern for validation
            </p>
          </div>
        </div>
      )}

      {localField.type === 'rating' && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Rating Scale</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Minimum *
              </label>
              <input
                type="number"
                value={localField.validation?.min || 1}
                onChange={(e) => updateLocalField({
                  validation: {
                    ...localField.validation,
                    min: parseInt(e.target.value) || 1
                  }
                })}
                className="form-input"
                min="1"
                max="10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maximum *
              </label>
              <input
                type="number"
                value={localField.validation?.max || 5}
                onChange={(e) => updateLocalField({
                  validation: {
                    ...localField.validation,
                    max: parseInt(e.target.value) || 5
                  }
                })}
                className="form-input"
                min="2"
                max="10"
              />
            </div>
          </div>
        </div>
      )}

      {(localField.type === 'mcq' || localField.type === 'checkbox') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">Options</h4>
            <button
              onClick={addOption}
              className="btn-outline text-xs py-1 px-2"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Option
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {localField.options?.map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    className="form-input text-sm"
                    placeholder={`Option ${index + 1}`}
                  />
                </div>
                
                {localField.options && localField.options.length > 2 && (
                  <button
                    onClick={() => deleteOption(option.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete option"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {localField.options && localField.options.length >= 10 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Maximum 10 options recommended for better user experience
            </p>
          )}
        </div>
      )}

      {/* Advanced Properties */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Advanced</h4>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>Field ID: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{localField.id}</code></div>
          <div>Type: <span className="capitalize">{localField.type}</span></div>
          <div>Required: {localField.required ? 'Yes' : 'No'}</div>
          {localField.options && (
            <div>Options: {localField.options.length}</div>
          )}
        </div>
      </div>
    </div>
  )
}
