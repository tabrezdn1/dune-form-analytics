import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicFormView } from './PublicFormView'
import { ThemeScript } from '@/components/ui/ThemeScript'
import { api } from '@/lib/api'

// Disable static generation and caching for this dynamic route
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        title: 'Form Not Found - Dune Forms',
      }
    }

    return {
      title: `${form.title} - Dune Forms`,
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
      title: 'Form Not Found - Dune Forms',
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

    return (
      <>
        <ThemeScript />
        <PublicFormView form={form} />
      </>
    )
  } catch (error) {
    notFound()
  }
}
