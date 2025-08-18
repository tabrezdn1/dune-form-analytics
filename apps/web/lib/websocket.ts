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

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionStatus('connecting')
      wsRef.current = new WebSocket(url)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectCountRef.current = 0
        onConnect?.()
        
        // Send ping to keep connection alive
        const pingInterval = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
          } else {
            clearInterval(pingInterval)
          }
        }, 45000) // Ping every 45 seconds (less aggressive)
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
        
        console.log('WebSocket closed:', event.code, event.reason)

        // Only attempt to reconnect if it wasn't a manual close and not a normal close
        if (!isManualCloseRef.current && event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          console.log(`WebSocket disconnected unexpectedly. Reconnecting (${reconnectCountRef.current}/${reconnectAttempts})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else if (event.code === 1000) {
          console.log('WebSocket closed normally')
        }
      }

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error')
        onError?.(error)
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      setConnectionStatus('error')
      console.error('Failed to create WebSocket connection:', error)
    }
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
    connect()

    // Don't disconnect on component unmount - keep connection alive
    return () => {
      // Only disconnect if URL changes, not on unmount
    }
  }, [url])
  
  // Cleanup on page unload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      disconnect() // Final cleanup
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

// Hook specifically for form analytics WebSocket
export function useFormAnalyticsWebSocket(formId: string, onAnalyticsUpdate?: (analytics: Analytics['byField']) => void) {
  // Use different WebSocket URL based on environment
  const getWebSocketUrl = () => {
    // Check if we're in a Docker environment by looking for Docker-specific env vars
    const isDocker = process.env.INTERNAL_WS_URL
    
    if (isDocker && typeof window !== 'undefined') {
      // In Docker, use the host machine's localhost from the browser perspective
      return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
    } else {
      return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
    }
  }
  
  const WS_URL = getWebSocketUrl()
  const url = `${WS_URL}/ws/forms/${formId}`

  return useWebSocket(url, {
    onMessage: (data: WebSocketMessage) => {
      console.log('🔌 RAW WebSocket message received:', JSON.stringify(data, null, 2))
      
      if (data.type === 'analytics:update') {
        console.log('📊 Analytics update detected! Data structure:', JSON.stringify(data.data, null, 2))
        onAnalyticsUpdate?.(data.data)
        console.log('✅ Analytics handler called - UI should update now!')
      } else if (data.type === 'connected') {
        console.log('🎉 WebSocket connected for form', data.formId)
      } else {
        console.log('ℹ️ Other message type received:', data.type, 'Full data:', JSON.stringify(data, null, 2))
      }
    },
    onConnect: () => {
      console.log(`Connected to analytics WebSocket for form ${formId}`)
    },
    onDisconnect: () => {
      console.log(`Disconnected from analytics WebSocket for form ${formId}`)
    },
    onError: (error) => {
      console.error(`WebSocket error for form ${formId}:`, error)
    },
  })
}
