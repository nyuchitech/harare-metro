// src/App.jsx - Now using React Router for proper URL routing
import React from 'react'
import AppRouter from './AppRouter'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  )
}

export default App