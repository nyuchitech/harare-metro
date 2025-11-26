/**
 * Frontend Image Service
 * Handles image loading, caching, and optimization for the frontend
 * Replaces backend image proxy with client-side processing
 */

export interface ImageOptions {
  variant?: 'thumbnail' | 'hero' | 'public' | 'original';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  fallback?: string;
}

export interface ImageResult {
  src: string;
  srcSet?: string;
  error?: string;
  loading?: boolean;
}

export class ImageService {
  private cache = new Map<string, ImageResult>();
  private loadingPromises = new Map<string, Promise<ImageResult>>();

  /**
   * Get optimized image URL with caching
   */
  async getImage(imageUrl: string, optionsageOptions = {})omise<ImageResult> {
    const cacheKey = this.getCacheKey(imageUrl, options);
    
    // Return cached result if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    // Start loading
    const loadingPromise = this.loadImage(imageUrl, options);
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;
      this.cache.set(cacheKey, result);
      this.loadingPromises.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingPromises.delete(cacheKey);
      const errorResultageResult = {
        src: options.fallback || this.getPlaceholderImage(),
        error: error instanceof Error ? error.message : 'Image load failed'
      };
      this.cache.set(cacheKey, errorResult);
      return errorResult;
    }
  }

  /**
   * Load and validate image
   */
  private async loadImage(imageUrl: string, optionsageOptions)omise<ImageResult> {
    // Validate URL
    try {
      new URL(imageUrl);
    } catch {
      throw new Error('Invalid image URL');
    }

    // Generate optimized URL based on options
    const optimizedUrl = this.getOptimizedUrl(imageUrl, options);
    
    // Validate image loads
    await this.validateImage(optimizedUrl);

    return {
      src: optimizedUrl,
      srcSet: this.generateSrcSet(imageUrl, options)
    };
  }

  /**
   * Generate optimized URL (using URL parameters or Cloudflare Image Resizing)
   */
  private getOptimizedUrl(imageUrl: string, optionsageOptions): string {
    const url = new URL(imageUrl);
    
    // Add Cloudflare Image Resizing parameters if supported
    if (options.size) {
      const sizeMap = {
        sm: '300',
        md: '600', 
        lg: '900',
        xl: '1200'
      };
      url.searchParams.set('width', sizeMap[options.size);
    }

    if (options.format && options.format !== 'auto') {
      url.searchParams.set('format', options.format);
    }

    if (options.quality) {
      url.searchParams.set('quality', options.quality.toString());
    }

    return url.toString();
  }

  /**
   * Generate responsive srcSet
   */
  private generateSrcSet(imageUrl: string, optionsageOptions): string {
    const sizes = ['300w', '600w', '900w', '1200w';
    const srcSet = sizes.map(size => {
      const width = size.replace('w', '');
      const url = new URL(imageUrl);
      url.searchParams.set('width', width);
      if (options.format && options.format !== 'auto') {
        url.searchParams.set('format', options.format);
      }
      return `${url.toString()} ${size}`;
    });
    
    return srcSet.join(', ');
  }

  /**
   * Validate that image can be loaded
   */
  private validateImage(url: string)omise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;
    });
  }

  /**
   * Generate cache key
   */
  private getCacheKey(imageUrl: string, optionsageOptions): string {
    return `${imageUrl}-${JSON.stringify(options)}`;
  }

  /**
   * Get placeholder image for failed loads
   */
  private getPlaceholderImage(): string {
    // Generate a simple SVG placeholder
    const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="system-ui">Image not available</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Preload images
   */
  async preloadImages(urls: string[, optionsageOptions = {})omise<void> {
    const promises = urls.map(url => this.getImage(url, options));
    await Promise.allSettled(promises);
  }
}

// Singleton instance
export const imageService = new ImageService();

/**
 * React hook for using the image service
 */
export function useOptimizedImage(imageUrl: string | null, optionsageOptions = {}) {
  const [result, setResult = React.useState<ImageResult>({ 
    src: options.fallback || imageService['getPlaceholderImage'(), 
    loading: true 
  });

  React.useEffect(() => {
    if (!imageUrl) {
      setResult({ 
        src: options.fallback || imageService['getPlaceholderImage'(), 
        loading: false 
      });
      return;
    }

    let cancelled = false;

    imageService.getImage(imageUrl, options).then(result => {
      if (!cancelled) {
        setResult({ ...result, loading: false });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl, JSON.stringify(options));

  return result;
}

// Import React for the hook
import * as React from 'react';