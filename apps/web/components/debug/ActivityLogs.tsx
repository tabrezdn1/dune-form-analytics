'use client'

import React, { useState, useRef } from 'react'

export interface LogEntry {
  id: string
  timestamp: Date
  type: 'websocket' | 'submission' | 'analytics' | 'error'
  message: string
  data?: any
}

interface ActivityLogsProps {
  formId: string
  isConnected: boolean
  onAddLog?: (type: LogEntry['type'], message: string, data?: any) => void
}

export function ActivityLogs({ formId, isConnected, onAddLog }: ActivityLogsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logsEndRef = useRef<HTMLDivElement>(null)

  const addLog = (type: LogEntry['type'], message: string, data?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      type,
      message,
      data,
    }
    
    setLogs(prev => [...prev.slice(-49), newLog]) // Keep last 50 logs
    
    // Auto-scroll to bottom
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    
    // Call parent callback if provided
    onAddLog?.(type, message, data)
  }

  // Expose addLog function to parent components
  React.useImperativeHandle(onAddLog, () => ({
    addLog,
  }), [])

  const clearLogs = () => {
    setLogs([])
  }

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'websocket': return '🔌'
      case 'submission': return '📝'
      case 'analytics': return '📊'
      case 'error': return '❌'
      default: return '📋'
    }
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'websocket': return 'text-blue-600 dark:text-blue-400'
      case 'submission': return 'text-green-600 dark:text-green-400'
      case 'analytics': return 'text-purple-600 dark:text-purple-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Activity Logs
          </h3>
          <span className={`text-sm px-2 py-1 rounded-full ${
            isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={clearLogs}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Clear logs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 flex items-center space-x-1"
          >
            <span>{isOpen ? 'Hide' : 'Show'} Logs</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Logs Panel */}
      {isOpen && (
        <div className="p-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                No activity yet. Logs will appear here as events occur.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2 text-sm">
                    <span className="text-xs text-gray-400 mt-0.5 font-mono">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="mt-0.5">{getLogIcon(log.type)}</span>
                    <div className="flex-1">
                      <span className={`${getLogColor(log.type)} font-medium`}>
                        {log.message}
                      </span>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                            View details
                          </summary>
                          <pre className="text-xs text-gray-600 dark:text-gray-400 mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
          
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Real-time activity monitoring • Last {logs.length} events
          </div>
        </div>
      )}
    </div>
  )
}