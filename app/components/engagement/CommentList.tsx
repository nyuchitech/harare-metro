import { useState, useEffect } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { CommentItem } from "./CommentItem";
import { CommentForm } from "./CommentForm";

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

interface CommentListProps {
  articleId: number;
  initialComments?: Comment[];
  initialCount?: number;
  showForm?: boolean;
}

export function CommentList({
  articleId,
  initialComments = [],
  initialCount = 0,
  showForm = true,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const COMMENTS_PER_PAGE = 10;

  // Fetch comments on mount if not provided
  useEffect(() => {
    if (initialComments.length === 0) {
      fetchComments();
    }
  }, []);

  const fetchComments = async (pageNum = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/comments?page=${pageNum}&limit=${COMMENTS_PER_PAGE}`
      );

      if (!response.ok) {
        throw new Error("Failed to load comments");
      }

      const data = (await response.json()) as {
        comments?: Comment[];
        total?: number;
      };

      if (pageNum === 1) {
        setComments(data.comments || []);
      } else {
        setComments((prev) => [...prev, ...(data.comments || [])]);
      }

      setTotalCount(data.total || 0);
      setHasMore((data.comments || []).length === COMMENTS_PER_PAGE);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || "Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentAdded = (newComment: Comment) => {
    setComments((prev) => [newComment, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handleDelete = async (commentId: number) => {
    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      // Remove from local state
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotalCount((prev) => prev - 1);
    } catch (err: any) {
      alert(err.message || "Failed to delete comment");
    }
  };

  const handleReport = async (commentId: number) => {
    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/comments/${commentId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to report comment");
      }

      alert("Comment reported successfully. Our moderators will review it.");
    } catch (err: any) {
      alert(err.message || "Failed to report comment");
    }
  };

  const handleLike = async (commentId: number) => {
    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/comments/${commentId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to like comment");
      }

      const data = (await response.json()) as {
        liked: boolean;
        likesCount?: number;
      };

      // Update local state
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: data.liked,
                likesCount: data.likesCount || c.likesCount,
              }
            : c
        )
      );
    } catch (err: any) {
      console.error("Error liking comment:", err);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchComments(page + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[hsl(var(--zw-green))]" />
        <h3 className="font-serif text-xl font-bold text-white">
          Comments {totalCount > 0 && `(${totalCount})`}
        </h3>
      </div>

      {/* Comment form */}
      {showForm && (
        <CommentForm articleId={articleId} onCommentAdded={handleCommentAdded} />
      )}

      {/* Comments list */}
      {error && (
        <div className="bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))] rounded-xl p-4">
          <p className="text-[hsl(var(--zw-red))] text-sm">{error}</p>
        </div>
      )}

      {comments.length === 0 && !isLoading && (
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={handleDelete}
            onReport={handleReport}
            onLike={handleLike}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && comments.length > 0 && (
        <button
          onClick={loadMore}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More Comments"
          )}
        </button>
      )}
    </div>
  );
}
