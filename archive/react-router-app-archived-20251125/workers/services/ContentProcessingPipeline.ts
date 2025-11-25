/**
 * Content Processing Pipeline Service
 * Orchestrates the complete content processing workflow:
 * RSS Feed → Scraping → Author Detection → Classification → Quality Scoring → Image Processing → Publication
 */

import { D1Service } from "../../database/D1Service.js";
import { ArticleAIService } from "./ArticleAIService.ts";
import { AuthorProfileService } from "./AuthorProfileService.ts";

export interface PipelineStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  processingTime?: number;
  errorMessage?: string;
  retryCount: number;
  inputData?: any;
  outputData?: any;
  qualityMetrics?: any;
}

export interface ContentSource {
  id: string;
  url: string;
  type: 'rss' | 'scrape' | 'api';
  name: string;
  scrapingEnabled: boolean;
  scrapingSelectors?: {
    title?: string;
    content?: string;
    author?: string;
    publishDate?: string;
    images?: string;
    excerpt?: string;
  };
  authorSelectors?: {
    name?: string;
    title?: string;
    bio?: string;
    byline?: string;
  };
  qualityRating: number;
  credibilityScore: number;
}

export interface ProcessingResult {
  success: boolean;
  articleId?: number;
  stages: PipelineStage[];
  errors: string[];
  warnings: string[];
  metrics: {
    totalTime: number;
    stagesCompleted: number;
    qualityScore: number;
    confidenceScore: number;
  };
}

export interface AuthorExtractionResult {
  authors: Array<{
    name: string;
    normalizedName: string;
    title?: string;
    outlet?: string;
    contributionType: 'primary' | 'contributor' | 'editor';
    confidence: number;
  }>;
  bylineText: string;
  extractionMethod: 'rss' | 'ai' | 'manual';
}

export class ContentProcessingPipeline {
  private d1Service: D1Service;
  private aiService: ArticleAIService;
  private authorService: AuthorProfileService;
  private defaultStages = [
    'extraction',
    'cleaning',
    'author_detection',
    'classification',
    'quality_scoring',
    'image_processing',
    'embedding',
    'publication'
  ];

  constructor(d1Service: D1Service, aiService: ArticleAIService) {
    this.d1Service = d1Service;
    this.aiService = aiService;
    this.authorService = new AuthorProfileService(d1Service);
  }

  /**
   * Process content from RSS feeds and scraping sources
   */
  async processContentSource(source: ContentSource): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    try {
      console.log(`Processing content source: ${source.name} (${source.type})`);
      
      // Step 1: Extract content based on source type
      const extractedContent = await this.extractContent(source);
      
      // Step 2: Process each extracted article through the pipeline
      for (const content of extractedContent) {
        const result = await this.processArticle(content, source);
        results.push(result);
      }
      
      // Update source statistics
      await this.updateSourceStats(source.id, results);
      
    } catch (error) {
      console.error(`Failed to process source ${source.id}:`, error);
      results.push({
        success: false,
        stages: [],
        errors: [error.message],
        warnings: [],
        metrics: { totalTime: 0, stagesCompleted: 0, qualityScore: 0, confidenceScore: 0 }
      });
    }
    
