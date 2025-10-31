import { UserPlus, Check } from 'lucide-react';
import { useFollow, type FollowType } from '~/hooks/useFollow';

interface FollowButtonProps {
  followType: FollowType;
  followId: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export function FollowButton({
  followType,
  followId,
  label,
  size = 'md',
  variant = 'primary',
}: FollowButtonProps) {
  const { isFollowing, loading, toggleFollow } = useFollow(followType, followId);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  };

  const variantClasses = {
    primary: isFollowing
      ? 'bg-gray-800 hover:bg-gray-700 text-white'
      : 'bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white',
    secondary: isFollowing
      ? 'bg-transparent border-2 border-gray-700 hover:border-gray-600 text-white'
      : 'bg-transparent border-2 border-[hsl(var(--zw-green))] hover:border-[hsl(var(--zw-green))]/80 text-[hsl(var(--zw-green))]',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const getLabel = () => {
    if (label) return label;
    if (loading) return 'Loading...';
    return isFollowing ? 'Following' : 'Follow';
  };

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`flex items-center ${sizeClasses[size]} ${variantClasses[variant]} font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
      aria-label={isFollowing ? `Unfollow ${followType}` : `Follow ${followType}`}
    >
      {loading ? (
        <div className={`${iconSizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : isFollowing ? (
        <Check className={iconSizes[size]} />
      ) : (
        <UserPlus className={iconSizes[size]} />
      )}
      <span>{getLabel()}</span>
    </button>
  );
}
