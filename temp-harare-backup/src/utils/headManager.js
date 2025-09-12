// src/utils/headManager.js - Vite Head Management Utilities

/**
 * Update or create a meta tag
 * @param {string} name - The name or property of the meta tag
 * @param {string} content - The content of the meta tag
 * @param {boolean} isProperty - Whether to use 'property' instead of 'name'
 */
export const updateMetaTag = (name, content, isProperty = false) => {
  if (!content) return;
  
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
};

/**
 * Update the document title
 * @param {string} title - The new title
 */
export const updateTitle = (title) => {
  if (title) {
    document.title = title;
  }
};

/**
 * Update or create a link tag
 * @param {string} rel - The rel attribute
 * @param {string} href - The href attribute
 * @param {Object} additionalAttrs - Additional attributes
 */
export const updateLinkTag = (rel, href, additionalAttrs = {}) => {
  if (!href) return;
  
  let link = document.querySelector(`link[rel="${rel}"]`);
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', href);
  
  // Add any additional attributes
  Object.entries(additionalAttrs).forEach(([key, value]) => {
    link.setAttribute(key, value);
  });
};

/**
 * Remove a meta tag
 * @param {string} name - The name or property of the meta tag
 * @param {boolean} isProperty - Whether to use 'property' instead of 'name'
 */
export const removeMetaTag = (name, isProperty = false) => {
  const attribute = isProperty ? 'property' : 'name';
  const meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (meta) {
    meta.remove();
  }
};

/**
 * Add structured data to the head
 * @param {string} id - Unique ID for the script tag
 * @param {Object} data - The structured data object
 */
export const updateStructuredData = (id, data) => {
  // Remove existing structured data with this ID
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
  
  // Add new structured data
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

/**
 * Clean up all dynamically added meta tags (useful for SPA navigation)
 * @param {Array} preserveTags - Array of meta tag names to preserve
 */
export const cleanupMetaTags = (preserveTags = ['viewport', 'charset']) => {
  const metaTags = document.querySelectorAll('meta[name], meta[property]');
  metaTags.forEach(tag => {
    const name = tag.getAttribute('name') || tag.getAttribute('property');
    if (!preserveTags.includes(name)) {
      tag.remove();
    }
  });
};
