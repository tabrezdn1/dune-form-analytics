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
      <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'My Forms', current: true }
        ]} />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                My Forms
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage your saved forms and drafts
              </p>
            </div>
            
            <Link
              href="/builder"
              className="btn-primary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create New Form
            </Link>
          </div>
        </div>

        {/* Forms List */}
        {forms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Forms Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first form to get started with collecting responses.
            </p>
            <Link
              href="/builder"
              className="btn-primary inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Form
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {forms.map((form) => (
              <div key={form.id} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {form.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        form.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {formUtils.formatStatus(form.status)}
                      </span>
                    </div>
                    
                    {form.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {form.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{form.fields.length} fields</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-3">
                    {/* Row 1: Status Toggle */}
                    <div className="flex justify-end">
                      <ToggleSwitch
                        enabled={form.status === 'published'}
                        onChange={() => handleStatusToggle(form)}
                        onLabel="Published"
                        offLabel="Draft"
                      />
                    </div>

                    {/* Row 2: Action Icons */}
                    <div className="flex items-center space-x-2">
                      {/* Share Button - Only for published forms */}
                      {form.status === 'published' && (
                        <button
                          onClick={() => handleShare(form)}
                          className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
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
                          className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
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
                          className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
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
                        className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
                        title="Edit form"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      {/* Delete Button */}
                      <button
                        onClick={() => openDeleteModal(form)}
                        className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
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
