'use client'

import React, { useState, useEffect } from 'react'
import { Form } from '@/lib/types'
import { useFormBuilder } from '@/lib/form-builder-state'
import { FieldPalette } from '@/components/builder/FieldPalette'
import { FormCanvas } from '@/components/builder/FormCanvas'
import { FieldInspector } from '@/components/builder/FieldInspector'
import { FormRenderer } from '@/components/forms/FormRenderer'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface FormBuilderClientProps {
  initialForm?: Form
}

export default function FormBuilderClient({ initialForm }: FormBuilderClientProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'preview'>('build')
  const [showPreview, setShowPreview] = useState(false)

  const {
    title,
    description,
    fields,
    selectedFieldId,
    isDirty,
    isSaving,
    errors,
    setTitle,
    setDescription,
    addField,
    updateField,
    deleteField,
    reorderFields,
    selectField,
    setSaving,
    canSave,
    validateForm,
    getFormData,
    resetForm,
    loadForm,
  } = useFormBuilder()

  // Load initial form data if editing
  useEffect(() => {
    if (initialForm) {
      loadForm(initialForm)
    }
  }, [initialForm, loadForm])

  const selectedField = fields.find(field => field.id === selectedFieldId) || null

  const handleSave = async (publish = false) => {
    if (!canSave()) {
      toast.error('Please fix form errors before saving')
      return
    }

    if (!validateForm()) {
      toast.error('Please fix validation errors')
      return
    }

    setSaving(true)

    try {
      const formData = getFormData()
      
      let form
      if (initialForm) {
        // Update existing form
        const updateResponse = await api.updateForm(initialForm.id, formData)
        if (!updateResponse.success) {
          throw new Error(updateResponse.error || 'Failed to update form')
        }
        form = updateResponse.data
        if (!form) {
          throw new Error('Failed to update form - no data returned')
        }
      } else {
        // Create new form
        const createResponse = await api.createForm(formData)
        if (!createResponse.success) {
          throw new Error(createResponse.error || 'Failed to create form')
        }
        form = createResponse.data
        if (!form) {
          throw new Error('Failed to create form - no data returned')
        }
      }
      
      // Publish if requested
      if (publish) {
        const publishResponse = await api.publishForm(form.id)
        if (!publishResponse.success) {
          throw new Error(publishResponse.error || 'Failed to publish form')
        }
      }
      
      toast.success(
        publish 
          ? `Form published! Share link: ${window.location.origin}/f/${form.shareSlug}`
          : initialForm ? 'Form updated successfully!' : 'Form saved as draft!'
      )
      
      // Redirect to analytics dashboard if published
      if (publish) {
        window.location.href = `/forms/${form.id}`
      }
      
    } catch (error) {
      toast.error('Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  const handlePreviewSubmit = async (data: any) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success('Preview submitted!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {initialForm ? 'Edit Form' : 'Form Builder'}
              </h1>
              
              {isDirty && (
                <span className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Tab switcher */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('build')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'build'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Build
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Preview
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={!canSave() || isSaving}
                  className="btn-outline"
                >
                  {isSaving ? 'Saving...' : initialForm ? 'Update Draft' : 'Save Draft'}
                </button>
                
                <button
                  onClick={() => handleSave(true)}
                  disabled={!canSave() || isSaving}
                  className="btn-primary"
                >
                  {isSaving ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Forms', href: '/forms' },
          { label: `Edit: ${title || 'Untitled Form'}`, current: true }
        ]} />
        
        {activeTab === 'build' ? (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Field Palette */}
            <div className="lg:col-span-3">
              <div className="sticky top-8">
                <FieldPalette onAddField={addField} />
              </div>
            </div>

            {/* Form Canvas */}
            <div className="lg:col-span-6">
              <div className="card p-6">
                {/* Form metadata */}
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Form Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                      placeholder="Enter form title..."
                    />
                    {errors.title && (
                      <div className="form-error">{errors.title}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="form-textarea"
                      rows={2}
                      placeholder="Enter form description..."
                    />
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <FormCanvas
                    fields={fields}
                    selectedFieldId={selectedFieldId}
                    onSelectField={selectField}
                    onDeleteField={deleteField}
                    onReorderFields={reorderFields}
                    onAddField={addField}
                  />
                </div>
              </div>
            </div>

            {/* Field Inspector */}
            <div className="lg:col-span-3">
              <div className="sticky top-8">
                <div className="card">
                  <FieldInspector
                    field={selectedField}
                    fields={fields}
                    onUpdate={(updates) => {
                      if (selectedField) {
                        updateField(selectedField.id, updates)
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Tab */
          <div className="max-w-2xl mx-auto">
            <div className="card p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {title || 'Untitled Form'}
                </h2>
                {description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {description}
                  </p>
                )}
              </div>

              {fields.length > 0 ? (
                <FormRenderer
                  fields={fields}
                  onSubmit={handlePreviewSubmit}
                  showProgress={true}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Add some fields to see the preview
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating action button for mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
        >
          {showPreview ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-lg overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {fields.length > 0 ? (
                <FormRenderer
                  fields={fields}
                  onSubmit={handlePreviewSubmit}
                  showProgress={true}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Add some fields to see the preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
