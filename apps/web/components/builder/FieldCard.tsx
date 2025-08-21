'use client'

import React from 'react'
import { FormField } from '@/lib/types'

interface FieldCardProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd?: () => void
  className?: string
}

export function FieldCard({
  field,
  isSelected,
  onSelect,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  className = ''
}: FieldCardProps) {
  const getFieldTypeIcon = () => {
    switch (field.type) {
      case 'text':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'mcq':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'checkbox':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case 'rating':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getFieldTypeColor = () => {
    switch (field.type) {
      case 'text': return 'text-blue-600 dark:text-blue-400'
      case 'mcq': return 'text-green-600 dark:text-green-400'
      case 'checkbox': return 'text-purple-600 dark:text-purple-400'
      case 'rating': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const renderFieldPreview = () => {
    switch (field.type) {
      case 'text':
        return (
          <div className="mt-2">
            <input
              type="text"
              placeholder="Text input preview..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              disabled
            />
          </div>
        )

      case 'mcq':
        return (
          <div className="mt-2 space-y-2">
            {field.options?.slice(0, 3).map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`preview-${field.id}`}
                  className="text-sm"
                  disabled
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {option.label}
                </span>
              </div>
            ))}
            {field.options && field.options.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{field.options.length - 3} more options
              </div>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div className="mt-2 space-y-2">
            {field.options?.slice(0, 3).map((option, index) => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="text-sm"
                  disabled
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {option.label}
                </span>
              </div>
            ))}
            {field.options && field.options.length > 3 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                +{field.options.length - 3} more options
              </div>
            )}
          </div>
        )

      case 'rating':
        return (
          <div className="mt-2 flex items-center space-x-1">
            {Array.from({ length: Math.min(field.validation?.max || 5, 5) }, (_, index) => (
              <svg
                key={index}
                className="w-4 h-4 text-gray-300 dark:text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {field.validation?.min || 1} - {field.validation?.max || 5}
            </span>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`
        relative pl-8 pr-4 py-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }
        ${className}
      `}
      onClick={onSelect}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Drag handle */}
      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <div className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
          <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>

      {/* Field header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={getFieldTypeColor()}>
            {getFieldTypeIcon()}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {field.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {field.type} field
              {field.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          {isSelected && (
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete field"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Field preview */}
      {renderFieldPreview()}

      {/* Field metadata */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          {field.validation && (
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              Validated
            </span>
          )}
          {field.options && (
            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {field.options.length} options
            </span>
          )}
        </div>
        
        <div className="text-gray-400">
          ID: {field.id}
        </div>
      </div>
    </div>
  )
}
