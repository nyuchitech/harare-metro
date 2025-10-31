/**
 * Simple RSS Feed Service
 *
 * A clean, minimal implementation that focuses on:
 * 1. Fetching RSS feeds reliably
 * 2. Extracting images from feeds
 * 3. Simple keyword-based category assignment
 * 4. Basic keyword extraction
 *
 * No complex AI, no over-engineering - just working RSS aggregation
 */

import { XMLParser } from 'fast-xml-parser';

// Comprehensive list of trusted image domains for Zimbabwe news sites
const TRUSTED_IMAGE_DOMAINS = [
  // Primary Zimbabwe news sites
  'herald.co.zw',
  'heraldonline.co.zw',
  'newsday.co.zw',
  'chronicle.co.zw',
  'zbc.co.zw',
  'businessweekly.co.zw',
  'techzim.co.zw',
  't3n9sm.c2.acecdn.net', // Techzim CDN
  'thestandard.co.zw',
  'zimlive.com',
  'newzimbabwe.com',
  'theindependent.co.zw',
  'sundaymail.co.zw',
  '263chat.com',
  'dailynews.co.zw',
  'zimeye.net',
  'pindula.co.zw',
  'zimbabwesituation.com',
  'nehandaradio.com',
  'opennews.co.zw',
  'fingaz.co.zw',
  'manicapost.co.zw',
  'southerneye.co.zw',

  // WordPress and common CMS domains
  'wp.com',
  'wordpress.com',
  'files.wordpress.com',
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'i3.wp.com',

  // CDN and image hosting services
  'cloudinary.com',
  'res.cloudinary.com',
  'imgur.com',
  'i.imgur.com',
  'gravatar.com',
  'secure.gravatar.com',
  'amazonaws.com',
  's3.amazonaws.com',
  'cloudfront.net',
  'unsplash.com',
  'images.unsplash.com',
  'pexels.com',
  'images.pexels.com',

  // Google services
  'googleusercontent.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'blogger.googleusercontent.com',
  'drive.google.com',

  // Social media image domains
  'fbcdn.net',
  'scontent.fhre1-1.fna.fbcdn.net',
  'pbs.twimg.com',
  'abs.twimg.com',
  'instagram.com',

  // News agencies
  'ap.org',
  'apnews.com',
  'reuters.com',
  'bbci.co.uk',
  'bbc.co.uk',
  'cnn.com',
  'media.cnn.com',

  // African news networks
  'africanews.com',
  'mg.co.za',
  'news24.com',
  'timeslive.co.za',
  'iol.co.za',
  'citizen.co.za',

  // Generic image hosting
  'photobucket.com',
  'flickr.com',
  'staticflickr.com',
  'wikimedia.org',
  'upload.wikimedia.org'
];

interface RSSSource {
  id: string;
  name: string;
  url: string;
  enabled: number;
}

interface Article {
  title: string;
  description?: string;
  content?: string;
  author?: string;
  source: string;
  source_id: string;
  category_id: string;
  published_at: string;
  image_url?: string;
  original_url: string;
  rss_guid?: string;
}

export class SimpleRSSService {
  private db: D1Database;
  private parser: XMLParser;

