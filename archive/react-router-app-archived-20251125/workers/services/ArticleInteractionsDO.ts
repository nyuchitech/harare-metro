/**
 * Article Interactions Durable Object
 * Handles real-time likes, shares, saves, and comments for individual articles
 * Replaces Supabase real-time subscriptions with native Cloudflare solution
 */

export interface ArticleInteraction {
  userId: string
  type: 'like' | 'share' | 'save' | 'unsave' | 'unlike'
  timestamp: number
  metadata?: Record<string, any>
}

export interface ArticleState {
  articleId: number
  likesCount: number
  sharesCount: number
  savesCount: number
  commentsCount: number
  likedBy: Set<string> // User IDs who liked
  savedBy: Set<string> // User IDs who saved
  lastUpdated: number
  connections: Map<string, WebSocket> // Active WebSocket connections
}

export class ArticleInteractionsDO {
  private state: DurableObjectState
  private env: any
  private articleState: ArticleState
  private pendingWrites: ArticleInteraction[] = []
  private flushTimeout?: any

  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
    
    // Initialize article state from Durable Object storage
    this.initializeState()
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // Extract article ID from DO name/path
    const articleId = this.extractArticleId(url)
    
    switch (path) {
      case '/ws':
        return this.handleWebSocket(request)
      case '/interactions':
        if (method === 'POST') {
          return this.handleInteraction(request)
        } else if (method === 'GET') {
          return this.getInteractionState()
        }
        break
      case '/like':
        return this.handleLike(request)
      case '/save':
        return this.handleSave(request)  
      case '/share':
        return this.handleShare(request)
      case '/counts':
        return this.getCounts()
      default:
        return new Response('Not found', { status: 404 })
    }

