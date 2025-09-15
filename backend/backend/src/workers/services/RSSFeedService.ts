import { XMLParser } from 'fast-xml-parser';
import { CategoryManager } from './CategoryManager.js';
import { NewsSourceManager } from './NewsSourceManager.js';
import { CloudflareImagesService } from '../../src/services/CloudflareImagesService.js';

export interface RSSSource {
  id: string;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
  priority: number;
}

export interface Article {
  title: string;
  description?: string;
  content?: string;
  author?: string;
  source: string;
  source_id: string;
  source_url?: string;
  category_id?: string;
  published_at: string;
  image_url?: string;
  original_url: string;
  rss_guid?: string;
}

export class RSSFeedService {
  private parser: XMLParser;
  private categoryManager: CategoryManager;
  private sourceManager: NewsSourceManager;
  private imagesService?: CloudflareImagesService;
  
  constructor(private db: D1Database, imagesService?: CloudflareImagesService) {
    // Initialize XML parser with enhanced options
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      ignoreNameSpace: false,
      removeNSPrefix: false,
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
      processEntities: true,
      htmlEntities: true
    });
    
    // Initialize CategoryManager for intelligent classification
    this.categoryManager = new CategoryManager(this.db);
    
    // Initialize NewsSourceManager for performance tracking
    this.sourceManager = new NewsSourceManager(this.db);
    
    // Store images service for image optimization
    this.imagesService = imagesService;
  }

  /**
   * MAIN RSS REFRESH FUNCTION
   * This addresses your key concerns:
   * 1. Articles stored permanently in D1 (no age limits on DB)
   * 2. Analytics/counts not affected by caching or pagination
   * 3. Continuous growth database
   */
  async refreshAllFeeds(): Promise<{ 
    processed: number; 
    newArticles: number; 
    sources: number; 
    errors: string[] 
  }> {
    console.log('[RSS] Starting comprehensive RSS refresh');
    
    const results = {
      processed: 0,
      newArticles: 0,
      sources: 0,
      errors: [] as string[]
    };

    try {
      // Get all enabled RSS sources from D1
      const sourcesQuery = await this.db
        .prepare('SELECT * FROM rss_sources WHERE enabled = 1 ORDER BY priority DESC')
        .all();
      
      const sources = sourcesQuery.results as RSSSource[];
      console.log(`[RSS] Found ${sources.length} enabled RSS sources`);
      
      results.sources = sources.length;

      // Process each RSS source
      for (const source of sources) {
        try {
          console.log(`[RSS] Processing ${source.name} (${source.url})`);
          
          const articles = await this.fetchAndParseFeed(source);
          console.log(`[RSS] ${source.name}: Retrieved ${articles.length} articles`);
          
          // Store articles in D1 (PERMANENT STORAGE - NO AGE LIMITS)
          const newCount = await this.storeArticles(articles, source);
          
          results.processed += articles.length;
          results.newArticles += newCount;
          
          // Update source fetch status
          await this.updateSourceStatus(source.id, true, null);
          
          // Track source performance  
          await this.sourceManager.updateSourcePerformance(source.id, true, newCount);
          
          console.log(`[RSS] ${source.name}: Stored ${newCount} new articles`);
          
        } catch (error) {
          const errorMsg = `${source.name}: ${error.message}`;
          results.errors.push(errorMsg);
          console.error(`[RSS] Error processing ${source.name}:`, error);
          
          // Update source with error status
          await this.updateSourceStatus(source.id, false, error.message);
          
          // Track source performance failure
          await this.sourceManager.updateSourcePerformance(source.id, false, 0, error.message);
        }
      }
      
      console.log(`[RSS] Refresh complete: ${results.newArticles} new articles from ${results.processed} processed`);
      return results;
      
    } catch (error) {
      console.error('[RSS] Critical error in RSS refresh:', error);
      results.errors.push(`Critical error: ${error.message}`);
      return results;
    }
  }

  /**
   * Fetch and parse a single RSS feed
   */
  private async fetchAndParseFeed(source: RSSSource): Promise<Article[]> {
    // Fetch RSS feed with proper headers
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'Harare Metro News Aggregator 2.0',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Cache-Control': 'no-cache'
      },
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const feedData = this.parser.parse(xmlText);
    
    // Handle different RSS/Atom feed structures
    const channel = feedData.rss?.channel || feedData.feed || feedData;
    const items = channel.item || channel.entry || [];
    
    if (!Array.isArray(items)) {
      throw new Error('No articles found in RSS feed');
    }

    // Convert RSS items to our Article format
    const articles: Article[] = [];
    
    for (const item of items.slice(0, 50)) { // Limit to 50 articles per fetch
      try {
        const article = await this.parseRSSItem(item, source);
        if (article) {
          articles.push(article);
        }
      } catch (error) {
        console.warn(`[RSS] Error parsing item from ${source.name}:`, error);
      }
    }
    
    return articles;
  }

  /**
   * Parse a single RSS item into our Article format
   */
  private async parseRSSItem(item: any, source: RSSSource): Promise<Article | null> {
    // Extract title (required)
    const title = this.extractText(item.title);
    if (!title) {
      return null; // Skip items without titles
    }

    // Extract link (required)
    const link = this.extractLink(item);
    if (!link) {
      return null; // Skip items without links
    }

    // Extract description/content
    const description = this.extractText(
      item.description || 
      item.summary || 
      item['content:encoded'] ||
      item.content
    );

    // Extract publication date
    const pubDate = this.extractDate(
      item.pubDate || 
      item.published || 
      item.updated ||
      item['dc:date']
    );

    // Extract author
    const author = this.extractText(
      item.author || 
      item['dc:creator'] ||
      item.creator
    );

    // Extract image
    const imageUrl = await this.extractImage(item, link);
    
    // Process image with Cloudflare Images if available
    const articleId = this.generateArticleId(title, source.id);
    const optimizedImageUrl = await this.processImage(imageUrl, articleId);

    // Generate RSS GUID for deduplication
    const guid = item.guid?.['#text'] || item.guid || item.id || link;

    // Use intelligent category classification instead of source category
    const classificationText = `${title} ${description || ''}`;
    const intelligentCategory = await this.categoryManager.classifyContent(title, description);
    
    return {
      title: this.cleanText(title),
      description: description ? this.cleanText(description.substring(0, 500)) : undefined,
      author: author ? this.cleanText(author) : undefined,
      source: source.name,
      source_id: source.id,
      source_url: source.url,
      category_id: intelligentCategory,
      published_at: pubDate || new Date().toISOString(),
      image_url: optimizedImageUrl,
      original_url: link,
      rss_guid: guid
    };
  }

  /**
   * Store articles in D1 database
   * KEY: No age limits - permanent storage for analytics integrity
   */
  private async storeArticles(articles: Article[], source: RSSSource): Promise<number> {
    let newCount = 0;
    
    // Get valid category IDs to prevent FOREIGN KEY constraints
    const categoriesQuery = await this.db
      .prepare('SELECT id FROM categories')
      .all();
    const validCategoryIds = new Set(categoriesQuery.results.map((cat: any) => cat.id));
    
    for (const article of articles) {
      try {
        // Check if article already exists (prevent duplicates)
        const existing = await this.db
          .prepare('SELECT id FROM articles WHERE original_url = ? OR rss_guid = ?')
          .bind(article.original_url, article.rss_guid)
          .first();
        
        if (existing) {
          continue; // Skip duplicate articles
        }

        // Validate category_id - use 'general' if invalid
        let categoryId = article.category_id;
        if (!validCategoryIds.has(categoryId)) {
          categoryId = 'general'; // Fallback to general category
          console.warn(`[RSS] Invalid category_id "${article.category_id}" for article "${article.title}", using 'general'`);
        }

        // Insert new article (PERMANENT STORAGE)
        await this.db
          .prepare(`
            INSERT INTO articles (
              title, slug, description, author, source, source_id, source_url,
              category_id, published_at, image_url, original_url, rss_guid,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `)
          .bind(
            article.title,
            this.generateSlug(article.title),
            article.description,
            article.author,
            article.source,
            article.source_id,
            article.source_url,
            categoryId,
            article.published_at,
            article.image_url,
            article.original_url,
            article.rss_guid
          )
          .run();
        
        newCount++;
        
      } catch (error) {
        console.warn(`[RSS] Error storing article "${article.title}":`, error);
      }
    }
    
    return newCount;
  }

  /**
   * Update RSS source status
   */
  private async updateSourceStatus(sourceId: string, success: boolean, error: string | null): Promise<void> {
    try {
      await this.db
        .prepare(`
          UPDATE rss_sources 
          SET last_fetched_at = datetime('now'),
              fetch_count = fetch_count + 1,
              error_count = CASE WHEN ? THEN error_count ELSE error_count + 1 END,
              last_error = ?
          WHERE id = ?
        `)
        .bind(success, success ? null : error, sourceId)
        .run();
    } catch (err) {
      console.error(`[RSS] Error updating source status for ${sourceId}:`, err);
    }
  }

  // Utility methods for parsing RSS content
  private extractText(value: any): string | null {
    if (!value) return null;
    
    if (typeof value === 'string') {
      return value.trim();
    }
    
    if (typeof value === 'object') {
      return value['#text'] || value._ || value.text || null;
    }
    
    return null;
  }

  private extractLink(item: any): string | null {
    // Try different link formats
    if (typeof item.link === 'string') {
      return item.link;
    }
    
    if (item.link?.['@_href']) {
      return item.link['@_href'];
    }
    
    if (item.id && item.id.startsWith('http')) {
      return item.id;
    }
    
    return null;
  }

  private extractDate(dateValue: any): string | null {
    if (!dateValue) return null;
    
    try {
      const dateStr = typeof dateValue === 'string' ? dateValue : dateValue['#text'] || dateValue._ || '';
      const date = new Date(dateStr);
      
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date.toISOString();
    } catch {
      return null;
    }
  }

  private async extractImage(item: any, fallbackUrl: string): Promise<string | null> {
    // Simple image extraction - can be enhanced later
    try {
      // Check media:content
      if (item['media:content']?.['@_url'] && this.isImageUrl(item['media:content']['@_url'])) {
        return item['media:content']['@_url'];
      }

      // Check enclosure
      if (item.enclosure?.['@_url'] && this.isImageUrl(item.enclosure['@_url'])) {
        return item.enclosure['@_url'];
      }

      // Extract from description
      const description = this.extractText(item.description);
      if (description) {
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch && this.isImageUrl(imgMatch[1])) {
          return imgMatch[1];
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private isImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    const imageExtensions = /\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i;
    return imageExtensions.test(url) || url.includes('image') || url.includes('photo');
  }

  /**
   * Generate article ID for image processing
   */
  private generateArticleId(title: string, sourceId: string): string {
    const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    const timestamp = Date.now().toString();
    return `${sourceId}-${cleanTitle}-${timestamp}`;
  }

  /**
   * Process image through Cloudflare Images if service is available
   */
  private async processImage(imageUrl: string | null, articleId: string): Promise<string | null> {
    // Return null if no image
    if (!imageUrl) return null;

    // Return original URL if no images service available
    if (!this.imagesService) return imageUrl;

    try {
      // Process through Cloudflare Images
      return await this.imagesService.processRssImage(imageUrl, articleId);
    } catch (error) {
      console.warn(`Failed to process image ${imageUrl} for article ${articleId}:`, error);
      return imageUrl; // Fallback to original URL
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/^\s+|\s+$/g, '') // Trim
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 1000); // Limit length
  }

  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 100); // Limit length
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  }
}