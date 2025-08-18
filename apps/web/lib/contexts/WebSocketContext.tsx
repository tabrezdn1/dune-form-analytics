'use client'

import React, { createContext, useContext, ReactNode, useRef, useCallback } from 'react'
import { useFormAnalyticsWebSocket } from '@/lib/websocket'

// WebSocket Context Types
interface WebSocketConnection {
  formId: string
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

interface WebSocketContextValue {
  connections: Map<string, WebSocketConnection>
  connect: (formId: string, onAnalyticsUpdate?: (data: any) => void) => void
  disconnect: (formId: string) => void
  isConnected: (formId: string) => boolean
  getConnectionStatus: (formId: string) => string
}

// Context
const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined)

// Hook to use WebSocket Context
export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}

// WebSocket Provider Component
export function WebSocketProvider({ children }: { children: ReactNode }) {
  const connectionsRef = useRef<Map<string, any>>(new Map())
  const [connections, setConnections] = React.useState<Map<string, WebSocketConnection>>(new Map())

  const connect = useCallback((formId: string, onAnalyticsUpdate?: (data: any) => void) => {
    // Don't create duplicate connections
    if (connectionsRef.current.has(formId)) {
      return
    }

    // Create WebSocket connection
    const wsConnection = useFormAnalyticsWebSocket(formId, onAnalyticsUpdate)
    connectionsRef.current.set(formId, wsConnection)

    // Update connection state
    setConnections(prev => new Map(prev.set(formId, {
      formId,
      isConnected: wsConnection.isConnected,
      connectionStatus: wsConnection.connectionStatus,
    })))
  }, [])

  const disconnect = useCallback((formId: string) => {
    const connection = connectionsRef.current.get(formId)
    if (connection) {
      connection.disconnect?.()
      connectionsRef.current.delete(formId)
      
      setConnections(prev => {
        const newMap = new Map(prev)
        newMap.delete(formId)
        return newMap
      })
    }
  }, [])

  const isConnected = useCallback((formId: string) => {
    return connections.get(formId)?.isConnected ?? false
  }, [connections])

  const getConnectionStatus = useCallback((formId: string) => {
    return connections.get(formId)?.connectionStatus ?? 'disconnected'
  }, [connections])

  const contextValue: WebSocketContextValue = {
    connections,
    connect,
    disconnect,
    isConnected,
    getConnectionStatus,
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

// Advanced WebSocket hook with connection management
export function useWebSocketConnection(formId: string, onAnalyticsUpdate?: (data: any) => void) {
  const { connect, disconnect, isConnected, getConnectionStatus } = useWebSocketContext()

  React.useEffect(() => {
    connect(formId, onAnalyticsUpdate)
    
    return () => {
      // Keep connection alive for real-time updates
      // Only disconnect on explicit cleanup
    }
  }, [formId, onAnalyticsUpdate, connect])

  return {
    isConnected: isConnected(formId),
    connectionStatus: getConnectionStatus(formId),
    disconnect: () => disconnect(formId),
  }
}
