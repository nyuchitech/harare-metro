import { useState } from "react";
import { Trash2, Flag, ThumbsUp } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface Comment {
  id: number;
  content: string;
  userId: number;
  username: string;
  userRole?: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: number) => void;
  onReport?: (commentId: number) => void;
  onLike?: (commentId: number) => void;
}

export function CommentItem({
  comment,
  onDelete,
  onReport,
  onLike,
}: CommentItemProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(comment.isLiked || false);
  const [localLikesCount, setLocalLikesCount] = useState(
    comment.likesCount || 0
  );

  const isOwner = user?.id ? String(user.id) === String(comment.userId) : false;
  const isModerator = user?.role === "moderator" || user?.role === "admin";
  const canDelete = isOwner || isModerator;

  const handleDelete = async () => {
    if (!canDelete || isDeleting) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    setIsDeleting(true);
    if (onDelete) {
      await onDelete(comment.id);
    }
    setIsDeleting(false);
  };

  const handleReport = async () => {
    if (isReporting) return;

    if (!confirm("Report this comment for violating community guidelines?"))
      return;

    setIsReporting(true);
    if (onReport) {
      await onReport(comment.id);
    }
    setIsReporting(false);
  };

  const handleLike = async () => {
    if (isLiking || !user) return;

    // Optimistic update
    setLocalLiked(!localLiked);
    setLocalLikesCount(localLiked ? localLikesCount - 1 : localLikesCount + 1);

    setIsLiking(true);
    if (onLike) {
      await onLike(comment.id);
    }
    setIsLiking(false);
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const getRoleBadge = (role?: string) => {
    if (!role || role === "creator") return null;

    const badges: Record<string, { text: string; color: string }> = {
      admin: { text: "Admin", color: "bg-[hsl(var(--zw-red))]" },
      moderator: { text: "Mod", color: "bg-[hsl(var(--zw-yellow))]" },
      author: { text: "Author", color: "bg-[hsl(var(--zw-green))]" },
      "business-creator": { text: "Business", color: "bg-blue-600" },
    };

    const badge = badges[role];
    if (!badge) return null;

    return (
      <span
        className={`${badge.color} text-white text-xs px-2 py-0.5 rounded-full font-medium`}
      >
        {badge.text}
      </span>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <a
            href={`/@/${comment.username}`}
            className="font-medium text-white hover:text-[hsl(var(--zw-green))] transition-colors"
          >
            @{comment.username}
          </a>
          {getRoleBadge(comment.userRole)}
          <span className="text-gray-500 text-sm">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-gray-500 hover:text-[hsl(var(--zw-red))] transition-colors disabled:opacity-50"
              aria-label="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {!isOwner && user && (
            <button
              onClick={handleReport}
              disabled={isReporting}
              className="text-gray-500 hover:text-[hsl(var(--zw-yellow))] transition-colors disabled:opacity-50"
              aria-label="Report comment"
            >
              <Flag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-300 leading-relaxed mb-3">{comment.content}</p>

      {/* Like button */}
      <button
        onClick={handleLike}
        disabled={isLiking || !user}
        className={`flex items-center gap-1.5 text-sm transition-colors ${
          localLiked
            ? "text-[hsl(var(--zw-green))]"
            : "text-gray-500 hover:text-gray-400"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <ThumbsUp className={`h-4 w-4 ${localLiked ? "fill-current" : ""}`} />
        {localLikesCount > 0 && (
          <span className="font-medium">{localLikesCount}</span>
        )}
      </button>
    </div>
  );
}
