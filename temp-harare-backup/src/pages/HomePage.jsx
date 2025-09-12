// src/pages/HomePage.jsx - Home page (redirects to feed)
import React from 'react'
import { Navigate } from 'react-router-dom'

const HomePage = () => {
  return <Navigate to="/feed" replace />
}

export default HomePage