'use client'

import React, { useState } from 'react'
import { FormField } from '@/lib/types'
import { nanoid } from 'nanoid'

interface FieldInspectorProps {
  field: FormField | null
  fields: FormField[]
  onUpdate: (updates: Partial<FormField>) => void
  className?: string
}

export function FieldInspector({ field, fields, onUpdate, className = '' }: FieldInspectorProps) {
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

      {/* Conditional Visibility */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Conditional Visibility</h4>
        
        {/* Get available fields (only fields that appear before this one) */}
        {(() => {
          const currentFieldIndex = fields.findIndex(f => f.id === localField.id)
          const availableFields = fields.slice(0, currentFieldIndex).filter(f => f.id !== localField.id)
          
          if (availableFields.length === 0) {
            return (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add fields above this one to create conditional logic
              </p>
            )
          }

          return (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`conditional-${localField.id}`}
                  checked={!!localField.visibility}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateLocalField({
                        visibility: {
                          whenFieldId: availableFields[0].id,
                          op: 'eq',
                          value: ''
                        }
                      })
                    } else {
                      updateLocalField({ visibility: undefined })
                    }
                  }}
                  className="form-checkbox"
                />
                <label 
                  htmlFor={`conditional-${localField.id}`}
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Show this field conditionally
                </label>
              </div>

              {localField.visibility && (
                <div className="ml-6 space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Show this field when:
                  </div>
                  
                  {/* Field Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Field
                    </label>
                    <select
                      value={localField.visibility.whenFieldId}
                      onChange={(e) => {
                        updateLocalField({
                          visibility: {
                            ...localField.visibility!,
                            whenFieldId: e.target.value,
                            value: '' // Reset value when field changes
                          }
                        })
                      }}
                      className="form-select text-sm"
                    >
                      {availableFields.map(field => (
                        <option key={field.id} value={field.id}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Operator Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Condition
                    </label>
                    <select
                      value={localField.visibility.op}
                      onChange={(e) => {
                        updateLocalField({
                          visibility: {
                            ...localField.visibility!,
                            op: e.target.value as 'eq' | 'ne' | 'in' | 'gt' | 'lt',
                            value: '' // Reset value when operator changes
                          }
                        })
                      }}
                      className="form-select text-sm"
                    >
                      <option value="eq">equals</option>
                      <option value="ne">does not equal</option>
                      {(() => {
                        const triggerField = availableFields.find(f => f.id === localField.visibility?.whenFieldId)
                        if (triggerField?.type === 'rating') {
                          return (
                            <>
                              <option value="gt">greater than</option>
                              <option value="lt">less than</option>
                            </>
                          )
                        }
                        if (triggerField?.type === 'checkbox') {
                          return <option value="in">contains</option>
                        }
                        return null
                      })()}
                    </select>
                  </div>

                  {/* Value Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Value
                    </label>
                    {(() => {
                      const triggerField = availableFields.find(f => f.id === localField.visibility?.whenFieldId)
                      
                      if (!triggerField) {
                        return (
                          <input
                            type="text"
                            value={localField.visibility.value || ''}
                            onChange={(e) => {
                              updateLocalField({
                                visibility: {
                                  ...localField.visibility!,
                                  value: e.target.value
                                }
                              })
                            }}
                            className="form-input text-sm"
                            placeholder="Enter value..."
                          />
                        )
                      }

                      // MCQ field - show dropdown of options
                      if (triggerField.type === 'mcq') {
                        return (
                          <select
                            value={localField.visibility.value || ''}
                            onChange={(e) => {
                              updateLocalField({
                                visibility: {
                                  ...localField.visibility!,
                                  value: e.target.value
                                }
                              })
                            }}
                            className="form-select text-sm"
                          >
                            <option value="">Select option...</option>
                            {triggerField.options?.map(option => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )
                      }

                      // Rating field - show number input
                      if (triggerField.type === 'rating') {
                        const min = triggerField.validation?.min || 1
                        const max = triggerField.validation?.max || 5
                        return (
                          <input
                            type="number"
                            min={min}
                            max={max}
                            value={localField.visibility.value || min}
                            onChange={(e) => {
                              updateLocalField({
                                visibility: {
                                  ...localField.visibility!,
                                  value: parseInt(e.target.value)
                                }
                              })
                            }}
                            className="form-input text-sm"
                          />
                        )
                      }

                      // Checkbox field - show multi-select for "contains" operation
                      if (triggerField.type === 'checkbox' && localField.visibility.op === 'in') {
                        return (
                          <select
                            value={localField.visibility.value || ''}
                            onChange={(e) => {
                              updateLocalField({
                                visibility: {
                                  ...localField.visibility!,
                                  value: e.target.value
                                }
                              })
                            }}
                            className="form-select text-sm"
                          >
                            <option value="">Select option...</option>
                            {triggerField.options?.map(option => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )
                      }

                      // Text field - show text input
                      return (
                        <input
                          type="text"
                          value={localField.visibility.value || ''}
                          onChange={(e) => {
                            updateLocalField({
                              visibility: {
                                ...localField.visibility!,
                                value: e.target.value
                              }
                            })
                          }}
                          className="form-input text-sm"
                          placeholder="Enter value..."
                        />
                      )
                    })()}
                  </div>

                  {/* Preview */}
                  {localField.visibility.whenFieldId && localField.visibility.value && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 p-2 rounded border">
                      <strong>Preview:</strong> This field will show when "
                      {availableFields.find(f => f.id === localField.visibility?.whenFieldId)?.label}"
                      {' '}
                      {localField.visibility.op === 'eq' && 'equals'}
                      {localField.visibility.op === 'ne' && 'does not equal'}
                      {localField.visibility.op === 'gt' && 'is greater than'}
                      {localField.visibility.op === 'lt' && 'is less than'}
                      {localField.visibility.op === 'in' && 'contains'}
                      {' '}
                      {(() => {
                        const triggerField = availableFields.find(f => f.id === localField.visibility?.whenFieldId)
                        if (triggerField?.type === 'mcq' || triggerField?.type === 'checkbox') {
                          const option = triggerField.options?.find(opt => opt.id === localField.visibility?.value)
                          return `"${option?.label || localField.visibility?.value}"`
                        }
                        return `"${localField.visibility?.value}"`
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </div>

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