    return new Response('Method not allowed', { status: 405 })
  }

  /**
   * Initialize article state from storage or create new
   */
  private async initializeState(): Promise<void> {
    try {
      const stored = await this.state.storage.get('articleState')
      
      if (stored) {
        const parsed = stored as any
        this.articleState = {
          ...parsed,
          likedBy: new Set(parsed.likedBy || []),
          savedBy: new Set(parsed.savedBy || []),
          connections: new Map()
        }
      } else {
        // Initialize new article state
        this.articleState = {
          articleId: 0, // Will be set from first interaction
          likesCount: 0,
          sharesCount: 0,
          savesCount: 0,
          commentsCount: 0,
          likedBy: new Set(),
          savedBy: new Set(),
          lastUpdated: Date.now(),
          connections: new Map()
        }
        
        await this.saveState()
      }
    } catch (error) {
      console.error('Failed to initialize article state:', error)
      // Start with empty state on error
      this.articleState = {
        articleId: 0,
        likesCount: 0,
        sharesCount: 0,
        savesCount: 0,
        commentsCount: 0,
        likedBy: new Set(),
        savedBy: new Set(),
        lastUpdated: Date.now(),
        connections: new Map()
      }
    }
  }

  /**
   * Handle WebSocket connections for real-time updates
   */
  private async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected websocket', { status: 400 })
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    const connectionId = crypto.randomUUID()
    this.articleState.connections.set(connectionId, server)

    server.accept()
    
    // Send current state to new connection
    server.send(JSON.stringify({
      type: 'initial_state',
      data: {
        articleId: this.articleState.articleId,
        likesCount: this.articleState.likesCount,
        sharesCount: this.articleState.sharesCount,
        savesCount: this.articleState.savesCount,
        commentsCount: this.articleState.commentsCount
      }
    }))

    // Handle connection close
    server.addEventListener('close', () => {
      this.articleState.connections.delete(connectionId)
    })

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  /**
   * Handle like/unlike actions
   */
  private async handleLike(request: Request): Promise<Response> {
    const body = await request.json()
    const { userId, action } = body // action: 'like' or 'unlike'

    if (!userId) {
      return new Response('User ID required', { status: 400 })
    }

    const interaction: ArticleInteraction = {
      userId,
      type: action === 'unlike' ? 'unlike' : 'like',
      timestamp: Date.now()
    }

    if (action === 'like') {
      if (!this.articleState.likedBy.has(userId)) {
        this.articleState.likedBy.add(userId)
        this.articleState.likesCount++
      }
    } else if (action === 'unlike') {
      if (this.articleState.likedBy.has(userId)) {
        this.articleState.likedBy.delete(userId)
        this.articleState.likesCount--
      }
    }

    await this.processInteraction(interaction)
    
    return new Response(JSON.stringify({
      success: true,
      likesCount: this.articleState.likesCount,
      userLiked: this.articleState.likedBy.has(userId)
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Handle save/unsave actions
   */
  private async handleSave(request: Request): Promise<Response> {
    const body = await request.json()
    const { userId, action } = body // action: 'save' or 'unsave'

    if (!userId) {
      return new Response('User ID required', { status: 400 })
    }

    const interaction: ArticleInteraction = {
      userId,
      type: action === 'unsave' ? 'unsave' : 'save',
      timestamp: Date.now()
    }

    if (action === 'save') {
      if (!this.articleState.savedBy.has(userId)) {
        this.articleState.savedBy.add(userId)
        this.articleState.savesCount++
      }
    } else if (action === 'unsave') {
      if (this.articleState.savedBy.has(userId)) {
        this.articleState.savedBy.delete(userId)
        this.articleState.savesCount--
      }
    }

    await this.processInteraction(interaction)
    
    return new Response(JSON.stringify({
      success: true,
      savesCount: this.articleState.savesCount,
      userSaved: this.articleState.savedBy.has(userId)
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Handle share actions
   */
  private async handleShare(request: Request): Promise<Response> {
    const body = await request.json()
    const { userId, shareType } = body // shareType: 'twitter', 'facebook', 'whatsapp', 'copy'

    const interaction: ArticleInteraction = {
      userId: userId || 'anonymous',
      type: 'share',
      timestamp: Date.now(),
      metadata: { shareType }
    }

    this.articleState.sharesCount++
    await this.processInteraction(interaction)
    
    return new Response(JSON.stringify({
      success: true,
      sharesCount: this.articleState.sharesCount
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Get current interaction counts
   */
  private async getCounts(): Promise<Response> {
    return new Response(JSON.stringify({
      articleId: this.articleState.articleId,
      likesCount: this.articleState.likesCount,
      sharesCount: this.articleState.sharesCount,
      savesCount: this.articleState.savesCount,
      commentsCount: this.articleState.commentsCount,
      lastUpdated: this.articleState.lastUpdated
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Get full interaction state including user lists
   */
  private async getInteractionState(): Promise<Response> {
    return new Response(JSON.stringify({
      articleId: this.articleState.articleId,
      counts: {
        likes: this.articleState.likesCount,
        shares: this.articleState.sharesCount,
        saves: this.articleState.savesCount,
        comments: this.articleState.commentsCount
      },
      users: {
        liked: Array.from(this.articleState.likedBy),
        saved: Array.from(this.articleState.savedBy)
      },
      activeConnections: this.articleState.connections.size,
      lastUpdated: this.articleState.lastUpdated
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Process interaction and broadcast updates
   */
  private async processInteraction(interaction: ArticleInteraction): Promise<void> {
    // Add to pending writes for batch processing
    this.pendingWrites.push(interaction)
    
    // Update last modified time
    this.articleState.lastUpdated = Date.now()
    
    // Save state to durable object storage
    await this.saveState()
    
    // Broadcast to connected clients
    this.broadcastUpdate(interaction)
    
    // Schedule flush to D1 database
    this.scheduleFlush()
  }

  /**
   * Broadcast updates to all connected WebSocket clients
   */
  private broadcastUpdate(interaction: ArticleInteraction): void {
    const update = {
      type: 'interaction_update',
      data: {
        interaction,
        counts: {
          likes: this.articleState.likesCount,
          shares: this.articleState.sharesCount,
          saves: this.articleState.savesCount
        },
        timestamp: Date.now()
      }
    }

    const message = JSON.stringify(update)
    
    // Send to all connected clients
    for (const [connectionId, ws] of this.articleState.connections) {
      try {
        ws.send(message)
      } catch (error) {
        console.error(`Failed to send to connection ${connectionId}:`, error)
        this.articleState.connections.delete(connectionId)
      }
    }
  }

  /**
   * Save current state to Durable Object storage
   */
  private async saveState(): Promise<void> {
    try {
      const stateToSave = {
        ...this.articleState,
        likedBy: Array.from(this.articleState.likedBy),
        savedBy: Array.from(this.articleState.savedBy),
        connections: undefined // Don't persist WebSocket connections
      }
      
      await this.state.storage.put('articleState', stateToSave)
    } catch (error) {
      console.error('Failed to save article state:', error)
    }
  }

  /**
   * Schedule flush of pending writes to D1 database
   */
  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout)
    }

    // Batch writes every 5 seconds or when 10 interactions accumulate
    this.flushTimeout = setTimeout(() => {
      this.flushToD1()
    }, 5000)

    if (this.pendingWrites.length >= 10) {
      this.flushToD1()
    }
  }

  /**
   * Flush pending interactions to D1 database
   */
  private async flushToD1(): Promise<void> {
    if (this.pendingWrites.length === 0) return

    try {
      const interactions = [...this.pendingWrites]
      this.pendingWrites = []

      // Clear timeout
      if (this.flushTimeout) {
        clearTimeout(this.flushTimeout)
        this.flushTimeout = undefined
      }

      const db = this.env.DB

      // Batch insert interactions
      for (const interaction of interactions) {
        await db
          .prepare(`
            INSERT OR REPLACE INTO user_likes (user_id, article_id, created_at)
            SELECT ?, ?, datetime('now')
            WHERE ? = 'like'
          `)
          .bind(interaction.userId, this.articleState.articleId, interaction.type)
          .run()

        await db
          .prepare(`
            DELETE FROM user_likes WHERE user_id = ? AND article_id = ?
            AND ? = 'unlike'
          `)
          .bind(interaction.userId, this.articleState.articleId, interaction.type)
          .run()

        await db
          .prepare(`
            INSERT OR REPLACE INTO user_bookmarks (user_id, article_id, created_at)
            SELECT ?, ?, datetime('now')
            WHERE ? = 'save'
          `)
          .bind(interaction.userId, this.articleState.articleId, interaction.type)
          .run()

        await db
          .prepare(`
            DELETE FROM user_bookmarks WHERE user_id = ? AND article_id = ?
            AND ? = 'unsave'
          `)
          .bind(interaction.userId, this.articleState.articleId, interaction.type)
          .run()
      }

      // Update article view count
      await db
        .prepare('UPDATE articles SET view_count = ? WHERE id = ?')
        .bind(this.articleState.likesCount + this.articleState.savesCount, this.articleState.articleId)
        .run()

      console.log(`Flushed ${interactions.length} interactions to D1 for article ${this.articleState.articleId}`)
    } catch (error) {
      console.error('Failed to flush interactions to D1:', error)
      // Re-add interactions on failure
      this.pendingWrites.unshift(...this.pendingWrites)
    }
  }

  /**
   * Extract article ID from URL or DO name
   */
  private extractArticleId(url: URL): number {
    // Article ID can be in path or query parameter
    const pathId = url.pathname.split('/')[1]
    const queryId = url.searchParams.get('articleId')
    return parseInt(pathId || queryId || '0')
  }

  /**
   * Handle interaction via POST
   */
  private async handleInteraction(request: Request): Promise<Response> {
    const body = await request.json()
    const { userId, type, articleId } = body

    if (!userId || !type) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Set article ID if not already set
    if (this.articleState.articleId === 0 && articleId) {
      this.articleState.articleId = articleId
    }

    const interaction: ArticleInteraction = {
      userId,
      type,
      timestamp: Date.now(),
      metadata: body.metadata
    }

    await this.processInteraction(interaction)

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }
}