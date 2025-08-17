'use client'

import React from 'react'
import { AnalyticsDashboard } from '../[id]/AnalyticsDashboard'
import { Form, Analytics } from '@/lib/types'

// Mock data for demonstration
const mockForm: Form = {
  id: '507f1f77bcf86cd799439011',
  title: 'Sample Feedback Form',
  description: 'A sample form to test the application',
  status: 'published',
  shareSlug: 'sample-feedback-form',
  fields: [
    {
      id: 'f1',
      type: 'text',
      label: "What's your name?",
      required: true,
      validation: {
        minLen: 2,
        maxLen: 100
      }
    },
    {
      id: 'f2',
      type: 'rating',
      label: 'How would you rate our service?',
      required: true,
      validation: {
        min: 1,
        max: 5
      }
    },
    {
      id: 'f3',
      type: 'mcq',
      label: 'How did you hear about us?',
      required: false,
      options: [
        { id: 'o1', label: 'Social Media' },
        { id: 'o2', label: 'Google Search' },
        { id: 'o3', label: 'Friend Referral' },
        { id: 'o4', label: 'Advertisement' }
      ]
    },
    {
      id: 'f4',
      type: 'checkbox',
      label: 'Which features do you like most?',
      required: false,
      options: [
        { id: 'c1', label: 'Easy to use' },
        { id: 'c2', label: 'Fast performance' },
        { id: 'c3', label: 'Good design' },
        { id: 'c4', label: 'Reliable' }
      ]
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

const mockAnalytics: Analytics = {
  formId: '507f1f77bcf86cd799439011',
  byField: {
    f1: {
      count: 45
    },
    f2: {
      count: 45,
      average: 4.2,
      median: 4.0
    },
    f3: {
      count: 42,
      distribution: {
        o1: 18,
        o2: 12,
        o3: 8,
        o4: 4
      }
    },
    f4: {
      count: 40,
      distribution: {
        c1: 32,
        c2: 28,
        c3: 25,
        c4: 22
      }
    }
  },
  totalResponses: 45,
  completionRate: 0.93,
  averageTimeToComplete: 180,
  updatedAt: new Date().toISOString()
}

export default function SampleDashboardPage() {
  return (
    <div>
      {/* Demo banner */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              This is a demo dashboard with sample data. 
              <a href="/f/sample-feedback-form" className="underline ml-1">
                Submit a response to see real-time updates!
              </a>
            </span>
          </div>
        </div>
      </div>

      <AnalyticsDashboard 
        form={mockForm}
        initialAnalytics={mockAnalytics}
      />
    </div>
  )
}
