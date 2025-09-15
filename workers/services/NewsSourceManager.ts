/**
 * NewsSourceManager - Dynamic News Source Management System
 * 
 * Features:
 * - Dynamic source discovery and validation
 * - Source quality scoring and monitoring
 * - Automatic RSS feed detection
 * - Source performance tracking
 * - Bulk source import/management
 * - Source health monitoring
 */

import { CategoryManager } from './CategoryManager.js';

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  rss_url?: string;
  base_domain: string;
  category: string;
  country: string;
  language: string;
  enabled: boolean;
  priority: number;
  quality_score: number;
  reliability_score: number;
  freshness_score: number;
  last_validated_at?: string;
  validation_status: 'pending' | 'valid' | 'invalid' | 'needs_review';
  error_count: number;
  success_count: number;
  last_error?: string;
  last_successful_fetch?: string;
  created_at: string;
  updated_at: string;
}

export interface SourceValidationResult {
  is_valid: boolean;
  rss_url?: string;
  detected_feeds: string[];
  feed_quality: number;
  estimated_update_frequency: string;
  language_detected?: string;
  content_sample?: string;
  error_message?: string;
  validation_details: {
    has_rss: boolean;
    rss_accessible: boolean;
    articles_count: number;
    recent_articles: boolean;
    feed_structure_valid: boolean;
    encoding_issues: boolean;
  };
}

export class NewsSourceManager {
  constructor(private db: D1Database) {}

  // ===============================================================
  // SOURCE DISCOVERY AND VALIDATION
  // ===============================================================

  /**
   * Discover RSS feeds from a website URL
   */
  async discoverRSSFeeds(websiteUrl: string): Promise<string[]> {
    try {
      console.log(`[NewsSourceManager] Discovering RSS feeds for: ${websiteUrl}`);
      
      // Common RSS feed patterns for Zimbabwe news sites
      const commonPaths = [
        '/feed/',
        '/rss/',
        '/feed.xml',
        '/rss.xml',
        '/feeds/all.rss.xml',
        '/index.xml',
        '/?feed=rss2',
        '/wp-rss2.php',
        '/news/feed/',
        '/articles/feed/'
      ];

      const baseUrl = websiteUrl.replace(/\/$/, '');
      const discoveredFeeds: string[] = [];

      // Try each common path
      for (const path of commonPaths) {
        const feedUrl = `${baseUrl}${path}`;
        
        try {
          const response = await fetch(feedUrl, {
            method: 'HEAD',
            timeout: 10000,
            headers: {
              'User-Agent': 'Harare Metro News Aggregator 2.0 (Feed Discovery)'
            }
          });

          if (response.ok) {
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('xml') || contentType.includes('rss')) {
              discoveredFeeds.push(feedUrl);
              console.log(`[NewsSourceManager] Found RSS feed: ${feedUrl}`);
            }
          }
        } catch (error) {
          // Continue to next path
        }
      }

      // Try to fetch main page and look for RSS links
      try {
        const mainPageResponse = await fetch(websiteUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Harare Metro News Aggregator 2.0 (Feed Discovery)'
          }
        });

