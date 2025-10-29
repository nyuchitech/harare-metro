/**
 * UserService
 *
 * Handles user-related operations:
 * - User profile management
 * - Reading history
 * - Personal analytics
 * - Personalized feed (algorithm-based)
 * - User preferences
 */

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  role: string;
  created_at: string;
  updated_at: string;
  preferences?: any;
  stats?: {
    total_reads: number;
    total_bookmarks: number;
    total_likes: number;
    total_comments: number;
  };
}

export interface ReadingHistoryItem {
  id: string;
  user_id: string;
  article_id: string;
  article_title: string;
  article_slug: string;
  source_name: string;
  category: string;
  read_at: string;
  read_duration_seconds?: number;
  scroll_depth_percent?: number;
}

export interface UserAnalytics {
  total_reads: number;
  total_bookmarks: number;
  total_likes: number;
  total_comments: number;
  reading_streak_days: number;
  favorite_categories: Array<{ category: string; count: number }>;
  favorite_sources: Array<{ source: string; count: number }>;
  reading_time_by_day: Array<{ day: string; minutes: number }>;
  most_read_authors: Array<{ author: string; count: number }>;
}

export interface PersonalizedFeedItem {
  article_id: string;
  title: string;
  slug: string;
  source_name: string;
  category: string;
  published_at: string;
  image_url?: string;
  relevance_score: number;
  reason?: string; // Why this was recommended
}

export class UserService {
  private usersDb: D1Database;
  private contentDb: D1Database;

  constructor(usersDb: D1Database, contentDb: D1Database) {
    this.usersDb = usersDb;
    this.contentDb = contentDb;
  }

  // ===========================================================================
  // USER PROFILE MANAGEMENT
  // ===========================================================================

