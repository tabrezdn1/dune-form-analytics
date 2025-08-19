'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()
  
  // Auto-generate breadcrumbs if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname)

  if (breadcrumbItems.length <= 1) {
    return null // Don't show breadcrumbs for single-level pages
  }

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            
            {item.current || !item.href ? (
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Auto-generate breadcrumbs based on pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' }
  ]

  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Custom labels for specific routes
    const label = getBreadcrumbLabel(segment, segments, index)
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast
    })
  })

  return breadcrumbs
}

// Get human-readable labels for breadcrumb segments
function getBreadcrumbLabel(segment: string, segments: string[], index: number): string {
  // Handle specific route patterns
  switch (segment) {
    case 'forms':
      return 'My Forms'
    case 'builder':
      return segments[index + 1] ? 'Edit Form' : 'Form Builder'
    case 'dashboard':
      return 'Analytics'
    case 'f':
      return 'Public Form'
    default:
      // For dynamic segments (IDs, slugs), try to make them more readable
      if (segment.length > 20) {
        return `Form ${segment.substring(0, 8)}...` // Truncate long IDs
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
  }
}

// Hook to get current breadcrumbs
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()
  return generateBreadcrumbs(pathname)
}
