'use client'

import React, { useState, useEffect } from 'react'

export function WebSocketTest({ formId }: { formId: string }) {
  const [status, setStatus] = useState('Disconnected')
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const wsUrl = `ws://127.0.0.1:8080/ws/forms/${formId}`
    console.log('Attempting WebSocket connection to:', wsUrl)
    
    try {
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket opened successfully')
        setStatus('Connected')
        setMessages(prev => [...prev, 'Connected successfully'])
      }
      
      ws.onmessage = (event) => {
        console.log('WebSocket message received:', event.data)
        setMessages(prev => [...prev, `Received: ${event.data}`])
      }
      
      ws.onerror = (error) => {
        console.log('WebSocket error:', error)
        setStatus('Error')
        setMessages(prev => [...prev, `Error: ${error.type}`])
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setStatus('Disconnected')
        setMessages(prev => [...prev, `Closed: ${event.code} - ${event.reason || 'No reason'}`])
      }
      
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      setStatus('Failed')
      setMessages(prev => [...prev, `Failed to create: ${error}`])
    }
  }, [formId])

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
      <h3 className="font-medium mb-2">WebSocket Debug</h3>
      <p className="text-sm mb-2">Status: <span className={`font-medium ${
        status === 'Connected' ? 'text-green-600' : 
        status === 'Error' ? 'text-red-600' : 'text-yellow-600'
      }`}>{status}</span></p>
      
      <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="text-gray-600 dark:text-gray-400">{msg}</div>
        ))}
      </div>
    </div>
  )
}
