import { Heart } from 'lucide-react';
import { useArticleEngagement } from '~/hooks/useArticleEngagement';

interface ArticleLikeButtonProps {
  articleId: number;
  initialLiked?: boolean;
  initialLikeCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ArticleLikeButton({
  articleId,
  initialLiked = false,
  initialLikeCount = 0,
  showCount = true,
  size = 'md',
}: ArticleLikeButtonProps) {
  const { isLiked, likeCount, toggleLike } = useArticleEngagement(articleId, {
    isLiked: initialLiked,
    likeCount: initialLikeCount,
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
        toggleLike();
      }}
      className={`flex items-center ${sizeClasses[size]} transition-all duration-200 group`}
      aria-label={isLiked ? 'Unlike article' : 'Like article'}
    >
      <Heart
        className={`${iconSizes[size]} transition-all duration-200 ${
          isLiked
            ? 'fill-[hsl(var(--zw-red))] text-[hsl(var(--zw-red))] scale-110'
            : 'text-gray-400 group-hover:text-[hsl(var(--zw-red))] group-hover:scale-110'
        }`}
      />
      {showCount && (
        <span
          className={`font-medium transition-colors ${
            isLiked
              ? 'text-[hsl(var(--zw-red))]'
              : 'text-gray-400 group-hover:text-[hsl(var(--zw-red))]'
          }`}
        >
          {likeCount > 0 ? likeCount : ''}
        </span>
      )}
    </button>
  );
}
