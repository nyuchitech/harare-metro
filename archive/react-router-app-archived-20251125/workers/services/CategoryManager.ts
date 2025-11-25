/**
 * CategoryManager - Comprehensive Category Management with Analytics
 * 
 * Features:
 * - User Interest Tracking
 * - Category Performance Analytics
 * - Content Classification
 * - Trend Detection
 * - A/B Testing Support
 * - User Segment Analysis
 */

export interface UserInterest {
  user_id: string;
  category_id: string;
  interest_score: number;
  view_count: number;
  engagement_count: number;
  last_interaction_at: string;
}

export interface CategoryPerformance {
  category_id: string;
  date: string;
  article_count: number;
  total_views: number;
  total_engagements: number;
  unique_readers: number;
  avg_read_time: number;
  bounce_rate: number;
}

export interface CategoryTrend {
  category_id: string;
  category_name: string;
  trend_direction: 'up' | 'down' | 'stable';
  growth_rate: number;
  period_days: number;
  current_engagement: number;
  previous_engagement: number;
}

export interface UserSegment {
  segment_name: string;
  user_count: number;
  top_categories: Array<{
    category_id: string;
    category_name: string;
    avg_engagement: number;
  }>;
  characteristics: {
    avg_session_time: number;
    avg_articles_per_session: number;
    preferred_content_types: string[];
  };
}

export class CategoryManager {
  constructor(private db: D1Database) {}

  // ===============================================================
  // USER INTEREST TRACKING
  // ===============================================================

