import { XMLParser } from 'fast-xml-parser';
import { CategoryManager } from './CategoryManager.js';
import { NewsSourceManager } from './NewsSourceManager.js';
import { CloudflareImagesService } from './CloudflareImagesService.js';
import { ContentProcessingPipeline } from './ContentProcessingPipeline.js';

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
  private processingPipeline?: ContentProcessingPipeline;

  constructor(
    private db: D1Database,
    imagesService?: CloudflareImagesService,
    private ai?: any
  ) {
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

    // Initialize ContentProcessingPipeline for AI enhancement (including author recognition)
    if (ai) {
      this.processingPipeline = new ContentProcessingPipeline(db, ai);
    }
  }

  /**
   * INITIAL BULK PULL - For first-time setup and testing
   * Pulls more articles than regular refresh for comprehensive database seeding
   */
  async initialBulkPull(options: {
    articlesPerSource?: number;
    includeOlderArticles?: boolean;
    testMode?: boolean;
  } = {}): Promise<{ 
    processed: number; 
    newArticles: number; 
    sources: number; 
    errors: string[];
    sourceResults: Array<{
      sourceName: string;
      articlesFound: number;
      articlesStored: number;
      success: boolean;
      error?: string;
    }>;
  }> {
    const {
      articlesPerSource = 200, // Higher limit for initial pull
      includeOlderArticles = true,
      testMode = false
    } = options;

    console.log(`[RSS] Starting INITIAL BULK PULL - ${articlesPerSource} articles per source`);
    
    const results = {
      processed: 0,
      newArticles: 0,
      sources: 0,
      errors: [] as string[],
      sourceResults: [] as Array<{
        sourceName: string;
        articlesFound: number;
        articlesStored: number;
        success: boolean;
        error?: string;
      }>
    };

    try {
      // Get all enabled RSS sources from D1
      const sourcesQuery = await this.db
        .prepare('SELECT * FROM rss_sources WHERE enabled = 1 ORDER BY priority DESC')
        .all();
      
      const sources = sourcesQuery.results as RSSSource[];
      console.log(`[RSS] Found ${sources.length} enabled RSS sources for bulk pull`);
      
      results.sources = sources.length;

      // Process each RSS source with higher limits
      for (const source of sources) {
        const sourceResult = {
          sourceName: source.name,
          articlesFound: 0,
          articlesStored: 0,
          success: false,
          error: undefined as string | undefined
        };

        try {
          console.log(`[RSS] Bulk pulling from ${source.name} (${source.url})`);
          
          const articles = await this.fetchAndParseFeedBulk(source, articlesPerSource, includeOlderArticles);
          sourceResult.articlesFound = articles.length;
          console.log(`[RSS] ${source.name}: Retrieved ${articles.length} articles for bulk processing`);
          
          // Store articles in D1 with enhanced field population testing
          const newCount = await this.storeArticlesBulk(articles, source, testMode);
          sourceResult.articlesStored = newCount;
          
          results.processed += articles.length;
          results.newArticles += newCount;
          sourceResult.success = true;
          
          // Update source fetch status
          await this.updateSourceStatus(source.id, true, null);
          
          // Track source performance  
          await this.sourceManager.updateSourcePerformance(source.id, true, newCount);
          
          console.log(`[RSS] ${source.name}: Stored ${newCount}/${articles.length} articles in bulk pull`);
          
        } catch (error) {
          const errorMsg = `${source.name}: ${error.message}`;
          sourceResult.error = error.message;
          results.errors.push(errorMsg);
          console.error(`[RSS] Error in bulk pull for ${source.name}:`, error);
          
          // Update source with error status
          await this.updateSourceStatus(source.id, false, error.message);
          
          // Track source performance failure
          await this.sourceManager.updateSourcePerformance(source.id, false, 0, error.message);
        }

        results.sourceResults.push(sourceResult);

        // Small delay between sources in test mode
        if (testMode) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`[RSS] BULK PULL COMPLETE: ${results.newArticles} new articles from ${results.processed} processed across ${results.sources} sources`);
      return results;
      
    } catch (error) {
      console.error('[RSS] Critical error in bulk pull:', error);
      results.errors.push(`Critical error: ${error.message}`);
      return results;
    }
  }

  /**
   * MAIN RSS REFRESH FUNCTION
   * This addresses your key concerns:
   * 1. Articles stored permanently in D1 (no age limits on DB)
   * 2. Analytics/counts not affected by caching or pagination
   * 3. Continuous growth database
   * 4. Per-source daily limits (100 articles/day)
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
          
          // Check daily limit from database configuration
          const dailyCount = await this.getTodayArticleCount(source.id);
          const dailyLimit = source.daily_limit || 100; // Use source-specific limit
          
          if (dailyCount >= dailyLimit) {
            console.log(`[RSS] ${source.name}: Daily limit reached (${dailyCount}/${dailyLimit}), skipping`);
            continue;
          }
          
          const remainingQuota = dailyLimit - dailyCount;
          const articlesPerFetch = source.articles_per_fetch || 50;
          const articles = await this.fetchAndParseFeed(source, Math.min(articlesPerFetch, remainingQuota));
          console.log(`[RSS] ${source.name}: Retrieved ${articles.length} articles (quota: ${remainingQuota})`);
          
          // Store articles in D1 (PERMANENT STORAGE - NO AGE LIMITS)
          const newCount = await this.storeArticles(articles, source);
          
          results.processed += articles.length;
          results.newArticles += newCount;
          
          // Update source fetch status
          await this.updateSourceStatus(source.id, true, null);
          
          // Track source performance  
          await this.sourceManager.updateSourcePerformance(source.id, true, newCount);
          
          console.log(`[RSS] ${source.name}: Stored ${newCount} new articles (daily total: ${dailyCount + newCount}/${dailyLimit})`);
          
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
   * Get today's article count for a source from daily stats
   */
  private async getTodayArticleCount(sourceId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const result = await this.db
        .prepare('SELECT articles_stored FROM daily_source_stats WHERE source_id = ? AND date_tracked = ?')
        .bind(sourceId, today)
        .first() as any;
      
      return result?.articles_stored || 0;
    } catch (error) {
      console.warn(`[RSS] Error getting today's count for ${sourceId}:`, error);
      return 0;
    }
  }

  /**
   * Fetch and parse a single RSS feed with configurable limits
   */
  private async fetchAndParseFeed(source: RSSSource, maxArticles?: number): Promise<Article[]> {
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
    
    const articleLimit = maxArticles || 50;
    for (const item of items.slice(0, articleLimit)) { // Use configurable limit
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
    // Enhanced image extraction matching Google News/Feedly capabilities
    try {
      const imageCandidates: string[] = [];

      // 1. Check media:content (high quality, most common)
      if (item['media:content']?.['@_url']) {
        console.log(`[IMAGE-EXTRACT] Found media:content URL: ${item['media:content']['@_url']}`);
        imageCandidates.push(item['media:content']['@_url']);
      }

      // 2. Check media:thumbnail (common in RSS 2.0)
      if (item['media:thumbnail']?.['@_url']) {
        console.log(`[IMAGE-EXTRACT] Found media:thumbnail URL: ${item['media:thumbnail']['@_url']}`);
        imageCandidates.push(item['media:thumbnail']['@_url']);
      }

      // 3. Check enclosure (podcast/media RSS)
      if (item.enclosure?.['@_url'] && item.enclosure?.['@_type']?.includes('image')) {
        console.log(`[IMAGE-EXTRACT] Found enclosure URL: ${item.enclosure['@_url']}`);
        imageCandidates.push(item.enclosure['@_url']);
      }

      // 4. Extract from content:encoded (full HTML content)
      if (item['content:encoded']) {
        const contentEncoded = this.extractText(item['content:encoded']);
        const imgMatch = contentEncoded.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch) {
          console.log(`[IMAGE-EXTRACT] Found img in content:encoded: ${imgMatch[1]}`);
          imageCandidates.push(imgMatch[1]);
        }
      }

      // 5. Extract from description HTML
      const description = this.extractText(item.description);
      if (description) {
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch) {
          console.log(`[IMAGE-EXTRACT] Found img in description: ${imgMatch[1]}`);
          imageCandidates.push(imgMatch[1]);
        }
      }

      // 6. Try to extract og:image from article URL (premium feature like Feedly)
      if (fallbackUrl && this.shouldFetchOgImage(item)) {
        try {
          console.log(`[IMAGE-EXTRACT] Attempting to fetch og:image from ${fallbackUrl}`);
          const ogImage = await this.extractOgImage(fallbackUrl);
          if (ogImage) {
            console.log(`[IMAGE-EXTRACT] Found og:image: ${ogImage}`);
            imageCandidates.push(ogImage);
          }
        } catch (error) {
          console.warn(`Failed to extract og:image from ${fallbackUrl}:`, error);
        }
      }

      console.log(`[IMAGE-EXTRACT] Total candidates found: ${imageCandidates.length}`, imageCandidates);

      // Filter and validate image candidates
      for (const candidate of imageCandidates) {
        if (candidate && this.isImageUrl(candidate)) {
          console.log(`[IMAGE-EXTRACT] Validating candidate: ${candidate}`);
          // Validate that it's an accessible URL
          const validatedUrl = this.normalizeImageUrl(candidate, fallbackUrl);
          console.log(`[IMAGE-EXTRACT] Normalized URL: ${validatedUrl}`);

          if (validatedUrl) {
            const isAccessible = await this.isImageAccessible(validatedUrl);
            console.log(`[IMAGE-EXTRACT] Accessibility check for ${validatedUrl}: ${isAccessible}`);

            if (isAccessible) {
              console.log(`[IMAGE-EXTRACT] ✅ Selected image: ${validatedUrl}`);
              return validatedUrl;
            }
          }
        } else {
          console.log(`[IMAGE-EXTRACT] Skipped candidate (not image URL): ${candidate}`);
        }
      }

      console.warn(`[IMAGE-EXTRACT] ❌ No valid image found for article`);
      return null;
    } catch (error) {
      console.error(`[IMAGE-EXTRACT] Error extracting image:`, error);
      return null;
    }
  }

  /**
   * Determine if we should fetch og:image from article URL
   * Only do this for high-priority sources to avoid excessive requests
   */
  private shouldFetchOgImage(item: any): boolean {
    // Skip if we already have good image candidates
    if (item['media:content']?.['@_url'] || item['media:thumbnail']?.['@_url']) {
      return false;
    }
    // Only fetch for recent articles (within last 7 days)
    const pubDate = item.pubDate || item.published;
    if (pubDate) {
      const articleDate = new Date(pubDate);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return articleDate > weekAgo;
    }
    return false;
  }

  /**
   * Extract og:image from article URL
   */
  private async extractOgImage(articleUrl: string): Promise<string | null> {
    try {
      const response = await fetch(articleUrl, {
        headers: {
          'User-Agent': 'Harare Metro News Bot/1.0',
          'Accept': 'text/html'
        },
        timeout: 5000 // 5 second timeout
      });

      if (!response.ok) return null;

      const html = await response.text();

      // Extract og:image meta tag
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);
      if (ogImageMatch) {
        return ogImageMatch[1];
      }

      // Try alternate format
      const ogImageMatch2 = html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i);
      if (ogImageMatch2) {
        return ogImageMatch2[1];
      }

      return null;
    } catch (error) {
      console.warn(`Failed to fetch og:image from ${articleUrl}:`, error);
      return null;
    }
  }

  /**
   * Normalize image URL (handle relative URLs)
   */
  private normalizeImageUrl(imageUrl: string, baseUrl: string): string | null {
    try {
      // Already absolute URL
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }

      // Relative URL - need to resolve against base
      if (baseUrl) {
        const base = new URL(baseUrl);
        if (imageUrl.startsWith('//')) {
          return `${base.protocol}${imageUrl}`;
        }
        if (imageUrl.startsWith('/')) {
          return `${base.origin}${imageUrl}`;
        }
        return new URL(imageUrl, baseUrl).href;
      }

      return null;
    } catch (error) {
      console.warn(`Failed to normalize image URL ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Check if image URL is accessible
   * UPDATED: Less strict - fallback to URL validation if HEAD fails
   */
  private async isImageAccessible(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        timeout: 3000, // 3 second timeout
        headers: {
          'User-Agent': 'Harare Metro News Bot/1.0'
        }
      });

      // Check if response is successful and content-type is image
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        const isValid = contentType.startsWith('image/') || this.isImageUrl(imageUrl);
        console.log(`[IMAGE-ACCESSIBLE] HEAD request succeeded. Content-Type: ${contentType}, Valid: ${isValid}`);
        return isValid;
      }

      // If HEAD failed but status is 405 (Method Not Allowed), the server might not support HEAD
      // Fall back to URL validation
      if (response.status === 405) {
        console.log(`[IMAGE-ACCESSIBLE] HEAD not allowed (405), falling back to URL validation`);
        return this.isImageUrl(imageUrl);
      }

      console.warn(`[IMAGE-ACCESSIBLE] HEAD request failed with status ${response.status}`);
      // Still try URL validation as fallback
      return this.isImageUrl(imageUrl);
    } catch (error: any) {
      // If HEAD request fails (timeout, network error), fall back to URL validation
      // Many servers don't respond well to HEAD requests
      console.warn(`[IMAGE-ACCESSIBLE] HEAD request error for ${imageUrl}: ${error.message}. Falling back to URL validation.`);
      return this.isImageUrl(imageUrl);
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

  // ===================================================================
  // BULK PULL SPECIFIC METHODS
  // ===================================================================

  /**
   * Fetch and parse feed with bulk pull settings (higher limits, older articles)
   */
  private async fetchAndParseFeedBulk(
    source: RSSSource, 
    maxArticles: number, 
    includeOlderArticles: boolean
  ): Promise<Article[]> {
    // Use RSS URL if available, otherwise use main URL + /feed/
    const feedUrl = source.rss_url || source.url + '/feed/';
    
    // Fetch RSS feed with proper headers
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Harare Metro News Aggregator 2.0 (Bulk Pull)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'Cache-Control': 'no-cache'
      },
      timeout: 45000 // Longer timeout for bulk operations
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

    // Convert RSS items to our Article format with bulk settings
    const articles: Article[] = [];
    
    // Get system configuration for max article age if including older articles
    let maxAge = 30; // Default 30 days
    if (!includeOlderArticles) {
      maxAge = 7; // Only last week for regular bulk pull
    }
    
    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    
    for (const item of items.slice(0, maxArticles)) {
      try {
        const article = await this.parseRSSItem(item, source);
        if (article) {
          // Check article age if configured
          if (includeOlderArticles || new Date(article.published_at) > cutoffDate) {
            articles.push(article);
          }
        }
      } catch (error) {
        console.warn(`[RSS] Error parsing bulk item from ${source.name}:`, error);
      }
    }
    
    return articles;
  }

  /**
   * Store articles with enhanced field population testing for bulk operations
   */
  private async storeArticlesBulk(articles: Article[], source: RSSSource, testMode: boolean = false): Promise<number> {
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
          if (testMode) {
            console.log(`[RSS] [TEST] Duplicate article skipped: "${article.title}"`);
          }
          continue; // Skip duplicate articles
        }

        // Validate category_id - use 'general' if invalid
        let categoryId = article.category_id;
        if (!validCategoryIds.has(categoryId)) {
          categoryId = 'general'; // Fallback to general category
          if (testMode) {
            console.warn(`[RSS] [TEST] Invalid category_id "${article.category_id}" for article "${article.title}", using 'general'`);
          }
        }

        // Enhanced field population testing in test mode
        if (testMode) {
          console.log(`[RSS] [TEST] Article fields for "${article.title.substring(0, 50)}...":`, {
            hasTitle: !!article.title,
            hasDescription: !!article.description,
            hasAuthor: !!article.author,
            hasSource: !!article.source,
            hasCategory: !!categoryId,
            hasPublishedAt: !!article.published_at,
            hasImageUrl: !!article.image_url,
            hasOriginalUrl: !!article.original_url,
            hasRssGuid: !!article.rss_guid,
            descriptionLength: article.description?.length || 0,
            publishedAt: article.published_at
          });
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
        
        if (testMode && newCount <= 5) {
          console.log(`[RSS] [TEST] Successfully stored article #${newCount}: "${article.title}"`);
        }
        
      } catch (error) {
        console.warn(`[RSS] Error storing article "${article.title}":`, error);
        if (testMode) {
          console.error(`[RSS] [TEST] Error details for "${article.title}":`, error.message);
        }
      }
    }
    
    return newCount;
  }

  /**
   * Get system configuration value
   */
  private async getSystemConfig(key: string, defaultValue: any): Promise<any> {
    try {
      const result = await this.db
        .prepare('SELECT config_value, config_type FROM system_config WHERE config_key = ?')
        .bind(key)
        .first() as any;
      
      if (!result) return defaultValue;
      
      // Parse based on type
      switch (result.config_type) {
        case 'number':
          return parseInt(result.config_value);
        case 'boolean':
          return result.config_value === 'true';
        case 'json':
          return JSON.parse(result.config_value);
        default:
          return result.config_value;
      }
    } catch (error) {
      console.warn(`[RSS] Error getting system config ${key}:`, error);
      return defaultValue;
    }
  }
}