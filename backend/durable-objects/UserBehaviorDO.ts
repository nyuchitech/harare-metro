export class UserBehaviorDO {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    try {
      switch (request.method) {
        case 'GET':
          return this.getUserBehavior(userId);
        case 'POST':
          return this.recordBehavior(request, userId);
        case 'DELETE':
          return this.clearUserData(userId);
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

  private async getUserBehavior(userId: string | null): Promise<Response> {
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const behavior = await this.state.storage.get(`behavior:${userId}`) || {
      readingTime: 0,
      articlesRead: 0,
      categoriesViewed: {},
      lastActivity: new Date().toISOString(),
      preferences: {
        categories: [],
        sources: [],
        readingSpeed: 'medium'
      },
      streak: {
        current: 0,
        longest: 0,
        lastActiveDate: null
      }
    };

    return new Response(JSON.stringify(behavior), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async recordBehavior(request: Request, userId: string | null): Promise<Response> {
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { 
      action, 
      articleId, 
      category, 
      readingTime, 
      source,
      preferences 
    } = body;

    const key = `behavior:${userId}`;
    const current = await this.state.storage.get(key) || {
      readingTime: 0,
      articlesRead: 0,
      categoriesViewed: {},
      lastActivity: new Date().toISOString(),
      preferences: {
        categories: [],
        sources: [],
        readingSpeed: 'medium'
      },
      streak: {
        current: 0,
        longest: 0,
        lastActiveDate: null
      }
    };

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    switch (action) {
      case 'read_article':
        current.articlesRead += 1;
        current.readingTime += readingTime || 0;
        
        if (category) {
          current.categoriesViewed[category] = (current.categoriesViewed[category] || 0) + 1;
        }
        
        // Update reading streak
        const lastActiveDate = current.streak.lastActiveDate;
        if (!lastActiveDate || lastActiveDate !== today) {
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];
          
          if (lastActiveDate === yesterday) {
            current.streak.current += 1;
          } else {
            current.streak.current = 1;
          }
          
          current.streak.longest = Math.max(
            current.streak.longest, 
            current.streak.current
          );
          current.streak.lastActiveDate = today;
        }
        break;

      case 'update_preferences':
        if (preferences) {
          current.preferences = { ...current.preferences, ...preferences };
        }
        break;

      case 'track_time':
        current.readingTime += readingTime || 0;
        break;
    }

    current.lastActivity = now.toISOString();
    await this.state.storage.put(key, current);

    // Also track article-specific user behavior
    if (articleId && action === 'read_article') {
      const articleKey = `user_article:${userId}:${articleId}`;
      await this.state.storage.put(articleKey, {
        readAt: now.toISOString(),
        readingTime: readingTime || 0,
        category,
        source
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      behavior: current 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async clearUserData(userId: string | null): Promise<Response> {
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete main behavior record
    await this.state.storage.delete(`behavior:${userId}`);
    
    // Delete all user-article records
    const keys = await this.state.storage.list({ prefix: `user_article:${userId}:` });
    for (const key of keys.keys()) {
      await this.state.storage.delete(key);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'User data cleared' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}