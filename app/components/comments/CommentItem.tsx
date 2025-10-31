import { useState } from 'react';
import { Heart, Reply, User } from 'lucide-react';
import { CommentForm } from './CommentForm';

interface Comment {
  id: number;
  content: string;
  like_count: number;
  reply_count: number;
  created_at: string;
  user_display_name?: string;
  user_username?: string;
  user_avatar_url?: string;
  is_liked?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  onLike: (commentId: number) => void;
  onReply?: (content: string, parentId: number) => Promise<boolean>;
  isSubmitting?: boolean;
  depth?: number;
  maxDepth?: number;
}

export function CommentItem({
  comment,
  onLike,
  onReply,
  isSubmitting = false,
  depth = 0,
  maxDepth = 3,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReply = async (content: string) => {
    if (!onReply) return false;
    const success = await onReply(content, comment.id);
    if (success) {
      setShowReplyForm(false);
    }
    return success;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const canReply = depth < maxDepth && onReply;

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : 'mt-4'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user_avatar_url ? (
            <img
              src={comment.user_avatar_url}
              alt={comment.user_display_name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-white">
              {comment.user_display_name || comment.user_username || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(comment.created_at)}
            </span>
          </div>

          <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(comment.id)}
              className="flex items-center gap-1 text-xs transition-colors group"
            >
              <Heart
                className={`w-4 h-4 transition-all ${
                  comment.is_liked
                    ? 'fill-[hsl(var(--zw-red))] text-[hsl(var(--zw-red))]'
                    : 'text-gray-400 group-hover:text-[hsl(var(--zw-red))]'
                }`}
              />
              {comment.like_count > 0 && (
                <span
                  className={
                    comment.is_liked
                      ? 'text-[hsl(var(--zw-red))]'
                      : 'text-gray-400 group-hover:text-[hsl(var(--zw-red))]'
                  }
                >
                  {comment.like_count}
                </span>
              )}
            </button>

            {canReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-[hsl(var(--zw-green))] transition-colors"
              >
                <Reply className="w-4 h-4" />
                Reply
                {comment.reply_count > 0 && (
                  <span className="text-gray-500">({comment.reply_count})</span>
                )}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && canReply && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                placeholder="Write a reply..."
                submitLabel="Reply"
                maxLength={300}
                isSubmitting={isSubmitting}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
