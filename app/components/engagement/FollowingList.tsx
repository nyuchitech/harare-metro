import { useState, useEffect } from "react";
import { Newspaper, UserCircle, Tag, Loader2, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface FollowItem {
  id: number;
  followType: "source" | "author" | "category";
  followId: number;
  followName: string;
  followedAt: string;
}

interface FollowingListProps {
  userId?: number;
  filterType?: "source" | "author" | "category" | "all";
  showUnfollowButton?: boolean;
  onUnfollow?: (item: FollowItem) => void;
}

export function FollowingList({
  userId,
  filterType = "all",
  showUnfollowButton = true,
  onUnfollow,
}: FollowingListProps) {
  const { user } = useAuth();
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !userId || (user?.id ? String(userId) === String(user.id) : false);

  useEffect(() => {
    fetchFollows();
  }, [userId, filterType]);

  const fetchFollows = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = isOwnProfile
        ? `https://admin.hararemetro.co.zw/api/user/me/follows${
            filterType !== "all" ? `?type=${filterType}` : ""
          }`
        : `https://admin.hararemetro.co.zw/api/user/${userId}/follows${
            filterType !== "all" ? `?type=${filterType}` : ""
          }`;

      const response = await fetch(endpoint, {
        headers: isOwnProfile
          ? {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            }
          : {},
      });

      if (!response.ok) {
        throw new Error("Failed to load following list");
      }

      const data = (await response.json()) as { follows?: FollowItem[] };
      setFollows(data.follows || []);
    } catch (err: any) {
      setError(err.message || "Failed to load following list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (item: FollowItem) => {
    if (!isOwnProfile) return;

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/user/me/follows/${item.followType}/${item.followId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to unfollow");
      }

      // Remove from local state
      setFollows((prev) => prev.filter((f) => f.id !== item.id));

      // Notify parent component
      if (onUnfollow) {
        onUnfollow(item);
      }
    } catch (err: any) {
      alert(err.message || "Failed to unfollow");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "source":
        return <Newspaper className="h-5 w-5 text-[hsl(var(--zw-green))]" />;
      case "author":
        return <UserCircle className="h-5 w-5 text-[hsl(var(--zw-yellow))]" />;
      case "category":
        return <Tag className="h-5 w-5 text-[hsl(var(--zw-red))]" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "source":
        return "News Source";
      case "author":
        return "Author";
      case "category":
        return "Topic";
      default:
        return type;
    }
  };

  const getItemUrl = (item: FollowItem) => {
    switch (item.followType) {
      case "source":
        return `/?source=${item.followId}`;
      case "author":
        return `/author/${item.followId}`;
      case "category":
        return `/?category=${item.followId}`;
      default:
        return "#";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--zw-green))]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[hsl(var(--zw-red))]/10 border border-[hsl(var(--zw-red))] rounded-xl p-4">
        <p className="text-[hsl(var(--zw-red))] text-sm">{error}</p>
      </div>
    );
  }

  if (follows.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
        <p className="text-gray-400">
          {isOwnProfile
            ? filterType === "all"
              ? "You're not following anything yet. Start exploring!"
              : `You're not following any ${filterType}s yet.`
            : "Not following anything yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {follows.map((item) => (
        <div
          key={item.id}
          className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <a
              href={getItemUrl(item)}
              className="flex items-center gap-3 flex-1 group"
            >
              {getIcon(item.followType)}
              <div className="flex-1">
                <h4 className="font-semibold text-white group-hover:text-[hsl(var(--zw-green))] transition-colors">
                  {item.followName}
                </h4>
                <p className="text-xs text-gray-500">
                  {getTypeLabel(item.followType)}
                </p>
              </div>
            </a>

            {showUnfollowButton && isOwnProfile && (
              <button
                onClick={() => handleUnfollow(item)}
                className="p-2 text-gray-500 hover:text-[hsl(var(--zw-red))] hover:bg-[hsl(var(--zw-red))]/10 rounded-full transition-colors"
                aria-label={`Unfollow ${item.followName}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
