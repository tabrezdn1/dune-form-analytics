'use client'

import React from 'react'

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  onLabel?: string
  offLabel?: string
  disabled?: boolean
  className?: string
}

export function ToggleSwitch({
  enabled,
  onChange,
  onLabel = 'Published',
  offLabel = 'Draft',
  disabled = false,
  className = ''
}: ToggleSwitchProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Clean Toggle Switch */}
      <button
        type="button"
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${enabled 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={enabled ? `Click to set as ${offLabel.toLowerCase()}` : `Click to ${onLabel.toLowerCase()}`}
      >
        {/* Toggle Circle */}
        <span className={`
          inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `} />
      </button>

      {/* Status Label */}
      <span className={`text-sm font-medium transition-colors duration-200 ${
        enabled 
          ? 'text-green-700 dark:text-green-400' 
          : 'text-gray-600 dark:text-gray-400'
      }`}>
        {enabled ? onLabel : offLabel}
      </span>
    </div>
  )
}



