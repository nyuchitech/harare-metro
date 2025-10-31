// Type declarations for D1Service.js

export class D1Service {
  db: D1Database;

  constructor(database: D1Database);

  // System configuration
  getSystemConfig(key: string): Promise<any>;
  setSystemConfig(key: string, value: any, description?: string | null): Promise<{ success: boolean; error?: string }>;
  getAllSystemConfig(): Promise<Record<string, any>>;

  // RSS sources
  getRSSSources(): Promise<any[]>;
  updateRSSSourceStatus(sourceId: number, status: any): Promise<{ success: boolean; error?: string }>;

  // Categories
  getAllCategories(): Promise<any[]>;
  getCategories(): Promise<any[]>;
  getCategoryKeywords(): Promise<Record<number, string[]>>;

  // Articles
  upsertArticle(articleData: any): Promise<any>;
  getArticles(options?: {
    category?: string | null;
    limit?: number;
    offset?: number;
    status?: string;
    orderBy?: string;
    orderDirection?: string;
  }): Promise<any[]>;
  getArticleCount(options?: any): Promise<number>;
  searchArticles(query: string, options?: {
    category?: string | null;
    limit?: number;
    offset?: number;
  }): Promise<any[]>;
  getArticleBySourceSlug(sourceId: string, slug: string): Promise<any | null>;
  getArticleById(articleId: number | string, options?: any): Promise<any | null>;

  // Cache
  getCacheData(cacheKey: string, cacheType: string): Promise<any>;
  setCacheData(cacheKey: string, cacheType: string, data: any, ttlSeconds?: number | null): Promise<{ success: boolean; error?: string }>;
  clearExpiredCache(): Promise<{ success: boolean; error?: string }>;

  // Feed status
  getFeedStatus(sourceId: number): Promise<any>;
  updateFeedStatus(sourceId: number, status: string, errorMessage?: string | null, processingDuration?: number | null, articlesFetched?: number): Promise<{ success: boolean; error?: string }>;

  // Search logging
  logSearch(query: string, categoryFilter?: string | null, resultsCount?: number, sessionId?: string | null): Promise<{ success: boolean; error?: string }>;

  // Utilities
  generateSlug(title: string): string;
  runMigration(migrationSql: string): Promise<{ success: boolean; error?: string }>;
  healthCheck(): Promise<{ healthy: boolean; error?: string; timestamp: string }>;
  getDatabaseStats(): Promise<any>;
}
