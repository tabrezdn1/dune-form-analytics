import React, { useCallback } from 'react'
import { useAsync } from './useAsync'
import { useAppContext } from '@/lib/contexts/AppContext'
import { api } from '@/lib/api'
import { Form, Analytics, FormResponse, PaginatedResponse } from '@/lib/types'

// API hooks with comprehensive error handling and loading states

export function useFormOperations() {
  const { actions } = useAppContext()

  const createForm = useAsync(
    async (formData: any) => {
      actions.setOperationLoading('createForm', true)
      try {
        const result = await api.createForm(formData)
        actions.setOperationError('createForm', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create form'
        actions.setOperationError('createForm', message)
        throw error
      } finally {
        actions.setOperationLoading('createForm', false)
      }
    },
    {
      onSuccess: () => actions.clearErrors(),
    }
  )

  const updateForm = useAsync(
    async (formId: string, formData: any) => {
      actions.setOperationLoading('updateForm', true)
      try {
        const result = await api.updateForm(formId, formData)
        actions.setOperationError('updateForm', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update form'
        actions.setOperationError('updateForm', message)
        throw error
      } finally {
        actions.setOperationLoading('updateForm', false)
      }
    }
  )

  const deleteForm = useAsync(
    async (formId: string) => {
      actions.setOperationLoading('deleteForm', true)
      try {
        const result = await api.deleteForm(formId)
        actions.setOperationError('deleteForm', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete form'
        actions.setOperationError('deleteForm', message)
        throw error
      } finally {
        actions.setOperationLoading('deleteForm', false)
      }
    }
  )

  const publishForm = useAsync(
    async (formId: string) => {
      actions.setOperationLoading('publishForm', true)
      try {
        const result = await api.publishForm(formId)
        actions.setOperationError('publishForm', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to publish form'
        actions.setOperationError('publishForm', message)
        throw error
      } finally {
        actions.setOperationLoading('publishForm', false)
      }
    }
  )

  return {
    createForm,
    updateForm,
    deleteForm,
    publishForm,
  }
}

export function useFormData(formId?: string) {
  const { actions } = useAppContext()

  const fetchForm = useAsync(
    async (id: string) => {
      actions.setOperationLoading('fetchForm', true)
      try {
        const result = await api.getForm(id)
        actions.setOperationError('fetchForm', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch form'
        actions.setOperationError('fetchForm', message)
        throw error
      } finally {
        actions.setOperationLoading('fetchForm', false)
      }
    },
    {
      immediate: !!formId,
    }
  )

  const fetchForms = useAsync(
    async (page = 1, limit = 20) => {
      actions.setOperationLoading('fetchForms', true)
      try {
        const result = await api.listForms(page, limit)
        actions.setOperationError('fetchForms', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch forms'
        actions.setOperationError('fetchForms', message)
        throw error
      } finally {
        actions.setOperationLoading('fetchForms', false)
      }
    }
  )

  // Auto-fetch form if ID provided
  React.useEffect(() => {
    if (formId) {
      fetchForm.execute(formId)
    }
  }, [formId])

  return {
    form: fetchForm.data,
    forms: fetchForms.data,
    fetchForm: fetchForm.execute,
    fetchForms: fetchForms.execute,
    loading: fetchForm.loading || fetchForms.loading,
    error: fetchForm.error || fetchForms.error,
  }
}

export function useAnalyticsData(formId?: string) {
  const { actions } = useAppContext()

  const fetchAnalytics = useAsync(
    async (id: string) => {
      actions.setOperationLoading('fetchAnalytics', true)
      try {
        const result = await api.getAnalytics(id)
        actions.setOperationError('fetchAnalytics', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch analytics'
        actions.setOperationError('fetchAnalytics', message)
        throw error
      } finally {
        actions.setOperationLoading('fetchAnalytics', false)
      }
    }
  )

  const exportCSV = useAsync(
    async (id: string, params?: { startDate?: string; endDate?: string }) => {
      actions.setOperationLoading('exportCSV', true)
      try {
        const result = await api.exportResponsesCSV(id, params)
        actions.setOperationError('exportCSV', null)
        return result
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to export CSV'
        actions.setOperationError('exportCSV', message)
        throw error
      } finally {
        actions.setOperationLoading('exportCSV', false)
      }
    }
  )

  // Auto-fetch analytics if form ID provided
  React.useEffect(() => {
    if (formId) {
      fetchAnalytics.execute(formId)
    }
  }, [formId])

  return {
    analytics: fetchAnalytics.data,
    fetchAnalytics: fetchAnalytics.execute,
    exportCSV: exportCSV.execute,
    loading: fetchAnalytics.loading || exportCSV.loading,
    error: fetchAnalytics.error || exportCSV.error,
  }
}
