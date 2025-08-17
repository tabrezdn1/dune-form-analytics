'use client'

import React from 'react'
import { PublicFormView } from '../[slug]/PublicFormView'
import { PublicForm } from '@/lib/types'

// Mock sample form data
const mockForm: PublicForm = {
  id: '507f1f77bcf86cd799439011',
  title: 'Sample Feedback Form',
  description: 'Help us improve by sharing your feedback. This is a demo form to showcase the real-time analytics features.',
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
      label: 'Which features do you like most? (Select all that apply)',
      required: false,
      options: [
        { id: 'c1', label: 'Easy to use' },
        { id: 'c2', label: 'Fast performance' },
        { id: 'c3', label: 'Good design' },
        { id: 'c4', label: 'Reliable' }
      ]
    }
  ]
}

export default function SampleFormPage() {
  return (
    <div>


      <PublicFormView form={mockForm} />
    </div>
  )
}
