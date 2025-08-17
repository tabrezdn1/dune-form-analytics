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
    reconnectAttempts = 5,
    reconnectInterval = 3000,
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
        }, 30000) // Ping every 30 seconds
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

        // Only attempt to reconnect if it wasn't a manual close
        if (!isManualCloseRef.current && reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          console.log(`WebSocket disconnected. Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts})...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
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

    return () => {
      disconnect()
    }
  }, [url])

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
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
  const url = `${WS_URL}/ws/forms/${formId}`

  return useWebSocket(url, {
    onMessage: (data: WebSocketMessage) => {
      if (data.type === 'analytics:update' && data.data) {
        onAnalyticsUpdate?.(data.data)
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
