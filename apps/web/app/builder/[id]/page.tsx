import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import FormBuilderClient from './FormBuilderClient'

interface BuilderPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: BuilderPageProps): Promise<Metadata> {
  try {
    const response = await api.getForm(params.id)
    const form = response.data

    if (!form) {
      return {
        title: 'Form Not Found - Dune Form Analytics',
      }
    }

    return {
      title: `Edit ${form.title} - Form Builder`,
      description: `Edit the ${form.title} form`,
    }
  } catch (error) {
    return {
      title: 'Form Not Found - Dune Form Analytics',
    }
  }
}

export default async function EditFormPage({ params }: BuilderPageProps) {
  try {
    const response = await api.getForm(params.id)
    
    if (!response.success || !response.data) {
      notFound()
    }

    const form = response.data

    return (
      <ProtectedRoute>
        <FormBuilderClient initialForm={form} />
      </ProtectedRoute>
    )
  } catch (error) {
    notFound()
  }
}
