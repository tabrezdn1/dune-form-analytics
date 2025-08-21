'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { FormField } from '@/lib/types'
import { FieldCard } from './FieldCard'

// Insertion line indicator component
interface InsertionLineProps {
  dropTargetIndex: number
  fieldPositions: { top: number; center: number; bottom: number }[]
  fieldsLength: number
}

const InsertionLine = ({ dropTargetIndex, fieldPositions, fieldsLength }: InsertionLineProps) => {
  let insertionTop = 16 // Default top position
  
  if (dropTargetIndex === 0) {
    insertionTop = 16
  } else if (dropTargetIndex >= fieldsLength) {
    // Position after last field using cached positions
    const lastPosition = fieldPositions[fieldsLength - 1]
    if (lastPosition) {
      insertionTop = lastPosition.bottom + 8
    }
  } else if (fieldPositions[dropTargetIndex]) {
    // Position before target field using cached positions  
    insertionTop = fieldPositions[dropTargetIndex].top - 8
  }

  return (
    <div
      className="absolute left-0 right-0 h-0.5 bg-emerald-500 z-10 transition-all duration-200 shadow-lg"
      style={{ top: `${insertionTop}px` }}
    >
      <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-500 rounded-full shadow-md"></div>
      <div className="absolute left-4 transform -translate-y-1/2 bg-emerald-500 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
        Insert at position {dropTargetIndex + 1}
      </div>
    </div>
  )
}

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
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Memoized field positions to avoid recalculating on every mousemove
  const fieldPositions = useRef<{ top: number; center: number; bottom: number }[]>([])
  
  // Update field positions when fields change or after layout updates
  const updateFieldPositions = useCallback(() => {
    if (!canvasRef.current || fields.length === 0) {
      fieldPositions.current = []
      return
    }

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const newPositions: { top: number; center: number; bottom: number }[] = []
    
    const fieldElements = canvasRef.current.querySelectorAll('[data-field-index]')
    fieldElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect()
      const relativeTop = rect.top - canvasRect.top
      const relativeBottom = rect.bottom - canvasRect.top
      newPositions[index] = {
        top: relativeTop,
        center: relativeTop + (rect.height / 2),
        bottom: relativeBottom
      }
    })
    
    fieldPositions.current = newPositions
  }, [fields.length])

  // Update field positions when fields change or component mounts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFieldPositions()
    }, 0) // Allow DOM to update first
    
    return () => clearTimeout(timeoutId)
  }, [updateFieldPositions, fields])

  const handleFieldDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('fieldIndex', index.toString())
    updateFieldPositions() // Ensure positions are fresh
  }, [updateFieldPositions])

  const handleFieldDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
    setIsDragOverCanvas(false)
  }, [])

  // Calculate the best insertion index based on mouse position (optimized)
  const calculateDropIndex = useCallback((e: React.DragEvent): number => {
    if (!canvasRef.current || fields.length === 0) return 0

    const canvasRect = canvasRef.current.getBoundingClientRect()
    const mouseY = e.clientY - canvasRect.top

    // Use cached positions instead of DOM queries
    for (let i = 0; i < fieldPositions.current.length; i++) {
      const position = fieldPositions.current[i]
      if (mouseY < position.center) {
        return i
      }
    }

    // If we get here, insert at the end
    return fields.length
  }, [fields.length])

  const handleCanvasOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // We're in a drag operation if we have a dragged field or if there are drag data types
    const hasDragData = e.dataTransfer.types.length > 0
    const isFieldReorder = draggedIndex !== null
    const isPaletteDrag = hasDragData && !isFieldReorder
    
    if (isFieldReorder || isPaletteDrag) {
      e.dataTransfer.dropEffect = isFieldReorder ? 'move' : 'copy'
      setIsDragOverCanvas(true)
      
      // Calculate where we would insert
      const targetIndex = calculateDropIndex(e)
      setDropTargetIndex(targetIndex)
    }
  }, [draggedIndex, calculateDropIndex])

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const draggedIndexStr = e.dataTransfer.getData('fieldIndex')
      const fieldType = e.dataTransfer.getData('fieldType')
      const targetIndex = calculateDropIndex(e)
      
      if (fieldType && !draggedIndexStr) {
        // Adding new field from palette
        onAddField(fieldType as FormField['type'], targetIndex)
      } else if (draggedIndexStr) {
        // Reordering existing field
        const dragIndex = parseInt(draggedIndexStr, 10)
        
        // Validate the drag index
        if (isNaN(dragIndex) || dragIndex < 0 || dragIndex >= fields.length) {
          console.warn('Invalid drag index:', dragIndex)
          return
        }
        
        let adjustedTargetIndex = targetIndex
        
        // If dragging down, adjust target index to account for the removal
        if (dragIndex < targetIndex) {
          adjustedTargetIndex = targetIndex - 1
        }
        
        // Only reorder if the position actually changes
        if (dragIndex !== adjustedTargetIndex && adjustedTargetIndex >= 0) {
          onReorderFields(dragIndex, adjustedTargetIndex)
        }
      }
    } catch (error) {
      console.error('Error handling canvas drop:', error)
    } finally {
      handleFieldDragEnd()
    }
  }, [calculateDropIndex, onAddField, onReorderFields, fields.length, handleFieldDragEnd])

  if (fields.length === 0) {
    return (
      <div
        ref={canvasRef}
        className={`min-h-96 border-2 border-dashed rounded-lg flex items-center justify-center p-8 transition-all duration-200 ${
          isDragOverCanvas 
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.02]' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${className}`}
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasOver}
        onDragLeave={() => setIsDragOverCanvas(false)}
      >
        <div className="text-center pointer-events-none">
          <div className="text-gray-400 dark:text-gray-500 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
            Start Building Your Form
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
            <span className="hidden sm:inline">Drag field types from the left palette to this area, or </span>
            <span className="sm:hidden">Tap the buttons below or </span>
            <span className="hidden sm:inline">use the quick-add buttons below</span>
            <span className="sm:hidden">select field types from the left panel</span>
          </p>
          
          {/* Visual drag indication */}
          <div className="mb-6 pointer-events-none">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Drop fields here</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 pointer-events-auto">
            {(['text', 'mcq', 'checkbox', 'rating'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onAddField(type)}
                className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation active:scale-95"
              >
                Add {type === 'mcq' ? 'Multiple Choice' : type === 'checkbox' ? 'Checkboxes' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Form preview header */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Form Preview
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="hidden sm:inline">Drag fields anywhere to reorder them or drop new fields from the palette.</span>
          <span className="sm:hidden">Click fields to edit, tap and hold to reorder.</span>
        </p>
      </div>

      {/* Canvas - Entire area is droppable */}
      <div
        ref={canvasRef}
        className={`relative min-h-32 p-4 rounded-lg border-2 transition-all duration-200 ${
          isDragOverCanvas 
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 scale-[1.01]' 
            : 'border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasOver}
        onDragLeave={(e) => {
          // Only hide if we're actually leaving the canvas (not just moving to a child element)
          if (!canvasRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragOverCanvas(false);
            setDropTargetIndex(null);
          }
        }}
      >
        {/* Insertion line indicator */}
        {isDragOverCanvas && dropTargetIndex !== null && (
          <InsertionLine
            dropTargetIndex={dropTargetIndex}
            fieldPositions={fieldPositions.current}
            fieldsLength={fields.length}
          />
        )}

        {/* Fields */}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              data-field-index={index}
              className={`transition-all duration-200 ${
                draggedIndex === index ? 'opacity-50 scale-95' : ''
              }`}
            >
              <FieldCard
                field={field}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onSelectField(field.id)}
                onDelete={() => onDeleteField(field.id)}
                onDragStart={(e) => handleFieldDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                onDragEnd={handleFieldDragEnd}
                className="group cursor-grab active:cursor-grabbing"
              />
            </div>
          ))}

          {/* Instructions when dragging */}
          {isDragOverCanvas && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg text-sm font-medium border border-emerald-200 dark:border-emerald-800">
                {dropTargetIndex !== null 
                  ? `Drop to insert at position ${dropTargetIndex + 1}` 
                  : 'Drop anywhere to add field'
                }
              </div>
            </div>
          )}
        </div>
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