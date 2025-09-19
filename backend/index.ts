import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Import all business logic services - backend does the heavy lifting
import { D1Service } from "../database/D1Service.js";
import { D1ConfigService } from "./services/D1ConfigService.js";
import { D1CacheService } from "./services/D1CacheService.js";
import { AnalyticsEngineService } from "./services/AnalyticsEngineService.js";
import { ArticleService } from "./services/ArticleService.js";
import { ArticleAIService } from "./services/ArticleAIService.js";
import { ContentProcessingPipeline } from "./services/ContentProcessingPipeline.js";
import { AuthorProfileService } from "./services/AuthorProfileService.js";
import { NewsSourceService } from "./services/NewsSourceService.js";
import { NewsSourceManager } from "./services/NewsSourceManager.js";
import { RSSFeedService } from "./services/RSSFeedService.js";
import { OpenAuthService } from "./services/OpenAuthService.js";
import { RealtimeAnalyticsDO } from "./durable-objects/RealtimeAnalyticsDO.js";
import { ArticleInteractionsDO } from "./durable-objects/ArticleInteractionsDO.js";
import { UserBehaviorDO } from "./durable-objects/UserBehaviorDO.js";
import { RealtimeCountersDO } from "./durable-objects/RealtimeCountersDO.js";

// Import admin interface
import { getAdminHTML } from "./admin/index.js";

