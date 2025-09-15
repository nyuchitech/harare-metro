export class RealtimeCountersDO {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const counterId = url.searchParams.get('counterId') || 'global';

    try {
      switch (request.method) {
        case 'GET':
          return this.getCounters(counterId);
        case 'POST':
          return this.updateCounter(request, counterId);
        case 'DELETE':
          return this.resetCounter(counterId);
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

  private async getCounters(counterId: string): Promise<Response> {
    const counters = await this.state.storage.get(`counters:${counterId}`) || {
      activeUsers: 0,
      totalViews: 0,
      totalReads: 0,
      totalShares: 0,
      totalBookmarks: 0,
      totalLikes: 0,
      lastUpdated: new Date().toISOString(),
      hourlyStats: {},
      dailyStats: {}
    };

    return new Response(JSON.stringify(counters), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async updateCounter(request: Request, counterId: string): Promise<Response> {
    const body = await request.json();
    const { 
      action, 
      increment = 1, 
      userId,
      articleId,
      category 
    } = body;

    const key = `counters:${counterId}`;
    const current = await this.state.storage.get(key) || {
      activeUsers: 0,
      totalViews: 0,
      totalReads: 0,
      totalShares: 0,
      totalBookmarks: 0,
      totalLikes: 0,
      lastUpdated: new Date().toISOString(),
      hourlyStats: {},
      dailyStats: {}
    };

    const now = new Date();
    const hour = now.toISOString().substring(0, 13); // YYYY-MM-DDTHH
    const day = now.toISOString().substring(0, 10);  // YYYY-MM-DD

    // Initialize time-based stats if needed
    if (!current.hourlyStats[hour]) {
      current.hourlyStats[hour] = {
        views: 0, reads: 0, shares: 0, bookmarks: 0, likes: 0
      };
    }
    if (!current.dailyStats[day]) {
      current.dailyStats[day] = {
        views: 0, reads: 0, shares: 0, bookmarks: 0, likes: 0
      };
    }

    switch (action) {
      case 'view':
        current.totalViews += increment;
        current.hourlyStats[hour].views += increment;
        current.dailyStats[day].views += increment;
        break;
      case 'read':
        current.totalReads += increment;
        current.hourlyStats[hour].reads += increment;
        current.dailyStats[day].reads += increment;
        break;
      case 'share':
        current.totalShares += increment;
        current.hourlyStats[hour].shares += increment;
        current.dailyStats[day].shares += increment;
        break;
      case 'bookmark':
        current.totalBookmarks += increment;
        current.hourlyStats[hour].bookmarks += increment;
        current.dailyStats[day].bookmarks += increment;
        break;
      case 'like':
        current.totalLikes += increment;
        current.hourlyStats[hour].likes += increment;
        current.dailyStats[day].likes += increment;
        break;
      case 'active_user':
        // Track unique active users
        if (userId) {
          const userKey = `active_user:${userId}:${hour}`;
          const isActive = await this.state.storage.get(userKey);
          if (!isActive) {
            current.activeUsers += 1;
            await this.state.storage.put(userKey, now.toISOString(), {
              expirationTtl: 3600 // Expire after 1 hour
            });
          }
        }
        break;
    }

    // Clean up old hourly stats (keep last 24 hours)
    const cutoffHour = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      .toISOString().substring(0, 13);
    
    Object.keys(current.hourlyStats).forEach(h => {
      if (h < cutoffHour) {
        delete current.hourlyStats[h];
      }
    });

    // Clean up old daily stats (keep last 30 days)
    const cutoffDay = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().substring(0, 10);
    
    Object.keys(current.dailyStats).forEach(d => {
      if (d < cutoffDay) {
        delete current.dailyStats[d];
      }
    });

    current.lastUpdated = now.toISOString();
    await this.state.storage.put(key, current);

    // Track category-specific counters if provided
    if (category && action !== 'active_user') {
      const categoryKey = `counters:category:${category}`;
      const categoryCounters = await this.state.storage.get(categoryKey) || {
        totalViews: 0, totalReads: 0, totalShares: 0, 
        totalBookmarks: 0, totalLikes: 0
      };
      
      const field = `total${action.charAt(0).toUpperCase()}${action.slice(1)}s`;
      if (categoryCounters[field] !== undefined) {
        categoryCounters[field] += increment;
        await this.state.storage.put(categoryKey, categoryCounters);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      counters: current 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async resetCounter(counterId: string): Promise<Response> {
    const key = `counters:${counterId}`;
    await this.state.storage.delete(key);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Counter ${counterId} reset` 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}