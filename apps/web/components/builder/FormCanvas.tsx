'use client'

import React from 'react'
import { FormField } from '@/lib/types'
import { FieldCard } from './FieldCard'

interface FormCanvasProps {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (id: string | null) => void
  onDeleteField: (id: string) => void
  onReorderFields: (fromIndex: number, toIndex: number) => void
  onAddField: (type: FormField['type'], index?: number) => void
  className?: string
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
  onReorderFields,
  onAddField,
  className = ''
}: FormCanvasProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('fieldIndex', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    const draggedIndexStr = e.dataTransfer.getData('fieldIndex')
    const fieldType = e.dataTransfer.getData('fieldType')
    
    if (fieldType) {
      // Adding new field from palette
      onAddField(fieldType as FormField['type'], dropIndex)
    } else if (draggedIndexStr) {
      // Reordering existing field
      const dragIndex = parseInt(draggedIndexStr)
      if (dragIndex !== dropIndex) {
        onReorderFields(dragIndex, dropIndex)
      }
    }
    
    setDraggedIndex(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropIndex(null)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    const fieldType = e.dataTransfer.getData('fieldType')
    if (fieldType) {
      onAddField(fieldType as FormField['type'])
    }
  }

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  if (fields.length === 0) {
    return (
      <div
        className={`
          min-h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg
          flex items-center justify-center p-8 transition-colors
          hover:border-gray-400 dark:hover:border-gray-500
          ${className}
        `}
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Start Building Your Form
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
            Drag field types from the palette or click the buttons below to add your first field
          </p>
          
          <div className="flex flex-wrap justify-center gap-2">
            {(['text', 'mcq', 'checkbox', 'rating'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onAddField(type)}
                className="btn-outline text-xs py-1 px-3"
              >
                Add {type === 'mcq' ? 'Multiple Choice' : type === 'checkbox' ? 'Checkboxes' : type}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`space-y-4 ${className}`}
      onDrop={handleCanvasDrop}
      onDragOver={handleCanvasDragOver}
    >
      {/* Form preview header */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Form Preview
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This is how your form will appear to users. Click fields to edit, drag to reorder.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className={`
              relative transition-all duration-200
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
              ${dropIndex === index ? 'transform translate-y-1' : ''}
            `}
          >
            {/* Drop zone indicator */}
            {dropIndex === index && (
              <div className="absolute -top-2 left-0 right-0 h-1 bg-primary-500 rounded-full" />
            )}

            <FieldCard
              field={field}
              isSelected={selectedFieldId === field.id}
              onSelect={() => onSelectField(field.id)}
              onDelete={() => onDeleteField(field.id)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className="group"
            />
          </div>
        ))}
      </div>

      {/* Add field zones between fields */}
      <div className="space-y-3">
        {fields.map((_, index) => (
          <div
            key={`drop-zone-${index}`}
            className="h-2 border-2 border-dashed border-transparent hover:border-primary-300 dark:hover:border-primary-600 rounded transition-colors"
            onDragOver={(e) => handleDragOver(e, index + 1)}
            onDrop={(e) => handleDrop(e, index + 1)}
          />
        ))}
      </div>

      {/* Footer stats */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            {fields.length} field{fields.length !== 1 ? 's' : ''} in form
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{fields.filter(f => f.required).length} required</span>
            <span>{fields.filter(f => f.validation).length} validated</span>
          </div>
        </div>
      </div>
    </div>
  )
}
