'use client'

import React, { useState, useEffect, useRef } from 'react'

// Disable static generation and caching for this protected route
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Link from 'next/link'
import { Form } from '@/lib/types'
import { api, formUtils } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { copyToClipboard } from '@/lib/clipboard'
import toast from 'react-hot-toast'

export default function MyFormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    formId: string
    formTitle: string
  }>({
    isOpen: false,
    formId: '',
    formTitle: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    loadForms()
  }, [])

  const loadForms = async () => {
    try {
      setIsLoading(true)
      const response = await api.listForms()
      setForms(response.data)
    } catch (error) {
      toast.error('Failed to load forms')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async (formId: string) => {
    try {
      await api.publishForm(formId)
      toast.success('Form published successfully!')
      loadForms() // Refresh the list
    } catch (error) {
      toast.error('Failed to publish form')
    }
  }

  const handleUnpublish = async (formId: string) => {
    try {
      await api.unpublishForm(formId)
      toast.success('Form unpublished successfully!')
      loadForms() // Refresh the list
    } catch (error) {
      toast.error('Failed to unpublish form')
    }
  }

  const handleStatusToggle = async (form: Form) => {
    if (form.status === 'published') {
      await handleUnpublish(form.id)
    } else {
      await handlePublish(form.id)
    }
  }

  const handleShare = async (form: Form) => {
    if (!form.shareSlug) {
      toast.error('Form must be published to share')
      return
    }

    const shareUrl = formUtils.getFormShareURL(form.shareSlug)
    const success = await copyToClipboard(shareUrl)
    
    if (success) {
      toast.success('Link copied to clipboard!')
    } else {
      toast.error('Failed to copy link')
    }
  }

  const openDeleteModal = (form: Form) => {
    setDeleteModal({
      isOpen: true,
      formId: form.id,
      formTitle: form.title
    })
  }

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      formId: '',
      formTitle: ''
    })
  }

  const handleDelete = async () => {
    if (!deleteModal.formId) return

    try {
      setIsDeleting(true)
      await api.deleteForm(deleteModal.formId)
      toast.success('Form deleted successfully!')
      loadForms() // Refresh the list
      closeDeleteModal()
    } catch (error) {
      toast.error('Failed to delete form')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

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
          <Breadcrumbs items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Forms', current: true }
          ]} />
          
          {/* Modern Header */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      My Forms
                    </h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">
                      Manage your saved forms and drafts
                    </p>
                  </div>
                </div>
                
                <Link
                  href="/builder"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create New Form</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Modern Forms List */}
          {forms.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-200/50 dark:border-emerald-700/30 p-12">
              <div className="text-center">
                <div className="text-gray-400 dark:text-gray-500 mb-6">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                  No Forms Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto text-lg">
                  Create your first form to start collecting responses and analyzing data.
                </p>
                <Link
                  href="/builder"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Your First Form</span>
                </Link>
              </div>
            </div>
          ) : (
          <div className="grid gap-6">
            {forms.map((form) => (
              <div key={form.id} className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/90 dark:backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-200/50 dark:border-emerald-700/30 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10 p-8 transition-all duration-300 hover:bg-white/95 dark:hover:bg-gray-800/95">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-3 h-3 rounded-full ${
                        form.status === 'published' 
                          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                          : 'bg-yellow-500 shadow-lg shadow-yellow-500/30'
                      }`}></div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {form.title}
                      </h3>
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${
                        form.status === 'published' 
                          ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-200'
                          : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900/30 dark:to-orange-900/30 dark:text-yellow-200'
                      }`}>
                        {form.status === 'published' ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    
                    {form.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg leading-relaxed">
                        {form.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-8 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">{form.fields.length} fields</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-lg">
                        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Created {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-4">
                    {/* Modern Status Toggle */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {form.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      <ToggleSwitch
                        enabled={form.status === 'published'}
                        onChange={() => handleStatusToggle(form)}
                        onLabel=""
                        offLabel=""
                      />
                    </div>

                    {/* Modern Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Share Button - Only for published forms */}
                      {form.status === 'published' && (
                        <button
                          onClick={() => handleShare(form)}
                          className="p-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-all duration-200 hover:scale-105"
                          title="Copy share link"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                      )}

                      {/* Open in New Tab Button - Only for published forms */}
                      {form.status === 'published' && (
                        <a
                          href={formUtils.getFormShareURL(form.shareSlug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all duration-200 hover:scale-105"
                          title="Open form in new tab"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}

                      {/* Analytics Button - Only for published forms */}
                      {form.status === 'published' && (
                        <Link
                          href={`/forms/${form.id}`}
                          className="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all duration-200 hover:scale-105"
                          title="View analytics"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </Link>
                      )}

                      {/* Edit Button */}
                      <Link
                        href={`/builder/${form.id}`}
                        className="p-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Edit form"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => openDeleteModal(form)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all duration-200 hover:scale-105"
                        title="Delete form"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
                )}
        </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Delete Form"
        message={`Are you sure you want to delete "${deleteModal.formTitle}"? This action cannot be undone and all responses will be permanently lost.`}
        confirmText="Delete Form"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </ProtectedRoute>
  )
}
