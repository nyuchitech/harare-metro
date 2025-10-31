import { useState } from 'react';

interface EngagementState {
  isLiked: boolean;
  isSaved: boolean;
  likeCount: number;
}

export function useArticleEngagement(
  articleId: number,
  initialState?: Partial<EngagementState>
) {
  const [isLiked, setIsLiked] = useState(initialState?.isLiked ?? false);
  const [isSaved, setIsSaved] = useState(initialState?.isSaved ?? false);
  const [likeCount, setLikeCount] = useState(initialState?.likeCount ?? 0);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthToken = () => {
    // Get token from cookie
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth_token='));
    return authCookie ? authCookie.split('=')[1] : null;
  };

  const toggleLike = async () => {
    const token = getAuthToken();
    if (!token) {
      // Redirect to login
      window.location.href = '/auth/login';
      return;
    }

    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!isLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/like`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Revert on error
        setIsLiked(wasLiked);
        setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
        throw new Error('Failed to like article');
      }

      const data = await response.json();
      // Update with server state
      setIsLiked(data.liked);
      if (data.likeCount !== undefined) {
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Already reverted optimistic update
    }
  };

  const toggleSave = async () => {
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    // Optimistic update
    const wasSaved = isSaved;
    setIsSaved(!isSaved);

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Revert on error
        setIsSaved(wasSaved);
        throw new Error('Failed to save article');
      }

      const data = await response.json();
      setIsSaved(data.saved);
    } catch (error) {
      console.error('Error toggling save:', error);
      // Already reverted optimistic update
    }
  };

  const trackView = async () => {
    const token = getAuthToken();
    if (!token) return; // Don't track if not logged in

    try {
      await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/view`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            referrer: document.referrer || 'direct',
          }),
        }
      );
    } catch (error) {
      console.error('Error tracking view:', error);
      // Silent fail - don't disrupt user experience
    }
  };

  return {
    isLiked,
    isSaved,
    likeCount,
    isLoading,
    toggleLike,
    toggleSave,
    trackView,
  };
}