        if (mainPageResponse.ok) {
          const html = await mainPageResponse.text();
          
          // Look for RSS feed links in HTML
          const rssLinkRegex = /<link[^>]+type=["\']application\/rss\+xml["\'][^>]*href=["\']([^"\']+)["\'][^>]*>/gi;
          const atomLinkRegex = /<link[^>]+type=["\']application\/atom\+xml["\'][^>]*href=["\']([^"\']+)["\'][^>]*>/gi;
          
          let match;
          while ((match = rssLinkRegex.exec(html)) !== null) {
            const feedUrl = match[1].startsWith('http') ? match[1] : `${baseUrl}${match[1]}`;
            if (!discoveredFeeds.includes(feedUrl)) {
              discoveredFeeds.push(feedUrl);
            }
          }

          while ((match = atomLinkRegex.exec(html)) !== null) {
            const feedUrl = match[1].startsWith('http') ? match[1] : `${baseUrl}${match[1]}`;
            if (!discoveredFeeds.includes(feedUrl)) {
              discoveredFeeds.push(feedUrl);
            }
          }
        }
      } catch (error) {
        console.warn(`[NewsSourceManager] Could not fetch main page for ${websiteUrl}:`, error);
      }

      console.log(`[NewsSourceManager] Discovered ${discoveredFeeds.length} feeds for ${websiteUrl}`);
      return discoveredFeeds;
    } catch (error) {
      console.error(`[NewsSourceManager] Error discovering feeds for ${websiteUrl}:`, error);
      return [];
    }
  }

  /**
   * Validate an RSS feed and assess its quality
   */
  async validateRSSFeed(feedUrl: string): Promise<SourceValidationResult> {
    try {
      console.log(`[NewsSourceManager] Validating RSS feed: ${feedUrl}`);
      
      const result: SourceValidationResult = {
        is_valid: false,
        detected_feeds: [feedUrl],
        feed_quality: 0,
        estimated_update_frequency: 'unknown',
        validation_details: {
          has_rss: true,
          rss_accessible: false,
          articles_count: 0,
          recent_articles: false,
          feed_structure_valid: false,
          encoding_issues: false
        }
      };

      // Try to fetch the RSS feed
      const response = await fetch(feedUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Harare Metro News Aggregator 2.0 (Validation)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        }
      });

      if (!response.ok) {
        result.error_message = `HTTP ${response.status}: ${response.statusText}`;
        return result;
      }

      result.validation_details.rss_accessible = true;

      // Parse the feed content
      const xmlContent = await response.text();
      
      // Basic XML validation
      if (!xmlContent.includes('<rss') && !xmlContent.includes('<feed')) {
        result.error_message = 'Not a valid RSS or Atom feed';
        return result;
      }

      result.validation_details.feed_structure_valid = true;

      // Extract articles for quality assessment
      try {
        // Dynamic import for better performance - only load parser when needed
        const { XMLParser } = await import('fast-xml-parser');
        const parser = new XMLParser({
          ignoreAttributes: false,
          parseAttributeValue: true,
          trimValues: true
        });

        const feedData = parser.parse(xmlContent);
        const channel = feedData.rss?.channel || feedData.feed;
        const items = channel?.item || channel?.entry || [];

        if (Array.isArray(items) && items.length > 0) {
          result.validation_details.articles_count = items.length;
          result.feed_quality = Math.min(items.length * 10, 100); // Max 100

          // Check for recent articles (within last 7 days)
          const recentArticles = items.filter(item => {
            const pubDate = item.pubDate || item.published || item.updated;
            if (pubDate) {
              const articleDate = new Date(pubDate);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return articleDate > weekAgo;
            }
            return false;
          });

          result.validation_details.recent_articles = recentArticles.length > 0;
          if (recentArticles.length > 0) {
            result.feed_quality += 20; // Bonus for recent content
          }

          // Estimate update frequency
          if (recentArticles.length >= 5) {
            result.estimated_update_frequency = 'daily';
          } else if (recentArticles.length >= 2) {
            result.estimated_update_frequency = 'weekly';  
          } else {
            result.estimated_update_frequency = 'monthly';
          }

          // Sample content for language detection
          if (items[0]) {
            const title = items[0].title || '';
            const description = items[0].description || '';
            result.content_sample = `${title} ${description}`.substring(0, 200);
            
            // Simple language detection for Zimbabwe content
            const zimbabweKeywords = ['zimbabwe', 'harare', 'bulawayo', 'zim', 'zw', 'rtgs', 'bond'];
            const hasZimbabweContent = zimbabweKeywords.some(keyword => 
              result.content_sample.toLowerCase().includes(keyword)
            );
            
            if (hasZimbabweContent) {
              result.language_detected = 'en-zw'; // English (Zimbabwe)
              result.feed_quality += 30; // Bonus for Zimbabwe relevance
            } else {
              result.language_detected = 'en';
            }
          }

          result.is_valid = true;
          result.rss_url = feedUrl;

        } else {
          result.error_message = 'Feed contains no articles';
        }

      } catch (parseError) {
        result.error_message = `Feed parsing error: ${parseError.message}`;
        result.validation_details.encoding_issues = true;
      }

      console.log(`[NewsSourceManager] Validation complete for ${feedUrl}: quality=${result.feed_quality}, valid=${result.is_valid}`);
      return result;

    } catch (error) {
      console.error(`[NewsSourceManager] Error validating ${feedUrl}:`, error);
      return {
        is_valid: false,
        detected_feeds: [],
        feed_quality: 0,
        estimated_update_frequency: 'unknown',
        error_message: error.message,
        validation_details: {
          has_rss: false,
          rss_accessible: false,
          articles_count: 0,
          recent_articles: false,
          feed_structure_valid: false,
          encoding_issues: false
        }
      };
    }
  }

  /**
   * Add a new news source with automatic validation
   */
  async addNewsSource(
    websiteUrl: string,
    sourceName: string,
    category: string = 'general',
    priority: number = 3
  ): Promise<{ success: boolean; source?: NewsSource; message: string }> {
    try {
      console.log(`[NewsSourceManager] Adding new source: ${sourceName} (${websiteUrl})`);

      // Extract base domain
      const baseDomain = new URL(websiteUrl).hostname;

      // Check if source already exists
      const existingSource = await this.db
        .prepare('SELECT id FROM rss_sources WHERE base_domain = ?')
        .bind(baseDomain)
        .first();

      if (existingSource) {
        return {
          success: false,
          message: `Source with domain ${baseDomain} already exists`
        };
      }

      // Discover RSS feeds
      const discoveredFeeds = await this.discoverRSSFeeds(websiteUrl);

      if (discoveredFeeds.length === 0) {
        return {
          success: false,
          message: 'No RSS feeds found on this website'
        };
      }

      // Validate the best feed
      let bestFeed = discoveredFeeds[0];
      let bestValidation: SourceValidationResult | null = null;

      for (const feedUrl of discoveredFeeds.slice(0, 3)) { // Check top 3 feeds
        const validation = await this.validateRSSFeed(feedUrl);
        if (validation.is_valid && (!bestValidation || validation.feed_quality > bestValidation.feed_quality)) {
          bestFeed = feedUrl;
          bestValidation = validation;
        }
      }

      if (!bestValidation || !bestValidation.is_valid) {
        return {
          success: false,
          message: 'No valid RSS feeds found on this website'
        };
      }

      // Generate source ID
      const sourceId = sourceName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);

      // Create source record
      const source: NewsSource = {
        id: sourceId,
        name: sourceName,
        url: websiteUrl,
        rss_url: bestFeed,
        base_domain: baseDomain,
        category: category,
        country: 'ZW', // Zimbabwe
        language: bestValidation.language_detected || 'en',
        enabled: true,
        priority: priority,
        quality_score: bestValidation.feed_quality,
        reliability_score: 50, // Start with neutral score
        freshness_score: bestValidation.validation_details.recent_articles ? 80 : 30,
        validation_status: 'valid',
        error_count: 0,
        success_count: 1,
        last_validated_at: new Date().toISOString(),
        last_successful_fetch: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Insert into database
      await this.db
        .prepare(`
          INSERT INTO rss_sources (
            id, name, url, rss_url, base_domain, category, country, language,
            enabled, priority, quality_score, reliability_score, freshness_score,
            validation_status, error_count, success_count, last_validated_at,
            last_successful_fetch, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          source.id, source.name, source.url, source.rss_url, source.base_domain,
          source.category, source.country, source.language, source.enabled ? 1 : 0,
          source.priority, source.quality_score, source.reliability_score, source.freshness_score,
          source.validation_status, source.error_count, source.success_count,
          source.last_validated_at, source.last_successful_fetch,
          source.created_at, source.updated_at
        )
        .run();

      console.log(`[NewsSourceManager] Successfully added source: ${sourceName}`);
      return {
        success: true,
        source,
        message: `Successfully added ${sourceName} with ${bestValidation.feed_quality} quality score`
      };

    } catch (error) {
      console.error(`[NewsSourceManager] Error adding source ${sourceName}:`, error);
      return {
        success: false,
        message: `Error adding source: ${error.message}`
      };
    }
  }

  // ===============================================================
  // SOURCE QUALITY MONITORING
  // ===============================================================

  /**
   * Update source performance metrics after RSS fetch
   */
  async updateSourcePerformance(
    sourceId: string,
    success: boolean,
    articlesCount: number = 0,
    errorMessage?: string
  ): Promise<void> {
    try {
      if (success) {
        // Calculate freshness score based on articles count
        const freshnessScore = Math.min(articlesCount * 10 + 50, 100);
        
        await this.db
          .prepare(`
            UPDATE rss_sources 
            SET success_count = success_count + 1,
                reliability_score = CASE 
                  WHEN reliability_score < 90 THEN reliability_score + 2
                  ELSE reliability_score 
                END,
                freshness_score = ?,
                last_successful_fetch = datetime('now'),
                last_error = NULL,
                updated_at = datetime('now')
            WHERE id = ?
          `)
          .bind(freshnessScore, sourceId)
          .run();
      } else {
        await this.db
          .prepare(`
            UPDATE rss_sources 
            SET error_count = error_count + 1,
                reliability_score = CASE 
                  WHEN reliability_score > 10 THEN reliability_score - 5
                  ELSE reliability_score 
                END,
                last_error = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `)
          .bind(errorMessage, sourceId)
          .run();
      }

      // Calculate overall quality score
      await this.calculateQualityScore(sourceId);
      
    } catch (error) {
      console.error(`[NewsSourceManager] Error updating performance for ${sourceId}:`, error);
    }
  }

  /**
   * Calculate overall quality score for a source
   */
  private async calculateQualityScore(sourceId: string): Promise<void> {
    try {
      const source = await this.db
        .prepare(`
          SELECT reliability_score, freshness_score, success_count, error_count,
                 last_successful_fetch
          FROM rss_sources WHERE id = ?
        `)
        .bind(sourceId)
        .first() as any;

      if (!source) return;

      // Calculate quality score based on multiple factors
      let qualityScore = 0;

      // Reliability factor (40% weight)
      qualityScore += source.reliability_score * 0.4;

      // Freshness factor (30% weight)  
      qualityScore += source.freshness_score * 0.3;

      // Success ratio factor (20% weight)
      const totalAttempts = source.success_count + source.error_count;
      if (totalAttempts > 0) {
        const successRatio = source.success_count / totalAttempts;
        qualityScore += successRatio * 100 * 0.2;
      }

      // Recency factor (10% weight)
      if (source.last_successful_fetch) {
        const lastFetch = new Date(source.last_successful_fetch);
        const daysSinceLastFetch = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 100 - daysSinceLastFetch * 10);
        qualityScore += recencyScore * 0.1;
      }

      // Update quality score
      await this.db
        .prepare('UPDATE rss_sources SET quality_score = ? WHERE id = ?')
        .bind(Math.round(qualityScore), sourceId)
        .run();

    } catch (error) {
      console.error(`[NewsSourceManager] Error calculating quality score for ${sourceId}:`, error);
    }
  }

  // ===============================================================
  // BULK OPERATIONS
  // ===============================================================

  /**
   * Add multiple Zimbabwe news sources
   */
  async addZimbabweNewsSources(): Promise<{ added: number; failed: number; details: string[] }> {
    const zimbabweSources = [
      // Major Media Houses
      { name: "The Herald", url: "https://www.herald.co.zw", category: "general", priority: 5 },
      { name: "NewsDay", url: "https://www.newsday.co.zw", category: "general", priority: 5 },
      { name: "The Chronicle", url: "https://www.chronicle.co.zw", category: "general", priority: 5 },
      
      // Online Publications
      { name: "ZimLive", url: "https://www.zimlive.com", category: "general", priority: 4 },
      { name: "New Zimbabwe", url: "https://www.newzimbabwe.com", category: "general", priority: 4 },
      { name: "ZimEye", url: "https://zimeye.net", category: "general", priority: 4 },
      { name: "263Chat", url: "https://263chat.com", category: "general", priority: 4 },
      
      // Business & Finance  
      { name: "Financial Gazette", url: "https://fingaz.co.zw", category: "finance_investing", priority: 4 },
      { name: "Business Weekly", url: "https://businessweekly.co.zw", category: "finance_investing", priority: 4 },
      { name: "Zimbabwe Independent", url: "https://www.theindependent.co.zw", category: "finance_investing", priority: 4 },
      
      // Technology
      { name: "Techzim", url: "https://www.techzim.co.zw", category: "tech_gadgets", priority: 4 },
      { name: "TechnoMag", url: "https://technomag.co.zw", category: "tech_gadgets", priority: 3 },
      
      // Regional
      { name: "Manica Post", url: "https://manicapost.co.zw", category: "local_news", priority: 3 },
      { name: "Southern Eye", url: "https://southerneye.co.zw", category: "local_news", priority: 3 },
      
      // Radio/Broadcasting
      { name: "Star FM", url: "https://www.starfm.co.zw", category: "entertainment", priority: 3 },
      { name: "ZBC News Online", url: "https://www.zbc.co.zw", category: "general", priority: 4 },
      
      // Sports
      { name: "Soccer24 Zimbabwe", url: "https://soccer24.co.zw", category: "sports_athletics", priority: 3 },
      { name: "The Sports Hub", url: "https://sportshub.co.zw", category: "sports_athletics", priority: 3 },
      
      // Health & Lifestyle
      { name: "Health Times", url: "https://healthtimes.co.zw", category: "fitness_wellness", priority: 2 },
      
      // Education
      { name: "Education Matters", url: "https://educationmatters.co.zw", category: "languages_learning", priority: 2 }
    ];

    let added = 0;
    let failed = 0;
    const details: string[] = [];

    for (const source of zimbabweSources) {
      try {
        const result = await this.addNewsSource(
          source.url,
          source.name,
          source.category,
          source.priority
        );

        if (result.success) {
          added++;
          details.push(`✅ ${source.name}: ${result.message}`);
        } else {
          failed++;
          details.push(`❌ ${source.name}: ${result.message}`);
        }

        // Small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        failed++;
        details.push(`❌ ${source.name}: ${error.message}`);
      }
    }

    return { added, failed, details };
  }

  /**
   * Get source performance report
   */
  async getSourcePerformanceReport(): Promise<{
    total_sources: number;
    active_sources: number;
    high_quality_sources: number;
    sources_needing_attention: NewsSource[];
    top_performers: NewsSource[];
    recent_additions: NewsSource[];
  }> {
    try {
      const totalSources = await this.db
        .prepare('SELECT COUNT(*) as count FROM rss_sources')
        .first() as any;

      const activeSources = await this.db
        .prepare('SELECT COUNT(*) as count FROM rss_sources WHERE enabled = 1')
        .first() as any;

      const highQualitySources = await this.db
        .prepare('SELECT COUNT(*) as count FROM rss_sources WHERE quality_score >= 70')
        .first() as any;

      const sourcesNeedingAttention = await this.db
        .prepare(`
          SELECT * FROM rss_sources 
          WHERE quality_score < 50 OR error_count > success_count
          ORDER BY quality_score ASC
          LIMIT 10
        `)
        .all();

      const topPerformers = await this.db
        .prepare(`
          SELECT * FROM rss_sources 
          WHERE enabled = 1
          ORDER BY quality_score DESC, reliability_score DESC
          LIMIT 10
        `)
        .all();

      const recentAdditions = await this.db
        .prepare(`
          SELECT * FROM rss_sources 
          ORDER BY created_at DESC
          LIMIT 5
        `)
        .all();

      return {
        total_sources: totalSources?.count || 0,
        active_sources: activeSources?.count || 0,
        high_quality_sources: highQualitySources?.count || 0,
        sources_needing_attention: sourcesNeedingAttention.results as NewsSource[],
        top_performers: topPerformers.results as NewsSource[],
        recent_additions: recentAdditions.results as NewsSource[]
      };
    } catch (error) {
      console.error('[NewsSourceManager] Error generating performance report:', error);
      return {
        total_sources: 0,
        active_sources: 0,
        high_quality_sources: 0,
        sources_needing_attention: [],
        top_performers: [],
        recent_additions: []
      };
    }
  }
}

export default NewsSourceManager;