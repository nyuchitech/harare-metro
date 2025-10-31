import { useState, useEffect } from 'react';

interface Comment {
  id: number;
  article_id: number;
  user_id: string;
  parent_comment_id: number | null;
  content: string;
  like_count: number;
  reply_count: number;
  status: 'published' | 'pending' | 'flagged' | 'deleted';
  created_at: string;
  updated_at: string;
  // Joined fields
  user_display_name?: string;
  user_username?: string;
  user_avatar_url?: string;
  is_liked?: boolean;
}

export function useComments(articleId: number) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(c => c.trim().startsWith('auth_token='));
    return authCookie ? authCookie.split('=')[1] : null;
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/comments`
      );

      if (!response.ok) {
        throw new Error('Failed to load comments');
      }

      const data = await response.json();
      setComments(data.comments || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string, parentCommentId?: number) => {
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/auth/login';
      return false;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/comment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            content,
            parentCommentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      // Refresh comments
      await fetchComments();
      return true;
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding comment:', err);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const likeComment = async (commentId: number) => {
    const token = getAuthToken();
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/comments/${commentId}/like`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to like comment');
      }

      // Update local state optimistically
      setComments(prev =>
        prev.map(comment =>
          comment.id === commentId
            ? {
                ...comment,
                is_liked: !comment.is_liked,
                like_count: comment.is_liked
                  ? comment.like_count - 1
                  : comment.like_count + 1,
              }
            : comment
        )
      );
    } catch (err: any) {
      console.error('Error liking comment:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  return {
    comments,
    loading,
    error,
    submitting,
    addComment,
    likeComment,
    refreshComments: fetchComments,
  };
}
