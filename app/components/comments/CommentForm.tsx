import { useState } from 'react';
import { Send } from 'lucide-react';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  placeholder?: string;
  submitLabel?: string;
  maxLength?: number;
  isSubmitting?: boolean;
}

export function CommentForm({
  onSubmit,
  placeholder = 'Add a comment...',
  submitLabel = 'Post',
  maxLength = 500,
  isSubmitting = false,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > maxLength) {
      setError(`Comment must be ${maxLength} characters or less`);
      return;
    }

    const success = await onSubmit(content.trim());
    if (success) {
      setContent('');
      setError('');
    } else {
      setError('Failed to post comment. Please try again.');
    }
  };

  const remainingChars = maxLength - content.length;
  const isNearLimit = remainingChars < 50;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError('');
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(var(--zw-green))] focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 transition-colors resize-none disabled:opacity-50"
        />
        {content.length > 0 && (
          <div
            className={`absolute bottom-2 right-2 text-xs ${
              isNearLimit ? 'text-[hsl(var(--zw-red))]' : 'text-gray-500'
            }`}
          >
            {remainingChars}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-[hsl(var(--zw-red))]">{error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting || content.length > maxLength}
          className="px-6 py-2 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Posting...
            </>
          ) : (
            <>
              {submitLabel}
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
