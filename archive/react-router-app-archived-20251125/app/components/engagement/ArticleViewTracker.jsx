import { useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface ArticleViewTrackerProps {
  articleId: number;
  articleTitle: string;
  articleSource: string;
  articleCategory?: string;
  onViewTracked?: () => void;
}

export function ArticleViewTracker({
  articleId,
  articleTitle,
  articleSource,
  articleCategory,
  onViewTracked,
}) {
  const { user } = useAuth();
  const hasTracked = useRef(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    // Only track once per component mount
    if (hasTracked.current) return;

    // Track view after 3 seconds of page visibility (indicates genuine engagement)
    const viewTimer = setTimeout(() => {
      trackView();
    }, 3000);

    // Track when user leaves the page
    const handleBeforeUnload = () => {
      trackView(true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearTimeout(viewTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Track view on unmount if not already tracked
      if (!hasTracked.current) {
        trackView(true);
      }
    };
  }, [articleId]);

  const trackView = async (isFinal = false) => {
    if (hasTracked.current && !isFinal) return;

    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000); // in seconds

    // Only track if user spent at least 3 seconds on the page
    if (timeSpent < 3 && !isFinal) return;

    hasTracked.current = true;

    try {
      const payload = {
        articleId,
        articleTitle,
        articleSource,
        timeSpent,
      };

      if (articleCategory) {
        payload.articleCategory = articleCategory;
      }

      // Include user ID if logged in
      if (user?.id) {
        payload.userId = user.id;
      }

      await fetch(
        `https://admin.hararemetro.co.zw/api/articles/${articleId}/view`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user
              ? { Authorization: `Bearer ${localStorage.getItem("auth_token")}
          credentials: "include",` }
              : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      // Call callback if provided
      if (onViewTracked) {
        onViewTracked();
      }
    } catch (error) {
      // Silently fail - view tracking shouldn't break the UX
      console.error("Error tracking article view:", error);
    }
  };

  // This component is invisible - it only tracks views
  return null;
}
