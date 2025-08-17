'use client'

import React from 'react'
import { FormField } from '@/lib/types'

interface FieldPaletteProps {
  onAddField: (type: FormField['type']) => void
  className?: string
}

const fieldTypes = [
  {
    type: 'text' as const,
    label: 'Text Input',
    description: 'Single line or multi-line text',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    type: 'mcq' as const,
    label: 'Multiple Choice',
    description: 'Single selection from options',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    type: 'checkbox' as const,
    label: 'Checkboxes',
    description: 'Multiple selections allowed',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  {
    type: 'rating' as const,
    label: 'Rating Scale',
    description: 'Star or number rating',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
]

export function FieldPalette({ onAddField, className = '' }: FieldPaletteProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Field Types
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag and drop or click to add fields to your form
        </p>
      </div>

      <div className="space-y-3">
        {fieldTypes.map((fieldType) => (
          <button
            key={fieldType.type}
            onClick={() => onAddField(fieldType.type)}
            className={`
              w-full p-4 rounded-lg border-2 border-dashed transition-all duration-200
              hover:border-solid hover:shadow-md
              ${fieldType.borderColor} ${fieldType.bgColor}
              group cursor-pointer
            `}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('fieldType', fieldType.type)
              e.dataTransfer.effectAllowed = 'copy'
            }}
          >
            <div className="flex items-center space-x-3">
              <div className={`${fieldType.color} group-hover:scale-110 transition-transform`}>
                {fieldType.icon}
              </div>
              <div className="text-left">
                <div className={`font-medium ${fieldType.color}`}>
                  {fieldType.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {fieldType.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>



    </div>
  )
}
