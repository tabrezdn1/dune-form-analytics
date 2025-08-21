import React, { useEffect, useRef, useCallback } from 'react';
import { FormChangeAnalysis } from '@/lib/form-change-analyzer';
import { createPortal } from 'react-dom';

interface AnalyticsWarningDialogProps {
  isOpen: boolean;
  analysis: FormChangeAnalysis;
  currentResponseCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AnalyticsWarningDialog({
  isOpen,
  analysis,
  currentResponseCount = 0,
  onConfirm,
  onCancel,
}: AnalyticsWarningDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const hasResponses = currentResponseCount > 0;

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  // Focus management and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      const previouslyFocusedElement = document.activeElement as HTMLElement;

      // Focus the confirm button
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Cleanup
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';

        // Restore focus
        previouslyFocusedElement?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = dialogRef.current!.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const dialog = (
    <div
      className='fixed inset-0 z-50 overflow-y-auto'
      role='dialog'
      aria-modal='true'
      aria-labelledby='warning-dialog-title'
      aria-describedby='warning-dialog-description'
    >
      <div className='flex min-h-full items-center justify-center p-4 text-center'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-black/50 transition-opacity'
          aria-hidden='true'
          onClick={onCancel}
        />

        {/* Dialog */}
        <div
          ref={dialogRef}
          className='relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'
        >
          <div className='sm:flex sm:items-start'>
            <div
              className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20 sm:mx-0 sm:h-10 sm:w-10'
              aria-hidden='true'
            >
              <svg
                className='h-6 w-6 text-yellow-600 dark:text-yellow-500'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z'
                />
              </svg>
            </div>
            <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left'>
              <h3
                id='warning-dialog-title'
                className='text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100'
              >
                Analytics Will Be Reset
              </h3>
              <div className='mt-2' id='warning-dialog-description'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {hasResponses && (
                    <>
                      Your form has{' '}
                      <span className='font-semibold text-gray-700 dark:text-gray-300'>
                        {currentResponseCount}{' '}
                        {currentResponseCount === 1 ? 'response' : 'responses'}
                      </span>
                      .{' '}
                    </>
                  )}
                  The following changes will reset your analytics to zero:
                </p>

                <div className='mt-3 rounded-md bg-yellow-50 dark:bg-yellow-900/10 p-3'>
                  <ul className='text-sm text-yellow-800 dark:text-yellow-200 space-y-1'>
                    {analysis.incompatibleChanges.map((change, index) => (
                      <li
                        key={`incompatible-${index}`}
                        className='flex items-start'
                      >
                        <span className='mr-2' aria-hidden='true'>
                          •
                        </span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {analysis.compatibleChanges.length > 0 && (
                  <div className='mt-3'>
                    <p className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                      These changes will be preserved:
                    </p>
                    <ul className='text-xs text-gray-600 dark:text-gray-400 space-y-0.5'>
                      {analysis.compatibleChanges.map((change, index) => (
                        <li key={`compatible-${index}`}>
                          <span aria-hidden='true'>✓</span> {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className='mt-4 rounded-md bg-blue-50 dark:bg-blue-900/10 p-3'>
                  <p className='text-xs text-blue-800 dark:text-blue-200'>
                    <strong>Tip:</strong> Consider exporting your current
                    analytics data before proceeding if you need to keep a
                    record.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3'>
            <button
              ref={confirmButtonRef}
              type='button'
              onClick={onConfirm}
              className='inline-flex w-full justify-center rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:w-auto'
            >
              Continue and Reset Analytics
            </button>
            <button
              ref={cancelButtonRef}
              type='button'
              onClick={onCancel}
              className='mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:mt-0 sm:w-auto'
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render dialog at document root
  if (typeof document !== 'undefined') {
    return createPortal(dialog, document.body);
  }

  return dialog;
}
