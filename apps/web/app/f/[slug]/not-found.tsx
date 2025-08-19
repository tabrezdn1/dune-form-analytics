import Link from 'next/link'

export default function FormNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          {/* Form Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Form Not Available
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This form is either not published, has been removed, or the link is incorrect.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Possible reasons:
                </h3>
                <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside space-y-1">
                  <li>The form has been unpublished by its owner</li>
                  <li>The form has been deleted</li>
                  <li>The link is incorrect or expired</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact the form owner or create your own form at{' '}
            <Link href="/" className="text-primary-600 hover:text-primary-500 font-medium">
              Dune Forms
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}



