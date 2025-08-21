'use client';

import React, { useState } from 'react';
import { FormField } from '@/lib/types';

interface RatingProps {
  field: FormField;
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
}

export function Rating({
  field,
  value = 0,
  onChange,
  onBlur,
  error,
  disabled = false,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const min = field.validation?.min || 1;
  const max = field.validation?.max || 5;

  const handleClick = (rating: number) => {
    onChange(rating);
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  const getRatingLabel = (rating: number): string => {
    if (max === 5) {
      const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
      return labels[rating] || '';
    }
    if (max === 10) {
      if (rating <= 3) return 'Poor';
      if (rating <= 5) return 'Fair';
      if (rating <= 7) return 'Good';
      if (rating <= 9) return 'Very Good';
      return 'Excellent';
    }
    return '';
  };

  const displayValue = hoverValue || value;
  const ratingLabel = getRatingLabel(displayValue);

  return (
    <div className='form-group'>
      <label className='form-label'>
        {field.label}
        {field.required && <span className='text-red-500 ml-1'>*</span>}
      </label>

      <div className='flex flex-col space-y-3'>
        {/* Star/Number Rating */}
        <div
          className='flex items-center space-x-1'
          onMouseLeave={handleMouseLeave}
          onBlur={onBlur}
        >
          {Array.from({ length: max - min + 1 }, (_, index) => {
            const rating = min + index;
            const isActive = displayValue >= rating;
            const isSelected = value >= rating;

            return (
              <button
                key={rating}
                type='button'
                onClick={() => handleClick(rating)}
                onMouseEnter={() => handleMouseEnter(rating)}
                disabled={disabled}
                className={`
                  relative p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  transition-colors duration-150
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110 transform transition-transform'}
                  ${error ? 'focus:ring-red-500' : ''}
                `}
                aria-label={`Rate ${rating} out of ${max}`}
              >
                {max <= 5 ? (
                  // Star rating for 1-5 scale
                  <svg
                    className={`w-8 h-8 ${
                      isActive
                        ? isSelected
                          ? 'text-yellow-400'
                          : 'text-yellow-300'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                  </svg>
                ) : (
                  // Number rating for scales > 5
                  <div
                    className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium
                      transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                      }
                    `}
                  >
                    {rating}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Rating Labels and Value Display */}
        <div className='flex items-center justify-between text-sm'>
          <div className='flex items-center space-x-4'>
            {displayValue > 0 && (
              <span className='font-medium text-gray-900 dark:text-gray-100'>
                {displayValue} / {max}
              </span>
            )}
            {ratingLabel && (
              <span className='text-gray-600 dark:text-gray-400'>
                {ratingLabel}
              </span>
            )}
          </div>

          {/* Scale labels */}
          <div className='flex items-center space-x-2 text-xs text-gray-500'>
            <span>{min}</span>
            <span>-</span>
            <span>{max}</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && <div className='form-error'>{error}</div>}
    </div>
  );
}
