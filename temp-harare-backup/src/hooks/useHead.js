// src/hooks/useHead.js - Custom hook for head management
import { useEffect } from 'react';
import { updateTitle, updateMetaTag, updateLinkTag } from '@/utils/headManager';

/**
 * Custom hook for managing document head
 * @param {Object} config - Configuration object
 */
export const useHead = ({
  title,
  description,
  keywords,
  image,
  canonical,
  noIndex = false
} = {}) => {
  useEffect(() => {
    if (title) {
      updateTitle(title);
    }

    if (description) {
      updateMetaTag('description', description);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    if (image) {
      updateMetaTag('og:image', image, true);
      updateMetaTag('twitter:image', image);
    }

    if (canonical) {
      updateLinkTag('canonical', canonical);
    }

    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    }

  }, [title, description, keywords, image, canonical, noIndex]);
};

/**
 * Hook specifically for article pages
 * @param {Object} article - Article data
 */
export const useArticleHead = (article) => {
  useEffect(() => {
    if (!article) return;

    const title = `${article.title} | Harare Metro`;
    updateTitle(title);
    
    updateMetaTag('description', article.description || article.excerpt);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', article.description || article.excerpt, true);
    updateMetaTag('og:type', 'article', true);
    
    if (article.image) {
      updateMetaTag('og:image', article.image, true);
      updateMetaTag('twitter:image', article.image);
    }

    // Article specific meta
    updateMetaTag('article:published_time', article.pubDate, true);
    updateMetaTag('article:author', article.source, true);
    updateMetaTag('article:section', article.category, true);

  }, [article]);
};