    return results;
  }

  /**
   * Process a single article through the complete pipeline
   */
  async processArticle(content: any, source: ContentSource): Promise<ProcessingResult> {
    const startTime = Date.now();
    const stages: PipelineStage[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let articleId: number | undefined;

    try {
      // Initialize pipeline stages
      for (const stageName of this.defaultStages) {
        stages.push({
          name: stageName,
          status: 'pending',
          retryCount: 0
        });
      }

      // Stage 1: Content Extraction & Initial Storage
      articleId = await this.executeStage(stages[0], async () => {
        const extractionResult = await this.extractAndStoreArticle(content, source);
        if (!extractionResult.success) {
          throw new Error(extractionResult.error);
        }
        return extractionResult.articleId;
      });

      // Stage 2: Content Cleaning
      await this.executeStage(stages[1], async () => {
        const cleaningResult = await this.aiService.cleanContent(content.content || content.description);
        await this.updateArticle(articleId!, {
          processed_content: cleaningResult.cleanedContent,
          extracted_images: JSON.stringify(cleaningResult.extractedImages)
        });
        return cleaningResult;
      });

      // Stage 3: Author Detection & Recognition
      await this.executeStage(stages[2], async () => {
        const authorResult = await this.extractAndStoreAuthors(articleId!, content, source);
        return authorResult;
      });

      // Stage 4: Content Classification
      await this.executeStage(stages[3], async () => {
        const classificationResult = await this.classifyContent(articleId!, content);
        return classificationResult;
      });

      // Stage 5: Quality Scoring
      await this.executeStage(stages[4], async () => {
        const qualityResult = await this.calculateQualityMetrics(articleId!, content);
        await this.updateArticle(articleId!, {
          quality_score: qualityResult.overallScore
        });
        return qualityResult;
      });

      // Stage 6: Image Processing
      await this.executeStage(stages[5], async () => {
        const imageResult = await this.processImages(articleId!, content);
        return imageResult;
      });

      // Stage 7: Vector Embedding Creation
      await this.executeStage(stages[6], async () => {
        const article = await this.getArticle(articleId!);
        const embeddingResult = await this.aiService.createEmbedding(
          articleId!,
          article.title,
          article.processed_content || article.content
        );
        await this.updateArticle(articleId!, {
          embedding_id: embeddingResult.embeddingId
        });
        return embeddingResult;
      });

      // Stage 8: Publication & Finalization
      await this.executeStage(stages[7], async () => {
        await this.finalizeArticle(articleId!);
        return { published: true };
      });

      const totalTime = Date.now() - startTime;
      const completedStages = stages.filter(s => s.status === 'completed').length;
      const qualityScore = stages[4]?.outputData?.overallScore || 0;

      return {
        success: true,
        articleId,
        stages,
        errors,
        warnings,
        metrics: {
          totalTime,
          stagesCompleted: completedStages,
          qualityScore,
          confidenceScore: this.calculateOverallConfidence(stages)
        }
      };

    } catch (error) {
      console.error(`Pipeline failed for article:`, error);
      errors.push(error.message);

      return {
        success: false,
        articleId,
        stages,
        errors,
        warnings,
        metrics: {
          totalTime: Date.now() - startTime,
          stagesCompleted: stages.filter(s => s.status === 'completed').length,
          qualityScore: 0,
          confidenceScore: 0
        }
      };
    }
  }

  /**
   * Extract content from various source types
   */
  private async extractContent(source: ContentSource): Promise<any[]> {
    switch (source.type) {
      case 'rss':
        return this.extractFromRSS(source);
      case 'scrape':
        return this.extractFromScraping(source);
      case 'api':
        return this.extractFromAPI(source);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  /**
   * Extract content from RSS feeds
   */
  private async extractFromRSS(source: ContentSource): Promise<any[]> {
    try {
      const response = await fetch(source.url);
      const xmlText = await response.text();
      
      // Parse RSS/XML (implementation depends on your XML parser)
      // This is a simplified version - you'd use a proper XML parser like fast-xml-parser
      const articles = []; // Parse XML to extract articles
      
      return articles;
    } catch (error) {
      console.error(`RSS extraction failed for ${source.url}:`, error);
      return [];
    }
  }

  /**
   * Extract content from web scraping
   */
  private async extractFromScraping(source: ContentSource): Promise<any[]> {
    if (!source.scrapingEnabled || !source.scrapingSelectors) {
      return [];
    }

    try {
      // Implementation would use a headless browser or HTML parser
      // For now, return empty array - this would be implemented based on your scraping needs
      console.log(`Scraping content from ${source.url} with selectors:`, source.scrapingSelectors);
      
      return [];
    } catch (error) {
      console.error(`Scraping failed for ${source.url}:`, error);
      return [];
    }
  }

  /**
   * Extract content from API sources
   */
  private async extractFromAPI(source: ContentSource): Promise<any[]> {
    try {
      const response = await fetch(source.url);
      const data = await response.json();
      
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error(`API extraction failed for ${source.url}:`, error);
      return [];
    }
  }

  /**
   * Extract and store article authors with cross-outlet deduplication
   */
  private async extractAndStoreAuthors(articleId: number, content: any, source: ContentSource): Promise<AuthorExtractionResult> {
    const bylineText = content.author || content.byline || content.creator || '';
    
    // Use AI to extract and normalize author information
    const aiResult = await this.aiService.extractAuthors(bylineText, content.title, source.name);
    
    const authors: AuthorExtractionResult['authors'] = [];
    
    for (const authorData of aiResult.authors) {
      // Use AuthorProfileService for smart deduplication and profile management
      const authorProfile = await this.authorService.findOrCreateAuthor({
        name: authorData.name,
        title: authorData.title,
        outlet: source.id,
        confidence: authorData.confidence
      });
      
      // Create article-author relationship
      await this.d1Service.db.prepare(`
        INSERT OR IGNORE INTO article_authors (
          article_id, author_id, contribution_type, byline_order, 
          confidence_score, extraction_method
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        articleId,
        authorProfile.id,
        authorData.contributionType,
        authorData.bylineOrder || 1,
        authorData.confidence,
        'ai'
      ).run();

      authors.push({
        name: authorProfile.name,
        normalizedName: authorProfile.normalizedName,
        title: authorProfile.title,
        outlet: source.name,
        contributionType: authorData.contributionType,
        confidence: authorData.confidence
      });
    }

    // Update article with byline
    await this.updateArticle(articleId, { byline: bylineText });

    return {
      authors,
      bylineText,
      extractionMethod: 'ai'
    };
  }


  /**
   * Classify content type and characteristics
   */
  private async classifyContent(articleId: number, content: any): Promise<any> {
    const classification = await this.aiService.classifyContent(
      content.title,
      content.content || content.description
    );

    // Store classification
    await this.d1Service.db.prepare(`
      INSERT OR REPLACE INTO article_classifications (
        article_id, content_type, content_subtype, urgency_level,
        geographic_scope, target_audience, classification_confidence, ai_model_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      articleId,
      classification.contentType,
      classification.contentSubtype,
      classification.urgencyLevel,
      classification.geographicScope,
      classification.targetAudience,
      classification.confidence,
      'claude-3'
    ).run();

    // Update article content type
    await this.updateArticle(articleId, {
      content_type: classification.contentType
    });

    return classification;
  }

  /**
   * Calculate comprehensive quality metrics
   */
  private async calculateQualityMetrics(articleId: number, content: any): Promise<any> {
    const article = await this.getArticle(articleId);
    
    const qualityMetrics = {
      hasAuthor: !!article.byline,
      hasPublicationDate: !!article.published_at,
      hasFeaturedImage: !!article.image_url,
      contentCompleteness: this.calculateContentCompleteness(article),
      grammarScore: await this.aiService.assessGrammar(article.processed_content || article.content),
      readabilityScore: this.calculateReadabilityScore(article.processed_content || article.content),
      headlineQuality: await this.aiService.assessHeadlineQuality(article.title),
      topicRelevance: await this.aiService.assessTopicRelevance(article.title, article.content),
      timeliness: this.calculateTimeliness(article.published_at)
    };

    const overallScore = this.calculateOverallQualityScore(qualityMetrics);

    // Store quality factors
    await this.d1Service.db.prepare(`
      INSERT OR REPLACE INTO quality_factors (
        article_id, has_author, has_publication_date, has_featured_image,
        content_completeness, grammar_score, readability_score,
        headline_quality, topic_relevance, timeliness_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      articleId,
      qualityMetrics.hasAuthor,
      qualityMetrics.hasPublicationDate,
      qualityMetrics.hasFeaturedImage,
      qualityMetrics.contentCompleteness,
      qualityMetrics.grammarScore,
      qualityMetrics.readabilityScore,
      qualityMetrics.headlineQuality,
      qualityMetrics.topicRelevance,
      qualityMetrics.timeliness
    ).run();

    return { ...qualityMetrics, overallScore };
  }

  /**
   * Process and optimize images
   */
  private async processImages(articleId: number, content: any): Promise<any> {
    const article = await this.getArticle(articleId);
    const extractedImages = JSON.parse(article.extracted_images || '[]');
    
    const processedImages = [];
    
    for (const imageUrl of extractedImages) {
      try {
        // Process image through Cloudflare Images (if available)
        const processedImage = await this.optimizeImage(imageUrl);
        processedImages.push(processedImage);
      } catch (error) {
        console.error(`Failed to process image ${imageUrl}:`, error);
      }
    }

    return { processedImages };
  }

  /**
   * Execute a pipeline stage with error handling and logging
   */
  private async executeStage(stage: PipelineStage, operation: () => Promise<any>): Promise<any> {
    stage.status = 'processing';
    stage.startedAt = new Date();

    try {
      const result = await operation();
      stage.status = 'completed';
      stage.completedAt = new Date();
      stage.processingTime = stage.completedAt.getTime() - stage.startedAt.getTime();
      stage.outputData = result;
      return result;
    } catch (error) {
      stage.status = 'failed';
      stage.errorMessage = error.message;
      stage.completedAt = new Date();
      stage.processingTime = stage.completedAt.getTime() - stage.startedAt.getTime();
      
      // Log stage failure
      console.error(`Pipeline stage ${stage.name} failed:`, error);
      
      throw error;
    }
  }

  // Helper methods
  private normalizeAuthorName(name: string): string {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  private calculateContentCompleteness(article: any): number {
    let score = 0;
    const factors = [
      { field: 'title', weight: 0.2 },
      { field: 'content', weight: 0.4 },
      { field: 'byline', weight: 0.1 },
      { field: 'published_at', weight: 0.1 },
      { field: 'image_url', weight: 0.1 },
      { field: 'category', weight: 0.1 }
    ];

    for (const factor of factors) {
      if (article[factor.field]) {
        score += factor.weight;
      }
    }

    return Math.min(1.0, score);
  }

  private calculateReadabilityScore(content: string): number {
    if (!content) return 0;
    
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).length;
    const syllables = this.countSyllables(content);
    
    // Flesch Reading Ease formula
    const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    
    // Convert to 0-1 scale
    return Math.max(0, Math.min(1, fleschScore / 100));
  }

  private countSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiou]{2,}/g, 'a')
      .replace(/[^aeiou]/g, '')
      .length || 1;
  }

  private calculateTimeliness(publishedAt: string): number {
    if (!publishedAt) return 0;
    
    const now = new Date();
    const published = new Date(publishedAt);
    const hoursDiff = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
    
    // More timely articles get higher scores
    if (hoursDiff < 1) return 1.0;
    if (hoursDiff < 6) return 0.9;
    if (hoursDiff < 24) return 0.7;
    if (hoursDiff < 72) return 0.5;
    return 0.3;
  }

  private calculateOverallQualityScore(metrics: any): number {
    const weights = {
      hasAuthor: 0.15,
      hasPublicationDate: 0.10,
      hasFeaturedImage: 0.10,
      contentCompleteness: 0.20,
      grammarScore: 0.15,
      readabilityScore: 0.10,
      headlineQuality: 0.10,
      topicRelevance: 0.05,
      timeliness: 0.05
    };

    let score = 0;
    for (const [metric, weight] of Object.entries(weights)) {
      const value = typeof metrics[metric] === 'boolean' ? (metrics[metric] ? 1 : 0) : (metrics[metric] || 0);
      score += value * weight;
    }

    return Math.min(1.0, score);
  }

  private calculateOverallConfidence(stages: PipelineStage[]): number {
    const completedStages = stages.filter(s => s.status === 'completed');
    if (completedStages.length === 0) return 0;

    const confidenceSum = completedStages.reduce((sum, stage) => {
      return sum + (stage.outputData?.confidence || 0.8); // Default confidence
    }, 0);

    return confidenceSum / completedStages.length;
  }

  private async extractAndStoreArticle(content: any, source: ContentSource): Promise<{ success: boolean; articleId?: number; error?: string }> {
    try {
      const result = await this.d1Service.db.prepare(`
        INSERT INTO articles (
          title, content, url, published_at, category, source, image_url, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `).bind(
        content.title,
        content.content || content.description,
        content.url || content.link,
        content.published_at || content.pubDate,
        content.category || 'general',
        source.id,
        content.image_url || content.enclosure?.url,
        content.description
      ).first();

      return { success: true, articleId: result.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async updateArticle(articleId: number, updates: Record<string, any>): Promise<void> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const placeholders = fields.map(field => `${field} = ?`).join(', ');

    await this.d1Service.db.prepare(`
      UPDATE articles SET ${placeholders} WHERE id = ?
    `).bind(...values, articleId).run();
  }

  private async getArticle(articleId: number): Promise<any> {
    return await this.d1Service.db.prepare(`
      SELECT * FROM articles WHERE id = ?
    `).bind(articleId).first();
  }

  private async finalizeArticle(articleId: number): Promise<void> {
    await this.updateArticle(articleId, {
      ai_processed_at: new Date().toISOString(),
      last_content_update: new Date().toISOString()
    });
  }

  private async updateSourceStats(sourceId: string, results: ProcessingResult[]): Promise<void> {
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const successRate = total > 0 ? successful / total : 0;

    await this.d1Service.db.prepare(`
      UPDATE news_sources 
      SET last_scrape_attempt = ?, scrape_success_rate = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), successRate, sourceId).run();
  }

  private async optimizeImage(imageUrl: string): Promise<any> {
    // Placeholder for Cloudflare Images integration
    return { originalUrl: imageUrl, optimizedUrl: imageUrl };
  }
}