import { useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

export interface UseRealTimeOptions {
  autoConnect?: boolean
}

export function useRealTime(options: UseRealTimeOptions = {}) {
  const { autoConnect = true } = options
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (autoConnect) {
      // Initialize socket connection
      const initSocket = async () => {
        const socket = await apiClient.initializeSocket(user?.id)
        socketRef.current = socket

        // Set up connection event handlers
        socket.on('connect', () => {
          console.log('Connected to real-time server')
        })

        socket.on('disconnect', () => {
          console.log('Disconnected from real-time server')
        })

        socket.on('connect_error', (error) => {
          console.error('Real-time connection error:', error)
        })

        // Join user-specific room if user is logged in
        if (user?.id) {
          socket.emit('join_user', user.id)
        }
      }

      initSocket()

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect()
          socketRef.current = null
        }
      }
    }
  }, [autoConnect, user?.id])

  const connect = async () => {
    if (!socketRef.current) {
      const socket = await apiClient.initializeSocket(user?.id)
      socketRef.current = socket
    }
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }

  const joinRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', room)
    }
  }

  const leaveRoom = (room: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_room', room)
    }
  }

  const subscribe = (event: string, callback: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }

  const unsubscribe = (event: string, callback?: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback)
      } else {
        socketRef.current.off(event)
      }
    }
  }

  const emit = (event: string, ...args: unknown[]) => {
    if (socketRef.current) {
      socketRef.current.emit(event, ...args)
    }
  }

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    subscribe,
    unsubscribe,
    emit,
  }
}