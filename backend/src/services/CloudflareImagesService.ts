/**
 * Cloudflare Images Service
 * Handles image upload, storage, and optimization via Cloudflare Images
 */

export interface ImageUploadResult {
  success: boolean;
  result?: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  errors?: string[];
  messages?: string[];
}

export interface ImageVariant {
  public: string;
  thumbnail: string;
  hero: string;
}

export class CloudflareImagesService {
  private images: CloudflareImages;
  private accountId: string;

  constructor(images: CloudflareImages, accountId: string) {
    this.images = images;
    this.accountId = accountId;
  }

  /**
   * Upload image from URL to Cloudflare Images
   */
  async uploadFromUrl(imageUrl: string, metadata?: Record<string, any>): Promise<ImageUploadResult> {
    try {
      // Fetch the image
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Harare Metro News Bot/1.0',
          'Accept': 'image/*'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Get image data
      const imageData = await response.arrayBuffer();
      const contentType = response.headers.get('Content-Type') || 'image/jpeg';

      // Extract filename from URL or generate one
      const url = new URL(imageUrl);
      let filename = url.pathname.split('/').pop() || 'image';
      if (!filename.includes('.')) {
        const extension = contentType.includes('png') ? '.png' : 
                         contentType.includes('gif') ? '.gif' : 
                         contentType.includes('webp') ? '.webp' : '.jpg';
        filename += extension;
      }

      // Upload to Cloudflare Images
      const formData = new FormData();
      formData.append('file', new Blob([imageData], { type: contentType }), filename);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }

      const uploadResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.images}` // Note: This would need proper API token
        }
      });

      const result = await uploadResponse.json() as ImageUploadResult;
      
      if (!result.success) {
        throw new Error(`Image upload failed: ${result.errors?.join(', ')}`);
      }

      return result;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Get optimized image URLs for different variants
   */
  getImageVariants(imageId: string): ImageVariant {
    const baseUrl = `https://imagedelivery.net/${this.accountId}/${imageId}`;
    
    return {
      public: `${baseUrl}/public`,
      thumbnail: `${baseUrl}/thumbnail`, // 200x200
      hero: `${baseUrl}/hero` // 1200x630
    };
  }

  /**
   * Process and upload RSS feed image
   */
  async processRssImage(imageUrl: string, articleId: string): Promise<string | null> {
    try {
      // Skip if no image URL
      if (!imageUrl) return null;

      // Skip if image is already from Cloudflare Images
      if (imageUrl.includes('imagedelivery.net')) {
        return imageUrl;
      }

      // Upload image to Cloudflare Images
      const result = await this.uploadFromUrl(imageUrl, {
        source: 'rss_feed',
        article_id: articleId,
        original_url: imageUrl
      });

      if (result.success && result.result) {
        // Return optimized image URL
        const variants = this.getImageVariants(result.result.id);
        return variants.public;
      }

      // Fallback to original URL if upload fails
      console.warn('Image upload failed, using original URL:', result.errors);
      return imageUrl;
    } catch (error) {
      console.error('Failed to process RSS image:', error);
      return imageUrl; // Fallback to original
    }
  }

  /**
   * Batch process multiple images
   */
  async processMultipleImages(images: Array<{ url: string; articleId: string }>): Promise<Array<{ original: string; optimized: string | null }>> {
    const results = await Promise.allSettled(
      images.map(async ({ url, articleId }) => {
        const optimized = await this.processRssImage(url, articleId);
        return { original: url, optimized };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to process image ${images[index].url}:`, result.reason);
        return { original: images[index].url, optimized: null };
      }
    });
  }

  /**
   * Delete image from Cloudflare Images
   */
  async deleteImage(imageId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.images}`
        }
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }
}