import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface ArticleLikeButtonProps {
  articleId: number;
  initialLiked?: boolean;
  initialCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function ArticleLikeButton({
  articleId,
  initialLiked = false,
  initialCount = 0,
  size = "md",
  showCount = true,
}) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Size mappings
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const handleLike = async () => {
    // Check if user is logged in
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    // Optimistic update
    const previousLiked = liked;
    const previousCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        // Revert optimistic update on error
        setLiked(previousLiked);
        setCount(previousCount);
        console.error("Failed to toggle like");
      } else {
        const data = (await response.json()) as {
          liked: boolean;
          totalLikes?: number;
        };
        // Update with actual server data
        setLiked(data.liked);
        setCount(data.totalLikes || count);
      }
    } catch (error) {
      // Revert optimistic update on error
      setLiked(previousLiked);
      setCount(previousCount);
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full
          transition-all duration-200 ease-in-out
          ${
            liked
              ? "bg-[hsl(var(--zw-red))]/10 text-[hsl(var(--zw-red))]"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={liked ? "Unlike article" : "Like article"}
      >
        <Heart
          className={`${sizeClasses[size]} transition-transform ${
            liked ? "fill-current" : ""
          } ${isLoading ? "animate-pulse" : ""}`}
        />
        {showCount && (
          <span className={`font-medium ${textSizeClasses[size]}`}>
            {count.toLocaleString()}
          </span>
        )}
      </button>

      {/* Login prompt tooltip */}
      {showLoginPrompt && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-700 animate-in fade-in slide-in-from-top-1 duration-200">
            <a
              href="/auth/login"
              className="text-[hsl(var(--zw-green))] hover:underline"
            >
              Login
            </a>{" "}
            to like articles
          </div>
        </div>
      )}
    </div>
  );
}
