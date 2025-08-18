'use client'

import React, { useState } from 'react'
import { PublicForm } from '@/lib/types'
import { FormRenderer } from '@/components/forms/FormRenderer'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface PublicFormViewProps {
  form: PublicForm
}

export function PublicFormView({ form }: PublicFormViewProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: { answers: Array<{ fieldId: string; value: any }> }) => {
    setIsSubmitting(true)
    
    try {
      const result = await api.submitResponse(form.id, {
        answers: data.answers,
        meta: {
          // Add any additional metadata
          referrer: document.referrer || undefined,
        },
      })

      if (result.success) {
        setIsSubmitted(true)
        toast.success('Thank you! Your response has been submitted successfully.')
      } else {
        // Handle validation errors
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map(e => e.message).join(', ')
          toast.error(`Please fix the following errors: ${errorMessages}`)
          throw { validationErrors: result.errors }
        } else {
          toast.error(result.message || 'Failed to submit response. Please try again.')
        }
      }
    } catch (error: any) {
      if (error.validationErrors) {
        // Re-throw validation errors to be handled by FormRenderer
        throw error
      }
      
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            {/* Success icon */}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Thank You!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your response has been submitted successfully. We appreciate your time and feedback.
            </p>

            <button
              onClick={() => setIsSubmitted(false)}
              className="btn-outline"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Form header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {form.title}
          </h1>
          
          {form.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              {form.description}
            </p>
          )}
        </div>

        {/* Form container */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 md:p-8">
          <FormRenderer
            fields={form.fields}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showProgress={true}
          />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by{' '}
            <a
              href="/"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Dune Form Analytics
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
