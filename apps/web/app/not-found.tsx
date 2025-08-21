import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4'>
      <div className='text-center'>
        <div className='mb-8'>
          <h1 className='text-6xl font-bold text-gray-900 dark:text-gray-100 mb-2'>
            404
          </h1>
          <h2 className='text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4'>
            Page Not Found
          </h2>
          <p className='text-gray-600 dark:text-gray-400 max-w-md mx-auto'>
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved.
          </p>
        </div>
      </div>
    </div>
  );
}
