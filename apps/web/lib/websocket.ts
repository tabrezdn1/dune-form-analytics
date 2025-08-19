'use client'

import { useEffect, useRef, useState } from 'react'
import { WebSocketMessage, Analytics } from './types'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

// Custom React hook for WebSocket connections
export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 3,
    reconnectInterval = 5000,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectCountRef = useRef(0)
  const isManualCloseRef = useRef(false)
  const isConnectingRef = useRef(false)

  const connect = () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    isConnectingRef.current = true

    // Close any existing connection before creating new one
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Delay connection to prevent rapid reconnection cycles
    setTimeout(() => {
      try {
        setConnectionStatus('connecting')
        wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        isConnectingRef.current = false
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectCountRef.current = 0
        onConnect?.()
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
        onDisconnect?.()

        // Attempt reconnection with exponential backoff
        if (!isManualCloseRef.current && event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          
          const backoffDelay = Math.min(1000 * Math.pow(2, reconnectCountRef.current - 1), 8000)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, backoffDelay)
        }
      }

      wsRef.current.onerror = (error) => {
        isConnectingRef.current = false
        setConnectionStatus('error')
        onError?.(error)
      }
      } catch (error) {
        isConnectingRef.current = false
        setConnectionStatus('error')
      }
    }, 100) // Delay to prevent rapid reconnection cycles
  }

  const disconnect = () => {
    isManualCloseRef.current = true
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }

  useEffect(() => {
    let isActive = true
    
    // React Strict Mode compatible connection
    if (isActive) {
      connect()
    }

    return () => {
      isActive = false
      disconnect()
    }
  }, [url])
  
  // Handle browser page unload events
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
  }
}

// Hook for form analytics WebSocket connection
export function useFormAnalyticsWebSocket(formId: string, onAnalyticsUpdate?: (analytics: Analytics['byField']) => void) {
  const getWebSocketUrl = () => {
    return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
  }
  
  const WS_URL = getWebSocketUrl()
  const url = `${WS_URL}/ws/forms/${formId}`

  return useWebSocket(url, {
    onMessage: (data: WebSocketMessage) => {
      if (data.type === 'analytics:update') {
        onAnalyticsUpdate?.(data.data)
      }
    },
    onConnect: () => {
      // Connection established
    },
    onDisconnect: () => {
      // Connection closed
    },
    onError: (error) => {
      console.error(`WebSocket connection error for form ${formId}:`, error)
    },
  })
}