  /**
   * Get user profile by ID
   */
  async getProfile(user_id: string): Promise<UserProfile | null> {
    try {
      // Get user data
      const user = await this.usersDb
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .first();

      if (!user) {
        return null;
      }

      // Get user stats
      const stats = await this.getUserStats(user_id);

      // Get preferences
      const preferences = await this.usersDb
        .prepare("SELECT preferences FROM user_preferences WHERE user_id = ?")
        .bind(user_id)
        .first();

      return {
        id: user.id as string,
        email: user.email as string,
        display_name: user.display_name as string | undefined,
        avatar_url: user.avatar_url as string | undefined,
        bio: user.bio as string | undefined,
        role: user.role as string,
        created_at: user.created_at as string,
        updated_at: user.updated_at as string,
        preferences: preferences ? JSON.parse(preferences.preferences as string) : null,
        stats,
      };
    } catch (error: any) {
      console.error("[USER] Get profile error:", error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    user_id: string,
    updates: {
      display_name?: string;
      avatar_url?: string;
      bio?: string;
    }
  ): Promise<boolean> {
    try {
      const fields = [];
      const values = [];

      if (updates.display_name !== undefined) {
        fields.push("display_name = ?");
        values.push(updates.display_name);
      }

      if (updates.avatar_url !== undefined) {
        fields.push("avatar_url = ?");
        values.push(updates.avatar_url);
      }

      if (updates.bio !== undefined) {
        fields.push("bio = ?");
        values.push(updates.bio);
      }

      if (fields.length === 0) {
        return false;
      }

      fields.push("updated_at = datetime('now')");
      values.push(user_id);

      const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
      await this.usersDb.prepare(query).bind(...values).run();

      return true;
    } catch (error: any) {
      console.error("[USER] Update profile error:", error);
      return false;
    }
  }

  /**
   * Get user statistics
   */
  private async getUserStats(user_id: string): Promise<{
    total_reads: number;
    total_bookmarks: number;
    total_likes: number;
    total_comments: number;
  }> {
    try {
      // Total reads
      const reads = await this.usersDb
        .prepare("SELECT COUNT(*) as count FROM user_reading_history WHERE user_id = ?")
        .bind(user_id)
        .first();

      // Total bookmarks
      const bookmarks = await this.usersDb
        .prepare("SELECT COUNT(*) as count FROM user_bookmarks WHERE user_id = ?")
        .bind(user_id)
        .first();

      // Total likes
      const likes = await this.usersDb
        .prepare("SELECT COUNT(*) as count FROM user_likes WHERE user_id = ?")
        .bind(user_id)
        .first();

      // Total comments
      const comments = await this.usersDb
        .prepare("SELECT COUNT(*) as count FROM article_comments WHERE user_id = ?")
        .bind(user_id)
        .first();

      return {
        total_reads: (reads?.count as number) || 0,
        total_bookmarks: (bookmarks?.count as number) || 0,
        total_likes: (likes?.count as number) || 0,
        total_comments: (comments?.count as number) || 0,
      };
    } catch (error: any) {
      console.error("[USER] Get stats error:", error);
      return {
        total_reads: 0,
        total_bookmarks: 0,
        total_likes: 0,
        total_comments: 0,
      };
    }
  }

  // ===========================================================================
  // READING HISTORY
  // ===========================================================================

  /**
   * Get user's reading history
   */
  async getReadingHistory(
    user_id: string,
    limit = 50,
    offset = 0
  ): Promise<ReadingHistoryItem[]> {
    try {
      const history = await this.usersDb
        .prepare(
          `SELECT
            h.id,
            h.user_id,
            h.article_id,
            h.read_at,
            h.read_duration_seconds,
            h.scroll_depth_percent
          FROM user_reading_history h
          WHERE h.user_id = ?
          ORDER BY h.read_at DESC
          LIMIT ? OFFSET ?`
        )
        .bind(user_id, limit, offset)
        .all();

      if (!history.results || history.results.length === 0) {
        return [];
      }

      // Fetch article details from content DB
      const articleIds = history.results.map((h: any) => h.article_id);
      const placeholders = articleIds.map(() => "?").join(",");

      const articles = await this.contentDb
        .prepare(
          `SELECT id, title, slug, source_name, category
          FROM articles
          WHERE id IN (${placeholders})`
        )
        .bind(...articleIds)
        .all();

      // Map articles to history
      const articleMap = new Map(
        articles.results?.map((a: any) => [a.id, a]) || []
      );

      return history.results.map((h: any) => {
        const article = articleMap.get(h.article_id);
        return {
          id: h.id,
          user_id: h.user_id,
          article_id: h.article_id,
          article_title: article?.title || "Unknown",
          article_slug: article?.slug || "",
          source_name: article?.source_name || "Unknown",
          category: article?.category || "general",
          read_at: h.read_at,
          read_duration_seconds: h.read_duration_seconds,
          scroll_depth_percent: h.scroll_depth_percent,
        };
      });
    } catch (error: any) {
      console.error("[USER] Get reading history error:", error);
      return [];
    }
  }

  /**
   * Add to reading history
   */
  async addToReadingHistory(
    user_id: string,
    article_id: string,
    read_duration_seconds?: number,
    scroll_depth_percent?: number
  ): Promise<boolean> {
    try {
      await this.usersDb
        .prepare(
          `INSERT INTO user_reading_history
          (id, user_id, article_id, read_at, read_duration_seconds, scroll_depth_percent)
          VALUES (?, ?, ?, datetime('now'), ?, ?)`
        )
        .bind(
          crypto.randomUUID(),
          user_id,
          article_id,
          read_duration_seconds || null,
          scroll_depth_percent || null
        )
        .run();

      return true;
    } catch (error: any) {
      console.error("[USER] Add to reading history error:", error);
      return false;
    }
  }

  // ===========================================================================
  // PERSONAL ANALYTICS
  // ===========================================================================

  /**
   * Get user's personal analytics
   */
  async getAnalytics(user_id: string): Promise<UserAnalytics> {
    try {
      const stats = await this.getUserStats(user_id);

      // Favorite categories (top 5)
      const favoriteCategories = await this.usersDb
        .prepare(
          `SELECT category, COUNT(*) as count
          FROM user_reading_history h
          JOIN articles a ON h.article_id = a.id
          WHERE h.user_id = ?
          GROUP BY category
          ORDER BY count DESC
          LIMIT 5`
        )
        .bind(user_id)
        .all();

      // Favorite sources (top 5)
      const favoriteSources = await this.usersDb
        .prepare(
          `SELECT source_name, COUNT(*) as count
          FROM user_reading_history h
          JOIN articles a ON h.article_id = a.id
          WHERE h.user_id = ?
          GROUP BY source_name
          ORDER BY count DESC
          LIMIT 5`
        )
        .bind(user_id)
        .all();

      // Reading time by day (last 7 days)
      const readingTimeByDay = await this.usersDb
        .prepare(
          `SELECT
            DATE(read_at) as day,
            SUM(read_duration_seconds) / 60.0 as minutes
          FROM user_reading_history
          WHERE user_id = ?
            AND read_at >= datetime('now', '-7 days')
          GROUP BY DATE(read_at)
          ORDER BY day DESC`
        )
        .bind(user_id)
        .all();

      // Most read authors (top 5)
      const mostReadAuthors = await this.usersDb
        .prepare(
          `SELECT author_name, COUNT(*) as count
          FROM user_reading_history h
          JOIN article_authors aa ON h.article_id = aa.article_id
          JOIN authors a ON aa.author_id = a.id
          WHERE h.user_id = ?
          GROUP BY author_name
          ORDER BY count DESC
          LIMIT 5`
        )
        .bind(user_id)
        .all();

      // Reading streak (consecutive days)
      const readingStreak = await this.calculateReadingStreak(user_id);

      return {
        ...stats,
        reading_streak_days: readingStreak,
        favorite_categories:
          favoriteCategories.results?.map((c: any) => ({
            category: c.category,
            count: c.count,
          })) || [],
        favorite_sources:
          favoriteSources.results?.map((s: any) => ({
            source: s.source_name,
            count: s.count,
          })) || [],
        reading_time_by_day:
          readingTimeByDay.results?.map((d: any) => ({
            day: d.day,
            minutes: d.minutes || 0,
          })) || [],
        most_read_authors:
          mostReadAuthors.results?.map((a: any) => ({
            author: a.author_name,
            count: a.count,
          })) || [],
      };
    } catch (error: any) {
      console.error("[USER] Get analytics error:", error);
      return {
        total_reads: 0,
        total_bookmarks: 0,
        total_likes: 0,
        total_comments: 0,
        reading_streak_days: 0,
        favorite_categories: [],
        favorite_sources: [],
        reading_time_by_day: [],
        most_read_authors: [],
      };
    }
  }

  /**
   * Calculate reading streak (consecutive days)
   */
  private async calculateReadingStreak(user_id: string): Promise<number> {
    try {
      const history = await this.usersDb
        .prepare(
          `SELECT DISTINCT DATE(read_at) as day
          FROM user_reading_history
          WHERE user_id = ?
          ORDER BY day DESC
          LIMIT 365`
        )
        .bind(user_id)
        .all();

      if (!history.results || history.results.length === 0) {
        return 0;
      }

      let streak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const row of history.results) {
        const readDate = new Date(row.day as string);
        readDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (currentDate.getTime() - readDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === streak) {
          streak++;
          currentDate = readDate;
        } else {
          break;
        }
      }

      return streak;
    } catch (error: any) {
      console.error("[USER] Calculate reading streak error:", error);
      return 0;
    }
  }

  // ===========================================================================
  // PERSONALIZED FEED (Algorithm-based)
  // ===========================================================================

  /**
   * Get personalized feed for user
   *
   * Algorithm:
   * 1. Get user's favorite categories, sources, and authors
   * 2. Boost articles from preferred categories (2x weight)
   * 3. Boost articles from preferred sources (1.5x weight)
   * 4. Boost articles from preferred authors (2x weight)
   * 5. Penalize articles already read (0.1x weight)
   * 6. Sort by relevance score + recency
   */
  async getPersonalizedFeed(
    user_id: string,
    limit = 20,
    offset = 0
  ): Promise<PersonalizedFeedItem[]> {
    try {
      // Get user preferences
      const favoriteCategories = await this.usersDb
        .prepare(
          `SELECT category, COUNT(*) as count
          FROM user_reading_history h
          JOIN articles a ON h.article_id = a.id
          WHERE h.user_id = ?
          GROUP BY category
          ORDER BY count DESC
          LIMIT 3`
        )
        .bind(user_id)
        .all();

      const favoriteSources = await this.usersDb
        .prepare(
          `SELECT source_name, COUNT(*) as count
          FROM user_reading_history h
          JOIN articles a ON h.article_id = a.id
          WHERE h.user_id = ?
          GROUP BY source_name
          ORDER BY count DESC
          LIMIT 3`
        )
        .bind(user_id)
        .all();

      const favoriteAuthors = await this.usersDb
        .prepare(
          `SELECT author_id, COUNT(*) as count
          FROM user_reading_history h
          JOIN article_authors aa ON h.article_id = aa.article_id
          WHERE h.user_id = ?
          GROUP BY author_id
          ORDER BY count DESC
          LIMIT 3`
        )
        .bind(user_id)
        .all();

      // Get recent articles (last 7 days, not already read)
      const articles = await this.contentDb
        .prepare(
          `SELECT
            a.id,
            a.title,
            a.slug,
            a.source_name,
            a.category,
            a.published_at,
            a.image_url
          FROM articles a
          WHERE a.published_at >= datetime('now', '-7 days')
            AND a.id NOT IN (
              SELECT article_id FROM user_reading_history WHERE user_id = ?
            )
          ORDER BY a.published_at DESC
          LIMIT 100`
        )
        .bind(user_id)
        .all();

      if (!articles.results || articles.results.length === 0) {
        return [];
      }

      // Calculate relevance scores
      const favoriteCategorySet = new Set(
        favoriteCategories.results?.map((c: any) => c.category) || []
      );
      const favoriteSourceSet = new Set(
        favoriteSources.results?.map((s: any) => s.source_name) || []
      );
      const favoriteAuthorSet = new Set(
        favoriteAuthors.results?.map((a: any) => a.author_id) || []
      );

      const scoredArticles = await Promise.all(
        articles.results.map(async (article: any) => {
          let score = 1.0;
          let reason = "Recent article";

          // Category boost
          if (favoriteCategorySet.has(article.category)) {
            score *= 2.0;
            reason = `From your favorite category: ${article.category}`;
          }

          // Source boost
          if (favoriteSourceSet.has(article.source_name)) {
            score *= 1.5;
            reason = `From your favorite source: ${article.source_name}`;
          }

          // Author boost (check if article has favorite author)
          const hasAuthor = await this.contentDb
            .prepare(
              `SELECT 1 FROM article_authors WHERE article_id = ? AND author_id IN (${
                favoriteAuthors.results?.map(() => "?").join(",") || "?"
              })`
            )
            .bind(
              article.id,
              ...(favoriteAuthors.results?.map((a: any) => a.author_id) || [])
            )
            .first();

          if (hasAuthor) {
            score *= 2.0;
            reason = "By one of your favorite authors";
          }

          // Recency boost (newer = higher score)
          const publishedAt = new Date(article.published_at);
          const now = new Date();
          const hoursSincePublish =
            (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
          const recencyBoost = Math.max(0.1, 1.0 - hoursSincePublish / 168); // Decay over 7 days
          score *= recencyBoost;

          return {
            article_id: article.id,
            title: article.title,
            slug: article.slug,
            source_name: article.source_name,
            category: article.category,
            published_at: article.published_at,
            image_url: article.image_url,
            relevance_score: score,
            reason,
          };
        })
      );

      // Sort by relevance score and apply pagination
      scoredArticles.sort((a, b) => b.relevance_score - a.relevance_score);

      return scoredArticles.slice(offset, offset + limit);
    } catch (error: any) {
      console.error("[USER] Get personalized feed error:", error);
      return [];
    }
  }
}
