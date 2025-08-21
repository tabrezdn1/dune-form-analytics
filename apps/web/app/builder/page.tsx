'use client'

import React, { useState, useEffect } from 'react'

// Disable static generation and caching for this protected route
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { useFormBuilder } from '@/lib/form-builder-state'
import { FieldPalette } from '@/components/builder/FieldPalette'
import { FormCanvas } from '@/components/builder/FormCanvas'
import { FieldInspector } from '@/components/builder/FieldInspector'
import { FormRenderer } from '@/components/forms/FormRenderer'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function FormBuilderPage() {
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
  } = useFormBuilder()

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
      
      // Create form
      const createResponse = await api.createForm(formData)
      
      if (!createResponse.success) {
        throw new Error(createResponse.error || 'Failed to create form')
      }
      
      const form = createResponse.data
      if (!form) {
        throw new Error('Failed to create form')
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
          : 'Form saved as draft!'
      )
      
      // Redirect to analytics dashboard
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

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Form Builder', current: true }
  ]

  const headerActions = (
    <>
      {isDirty && (
        <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Unsaved changes
          </span>
        </div>
      )}
      
      {/* Modern Tab switcher */}
      <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-1.5 shadow-inner">
        <button
          onClick={() => setActiveTab('build')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'build'
              ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-lg transform scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>Build</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
            activeTab === 'preview'
              ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-lg transform scale-105'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Preview</span>
          </span>
        </button>
      </div>

      {/* Modern Action buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => handleSave(false)}
          disabled={!canSave() || isSaving}
          className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Save Draft</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => handleSave(true)}
          disabled={!canSave() || isSaving}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Publish</span>
            </>
          )}
        </button>
      </div>
    </>
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen relative overflow-hidden">
        {/* Complementary Theme Spotlight Background */}
        <div className="absolute inset-0 bg-white dark:bg-gray-900"></div>
        
        {/* Light Theme: Normal Green Spotlight */}
        <div 
          className="absolute inset-0 dark:hidden"
          style={{
            background: `radial-gradient(ellipse 140% 100% at 50% 50%, 
              transparent 0%, 
              transparent 25%, 
              rgb(34 197 94 / 0.08) 45%,
              rgb(22 163 74 / 0.15) 65%,
              rgb(21 128 61 / 0.25) 85%,
              rgb(20 83 45 / 0.35) 100%)`
          }}
        ></div>
        
        {/* Dark Theme: Deep Emerald Spotlight */}
        <div 
          className="absolute inset-0 hidden dark:block"
          style={{
            background: `radial-gradient(ellipse 140% 100% at 50% 50%, 
              transparent 0%, 
              transparent 20%, 
              rgb(6 78 59 / 0.15) 40%,
              rgb(6 78 59 / 0.3) 60%,
              rgb(4 47 46 / 0.5) 80%,
              rgb(6 78 59 / 0.7) 100%)`
          }}
        ></div>
        
        {/* Light Theme: Corner Effects */}
        <div 
          className="absolute inset-0 opacity-60 dark:hidden"
          style={{
            background: `
              radial-gradient(circle at 0% 0%, rgb(21 128 61 / 0.2) 0%, transparent 50%),
              radial-gradient(circle at 100% 0%, rgb(34 197 94 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 0% 100%, rgb(22 163 74 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, rgb(21 128 61 / 0.2) 0%, transparent 50%)`
          }}
        ></div>
        
        {/* Dark Theme: Deep Emerald Corners */}
        <div 
          className="absolute inset-0 opacity-80 hidden dark:block"
          style={{
            background: `
              radial-gradient(circle at 0% 0%, rgb(6 78 59 / 0.4) 0%, transparent 50%),
              radial-gradient(circle at 100% 0%, rgb(4 47 46 / 0.3) 0%, transparent 50%),
              radial-gradient(circle at 0% 100%, rgb(6 78 59 / 0.3) 0%, transparent 50%),
              radial-gradient(circle at 100% 100%, rgb(4 47 46 / 0.5) 0%, transparent 50%)`
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={breadcrumbs} />
          
          {/* Modern Page Header */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      Form Builder
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      Create dynamic forms with drag-and-drop interface
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {headerActions}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
      
      {activeTab === 'build' ? (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Field Palette - Modern Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
                  <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Field Library</span>
                  </h3>
                  <p className="text-emerald-100 text-sm mt-1">Drag fields to add them</p>
                </div>
                <div className="p-4">
                  <FieldPalette onAddField={addField} />
                </div>
              </div>
            </div>
          </div>

          {/* Form Canvas - Main Center Area */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Canvas Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Form Designer</span>
                </h3>
                
                {/* Form metadata with modern styling */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Form Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-all duration-200"
                      placeholder="Enter form title..."
                    />
                    {errors.title && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                        {errors.title}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400 transition-all duration-200 resize-none"
                      rows={2}
                      placeholder="Describe what this form is for..."
                    />
                  </div>
                </div>
              </div>

              {/* Canvas Body */}
              <div className="p-6">
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

          {/* Field Inspector - Modern Right Sidebar */}
          <div className="lg:col-span-3">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4">
                  <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <span>Field Settings</span>
                  </h3>
                  <p className="text-purple-100 text-sm mt-1">Configure selected field</p>
                </div>
                <div className="p-4">
                  {!selectedField ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 dark:text-gray-500 mb-3">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Select a field to customize its properties
                      </p>
                    </div>
                  ) : (
                    <FieldInspector
                      field={selectedField}
                      fields={fields}
                      onUpdate={(updates) => {
                        if (selectedField) {
                          updateField(selectedField.id, updates)
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : (
          /* Modern Preview Tab */
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Preview Header */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
                <div className="flex items-center justify-center space-x-3 text-white mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <h2 className="text-2xl font-bold">Live Preview</h2>
                </div>
                <p className="text-emerald-100 text-center">See how your form will look to users</p>
              </div>
              
              {/* Form Preview Content */}
              <div className="p-8">
                <div className="mb-8 text-center">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                    {title || 'Untitled Form'}
                  </h3>
                  {description && (
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      {description}
                    </p>
                  )}
                </div>

                {fields.length > 0 ? (
                  <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <FormRenderer
                      fields={fields}
                      onSubmit={handlePreviewSubmit}
                      showProgress={true}
                    />
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Fields Yet
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Switch to the Build tab and add some fields to see the preview
                    </p>
                    <button
                      onClick={() => setActiveTab('build')}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span>Start Building</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Modern Floating action button for mobile */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-2xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95"
        >
          {showPreview ? (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Modern Mobile preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden">
          <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-white text-lg">Form Preview</h3>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-[calc(100%-80px)] overflow-auto p-6">
              {fields.length > 0 ? (
                <div>
                  <div className="mb-6 text-center">
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {title || 'Untitled Form'}
                    </h4>
                    {description && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                  <FormRenderer
                    fields={fields}
                    onSubmit={handlePreviewSubmit}
                    showProgress={true}
                  />
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Fields Yet
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Add some fields to see the preview
                  </p>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Start Building
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
