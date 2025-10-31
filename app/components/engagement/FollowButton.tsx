import { useState } from "react";
import { UserPlus, UserMinus, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface FollowButtonProps {
  followType: "source" | "author" | "category";
  followId: number;
  followName: string;
  initialFollowing?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  followType,
  followId,
  followName,
  initialFollowing = false,
  size = "md",
  variant = "default",
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Size mappings
  const sizeClasses = {
    sm: { button: "px-3 py-1.5 text-xs", icon: "h-3 w-3" },
    md: { button: "px-4 py-2 text-sm", icon: "h-4 w-4" },
    lg: { button: "px-6 py-3 text-base", icon: "h-5 w-5" },
  };

  const handleFollow = async () => {
    // Check if user is logged in
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    // Optimistic update
    const previousFollowing = following;
    setFollowing(!following);
    setIsLoading(true);

    try {
      const endpoint = following
        ? `https://admin.hararemetro.co.zw/api/user/me/follows/${followType}/${followId}`
        : `https://admin.hararemetro.co.zw/api/user/me/follows`;

      const response = await fetch(endpoint, {
        method: following ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        ...(following
          ? {}
          : {
              body: JSON.stringify({
                followType,
                followId,
                followName,
              }),
            }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setFollowing(previousFollowing);
        console.error("Failed to toggle follow");
      } else {
        const data = (await response.json()) as { following: boolean };
        // Update with actual server data
        setFollowing(data.following);

        // Notify parent component
        if (onFollowChange) {
          onFollowChange(data.following);
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setFollowing(previousFollowing);
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (variant === "compact") {
      return null;
    }

    if (following) {
      return "Following";
    }

    switch (followType) {
      case "source":
        return "Follow Source";
      case "author":
        return "Follow Author";
      case "category":
        return "Follow Topic";
      default:
        return "Follow";
    }
  };

  const getIcon = () => {
    if (following) {
      return <Check className={sizeClasses[size].icon} />;
    }
    return <UserPlus className={sizeClasses[size].icon} />;
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`
          flex items-center gap-2 rounded-full font-semibold
          transition-all duration-200 ease-in-out
          ${sizeClasses[size].button}
          ${
            following
              ? "bg-gray-800 text-white hover:bg-[hsl(var(--zw-red))]/10 hover:text-[hsl(var(--zw-red))] border border-gray-700"
              : "bg-[hsl(var(--zw-green))] text-white hover:bg-[hsl(var(--zw-green))]/80 border border-[hsl(var(--zw-green))]"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={
          following ? `Unfollow ${followName}` : `Follow ${followName}`
        }
      >
        {isLoading ? (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        ) : (
          getIcon()
        )}
        {getButtonText()}
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
            to follow {followType === "category" ? "topics" : `${followType}s`}
          </div>
        </div>
      )}
    </div>
  );
}