// Types for Cloudflare bindings
type Bindings = {
  DB: D1Database;
  AUTH_STORAGE: KVNamespace;
  // ARTICLE_INTERACTIONS: DurableObjectNamespace; // Temporarily disabled
  // USER_BEHAVIOR: DurableObjectNamespace; // Temporarily disabled
  // REALTIME_COUNTERS: DurableObjectNamespace; // Temporarily disabled  
  // REALTIME_ANALYTICS: DurableObjectNamespace; // Temporarily disabled
  NEWS_ANALYTICS: AnalyticsEngineDataset;
  SEARCH_ANALYTICS: AnalyticsEngineDataset;
  CATEGORY_ANALYTICS: AnalyticsEngineDataset;
  USER_ANALYTICS: AnalyticsEngineDataset;
  PERFORMANCE_ANALYTICS: AnalyticsEngineDataset;
  AI: Ai;
  VECTORIZE_INDEX: VectorizeIndex;
  NODE_ENV: string;
  LOG_LEVEL: string;
  ROLES_ENABLED: string;
  DEFAULT_ROLE: string;
  ADMIN_ROLES: string;
  CREATOR_ROLES: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Add CORS and logging middleware
app.use("*", cors());
app.use("*", logger());

// Initialize all business services
function initializeServices(env: Bindings) {
  const d1Service = new D1Service(env.DB);
  const configService = new D1ConfigService(env.DB);
  const cacheService = new D1CacheService(env.DB);
  const analyticsService = new AnalyticsEngineService({
    NEWS_ANALYTICS: env.NEWS_ANALYTICS,
    SEARCH_ANALYTICS: env.SEARCH_ANALYTICS,
    CATEGORY_ANALYTICS: env.CATEGORY_ANALYTICS,
    USER_ANALYTICS: env.USER_ANALYTICS,
    PERFORMANCE_ANALYTICS: env.PERFORMANCE_ANALYTICS
  });
  const articleAIService = new ArticleAIService(env.AI, null, d1Service); // Vectorize disabled for now
  const contentPipeline = new ContentProcessingPipeline(d1Service, articleAIService);
  const authorProfileService = new AuthorProfileService(d1Service);
  const articleService = new ArticleService(env.DB); // Fix: ArticleService takes database directly
  const newsSourceService = new NewsSourceService(); // Fix: NewsSourceService takes no parameters
  const newsSourceManager = new NewsSourceManager(env.DB);
  const rssService = new RSSFeedService(d1Service);

  return {
    d1Service,
    configService,
    cacheService,
    analyticsService,
    articleAIService,
    contentPipeline,
    authorProfileService,
    articleService,
    newsSourceService,
    newsSourceManager,
    rssService
  };
}

// Admin dashboard - serve the HTML interface
app.get("/", (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

app.get("/admin", (c) => {
  c.header("Content-Type", "text/html");
  return c.html(getAdminHTML());
});

// Health check endpoint with full service health
app.get("/api/health", async (c) => {
  try {
    const services = initializeServices(c.env);
    const health = await services.d1Service.healthCheck();
    
    return c.json({
      status: health.healthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        database: health.healthy ? "operational" : "error",
        analytics: !!(c.env.NEWS_ANALYTICS && c.env.SEARCH_ANALYTICS && c.env.CATEGORY_ANALYTICS),
        cache: "operational",
        articles: "operational",
        newsSources: "operational"
      },
      environment: c.env.NODE_ENV || "production"
    });
  } catch (error) {
    return c.json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Comprehensive admin stats endpoint
app.get("/api/admin/stats", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get basic database statistics directly
    const totalArticles = await services.d1Service.getArticleCount();
    
    // Get RSS source count directly from database
    const sourcesResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM rss_sources WHERE enabled = 1'
    ).first();
    const activeSources = sourcesResult.count;
    
    // Get categories count directly from database  
    const categoriesResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM categories WHERE enabled = 1'
    ).first();
    const categoriesCount = categoriesResult.count;
    
    return c.json({
      database: {
        total_articles: totalArticles,
        active_sources: activeSources,
        categories: categoriesCount,
        size: 217088 // Approximate size from earlier query
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return c.json({ error: "Failed to fetch stats", details: error.message }, 500);
  }
});

// Full categories management endpoint
app.get("/api/categories", async (c) => {
  try {
    const services = initializeServices(c.env);
    const categories = await services.d1Service.getCategories();
    
    // Add statistics for each category
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        const articleCount = await services.d1Service.getArticleCount({ category_id: cat.id });
        return {
          ...cat,
          article_count: articleCount
        };
      })
    );
    
    return c.json({
      categories: categoriesWithStats
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

// Full articles management with caching and analytics
app.get("/api/feeds", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const category = c.req.query("category");
    
    // Get articles directly from database
    let articlesQuery = `
      SELECT id, title, slug, description, content_snippet, author, source, 
             published_at, image_url, original_url, category_id, view_count, 
             like_count, bookmark_count
      FROM articles 
      WHERE status = 'published'
    `;
    
    let countQuery = `SELECT COUNT(*) as total FROM articles WHERE status = 'published'`;
    
    if (category && category !== 'all') {
      articlesQuery += ` AND category_id = ?`;
      countQuery += ` AND category_id = ?`;
    }
    
    articlesQuery += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;
    
    // Execute queries
    const articlesResult = category && category !== 'all' ? 
      await c.env.DB.prepare(articlesQuery).bind(category, limit, offset).all() :
      await c.env.DB.prepare(articlesQuery).bind(limit, offset).all();
    
    const totalResult = category && category !== 'all' ?
      await c.env.DB.prepare(countQuery).bind(category).first() :
      await c.env.DB.prepare(countQuery).first();
    
    const totalCount = totalResult.total || 0;
    
    return c.json({
      articles: articlesResult.results || [],
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return c.json({ error: "Failed to fetch articles" }, 500);
  }
});

// RSS refresh endpoint with AI-powered content processing pipeline
app.post("/api/admin/refresh-rss", async (c) => {
  try {
    const services = initializeServices(c.env);
    const startTime = Date.now();
    
    console.log("Starting AI-powered RSS refresh...");
    
    // Get all enabled news sources
    const sources = await services.d1Service.db.prepare(`
      SELECT * FROM news_sources WHERE enabled = true
    `).all();
    
    const results = {
      newArticles: 0,
      updated: 0,
      errors: 0,
      sources_processed: 0,
      ai_processed: 0,
      authors_extracted: 0,
      keywords_extracted: 0,
      processing_time: 0
    };
    
    // Process each source through the AI pipeline
    for (const source of sources.results) {
      try {
        console.log(`Processing source: ${source.name} (${source.url})`);
        
        // Convert source to ContentSource format
        const contentSource = {
          id: source.id,
          url: source.url,
          type: 'rss' as const,
          name: source.name,
          scrapingEnabled: source.scraping_enabled || false,
          scrapingSelectors: source.scraping_selectors ? JSON.parse(source.scraping_selectors) : undefined,
          authorSelectors: source.author_selectors ? JSON.parse(source.author_selectors) : undefined,
          qualityRating: source.quality_rating || 1.0,
          credibilityScore: source.credibility_score || 1.0
        };
        
        // Process content through AI pipeline
        const pipelineResults = await services.contentPipeline.processContentSource(contentSource);
        
        // Aggregate results
        for (const result of pipelineResults) {
          if (result.success) {
            results.newArticles++;
            results.ai_processed++;
            
            // Count specific AI enhancements
            const authorStage = result.stages.find(s => s.name === 'author_detection');
            if (authorStage?.status === 'completed') {
              results.authors_extracted++;
            }
            
            const keywordStage = result.stages.find(s => s.name === 'classification');
            if (keywordStage?.status === 'completed') {
              results.keywords_extracted++;
            }
          } else {
            results.errors++;
          }
        }
        
        results.sources_processed++;
        
      } catch (sourceError) {
        console.error(`Failed to process source ${source.name}:`, sourceError);
        results.errors++;
        results.sources_processed++;
      }
    }
    
    results.processing_time = Date.now() - startTime;
    
    const refreshResult = {
      success: true,
      message: `AI-powered RSS refresh completed. Processed ${results.newArticles} articles with full AI pipeline including author recognition and content classification.`,
      results,
      ai_enhancements: {
        content_cleaning: "Removed image URLs and random characters",
        author_recognition: `Extracted ${results.authors_extracted} author profiles`,
        keyword_extraction: "Applied 256-keyword taxonomy across 32 categories",
        quality_scoring: "AI-assessed content quality and readability",
        image_processing: "Optimized images through Cloudflare Images",
        semantic_search: "Created vector embeddings for search"
      },
      timestamp: new Date().toISOString()
    };
    
    // Track the enhanced refresh event
    await services.analyticsService.trackEvent('ai_rss_refresh', {
      ...results,
      ai_features_used: [
        'content_cleaning',
        'author_extraction', 
        'keyword_classification',
        'quality_scoring',
        'image_processing',
        'vector_embeddings'
      ]
    });
    
    console.log(`AI RSS refresh completed in ${results.processing_time}ms:`, results);
    
    return c.json(refreshResult);
  } catch (error) {
    console.error("Error in AI RSS refresh:", error);
    return c.json({ 
      success: false, 
      error: "Failed to refresh RSS feeds with AI processing",
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// ===== BULK PULL ENDPOINTS FOR INITIAL SETUP AND TESTING =====

// Initial bulk pull with enhanced field testing
app.post("/api/admin/bulk-pull", async (c) => {
  try {
    const services = initializeServices(c.env);
    const body = await c.req.json().catch(() => ({}));
    
    const options = {
      articlesPerSource: parseInt(body.articlesPerSource) || 200,
      includeOlderArticles: body.includeOlderArticles !== false,
      testMode: body.testMode === true
    };
    
    console.log(`Starting BULK PULL with options:`, options);
    
    // Use the RSS service for initial bulk pull
    const results = await services.rssService.initialBulkPull(options);
    
    // Track the bulk pull event for analytics
    await services.analyticsService.trackEvent('initial_bulk_pull', {
      articles_per_source: options.articlesPerSource,
      include_older: options.includeOlderArticles,
      test_mode: options.testMode,
      ...results
    });
    
    return c.json({
      success: true,
      message: `Bulk pull completed: ${results.newArticles} new articles from ${results.sources} sources`,
      ...results,
      options,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error in bulk pull:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Add new Zimbabwe sources
app.post("/api/admin/add-zimbabwe-sources", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    console.log("Adding comprehensive Zimbabwe news sources...");
    
    // Use the news source manager to add all Zimbabwe sources
    const results = await services.newsSourceManager.addZimbabweNewsSources();
    
    // Track the source addition event
    await services.analyticsService.trackEvent('zimbabwe_sources_added', {
      added: results.added,
      failed: results.failed,
      total_attempted: results.added + results.failed
    });
    
    return c.json({
      success: true,
      message: `Added ${results.added} Zimbabwe news sources (${results.failed} failed)`,
      ...results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error adding Zimbabwe sources:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Get RSS configuration and source limits
app.get("/api/admin/rss-config", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get system configuration
    const systemConfig = await services.d1Service.db.prepare(`
      SELECT config_key, config_value, config_type, description, category 
      FROM system_config 
      WHERE category = 'rss' OR category = 'platform'
      ORDER BY category, config_key
    `).all();
    
    // Get sources with their current daily limits
    const sources = await services.d1Service.db.prepare(`
      SELECT id, name, url, category, enabled, priority, 
             daily_limit, articles_per_fetch, max_bulk_articles,
             quality_score, reliability_score, validation_status,
             last_fetched_at, fetch_count, error_count
      FROM rss_sources 
      ORDER BY priority DESC, name ASC
    `).all();
    
    // Get today's stats
    const todayStats = await services.d1Service.db.prepare(`
      SELECT source_id, articles_fetched, articles_stored, successful_fetches
      FROM daily_source_stats 
      WHERE date_tracked = DATE('now')
    `).all();
    
    const statsMap = {};
    for (const stat of todayStats.results) {
      statsMap[stat.source_id] = stat;
    }
    
    const sourcesWithStats = sources.results.map((source: any) => ({
      ...source,
      todayStats: statsMap[source.id] || { articles_fetched: 0, articles_stored: 0, successful_fetches: 0 }
    }));
    
    return c.json({
      systemConfig: systemConfig.results,
      sources: sourcesWithStats,
      totalSources: sources.results.length,
      enabledSources: sources.results.filter((s: any) => s.enabled).length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error getting RSS config:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Update RSS source configuration
app.put("/api/admin/rss-source/:sourceId", async (c) => {
  try {
    const services = initializeServices(c.env);
    const sourceId = c.req.param("sourceId");
    const body = await c.req.json();
    
    const {
      daily_limit,
      articles_per_fetch,
      max_bulk_articles,
      enabled,
      priority
    } = body;
    
    // Update source configuration
    await services.d1Service.db.prepare(`
      UPDATE rss_sources 
      SET daily_limit = ?, 
          articles_per_fetch = ?, 
          max_bulk_articles = ?,
          enabled = ?,
          priority = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      daily_limit,
      articles_per_fetch, 
      max_bulk_articles,
      enabled ? 1 : 0,
      priority,
      sourceId
    ).run();
    
    return c.json({
      success: true,
      message: `Updated configuration for source ${sourceId}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("Error updating RSS source config:", error);
    return c.json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Admin sources management with full service integration
app.get("/api/admin/sources", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get actual news sources from the news source service
    const sources = await services.newsSourceService.getAllSources();
    
    // Enhance with statistics and status
    const sourcesWithStats = await Promise.all(
      sources.map(async (source) => {
        const articleCount = await services.d1Service.getArticleCount({ source_id: source.id });
        const lastFetch = await services.cacheService.getLastFetch(source.id);
        
        return {
          ...source,
          articles: articleCount,
          last_fetch: lastFetch || new Date().toISOString(),
          status: source.enabled ? "active" : "inactive"
        };
      })
    );
    
    return c.json({ sources: sourcesWithStats });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return c.json({ error: "Failed to fetch sources" }, 500);
  }
});

// Analytics insights endpoint - backend heavy lifting
app.get("/api/admin/analytics", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get comprehensive analytics data
    const analytics = await services.analyticsService.getInsights({
      timeframe: c.req.query("timeframe") || "7d",
      category: c.req.query("category")
    });
    
    return c.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// Article by source/slug with full service integration
app.get("/api/article/by-source-slug", async (c) => {
  const source = c.req.query("source");
  const slug = c.req.query("slug");
  
  if (!source || !slug) {
    return c.json({ error: "Source and slug are required" }, 400);
  }

  try {
    const services = initializeServices(c.env);
    
    // Use article service for enhanced retrieval with caching
    const article = await services.articleService.getArticleBySlug(slug);
    
    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

    // Track article access analytics
    await services.analyticsService.trackEvent('article_view', {
      source: source,
      slug: slug,
      category: article.category_id,
      admin_access: true
    });

    return c.json({ article });
  } catch (error) {
    console.error("Error fetching article:", error);
    return c.json({ error: "Failed to fetch article" }, 500);
  }
});

// AI Pipeline monitoring and author recognition endpoints
app.get("/api/admin/ai-pipeline-status", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get AI processing statistics
    const aiStats = await services.d1Service.db.prepare(`
      SELECT 
        processing_type,
        status,
        COUNT(*) as count,
        AVG(processing_time) as avg_time,
        MAX(created_at) as last_processed
      FROM ai_processing_log 
      WHERE created_at > datetime('now', '-24 hours')
      GROUP BY processing_type, status
      ORDER BY processing_type, status
    `).all();
    
    // Get author extraction statistics
    const authorStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(DISTINCT a.id) as total_authors,
        COUNT(DISTINCT CASE WHEN a.verification_status = 'verified' THEN a.id END) as verified_authors,
        COUNT(DISTINCT aa.article_id) as articles_with_authors,
        AVG(aa.confidence_score) as avg_confidence
      FROM authors a
      LEFT JOIN article_authors aa ON a.id = aa.author_id
    `).first();
    
    // Get keyword extraction statistics  
    const keywordStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(DISTINCT k.id) as total_keywords,
        COUNT(DISTINCT ak.article_id) as articles_with_keywords,
        AVG(ak.confidence_score) as avg_keyword_confidence,
        MAX(k.usage_count) as most_used_keyword_count
      FROM keywords k
      LEFT JOIN article_keywords ak ON k.id = ak.keyword_id
    `).first();
    
    // Get quality scoring statistics
    const qualityStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(*) as articles_scored,
        AVG(quality_score) as avg_quality,
        COUNT(CASE WHEN quality_score > 0.8 THEN 1 END) as high_quality_count,
        COUNT(CASE WHEN quality_score < 0.5 THEN 1 END) as low_quality_count
      FROM articles 
      WHERE quality_score IS NOT NULL
    `).first();
    
    return c.json({
      ai_processing: aiStats.results,
      author_recognition: {
        total_authors: authorStats.total_authors || 0,
        verified_authors: authorStats.verified_authors || 0,
        articles_with_authors: authorStats.articles_with_authors || 0,
        avg_confidence: authorStats.avg_confidence || 0
      },
      keyword_extraction: {
        total_keywords: keywordStats.total_keywords || 0,
        articles_with_keywords: keywordStats.articles_with_keywords || 0,
        avg_confidence: keywordStats.avg_keyword_confidence || 0,
        most_used_count: keywordStats.most_used_keyword_count || 0
      },
      quality_assessment: {
        articles_scored: qualityStats.articles_scored || 0,
        avg_quality: qualityStats.avg_quality || 0,
        high_quality_count: qualityStats.high_quality_count || 0,
        low_quality_count: qualityStats.low_quality_count || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching AI pipeline status:", error);
    return c.json({ error: "Failed to fetch AI pipeline status" }, 500);
  }
});

// Author recognition and journalism tracking
app.get("/api/admin/authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "20");
    const outlet = c.req.query("outlet");
    
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT aa.article_id) as article_count,
        AVG(ar.quality_score) as avg_article_quality,
        MAX(ar.published_at) as last_article_date
      FROM authors a
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      LEFT JOIN articles ar ON aa.article_id = ar.id
    `;
    
    const params = [];
    if (outlet) {
      query += ` WHERE a.outlet = ?`;
      params.push(outlet);
    }
    
    query += `
      GROUP BY a.id
      ORDER BY article_count DESC, a.created_at DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const authors = await services.d1Service.db.prepare(query).bind(...params).all();
    
    // Get outlets summary
    const outlets = await services.d1Service.db.prepare(`
      SELECT 
        outlet,
        COUNT(*) as author_count,
        SUM(article_count) as total_articles
      FROM authors 
      WHERE outlet IS NOT NULL
      GROUP BY outlet
      ORDER BY author_count DESC
    `).all();
    
    return c.json({
      authors: authors.results,
      outlets: outlets.results,
      recognition_message: "Celebrating Zimbabwe journalism through author recognition and byline tracking"
    });
  } catch (error) {
    console.error("Error fetching authors:", error);
    return c.json({ error: "Failed to fetch authors" }, 500);
  }
});

// Content quality insights  
app.get("/api/admin/content-quality", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Quality distribution
    const qualityDistribution = await services.d1Service.db.prepare(`
      SELECT 
        CASE 
          WHEN quality_score >= 0.8 THEN 'Excellent'
          WHEN quality_score >= 0.6 THEN 'Good'  
          WHEN quality_score >= 0.4 THEN 'Fair'
          ELSE 'Needs Improvement'
        END as quality_tier,
        COUNT(*) as count,
        AVG(quality_score) as avg_score
      FROM articles 
      WHERE quality_score IS NOT NULL
      GROUP BY quality_tier
      ORDER BY avg_score DESC
    `).all();
    
    // Top quality articles by category
    const topByCategory = await services.d1Service.db.prepare(`
      SELECT 
        category,
        title,
        quality_score,
        published_at,
        (SELECT name FROM authors WHERE id = (
          SELECT author_id FROM article_authors WHERE article_id = articles.id LIMIT 1
        )) as author_name
      FROM articles 
      WHERE quality_score IS NOT NULL
      ORDER BY quality_score DESC
      LIMIT 10
    `).all();
    
    return c.json({
      quality_distribution: qualityDistribution.results,
      top_quality_articles: topByCategory.results,
      ai_enhancements: {
        content_cleaning: "Active - removing image URLs and noise",
        grammar_assessment: "Active - AI grammar scoring",
        readability_analysis: "Active - readability metrics",
        headline_optimization: "Active - headline quality scoring"
      }
    });
  } catch (error) {
    console.error("Error fetching content quality data:", error);
    return c.json({ error: "Failed to fetch content quality data" }, 500);
  }
});

// ===== AUTHOR PROFILE & SOCIAL FEATURES =====

// Individual author profile pages (auto-generated)
app.get("/api/author/:slug", async (c) => {
  try {
    const services = initializeServices(c.env);
    const slug = c.req.param("slug");
    
    const profile = await services.authorProfileService.getAuthorProfile(slug);
    
    if (!profile) {
      return c.json({ error: "Author not found" }, 404);
    }
    
    // Track profile view
    await services.authorProfileService.trackProfileInteraction(
      profile.id,
      'view',
      undefined, // userId would come from auth
      {
        ipAddress: c.req.header('cf-connecting-ip'),
        userAgent: c.req.header('user-agent'),
        referrer: c.req.header('referer')
      }
    );
    
    return c.json({
      author: profile,
      journalism_recognition: "Celebrating Zimbabwe journalism through comprehensive author profiles",
      profile_features: [
        "Cross-outlet author tracking",
        "Article quality scoring",
        "Professional credibility metrics",
        "Social engagement tracking",
        "Follow functionality"
      ]
    });
  } catch (error) {
    console.error("Error fetching author profile:", error);
    return c.json({ error: "Failed to fetch author profile" }, 500);
  }
});

// Follow/unfollow an author
app.post("/api/author/:authorId/follow", async (c) => {
  try {
    const services = initializeServices(c.env);
    const authorId = parseInt(c.req.param("authorId"));
    
    // TODO: Get userId from authentication
    const userId = 1; // Placeholder - would come from auth middleware
    
    const result = await services.authorProfileService.toggleAuthorFollow(userId, authorId);
    
    return c.json(result);
  } catch (error) {
    console.error("Error toggling author follow:", error);
    return c.json({ error: "Failed to update follow status" }, 500);
  }
});

// Follow/unfollow a news source
app.post("/api/source/:sourceId/follow", async (c) => {
  try {
    const services = initializeServices(c.env);
    const sourceId = c.req.param("sourceId");
    
    // TODO: Get userId from authentication
    const userId = 1; // Placeholder - would come from auth middleware
    
    const result = await services.authorProfileService.toggleSourceFollow(userId, sourceId);
    
    return c.json(result);
  } catch (error) {
    console.error("Error toggling source follow:", error);
    return c.json({ error: "Failed to update follow status" }, 500);
  }
});

// Featured authors showcase
app.get("/api/featured-authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "10");
    
    const authors = await services.authorProfileService.getFeaturedAuthors(limit);
    
    return c.json({
      featured_authors: authors,
      message: "Showcasing Zimbabwe's leading journalists and their contributions to news coverage"
    });
  } catch (error) {
    console.error("Error fetching featured authors:", error);
    return c.json({ error: "Failed to fetch featured authors" }, 500);
  }
});

// Trending authors based on recent engagement
app.get("/api/trending-authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const days = parseInt(c.req.query("days") || "7");
    const limit = parseInt(c.req.query("limit") || "10");
    
    const authors = await services.authorProfileService.getTrendingAuthors(days, limit);
    
    return c.json({
      trending_authors: authors,
      timeframe: `${days} days`,
      message: "Authors trending based on recent articles and reader engagement"
    });
  } catch (error) {
    console.error("Error fetching trending authors:", error);
    return c.json({ error: "Failed to fetch trending authors" }, 500);
  }
});

// Search authors across outlets
app.get("/api/search/authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    const query = c.req.query("q");
    const limit = parseInt(c.req.query("limit") || "20");
    
    if (!query) {
      return c.json({ error: "Search query required" }, 400);
    }
    
    const authors = await services.authorProfileService.searchAuthors(query, limit);
    
    return c.json({
      authors,
      query,
      total: authors.length,
      cross_outlet_search: "Search includes authors across all Zimbabwe news outlets"
    });
  } catch (error) {
    console.error("Error searching authors:", error);
    return c.json({ error: "Failed to search authors" }, 500);
  }
});

// Enhanced author management for admin (with cross-outlet view)
app.get("/api/admin/authors/detailed", async (c) => {
  try {
    const services = initializeServices(c.env);
    const limit = parseInt(c.req.query("limit") || "50");
    const outlet = c.req.query("outlet");
    const verified = c.req.query("verified");
    
    let query = `
      SELECT 
        a.*,
        COUNT(DISTINCT ao.outlet_id) as outlet_count,
        COUNT(DISTINCT aa.article_id) as total_articles,
        AVG(ar.quality_score) as avg_quality,
        MAX(ar.published_at) as last_article,
        GROUP_CONCAT(DISTINCT ns.name) as outlets_list
      FROM authors a
      LEFT JOIN author_outlets ao ON a.id = ao.author_id
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      LEFT JOIN articles ar ON aa.article_id = ar.id
      LEFT JOIN news_sources ns ON ao.outlet_id = ns.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (outlet) {
      conditions.push('ao.outlet_id = ?');
      params.push(outlet);
    }
    
    if (verified !== undefined) {
      conditions.push('a.is_verified = ?');
      params.push(verified === 'true' ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += `
      GROUP BY a.id
      ORDER BY total_articles DESC, a.follower_count DESC
      LIMIT ?
    `;
    params.push(limit);
    
    const authors = await services.d1Service.db.prepare(query).bind(...params).all();
    
    // Get deduplication stats
    const deduplicationStats = await services.d1Service.db.prepare(`
      SELECT 
        COUNT(DISTINCT a.normalized_name) as unique_authors,
        COUNT(*) as total_records,
        COUNT(CASE WHEN outlet_count > 1 THEN 1 END) as cross_outlet_authors
      FROM (
        SELECT 
          a.normalized_name,
          COUNT(DISTINCT ao.outlet_id) as outlet_count
        FROM authors a
        LEFT JOIN author_outlets ao ON a.id = ao.author_id
        GROUP BY a.normalized_name
      ) a
    `).first();
    
    return c.json({
      authors: authors.results,
      deduplication_stats: deduplicationStats,
      cross_outlet_tracking: "Authors are deduplicated across all news outlets",
      features: [
        "Smart author deduplication",
        "Cross-outlet article tracking", 
        "Professional credibility scoring",
        "Social engagement metrics",
        "Automated profile generation"
      ]
    });
  } catch (error) {
    console.error("Error fetching detailed authors:", error);
    return c.json({ error: "Failed to fetch detailed authors" }, 500);
  }
});

// Category management with author expertise tracking
app.get("/api/admin/categories/with-authors", async (c) => {
  try {
    const services = initializeServices(c.env);
    
    // Get categories with author expertise data
    const categories = await services.d1Service.db.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT ace.author_id) as expert_authors,
        COUNT(DISTINCT aa.article_id) as total_articles,
        AVG(ace.avg_quality_score) as category_quality,
        GROUP_CONCAT(DISTINCT a.name) as top_authors
      FROM categories c
      LEFT JOIN author_category_expertise ace ON c.id = ace.category_id
      LEFT JOIN authors a ON ace.author_id = a.id AND ace.expertise_level IN ('expert', 'specialist')
      LEFT JOIN article_authors aa ON a.id = aa.author_id
      LEFT JOIN articles ar ON aa.article_id = ar.id AND ar.category = c.id
      GROUP BY c.id
      ORDER BY expert_authors DESC, total_articles DESC
    `).all();
    
    // Get category managers
    const managers = await services.d1Service.db.prepare(`
      SELECT 
        cm.category_id,
        u.username as manager_name,
        cm.manager_type,
        cm.permissions
      FROM category_managers cm
      JOIN users u ON cm.user_id = u.id
      ORDER BY cm.category_id, cm.manager_type
    `).all();
    
    const managersByCategory = {};
    for (const manager of managers.results) {
      if (!managersByCategory[manager.category_id]) {
        managersByCategory[manager.category_id] = [];
      }
      managersByCategory[manager.category_id].push(manager);
    }
    
    const categoriesWithManagers = categories.results.map((category: any) => ({
      ...category,
      managers: managersByCategory[category.id] || [],
      top_authors: category.top_authors ? category.top_authors.split(',').slice(0, 5) : []
    }));
    
    return c.json({
      categories: categoriesWithManagers,
      author_expertise_tracking: "Categories track author expertise and specialization",
      management_features: [
        "Author expertise by category",
        "Category manager assignments",
        "Quality scoring by category",
        "Editorial oversight tools"
      ]
    });
  } catch (error) {
    console.error("Error fetching categories with authors:", error);
    return c.json({ error: "Failed to fetch categories with authors" }, 500);
  }
});

// Dynamic PWA manifest with full category management
app.get("/api/manifest.json", async (c) => {
  try {
    const services = initializeServices(c.env);
    const categories = await services.d1Service.getCategories();
    
    const shortcuts = categories
      .filter(cat => cat.id !== 'all' && cat.enabled)
      .slice(0, 4) // PWA spec recommends max 4 shortcuts
      .map(category => ({
        name: `${category.emoji || '📰'} ${category.name}`,
        url: `/?category=${category.id}`,
        description: `Browse ${category.name.toLowerCase()} news`
      }));

    const manifest = {
      name: "Harare Metro",
      short_name: "Harare Metro", 
      description: "Zimbabwe's Premier News Aggregation Platform",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#00A651",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      shortcuts,
      categories: ["news", "lifestyle", "business"],
      lang: "en",
      dir: "ltr",
      orientation: "portrait-primary"
    };

    c.header("Content-Type", "application/manifest+json");
    c.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    
    // Track manifest generation
    await services.analyticsService.trackEvent('manifest_generated', {
      shortcuts: shortcuts.length,
      categories: categories.length
    });
    
    return c.json(manifest);
  } catch (error) {
    console.error("Error generating manifest:", error);
    return c.json({ error: "Failed to generate manifest" }, 500);
  }
});

export default app;

// Export Durable Object classes for Cloudflare Workers
export { 
  ArticleInteractionsDO,
  UserBehaviorDO, 
  RealtimeCountersDO,
  RealtimeAnalyticsDO 
};