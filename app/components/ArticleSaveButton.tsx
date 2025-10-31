import { Bookmark } from 'lucide-react';
import { useArticleEngagement } from '~/hooks/useArticleEngagement';

interface ArticleSaveButtonProps {
  articleId: number;
  initialSaved?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ArticleSaveButton({
  articleId,
  initialSaved = false,
  size = 'md',
  showLabel = false,
}: ArticleSaveButtonProps) {
  const { isSaved, toggleSave } = useArticleEngagement(articleId, {
    isSaved: initialSaved,
  });

  const sizeClasses = {
    sm: 'text-sm gap-1',
    md: 'text-base gap-1.5',
    lg: 'text-lg gap-2',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave();
      }}
      className={`flex items-center ${sizeClasses[size]} transition-all duration-200 group`}
      aria-label={isSaved ? 'Remove bookmark' : 'Bookmark article'}
    >
      <Bookmark
        className={`${iconSizes[size]} transition-all duration-200 ${
          isSaved
            ? 'fill-[hsl(var(--zw-yellow))] text-[hsl(var(--zw-yellow))] scale-110'
            : 'text-gray-400 group-hover:text-[hsl(var(--zw-yellow))] group-hover:scale-110'
        }`}
      />
      {showLabel && (
        <span
          className={`font-medium transition-colors ${
            isSaved
              ? 'text-[hsl(var(--zw-yellow))]'
              : 'text-gray-400 group-hover:text-[hsl(var(--zw-yellow))]'
          }`}
        >
          {isSaved ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
