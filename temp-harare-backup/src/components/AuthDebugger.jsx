import React from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * Debug component to display current authentication state
 * This helps identify authentication flow issues
 */
const AuthDebugger = () => {
  const { user, isAuthenticated, loading, error } = useAuth()
  
  if (!import.meta.env.DEV) {
    return null // Only show in development
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#000',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      border: '1px solid #333'
    }}>
      <div><strong>Auth Debug:</strong></div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>User: {user?.email || 'None'}</div>
      <div>Error: {error || 'None'}</div>
      <div>User ID: {user?.id || 'None'}</div>
    </div>
  )
}

export default AuthDebugger
