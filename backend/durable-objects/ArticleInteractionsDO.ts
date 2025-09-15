export class ArticleInteractionsDO {
  private state: DurableObjectState;
  private env: any;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('articleId');

    try {
      switch (request.method) {
        case 'GET':
          return this.getInteractions(articleId);
        case 'POST':
          return this.recordInteraction(request, articleId);
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

  private async getInteractions(articleId: string | null): Promise<Response> {
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const interactions = await this.state.storage.get(`interactions:${articleId}`) || {
      views: 0,
      likes: 0,
      bookmarks: 0,
      shares: 0,
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(interactions), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async recordInteraction(request: Request, articleId: string | null): Promise<Response> {
    if (!articleId) {
      return new Response(JSON.stringify({ error: 'Article ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { type, userId, increment = 1 } = body;

    if (!type || !['view', 'like', 'bookmark', 'share'].includes(type)) {
      return new Response(JSON.stringify({ error: 'Invalid interaction type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const key = `interactions:${articleId}`;
    const current = await this.state.storage.get(key) || {
      views: 0,
      likes: 0,
      bookmarks: 0,
      shares: 0
    };

    // Update the specific interaction count
    const fieldName = type === 'view' ? 'views' : `${type}s`;
    current[fieldName] = (current[fieldName] || 0) + increment;
    current.lastUpdated = new Date().toISOString();

    // Store user interaction to prevent double counting
    if (userId) {
      const userKey = `user:${userId}:${articleId}:${type}`;
      const hasInteracted = await this.state.storage.get(userKey);
      
      if (hasInteracted && increment > 0) {
        return new Response(JSON.stringify({ 
          error: 'User already performed this interaction',
          current 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await this.state.storage.put(userKey, new Date().toISOString());
    }

    await this.state.storage.put(key, current);

    return new Response(JSON.stringify({ 
      success: true, 
      interactions: current 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}