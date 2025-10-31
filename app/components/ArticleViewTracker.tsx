import { useEffect, useRef } from 'react';
import { useArticleEngagement } from '~/hooks/useArticleEngagement';

interface ArticleViewTrackerProps {
  articleId: number;
}

export function ArticleViewTracker({ articleId }: ArticleViewTrackerProps) {
  const { trackView } = useArticleEngagement(articleId);
  const hasTracked = useRef(false);
  const startTime = useRef<number>(Date.now());
  const scrollDepth = useRef<number>(0);

  useEffect(() => {
    // Track view once on mount
    if (!hasTracked.current) {
      trackView();
      hasTracked.current = true;
    }

    // Track scroll depth
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100
      );
      scrollDepth.current = Math.max(scrollDepth.current, scrollPercent);
    };

    // Track reading time on page unload
    const handleBeforeUnload = () => {
      const readingTime = Math.round((Date.now() - startTime.current) / 1000);
      // Send beacon for tracking (non-blocking)
      const token = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('auth_token='))
        ?.split('=')[1];

      if (token) {
        navigator.sendBeacon(
          `https://admin.hararemetro.co.zw/api/articles/${articleId}/reading-time`,
          JSON.stringify({
            readingTime,
            scrollDepth: scrollDepth.current,
          })
        );
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [articleId, trackView]);

  // This component doesn't render anything
  return null;
}
