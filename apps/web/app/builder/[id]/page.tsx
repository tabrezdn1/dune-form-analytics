'use client';

import React, { useState, useEffect, useRef } from 'react';

// Disable static generation and caching for this protected route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Loading } from '@/components/ui/Loading';
import { useAppContext } from '@/lib/contexts/AppContext';
import { Form } from '@/lib/types';
import FormBuilderClient from './FormBuilderClient';

interface BuilderPageProps {
  params: { id: string };
}

export default function EditFormPage({ params }: BuilderPageProps) {
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load the form
        const response = await api.getForm(params.id);

        if (!response.success || !response.data) {
          setError('Form not found');
          return;
        }

        setForm(response.data);
      } catch (error) {
        setError('Failed to load form');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params.id]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
          <Loading size='lg' text='Loading form builder...' />
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !form) {
    notFound();
  }

  return (
    <ProtectedRoute>
      <FormBuilderClient initialForm={form} />
    </ProtectedRoute>
  );
}
