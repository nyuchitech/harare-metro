import { useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface CommentFormProps {
  articleId: number;
  onCommentAdded?: (comment: any) => void;
  placeholder?: string;
  maxLength?: number;
}

export function CommentForm({
  articleId,
  onCommentAdded,
  placeholder = "Share your thoughts...",
  maxLength = 1000,
}: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please login to comment");
      return;
    }

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    if (content.length > maxLength) {
      setError(`Comment must be ${maxLength} characters or less`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ content: content.trim() }),
        }
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to post comment");
      }

      const data = (await response.json()) as { comment?: any };

      // Clear form
      setContent("");

      // Notify parent component
      if (onCommentAdded && data.comment) {
        onCommentAdded(data.comment);
      }
    } catch (err: any) {
      setError(err.message || "Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-center">
        <p className="text-gray-400 mb-4">Join the conversation</p>
        <a
          href="/auth/login"
          className="inline-block px-6 py-2.5 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-full transition-colors"
        >
          Login to Comment
        </a>
      </div>
    );
  }

  const remainingChars = maxLength - content.length;
  const isNearLimit = remainingChars < 100;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 rounded-xl p-4 border border-gray-800"
    >
      <div className="flex items-start gap-3">
        {/* User avatar placeholder */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[hsl(var(--zw-green))] flex items-center justify-center text-white font-semibold">
          {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
        </div>

        {/* Input area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={3}
            disabled={isSubmitting}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))] border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            {/* Character count */}
            <span
              className={`text-xs ${
                isNearLimit ? "text-[hsl(var(--zw-yellow))]" : "text-gray-500"
              }`}
            >
              {remainingChars} characters remaining
            </span>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || content.length > maxLength}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-2 text-sm text-[hsl(var(--zw-red))]">{error}</p>
          )}
        </div>
      </div>
    </form>
  );
}
