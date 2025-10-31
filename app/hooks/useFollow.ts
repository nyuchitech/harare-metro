import { useState, useEffect } from 'react';

export type FollowType = 'source' | 'author' | 'category';

export function useFollow(followType: FollowType, followId: string) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth_token='));
    return authCookie ? authCookie.split('=')[1] : null;
  };

  const checkFollowStatus = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/user/me/follows?type=${followType}&id=${followId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing || false);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = async () => {
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);

    try {
      if (wasFollowing) {
        // Unfollow
        const response = await fetch(
          `https://admin.hararemetro.co.zw/api/user/me/follows/${followType}/${followId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to unfollow');
        }
      } else {
        // Follow
        const response = await fetch(
          'https://admin.hararemetro.co.zw/api/user/me/follows',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              followType,
              followId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to follow');
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert optimistic update
      setIsFollowing(wasFollowing);
    }
  };

  useEffect(() => {
    checkFollowStatus();
  }, [followType, followId]);

  return {
    isFollowing,
    loading,
    toggleFollow,
  };
}