  constructor(db: D1Database) {
    this.db = db;

    // Configure XML parser with simple settings
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    });
  }

  /**
   * Main entry point - refresh all RSS feeds
   */
  async refreshAllFeeds(): Promise<{
    success: boolean;
    newArticles: number;
    errors: number;
    details: string[];
  }> {
    console.log('[SIMPLE-RSS] Starting RSS refresh');

    const results = {
      success: true,
      newArticles: 0,
      errors: 0,
      details: [] as string[]
    };

    try {
      // Get all enabled RSS sources
      const sources = await this.db
        .prepare('SELECT id, name, url, enabled FROM rss_sources WHERE enabled = 1')
        .all<RSSSource>();

      if (!sources.results || sources.results.length === 0) {
        results.details.push('No enabled RSS sources found');
        return results;
      }

      console.log(`[SIMPLE-RSS] Found ${sources.results.length} enabled sources`);

      // Process each source
      for (const source of sources.results) {
        try {
          console.log(`[SIMPLE-RSS] Fetching ${source.name} (${source.url})`);
          const articles = await this.fetchAndParseFeed(source);

          console.log(`[SIMPLE-RSS] Parsed ${articles.length} articles from ${source.name}`);

          const stored = await this.storeArticles(articles);
          results.newArticles += stored;

          results.details.push(`${source.name}: ${stored} new articles`);
        } catch (error: any) {
          console.error(`[SIMPLE-RSS] Error processing ${source.name}:`, error.message);
          results.errors++;
          results.details.push(`${source.name}: ERROR - ${error.message}`);
        }
      }

      console.log(`[SIMPLE-RSS] Refresh complete. New articles: ${results.newArticles}, Errors: ${results.errors}`);

    } catch (error: any) {
      console.error('[SIMPLE-RSS] Fatal error during RSS refresh:', error);
      results.success = false;
      results.details.push(`Fatal error: ${error.message}`);
    }

    return results;
  }

  /**
   * Fetch and parse a single RSS feed
   */
  private async fetchAndParseFeed(source: RSSSource): Promise<Article[]> {
    // Fetch RSS feed with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Harare Metro News Aggregator/2.0 (https://www.hararemetro.co.zw)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();

      if (!xmlText || xmlText.trim().length === 0) {
        throw new Error('Empty response from RSS feed');
      }

      // Parse XML
      const feed = this.parser.parse(xmlText);

      // Extract items from RSS 2.0 or Atom feed
      let items = [];

      if (feed.rss?.channel?.item) {
        items = Array.isArray(feed.rss.channel.item)
          ? feed.rss.channel.item
          : [feed.rss.channel.item];
      } else if (feed.feed?.entry) {
        items = Array.isArray(feed.feed.entry)
          ? feed.feed.entry
          : [feed.feed.entry];
      } else {
        console.warn(`[SIMPLE-RSS] No items found in feed from ${source.name}`);
        return [];
      }

      // Convert items to articles (limit to 20 most recent)
      const articles = items.slice(0, 20).map(item => this.parseItem(item, source));

      return articles.filter(a => a !== null) as Article[];

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout (15s)');
      }
      throw error;
    }
  }

  /**
   * Parse a single RSS item into an Article
   */
  private parseItem(item: any, source: RSSSource): Article | null {
    try {
      // Extract title (required)
      const title = this.extractText(item.title);
      if (!title) {
        console.warn('[SIMPLE-RSS] Skipping item with no title');
        return null;
      }

      // Extract link (required)
      const link = this.extractText(item.link || item.guid);
      if (!link) {
        console.warn('[SIMPLE-RSS] Skipping item with no link');
        return null;
      }

      // Extract description (summary)
      const description = this.extractText(
        item.description ||
        item.summary
      );

      // Extract full content (priority to content:encoded for WordPress feeds)
      const content = this.extractText(
        item['content:encoded'] ||
        item.content ||
        item.description
      );

      // Extract published date
      const pubDate = this.parseDate(
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

      // Extract image - check multiple sources
      const imageUrl = this.extractImage(item);

      // Generate RSS GUID for deduplication
      const guid = this.extractText(item.guid) || link;

      // Assign category based on title and description
      const category = this.assignCategory(title, description || '');

      // Generate slug from title
      const slug = this.generateSlug(title);

      return {
        title: this.cleanText(title),
        description: description ? this.cleanText(description.substring(0, 500)) : undefined,
        content: content ? this.cleanText(content) : undefined,
        author: author ? this.cleanText(author) : undefined,
        source: source.name,
        source_id: source.id,
        category_id: category,
        published_at: pubDate,
        image_url: imageUrl,
        original_url: link,
        rss_guid: guid
      };
    } catch (error) {
      console.error('[SIMPLE-RSS] Error parsing item:', error);
      return null;
    }
  }

  /**
   * Extract text from XML element (handles nested objects)
   */
  private extractText(element: any): string | null {
    if (!element) return null;

    if (typeof element === 'string') {
      return element;
    }

    if (element['#text']) {
      return element['#text'];
    }

    if (element['@_href']) {
      return element['@_href'];
    }

    return null;
  }

  /**
   * Extract image URL from RSS item
   * Checks multiple common RSS image fields and validates against trusted domains
   */
  private extractImage(item: any): string | null {
    try {
      const imageCandidates: string[] = [];

      // 1. RSS Media tags (highest priority)
      if (item['media:content']?.['@_url']) {
        imageCandidates.push(item['media:content']['@_url']);
      }

      // 2. media:thumbnail
      if (item['media:thumbnail']?.['@_url']) {
        imageCandidates.push(item['media:thumbnail']['@_url']);
      }

      // 3. enclosure (if type is image)
      if (item.enclosure?.['@_url'] && item.enclosure?.['@_type']?.includes('image')) {
        imageCandidates.push(item.enclosure['@_url']);
      }

      // 4. RSS image tag
      if (item.image) {
        const imgUrl = typeof item.image === 'string' ? item.image : (item.image.url || item.image['@_url']);
        if (imgUrl) imageCandidates.push(imgUrl);
      }

      // 5. WordPress specific fields
      if (item['wp:featured_image']) {
        imageCandidates.push(item['wp:featured_image']);
      }

      if (item['wp:attachment_url']) {
        imageCandidates.push(item['wp:attachment_url']);
      }

      // 6. Extract from description HTML
      const description = this.extractText(item.description);
      if (description) {
        const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) imageCandidates.push(imgMatch[1]);

        // Look for og:image meta tags
        const ogMatch = description.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogMatch) imageCandidates.push(ogMatch[1]);
      }

      // 7. Extract from content:encoded HTML
      const contentEncoded = item['content:encoded'];
      if (contentEncoded) {
        const htmlContent = typeof contentEncoded === 'string'
          ? contentEncoded
          : (contentEncoded['#text'] || contentEncoded.toString());

        // Extract img src
        const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch) imageCandidates.push(imgMatch[1]);

        // Extract og:image
        const ogMatch = htmlContent.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        if (ogMatch) imageCandidates.push(ogMatch[1]);

        // Extract direct image URLs from content
        const urlRegex = /https?:\/\/[^\s<>"']+\.(?:jpe?g|png|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?/gi;
        const urlMatches = htmlContent.match(urlRegex);
        if (urlMatches) imageCandidates.push(...urlMatches);
      }

      // 8. Validate and filter candidates
      for (const candidate of imageCandidates) {
        if (!candidate || typeof candidate !== 'string') continue;

        // Clean URL
        let cleanUrl = candidate.trim()
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');

        // Handle protocol-relative URLs
        if (cleanUrl.startsWith('//')) {
          cleanUrl = `https:${cleanUrl}`;
        }

        // Validate URL format and check if it's an image
        if (!this.isValidImageUrl(cleanUrl)) continue;

        // Check if domain is trusted
        if (this.isTrustedImageDomain(cleanUrl)) {
          console.log('[SIMPLE-RSS] ✅ Found trusted image:', cleanUrl);
          return cleanUrl;
        }
      }

      // No valid image found
      return null;
    } catch (error) {
      console.error('[SIMPLE-RSS] Error extracting image:', error);
      return null;
    }
  }

  /**
   * Check if image URL is from a trusted domain
   */
  private isTrustedImageDomain(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return TRUSTED_IMAGE_DOMAINS.some(domain =>
        urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate image URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Must be http/https
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;

    // Check for image extensions or image in path
    const imageExtensions = /\.(jpe?g|png|gif|webp|svg|bmp|avif)(\?.*)?$/i;
    return imageExtensions.test(url) || url.includes('/image/') || url.includes('/img/');
  }

  /**
   * Assign category based on simple keyword matching
   * Categories match database categories: politics, economy, technology, sports, health,
   * education, entertainment, international, harare, agriculture, crime, environment, general
   */
  private assignCategory(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();

    // Crime & Justice keywords (check first - high specificity)
    if (text.match(/crime|police|arrest|court|justice|theft|murder|robbery|investigation|criminal|prison|sentence|jail|assault|fraud|corruption case/i)) {
      return 'crime';
    }

    // Politics keywords (expanded with Zimbabwe-specific terms)
    if (text.match(/politics|parliament|government|minister|president|election|vote|policy|zanu|mdc|ccc|opposition|mnangagwa|chamisa|senate|democracy|campaign|legislation|governance|reform|cabinet|party/i)) {
      return 'politics';
    }

    // Economy & Business keywords (expanded)
    if (text.match(/economy|business|market|trade|inflation|dollar|currency|bank|finance|investment|stock|gdp|forex|reserve bank|rbz|bond notes|rtgs|economic|financial|export|import|mining|gold|platinum|diamonds/i)) {
      return 'economy';
    }

    // Agriculture keywords (new category)
    if (text.match(/agriculture|farming|crop|livestock|tobacco|maize|cotton|farmer|harvest|irrigation|land|rural|commercial farming|agrarian/i)) {
      return 'agriculture';
    }

    // Technology keywords (expanded with Zimbabwe telcos)
    if (text.match(/technology|tech|digital|internet|software|app|computer|mobile|phone|cyber|ai|startup|innovation|ecocash|econet|netone|telecel|fintech|blockchain|ict/i)) {
      return 'technology';
    }

    // Sports keywords (expanded with Zimbabwe teams)
    if (text.match(/sport|football|soccer|rugby|cricket|tennis|basketball|athlete|team|match|game|tournament|warriors|chevrons|sables|dynamos|caps united|highlanders|psl|olympics/i)) {
      return 'sports';
    }

    // Health keywords
    if (text.match(/health|hospital|medical|doctor|patient|disease|covid|vaccine|clinic|treatment|medicine|pandemic|wellness|healthcare/i)) {
      return 'health';
    }

    // Education keywords (expanded with Zimbabwe institutions)
    if (text.match(/education|school|university|student|teacher|exam|college|learning|academic|degree|zimsec|uz|nust|msu|cut|examination/i)) {
      return 'education';
    }

    // Entertainment keywords (expanded with Zimbabwe genres)
    if (text.match(/entertainment|music|movie|film|celebrity|arts|culture|concert|festival|album|artist|dancehall|gospel|sungura|theatre/i)) {
      return 'entertainment';
    }

    // Environment keywords (new category)
    if (text.match(/environment|climate|conservation|wildlife|pollution|deforestation|recycling|renewable energy|sustainability|ecosystem|biodiversity|national park/i)) {
      return 'environment';
    }

    // Harare-specific keywords (new category)
    if (text.match(/harare|capital city|mbare|borrowdale|avondale|eastlea|highlands|kopje|waterfalls|westgate|city council|mayoral/i)) {
      return 'harare';
    }

    // International keywords (expanded with African focus)
    if (text.match(/international|world|global|foreign|usa|uk|china|africa|sadc|south africa|botswana|zambia|europe|asia|un|nato|biden|trump/i)) {
      return 'international';
    }

    // Default to general
    return 'general';
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: any): string {
    try {
      const text = this.extractText(dateStr);
      if (!text) return new Date().toISOString();

      const date = new Date(text);
      if (isNaN(date.getTime())) {
        return new Date().toISOString();
      }

      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Clean text - remove HTML, decode entities, trim, normalize whitespace
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&#8230;/g, '...') // Replace ellipsis entity
      .replace(/&#8211;/g, '-') // Replace en dash
      .replace(/&#8212;/g, '-') // Replace em dash
      .replace(/&#8216;/g, "'") // Replace left single quote
      .replace(/&#8217;/g, "'") // Replace right single quote
      .replace(/&#8220;/g, '"') // Replace left double quote
      .replace(/&#8221;/g, '"') // Replace right double quote
      .replace(/&#038;/g, '&') // Replace ampersand
      .replace(/&amp;/g, '&') // Replace HTML ampersand
      .replace(/&lt;/g, '<') // Replace less than
      .replace(/&gt;/g, '>') // Replace greater than
      .replace(/&quot;/g, '"') // Replace quote
      .replace(/&apos;/g, "'") // Replace apostrophe
      .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)) // Decode decimal entities
      .replace(/&nbsp;/g, ' ') // Replace non-breaking space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    const baseSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Add timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-6);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * Store articles in database (skip duplicates)
   */
  private async storeArticles(articles: Article[]): Promise<number> {
    let newCount = 0;

    for (const article of articles) {
      try {
        // Check if article already exists
        const existing = await this.db
          .prepare('SELECT id FROM articles WHERE original_url = ? OR rss_guid = ?')
          .bind(article.original_url, article.rss_guid)
          .first();

        if (existing) {
          console.log(`[SIMPLE-RSS] Skipping duplicate: ${article.title.substring(0, 50)}...`);
          continue;
        }

        // Generate slug
        const slug = this.generateSlug(article.title);

        // Insert article
        const insertResult = await this.db
          .prepare(`
            INSERT INTO articles (
              title, slug, description, content, author, source, source_id, source_url,
              category_id, published_at, image_url, original_url, rss_guid,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `)
          .bind(
            article.title,
            slug,
            article.description,
            article.content,
            article.author,
            article.source,
            article.source_id,
            article.source_id, // source_url same as source_id for now
            article.category_id,
            article.published_at,
            article.image_url,
            article.original_url,
            article.rss_guid
          )
          .run();

        const articleId = insertResult.meta.last_row_id;

        // Extract and store keywords
        const keywords = this.extractKeywords(article.title, article.description || '');
        if (keywords.length > 0) {
          await this.storeKeywords(articleId, keywords);
        }

        // Create/update author profile
        if (article.author && article.author.trim()) {
          await this.createOrUpdateAuthor(article.author, article.source);
        }

        console.log(`[SIMPLE-RSS] ✅ Stored: ${article.title.substring(0, 50)}... [${article.category_id}]${article.image_url ? ' 🖼️' : ''}${keywords.length > 0 ? ` [${keywords.length} keywords]` : ''}${article.author ? ` by ${article.author}` : ''}`);
        newCount++;

      } catch (error: any) {
        console.error(`[SIMPLE-RSS] Error storing article "${article.title}":`, error.message);
      }
    }

    return newCount;
  }

  /**
   * Extract simple keywords from article (top 5)
   */
  extractKeywords(title: string, description: string): string[] {
    const text = `${title} ${description}`.toLowerCase();

    // Comprehensive Zimbabwe-related keywords taxonomy (prioritized)
    const keywordPatterns = [
      // Core Zimbabwe terms (highest priority)
      'zimbabwe', 'harare', 'bulawayo', 'vic falls', 'victoria falls',

      // Politics
      'government', 'president', 'parliament', 'minister', 'policy', 'law', 'legislation',
      'zanu-pf', 'mdc', 'ccc', 'opposition', 'election', 'vote', 'politics', 'mnangagwa', 'chamisa',
      'senate', 'democracy', 'party', 'campaign', 'governance', 'reform',

      // Economy & Business
      'economy', 'business', 'finance', 'banking', 'investment', 'market', 'inflation',
      'dollar', 'currency', 'gdp', 'trade', 'export', 'import', 'stock', 'bond', 'forex',
      'zimbabwe dollar', 'usd', 'rtgs', 'reserve bank', 'rbz',

      // Mining & Agriculture
      'mining', 'gold', 'platinum', 'diamonds', 'agriculture', 'farming', 'tobacco',
      'maize', 'cotton', 'crop', 'livestock', 'harvest', 'irrigation', 'land',

      // Technology
      'technology', 'tech', 'digital', 'innovation', 'startup', 'internet', 'mobile',
      'app', 'software', 'ai', 'blockchain', 'fintech', 'ecocash', 'telecel', 'econet',
      'netone', 'ict',

      // Sports
      'sports', 'football', 'soccer', 'cricket', 'rugby', 'warriors', 'chevrons', 'sables',
      'dynamos', 'caps united', 'highlanders', 'psl', 'athletics', 'olympics',

      // Health
      'health', 'hospital', 'medical', 'doctor', 'covid', 'vaccine', 'disease',
      'treatment', 'clinic', 'wellness', 'pandemic',

      // Education
      'education', 'school', 'university', 'student', 'teacher', 'zimsec',
      'uz', 'nust', 'msu', 'cut', 'degree', 'examination',

      // Entertainment & Culture
      'music', 'entertainment', 'artist', 'culture', 'festival', 'concert',
      'dancehall', 'gospel', 'sungura',

      // Crime & Justice
      'crime', 'police', 'arrest', 'court', 'justice', 'investigation',

      // Environment
      'environment', 'climate', 'conservation', 'wildlife', 'pollution',

      // Places
      'mbare', 'borrowdale', 'avondale', 'eastlea', 'gweru', 'mutare', 'masvingo',
      'hwange', 'kariba', 'great zimbabwe'
    ];

    const found: string[] = [];

    for (const keyword of keywordPatterns) {
      if (text.includes(keyword)) {
        found.push(keyword);
        if (found.length >= 8) break; // Increased from 5 to 8 for better coverage
      }
    }

    return found;
  }

  /**
   * Store keywords and link them to article
   * Creates keyword records if they don't exist, and links them to the article
   */
  private async storeKeywords(articleId: number, keywords: string[]): Promise<void> {
    for (const keyword of keywords) {
      try {
        // Generate keyword ID and slug
        const keywordId = keyword.toLowerCase().replace(/\s+/g, '-');
        const keywordSlug = keywordId;
        const keywordName = keyword.charAt(0).toUpperCase() + keyword.slice(1);

        // Check if keyword exists in master table
        const existingKeyword = await this.db
          .prepare('SELECT id FROM keywords WHERE id = ?')
          .bind(keywordId)
          .first();

        if (!existingKeyword) {
          // Create keyword in master table
          await this.db
            .prepare(`
              INSERT INTO keywords (id, name, slug, type, enabled, created_at, updated_at)
              VALUES (?, ?, ?, 'general', 1, datetime('now'), datetime('now'))
            `)
            .bind(keywordId, keywordName, keywordSlug)
            .run();
        }

        // Link keyword to article (using article_keyword_links table)
        await this.db
          .prepare(`
            INSERT INTO article_keyword_links (article_id, keyword_id, relevance_score, source, created_at)
            VALUES (?, ?, 1.0, 'auto', datetime('now'))
            ON CONFLICT(article_id, keyword_id) DO NOTHING
          `)
          .bind(articleId, keywordId)
          .run();

        // Update keyword article count
        await this.db
          .prepare('UPDATE keywords SET article_count = article_count + 1 WHERE id = ?')
          .bind(keywordId)
          .run();

      } catch (error: any) {
        console.error(`[SIMPLE-RSS] Error storing keyword "${keyword}":`, error.message);
      }
    }
  }

  /**
   * Create or update author profile
   * Tracks author activity across sources
   */
  private async createOrUpdateAuthor(authorName: string, source: string): Promise<void> {
    try {
      // Clean up author name
      const cleanName = authorName.trim();
      if (!cleanName || cleanName.length < 2) {
        return; // Skip invalid names
      }

      // Generate normalized name for matching (lowercase, no special chars)
      const normalizedName = cleanName.toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

      // Check if author exists
      const existingAuthor = await this.db
        .prepare('SELECT id, article_count, expertise_categories FROM authors WHERE normalized_name = ?')
        .bind(normalizedName)
        .first();

      if (!existingAuthor) {
        // Create new author profile
        await this.db
          .prepare(`
            INSERT INTO authors (
              name, normalized_name, outlet, article_count,
              created_at, updated_at
            )
            VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
          `)
          .bind(cleanName, normalizedName, source)
          .run();

        console.log(`[SIMPLE-RSS] 👤 Created author profile: ${cleanName} (${source})`);
      } else {
        // Update existing author
        await this.db
          .prepare(`
            UPDATE authors
            SET article_count = article_count + 1,
                updated_at = datetime('now')
            WHERE id = ?
          `)
          .bind(existingAuthor.id)
          .run();
      }

    } catch (error: any) {
      console.error(`[SIMPLE-RSS] Error creating/updating author "${authorName}":`, error.message);
    }
  }
}
