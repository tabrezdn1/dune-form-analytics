import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FormField } from '@/lib/types';

// Constants
const UNDO_TIMEOUT_SECONDS = 10;
const ANIMATION_DURATION_MS = 1000;

interface UndoNotificationProps {
  deletedField: FormField | null;
  onUndo: (field: FormField) => void;
  onDismiss: () => void;
}

export function UndoNotification({
  deletedField,
  onUndo,
  onDismiss,
}: UndoNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(UNDO_TIMEOUT_SECONDS);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle undo action
  const handleUndo = useCallback(() => {
    if (!deletedField) return;

    setIsVisible(false);
    onUndo(deletedField);

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [deletedField, onUndo]);

  // Handle dismiss action
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss();

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [onDismiss]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      if (e.key === 'Escape') {
        handleDismiss();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleUndo, handleDismiss]);

  // Manage timer and visibility
  useEffect(() => {
    if (deletedField) {
      setIsVisible(true);
      setTimeLeft(UNDO_TIMEOUT_SECONDS);

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Start new timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleDismiss();
            return 0;
          }
          return prev - 1;
        });
      }, ANIMATION_DURATION_MS);
    } else {
      setIsVisible(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletedField]); // handleDismiss would cause infinite loop

  if (!isVisible || !deletedField) return null;

  const progressPercentage = (timeLeft / UNDO_TIMEOUT_SECONDS) * 100;

  return (
    <div
      className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up'
      role='alert'
      aria-live='assertive'
      aria-atomic='true'
    >
      <div className='bg-gray-900 dark:bg-gray-800 text-white rounded-xl shadow-2xl p-4 pr-6 flex items-center space-x-4 min-w-[400px]'>
        <div className='flex-shrink-0' aria-hidden='true'>
          <svg
            className='w-6 h-6 text-yellow-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
            />
          </svg>
        </div>

        <div className='flex-1'>
          <p className='font-medium'>
            Field &quot;{deletedField.label}&quot; deleted
          </p>
          <p className='text-sm text-gray-300 dark:text-gray-400'>
            {getFieldDeletionMessage(deletedField)}
          </p>
        </div>

        <div className='flex items-center space-x-3'>
          <button
            onClick={handleUndo}
            className='px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400'
            aria-label={`Undo deletion of ${deletedField.label} field`}
          >
            Undo
          </button>

          <button
            onClick={handleDismiss}
            className='p-2 hover:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400'
            aria-label='Dismiss notification'
          >
            <svg
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Timer indicator */}
        <div
          className='absolute bottom-0 left-0 right-0 h-1 bg-gray-700 dark:bg-gray-900 rounded-b-xl overflow-hidden'
          role='progressbar'
          aria-valuenow={timeLeft}
          aria-valuemin={0}
          aria-valuemax={UNDO_TIMEOUT_SECONDS}
          aria-label='Time remaining to undo'
        >
          <div
            className='h-full bg-yellow-400 transition-all ease-linear'
            style={{
              width: `${progressPercentage}%`,
              transitionDuration: `${ANIMATION_DURATION_MS}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Helper function to get appropriate deletion message
function getFieldDeletionMessage(field: FormField): string {
  switch (field.type) {
    case 'mcq':
    case 'checkbox':
      return `This will reset analytics for all ${field.options?.length || 0} options`;
    case 'rating':
      return 'This will reset rating analytics';
    default:
      return 'This will reset analytics for this field';
  }
}
