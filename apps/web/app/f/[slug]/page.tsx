import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicFormView } from './PublicFormView'
import { api } from '@/lib/api'

interface PublicFormPageProps {
  params: { slug: string }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PublicFormPageProps): Promise<Metadata> {
  try {
    const response = await api.getPublicForm(params.slug)
    const form = response.data

    if (!form) {
      return {
        title: 'Form Not Found - Dune Form Analytics',
      }
    }

    return {
      title: `${form.title} - Dune Form Analytics`,
      description: form.description || `Fill out the ${form.title} form`,
      openGraph: {
        title: form.title,
        description: form.description || `Fill out the ${form.title} form`,
        type: 'website',
      },
      robots: {
        index: true,
        follow: true,
      },
    }
  } catch (error) {
    return {
      title: 'Form Not Found - Dune Form Analytics',
    }
  }
}

export default async function PublicFormPage({ params }: PublicFormPageProps) {
  try {
    const response = await api.getPublicForm(params.slug)
    const form = response.data

    if (!form) {
      notFound()
    }

    return <PublicFormView form={form} />
  } catch (error) {
    notFound()
  }
}
