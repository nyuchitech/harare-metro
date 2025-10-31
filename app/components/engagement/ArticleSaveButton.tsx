import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface ArticleSaveButtonProps {
  articleId: number;
  initialSaved?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ArticleSaveButton({
  articleId,
  initialSaved = false,
  size = "md",
  showLabel = false,
}: ArticleSaveButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
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

  const handleSave = async () => {
    // Check if user is logged in
    if (!user) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 3000);
      return;
    }

    // Optimistic update
    const previousSaved = saved;
    setSaved(!saved);
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      if (!response.ok) {
        // Revert optimistic update on error
        setSaved(previousSaved);
        console.error("Failed to toggle save");
      } else {
        const data = (await response.json()) as { saved: boolean };
        // Update with actual server data
        setSaved(data.saved);
      }
    } catch (error) {
      // Revert optimistic update on error
      setSaved(previousSaved);
      console.error("Error toggling save:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        onClick={handleSave}
        disabled={isLoading}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full
          transition-all duration-200 ease-in-out
          ${
            saved
              ? "bg-[hsl(var(--zw-yellow))]/10 text-[hsl(var(--zw-yellow))]"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          }
          ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer active:scale-95"}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={saved ? "Remove bookmark" : "Bookmark article"}
      >
        <Bookmark
          className={`${sizeClasses[size]} transition-transform ${
            saved ? "fill-current" : ""
          } ${isLoading ? "animate-pulse" : ""}`}
        />
        {showLabel && (
          <span className={`font-medium ${textSizeClasses[size]}`}>
            {saved ? "Saved" : "Save"}
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
            to save articles
          </div>
        </div>
      )}
    </div>
  );
}
