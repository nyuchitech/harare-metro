// src/hooks/useUserInterests.js - Hook for managing user interests
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useUserInterests = () => {
  const { user, profile } = useAuth()
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  // Load user interests from profile
  useEffect(() => {
    if (profile) {
      const userInterests = profile.interests || []
      setInterests(userInterests)
      setLoading(false)
    } else if (user && !profile) {
      // User is logged in but profile hasn't loaded yet
      setLoading(true)
    } else {
      // No user logged in
      setInterests([])
      setLoading(false)
    }
  }, [user, profile])

  // Save interests to Supabase
  const saveInterests = async (newInterests) => {
    if (!user) {
      throw new Error('User must be logged in to save interests')
    }

    try {
      setSaving(true)
      setError(null)

      // Update the profile with new interests
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          interests: newInterests,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setInterests(newInterests)
      
      return { success: true }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }

  // Add a single interest
  const addInterest = async (categoryId) => {
    if (!interests.includes(categoryId)) {
      const newInterests = [...interests, categoryId]
      await saveInterests(newInterests)
    }
  }

  // Remove a single interest
  const removeInterest = async (categoryId) => {
    const newInterests = interests.filter(id => id !== categoryId)
    await saveInterests(newInterests)
  }

  // Check if user has specific interest
  const hasInterest = (categoryId) => {
    return interests.includes(categoryId)
  }

  // Get interests count
  const getInterestsCount = () => {
    return interests.length
  }

  // Check if user has set up interests
  const hasSetupInterests = () => {
    return interests.length > 0
  }

  return {
    interests,
    loading,
    error,
    saving,
    saveInterests,
    addInterest,
    removeInterest,
    hasInterest,
    getInterestsCount,
    hasSetupInterests,
    isLoggedIn: !!user
  }
}

export default useUserInterests