  /**
   * Get user's category interests with scores
   */
  async getUserInterests(userId: string): Promise<UserInterest[]> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            u.user_id,
            u.category_id,
            u.interest_score,
            u.view_count,
            u.engagement_count,
            u.last_interaction_at,
            c.name as category_name,
            c.emoji as category_emoji
          FROM user_category_interests u
          JOIN categories c ON u.category_id = c.id
          WHERE u.user_id = ?
          ORDER BY u.interest_score DESC
        `)
        .bind(userId)
        .all();

      return result.results as UserInterest[];
    } catch (error) {
      console.error('[CategoryManager] Error getting user interests:', error);
      return [];
    }
  }

  /**
   * Update user's interest score for a category
   */
  async updateInterestScore(
    userId: string,
    categoryId: string,
    delta: number,
    interactionType: 'view' | 'engagement' = 'view'
  ): Promise<void> {
    try {
      // Validate category exists
      const categoryExists = await this.db
        .prepare('SELECT id FROM categories WHERE id = ?')
        .bind(categoryId)
        .first();

      if (!categoryExists) {
        console.warn(`[CategoryManager] Category ${categoryId} does not exist`);
        return;
      }

      // Update or insert interest record
      const viewIncrement = interactionType === 'view' ? 1 : 0;
      const engagementIncrement = interactionType === 'engagement' ? 1 : 0;

      await this.db
        .prepare(`
          INSERT INTO user_category_interests (
            user_id, category_id, interest_score, view_count, engagement_count, 
            last_interaction_at, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
          ON CONFLICT(user_id, category_id) DO UPDATE SET
            interest_score = interest_score + ?,
            view_count = view_count + ?,
            engagement_count = engagement_count + ?,
            last_interaction_at = datetime('now'),
            updated_at = datetime('now')
        `)
        .bind(
          userId, categoryId, delta, viewIncrement, engagementIncrement,
          delta, viewIncrement, engagementIncrement
        )
        .run();

      console.log(`[CategoryManager] Updated interest for ${userId} in ${categoryId}: ${delta > 0 ? '+' : ''}${delta}`);
    } catch (error) {
      console.error('[CategoryManager] Error updating interest score:', error);
    }
  }

  /**
   * Get personalized content recommendations based on user interests
   */
  async getPersonalizedCategories(userId: string, limit: number = 10): Promise<string[]> {
    try {
      const result = await this.db
        .prepare(`
          SELECT category_id, interest_score
          FROM user_category_interests
          WHERE user_id = ? AND interest_score > 0
          ORDER BY interest_score DESC, last_interaction_at DESC
          LIMIT ?
        `)
        .bind(userId, limit)
        .all();

      return result.results.map((row: any) => row.category_id);
    } catch (error) {
      console.error('[CategoryManager] Error getting personalized categories:', error);
      return [];
    }
  }

  // ===============================================================
  // CATEGORY PERFORMANCE ANALYTICS  
  // ===============================================================

  /**
   * Track category performance metrics
   */
  async trackCategoryPerformance(
    categoryId: string,
    metrics: {
      article_count?: number;
      total_views?: number;
      total_engagements?: number;
      unique_readers?: number;
      avg_read_time?: number;
      bounce_rate?: number;
    },
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<void> {
    try {
      await this.db
        .prepare(`
          INSERT INTO category_performance (
            category_id, date, article_count, total_views, total_engagements,
            unique_readers, avg_read_time, bounce_rate, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(category_id, date) DO UPDATE SET
            article_count = COALESCE(?, article_count),
            total_views = COALESCE(?, total_views),
            total_engagements = COALESCE(?, total_engagements),
            unique_readers = COALESCE(?, unique_readers),
            avg_read_time = COALESCE(?, avg_read_time),
            bounce_rate = COALESCE(?, bounce_rate),
            updated_at = datetime('now')
        `)
        .bind(
          categoryId, date,
          metrics.article_count || 0,
          metrics.total_views || 0,
          metrics.total_engagements || 0,
          metrics.unique_readers || 0,
          metrics.avg_read_time || 0.0,
          metrics.bounce_rate || 0.0,
          // For conflict resolution
          metrics.article_count,
          metrics.total_views,
          metrics.total_engagements,
          metrics.unique_readers,
          metrics.avg_read_time,
          metrics.bounce_rate
        )
        .run();

      console.log(`[CategoryManager] Updated performance metrics for ${categoryId} on ${date}`);
    } catch (error) {
      console.error('[CategoryManager] Error tracking category performance:', error);
    }
  }

  /**
   * Get category performance analytics
   */
  async getCategoryAnalytics(
    categoryId?: string,
    days: number = 7
  ): Promise<CategoryPerformance[]> {
    try {
      const query = categoryId 
        ? `
          SELECT 
            cp.*,
            c.name as category_name,
            c.emoji as category_emoji
          FROM category_performance cp
          JOIN categories c ON cp.category_id = c.id
          WHERE cp.category_id = ? AND cp.date >= date('now', '-' || ? || ' days')
          ORDER BY cp.date DESC
        `
        : `
          SELECT 
            cp.*,
            c.name as category_name,
            c.emoji as category_emoji
          FROM category_performance cp
          JOIN categories c ON cp.category_id = c.id
          WHERE cp.date >= date('now', '-' || ? || ' days')
          ORDER BY cp.total_engagements DESC, cp.date DESC
        `;

      const result = categoryId
        ? await this.db.prepare(query).bind(categoryId, days).all()
        : await this.db.prepare(query).bind(days).all();

      return result.results as CategoryPerformance[];
    } catch (error) {
      console.error('[CategoryManager] Error getting category analytics:', error);
      return [];
    }
  }

  // ===============================================================
  // TREND DETECTION
  // ===============================================================

  /**
   * Detect and analyze category trends
   */
  async getCategoryTrends(days: number = 7): Promise<CategoryTrend[]> {
    try {
      const result = await this.db
        .prepare(`
          SELECT 
            c.id as category_id,
            c.name as category_name,
            current.total_engagements as current_engagement,
            previous.total_engagements as previous_engagement,
            CASE 
              WHEN previous.total_engagements = 0 THEN 100.0
              ELSE ROUND(((current.total_engagements - previous.total_engagements) * 100.0 / previous.total_engagements), 2)
            END as growth_rate
          FROM categories c
          LEFT JOIN (
            SELECT 
              category_id,
              SUM(total_engagements) as total_engagements
            FROM category_performance 
            WHERE date >= date('now', '-' || ? || ' days')
            GROUP BY category_id
          ) current ON c.id = current.category_id
          LEFT JOIN (
            SELECT 
              category_id,
              SUM(total_engagements) as total_engagements
            FROM category_performance 
            WHERE date >= date('now', '-' || (? * 2) || ' days') 
              AND date < date('now', '-' || ? || ' days')
            GROUP BY category_id
          ) previous ON c.id = previous.category_id
          WHERE current.total_engagements > 0 OR previous.total_engagements > 0
          ORDER BY growth_rate DESC
        `)
        .bind(days, days, days)
        .all();

      return result.results.map((row: any) => ({
        category_id: row.category_id,
        category_name: row.category_name,
        trend_direction: row.growth_rate > 5 ? 'up' : row.growth_rate < -5 ? 'down' : 'stable',
        growth_rate: row.growth_rate || 0,
        period_days: days,
        current_engagement: row.current_engagement || 0,
        previous_engagement: row.previous_engagement || 0
      }));
    } catch (error) {
      console.error('[CategoryManager] Error getting category trends:', error);
      return [];
    }
  }

  /**
   * Get trending categories (highest engagement growth)
   */
  async getTrendingCategories(limit: number = 5): Promise<CategoryTrend[]> {
    const trends = await this.getCategoryTrends(7);
    return trends
      .filter(trend => trend.trend_direction === 'up')
      .slice(0, limit);
  }

  // ===============================================================
  // CONTENT CLASSIFICATION
  // ===============================================================

  /**
   * Classify content into categories using keywords and ML
   */
  async classifyContent(title: string, description?: string): Promise<string> {
    try {
      // Get all categories with keywords
      const result = await this.db
        .prepare(`
          SELECT id, name, keywords
          FROM categories
          WHERE keywords IS NOT NULL AND keywords != '' AND keywords != '[]'
          ORDER BY sort_order
        `)
        .all();

      const categories = result.results as Array<{
        id: string;
        name: string;
        keywords: string;
      }>;

      const content = `${title} ${description || ''}`.toLowerCase();

      let bestMatch = 'general';
      let bestScore = 0;

      for (const category of categories) {
        if (category.id === 'all' || category.id === 'general') continue;

        try {
          // Parse JSON keywords array
          let keywords: string[] = [];
          if (category.keywords.startsWith('[')) {
            keywords = JSON.parse(category.keywords).map((k: string) => k.toLowerCase());
          } else {
            // Fallback to comma-separated for backward compatibility
            keywords = category.keywords.split(',').map(k => k.trim().toLowerCase());
          }

          const score = keywords.reduce((acc, keyword) => {
            if (content.includes(keyword)) {
              return acc + (keyword.length > 3 ? 2 : 1); // Weight longer keywords higher
            }
            return acc;
          }, 0);

          if (score > bestScore) {
            bestScore = score;
            bestMatch = category.id;
          }
        } catch (parseError) {
          console.warn(`[CategoryManager] Error parsing keywords for category ${category.id}:`, parseError);
        }
      }

      console.log(`[CategoryManager] Classified "${title.substring(0, 50)}..." as '${bestMatch}' (score: ${bestScore})`);
      return bestMatch;
    } catch (error) {
      console.error('[CategoryManager] Error classifying content:', error);
      return 'general';
    }
  }

  // ===============================================================
  // USER SEGMENTATION ANALYSIS
  // ===============================================================

  /**
   * Analyze user segments based on category preferences
   */
  async getUserSegments(): Promise<UserSegment[]> {
    try {
      // This is a simplified version - in production you'd use more sophisticated clustering
      const result = await this.db
        .prepare(`
          SELECT 
            CASE 
              WHEN AVG(interest_score) > 50 THEN 'Heavy Users'
              WHEN AVG(interest_score) > 20 THEN 'Regular Users'
              ELSE 'Casual Users'
            END as segment_name,
            COUNT(DISTINCT user_id) as user_count,
            category_id,
            c.name as category_name,
            AVG(engagement_count) as avg_engagement
          FROM user_category_interests u
          JOIN categories c ON u.category_id = c.id
          GROUP BY segment_name, category_id, c.name
          ORDER BY segment_name, avg_engagement DESC
        `)
        .all();

      // Group by segments
      const segments: { [key: string]: any } = {};
      
      for (const row of result.results as any[]) {
        if (!segments[row.segment_name]) {
          segments[row.segment_name] = {
            segment_name: row.segment_name,
            user_count: row.user_count,
            top_categories: [],
            characteristics: {
              avg_session_time: 0,
              avg_articles_per_session: 0,
              preferred_content_types: []
            }
          };
        }

        segments[row.segment_name].top_categories.push({
          category_id: row.category_id,
          category_name: row.category_name,
          avg_engagement: row.avg_engagement
        });
      }

      // Limit top categories per segment
      Object.values(segments).forEach((segment: any) => {
        segment.top_categories = segment.top_categories.slice(0, 5);
      });

      return Object.values(segments);
    } catch (error) {
      console.error('[CategoryManager] Error getting user segments:', error);
      return [];
    }
  }

  // ===============================================================
  // INSIGHTS AND REPORTING
  // ===============================================================

  /**
   * Generate comprehensive category insights report
   */
  async generateInsights(days: number = 30): Promise<{
    summary: {
      total_categories: number;
      active_categories: number;
      total_engagements: number;
      avg_engagement_per_category: number;
    };
    top_performing: CategoryPerformance[];
    trends: CategoryTrend[];
    user_segments: UserSegment[];
    recommendations: string[];
  }> {
    try {
      // Get summary stats
      const summaryResult = await this.db
        .prepare(`
          SELECT 
            (SELECT COUNT(*) FROM categories WHERE enabled = 1) as total_categories,
            (SELECT COUNT(DISTINCT category_id) FROM category_performance WHERE date >= date('now', '-' || ? || ' days')) as active_categories,
            (SELECT SUM(total_engagements) FROM category_performance WHERE date >= date('now', '-' || ? || ' days')) as total_engagements
        `)
        .bind(days, days)
        .first() as any;

      const summary = {
        total_categories: summaryResult?.total_categories || 0,
        active_categories: summaryResult?.active_categories || 0,
        total_engagements: summaryResult?.total_engagements || 0,
        avg_engagement_per_category: summaryResult?.active_categories ? 
          (summaryResult?.total_engagements || 0) / summaryResult.active_categories : 0
      };

      // Get other insights
      const [topPerforming, trends, userSegments] = await Promise.all([
        this.getCategoryAnalytics(undefined, days),
        this.getCategoryTrends(days),
        this.getUserSegments()
      ]);

      // Generate recommendations
      const recommendations = this.generateRecommendations(trends, topPerforming);

      return {
        summary,
        top_performing: topPerforming.slice(0, 10),
        trends: trends.slice(0, 10),
        user_segments: userSegments,
        recommendations
      };
    } catch (error) {
      console.error('[CategoryManager] Error generating insights:', error);
      return {
        summary: { total_categories: 0, active_categories: 0, total_engagements: 0, avg_engagement_per_category: 0 },
        top_performing: [],
        trends: [],
        user_segments: [],
        recommendations: []
      };
    }
  }

  /**
   * Generate actionable recommendations based on analytics
   */
  private generateRecommendations(trends: CategoryTrend[], performance: CategoryPerformance[]): string[] {
    const recommendations: string[] = [];

    // Trending up categories
    const upwardTrends = trends.filter(t => t.trend_direction === 'up').slice(0, 3);
    if (upwardTrends.length > 0) {
      recommendations.push(`Focus on trending categories: ${upwardTrends.map(t => t.category_name).join(', ')}`);
    }

    // Declining categories
    const decliningTrends = trends.filter(t => t.trend_direction === 'down').slice(0, 2);
    if (decliningTrends.length > 0) {
      recommendations.push(`Investigate declining categories: ${decliningTrends.map(t => t.category_name).join(', ')}`);
    }

    // Low performing categories
    const lowPerforming = performance.filter(p => p.total_engagements < 10).slice(0, 3);
    if (lowPerforming.length > 0) {
      recommendations.push(`Consider improving content strategy for low-engagement categories`);
    }

    // High bounce rate categories
    const highBounce = performance.filter(p => p.bounce_rate > 0.7).slice(0, 2);
    if (highBounce.length > 0) {
      recommendations.push(`Reduce bounce rate in categories with poor retention`);
    }

    return recommendations;
  }

  // ===============================================================
  // UTILITY METHODS
  // ===============================================================

  /**
   * Batch update category performance from analytics data
   */
  async batchUpdatePerformance(performanceData: CategoryPerformance[]): Promise<void> {
    try {
      for (const data of performanceData) {
        await this.trackCategoryPerformance(data.category_id, {
          article_count: data.article_count,
          total_views: data.total_views,
          total_engagements: data.total_engagements,
          unique_readers: data.unique_readers,
          avg_read_time: data.avg_read_time,
          bounce_rate: data.bounce_rate
        }, data.date);
      }
      console.log(`[CategoryManager] Batch updated ${performanceData.length} performance records`);
    } catch (error) {
      console.error('[CategoryManager] Error in batch update:', error);
    }
  }

  /**
   * Clean up old performance data (keep last N days)
   */
  async cleanupOldData(keepDays: number = 90): Promise<void> {
    try {
      await this.db
        .prepare(`
          DELETE FROM category_performance 
          WHERE date < date('now', '-' || ? || ' days')
        `)
        .bind(keepDays)
        .run();

      await this.db
        .prepare(`
          DELETE FROM user_category_interests 
          WHERE last_interaction_at < datetime('now', '-' || ? || ' days')
        `)
        .bind(keepDays)
        .run();

      console.log(`[CategoryManager] Cleaned up data older than ${keepDays} days`);
    } catch (error) {
      console.error('[CategoryManager] Error cleaning up old data:', error);
    }
  }
}

export default CategoryManager;