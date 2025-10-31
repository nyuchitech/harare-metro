import { MessageSquare } from 'lucide-react';
import { useComments } from '~/hooks/useComments';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  articleId: number;
}

export function CommentList({ articleId }: CommentListProps) {
  const {
    comments,
    loading,
    error,
    submitting,
    addComment,
    likeComment,
  } = useComments(articleId);

  // Build comment tree
  const buildCommentTree = () => {
    const commentMap = new Map();
    const roots: any[] = [];

    // First pass: create map of all comments
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    comments.forEach(comment => {
      const commentNode = commentMap.get(comment.id);
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentNode);
        } else {
          roots.push(commentNode);
        }
      } else {
        roots.push(commentNode);
      }
    });

    return roots;
  };

  const renderCommentTree = (comment: any, depth = 0) => {
    return (
      <div key={comment.id}>
        <CommentItem
          comment={comment}
          onLike={likeComment}
          onReply={addComment}
          isSubmitting={submitting}
          depth={depth}
        />
        {comment.replies && comment.replies.length > 0 && (
          <div>
            {comment.replies.map((reply: any) => renderCommentTree(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const commentTree = buildCommentTree();
  const totalComments = comments.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-white">
        <MessageSquare className="w-5 h-5" />
        <h3 className="text-lg font-serif font-semibold">
          Comments ({totalComments})
        </h3>
      </div>

      {/* Add Comment Form */}
      <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
        <CommentForm
          onSubmit={(content) => addComment(content)}
          placeholder="Share your thoughts..."
          submitLabel="Post Comment"
          isSubmitting={submitting}
        />
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-[hsl(var(--zw-green))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))]/20 rounded-xl p-4 text-[hsl(var(--zw-red))] text-sm">
          {error}
        </div>
      ) : totalComments === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 space-y-2">
          {commentTree.map(comment => renderCommentTree(comment))}
        </div>
      )}
    </div>
  );
}
