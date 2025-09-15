export class RealtimeAnalyticsDO {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      switch (request.method) {
        case 'GET':
          return this.getAnalytics(url);
        case 'POST':
          return this.recordEvent(request);
        case 'DELETE':
          return this.clearAnalytics(url);
        default:
          return new Response('Method not allowed', { status: 405 });
      }
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async getAnalytics(url: URL): Promise<Response> {
    const type = url.searchParams.get('type') || 'all';
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const category = url.searchParams.get('category');

    let analyticsData: any = {};

    switch (type) {
      case 'popular_articles':
        analyticsData = await this.getPopularArticles(timeRange, category);
        break;
      case 'user_engagement':
        analyticsData = await this.getUserEngagement(timeRange);
        break;
      case 'category_stats':
        analyticsData = await this.getCategoryStats(timeRange);
        break;
      case 'search_trends':
        analyticsData = await this.getSearchTrends(timeRange);
        break;
      case 'traffic_sources':
        analyticsData = await this.getTrafficSources(timeRange);
        break;
      case 'all':
      default:
        analyticsData = {
          popularArticles: await this.getPopularArticles(timeRange),
          userEngagement: await this.getUserEngagement(timeRange),
          categoryStats: await this.getCategoryStats(timeRange),
          searchTrends: await this.getSearchTrends(timeRange),
          trafficSources: await this.getTrafficSources(timeRange)
        };
    }

    return new Response(JSON.stringify(analyticsData), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async recordEvent(request: Request): Promise<Response> {
    const body = await request.json();
    const { 
      eventType, 
      userId, 
      articleId, 
      category, 
      source,
      searchQuery,
      referrer,
      userAgent,
      sessionId,
      metadata = {} 
    } = body;

    if (!eventType) {
      return new Response(JSON.stringify({ error: 'Event type required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const hour = timestamp.substring(0, 13);
    const day = timestamp.substring(0, 10);

    const event = {
      eventType,
      userId,
      articleId,
      category,
      source,
      searchQuery,
      referrer,
      userAgent,
      sessionId,
      metadata,
      timestamp
    };

    // Store the event
    const eventKey = `event:${now.getTime()}:${Math.random().toString(36).substr(2, 9)}`;
    await this.state.storage.put(eventKey, event, {
      expirationTtl: 7 * 24 * 60 * 60 // Keep events for 7 days
    });

    // Update aggregated analytics based on event type
    switch (eventType) {
      case 'article_view':
      case 'article_read':
        await this.updateArticleStats(articleId, eventType, category, hour, day);
        break;
      case 'search':
        await this.updateSearchStats(searchQuery, category, hour, day);
        break;
      case 'user_session':
        await this.updateEngagementStats(userId, sessionId, hour, day);
        break;
      case 'traffic_source':
        await this.updateTrafficStats(referrer, hour, day);
        break;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      eventId: eventKey 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async updateArticleStats(
    articleId: string | undefined, 
    eventType: string, 
    category: string | undefined, 
    hour: string, 
    day: string
  ): Promise<void> {
    if (!articleId) return;

    // Update article-specific stats
    const articleKey = `article_stats:${articleId}`;
    const articleStats = await this.state.storage.get(articleKey) || {
      views: 0,
      reads: 0,
      totalEngagementTime: 0,
      hourlyViews: {},
      dailyViews: {}
    };

    if (eventType === 'article_view') {
      articleStats.views += 1;
      articleStats.hourlyViews[hour] = (articleStats.hourlyViews[hour] || 0) + 1;
      articleStats.dailyViews[day] = (articleStats.dailyViews[day] || 0) + 1;
    } else if (eventType === 'article_read') {
      articleStats.reads += 1;
    }

    await this.state.storage.put(articleKey, articleStats);

    // Update category stats if provided
    if (category) {
      const categoryKey = `category_stats:${category}`;
      const categoryStats = await this.state.storage.get(categoryKey) || {
        views: 0,
        reads: 0,
        articles: new Set()
      };

      if (eventType === 'article_view') {
        categoryStats.views += 1;
      } else if (eventType === 'article_read') {
        categoryStats.reads += 1;
      }
      
      categoryStats.articles.add(articleId);
      await this.state.storage.put(categoryKey, {
        ...categoryStats,
        articles: Array.from(categoryStats.articles)
      });
    }
  }

  private async updateSearchStats(
    query: string | undefined, 
    category: string | undefined, 
    hour: string, 
    day: string
  ): Promise<void> {
    if (!query) return;

    const searchKey = `search_stats:${day}`;
    const searchStats = await this.state.storage.get(searchKey) || {
      totalSearches: 0,
      queries: {},
      categories: {}
    };

    searchStats.totalSearches += 1;
    searchStats.queries[query] = (searchStats.queries[query] || 0) + 1;
    
    if (category) {
      searchStats.categories[category] = (searchStats.categories[category] || 0) + 1;
    }

    await this.state.storage.put(searchKey, searchStats);
  }

  private async updateEngagementStats(
    userId: string | undefined, 
    sessionId: string | undefined, 
    hour: string, 
    day: string
  ): Promise<void> {
    const engagementKey = `engagement:${day}`;
    const engagement = await this.state.storage.get(engagementKey) || {
      uniqueUsers: new Set(),
      uniqueSessions: new Set(),
      totalSessions: 0
    };

    if (userId) {
      engagement.uniqueUsers.add(userId);
    }
    if (sessionId) {
      if (!engagement.uniqueSessions.has(sessionId)) {
        engagement.uniqueSessions.add(sessionId);
        engagement.totalSessions += 1;
      }
    }

    await this.state.storage.put(engagementKey, {
      uniqueUsers: Array.from(engagement.uniqueUsers),
      uniqueSessions: Array.from(engagement.uniqueSessions),
      totalSessions: engagement.totalSessions
    });
  }

  private async updateTrafficStats(
    referrer: string | undefined, 
    hour: string, 
    day: string
  ): Promise<void> {
    if (!referrer) return;

    const trafficKey = `traffic:${day}`;
    const trafficStats = await this.state.storage.get(trafficKey) || {
      sources: {},
      totalTraffic: 0
    };

    const domain = this.extractDomain(referrer);
    trafficStats.sources[domain] = (trafficStats.sources[domain] || 0) + 1;
    trafficStats.totalTraffic += 1;

    await this.state.storage.put(trafficKey, trafficStats);
  }

  private async getPopularArticles(timeRange: string, category?: string): Promise<any> {
    const cutoff = this.getTimeRangeCutoff(timeRange);
    const articles: any[] = [];
    
    const keys = await this.state.storage.list({ prefix: 'article_stats:' });
    for (const [key, stats] of keys) {
      const articleId = key.replace('article_stats:', '');
      articles.push({ articleId, ...stats });
    }

    return articles
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);
  }

  private async getUserEngagement(timeRange: string): Promise<any> {
    const cutoff = this.getTimeRangeCutoff(timeRange);
    const engagement = await this.state.storage.get('engagement:' + cutoff.split('T')[0]) || {
      uniqueUsers: [],
      uniqueSessions: [],
      totalSessions: 0
    };
    
    return {
      uniqueUsers: engagement.uniqueUsers.length,
      uniqueSessions: engagement.uniqueSessions.length,
      totalSessions: engagement.totalSessions
    };
  }

  private async getCategoryStats(timeRange: string): Promise<any> {
    const categories: any[] = [];
    const keys = await this.state.storage.list({ prefix: 'category_stats:' });
    
    for (const [key, stats] of keys) {
      const category = key.replace('category_stats:', '');
      categories.push({ category, ...stats });
    }

    return categories.sort((a, b) => b.views - a.views);
  }

  private async getSearchTrends(timeRange: string): Promise<any> {
    const cutoff = this.getTimeRangeCutoff(timeRange);
    const searchStats = await this.state.storage.get('search_stats:' + cutoff.split('T')[0]) || {
      totalSearches: 0,
      queries: {},
      categories: {}
    };

    const topQueries = Object.entries(searchStats.queries)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10);

    return {
      totalSearches: searchStats.totalSearches,
      topQueries,
      categoryBreakdown: searchStats.categories
    };
  }

  private async getTrafficSources(timeRange: string): Promise<any> {
    const cutoff = this.getTimeRangeCutoff(timeRange);
    const trafficStats = await this.state.storage.get('traffic:' + cutoff.split('T')[0]) || {
      sources: {},
      totalTraffic: 0
    };

    const topSources = Object.entries(trafficStats.sources)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10);

    return {
      totalTraffic: trafficStats.totalTraffic,
      topSources
    };
  }

  private async clearAnalytics(url: URL): Promise<Response> {
    const type = url.searchParams.get('type') || 'all';
    
    if (type === 'all') {
      await this.state.storage.deleteAll();
    } else {
      const keys = await this.state.storage.list({ prefix: `${type}:` });
      for (const key of keys.keys()) {
        await this.state.storage.delete(key);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Analytics ${type} cleared` 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private getTimeRangeCutoff(timeRange: string): string {
    const now = new Date();
    let cutoff: Date;

    switch (timeRange) {
      case '1h':
        cutoff = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return cutoff.toISOString();
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'direct';
    }
  }
}