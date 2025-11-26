// worker/services/D1UserService.js
export class D1UserService {
  constructor(d1Database) {
    this.db = d1Database
    this.initialized = false
  }

  async initialize() {
    if (this.initialized || !this.db) {
      return
    }

    try {
      // Create users table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          preferences TEXT DEFAULT '{}',
          stats TEXT DEFAULT '{}'
        )
      `).run()

      // Create user_likes table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS user_likes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          article_id TEXT NOT NULL,
          article_title TEXT,
          article_source TEXT,
          article_category TEXT,
          liked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, article_id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run()

      // Create user_bookmarks table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS user_bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          article_id TEXT NOT NULL,
          article_title TEXT,
          article_description TEXT,
          article_source TEXT,
          article_category TEXT,
          article_link TEXT,
          article_image_url TEXT,
          article_pub_date DATETIME,
          saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, article_id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run()

      // Create user_reading_history table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS user_reading_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          article_id TEXT NOT NULL,
          article_title TEXT,
          article_source TEXT,
          article_category TEXT,
          read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          time_spent INTEGER DEFAULT 0,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run()

      // Create indexes for better performance
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_user_likes_user_id ON user_likes(user_id)
      `).run()

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id)
      `).run()

      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_user_reading_history_user_id ON user_reading_history(user_id)
      `).run()

      this.initialized = true
      console.log('D1UserService initialized successfully')
    } catch (error) {
      console.log('Error initializing D1UserService:', error)
      throw error
    }
  }

  // User Management
  async createUser(userId, userData = {}) {
    try {
      await this.initialize()

      const { email, preferences = {}, stats = {} } = userData

      const result = await this.db.prepare(`
        INSERT INTO users (id, email, preferences, stats)
        VALUES (?, ?, ?, ?)
      `).bind(
        userId,
        email || null,
        JSON.stringify(preferences),
        JSON.stringify(stats)
      ).run()

      if (result.success) {
        return { success: true, user: await this.getUser(userId) }
      } else {
        throw new Error('Failed to create user')
      }
    } catch (error) {
      console.log('Error creating user:', error)
      return { success: false, error: error.message }
    }
  }

  async getUser(userId) {
    try {
      await this.initialize()

      const result = await this.db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).bind(userId).first()

      if (result) {
        return {
          ...result,
          preferences: JSON.parse(result.preferences || '{}'),
          stats: JSON.parse(result.stats || '{}')
        }
      }

      // If user doesn't exist, create them
      return await this.createUser(userId)
    } catch (error) {
      console.log('Error getting user:', error)
      return {
        id: userId,
        created_at: new Date().toISOString(),
        preferences: {},
        stats: {
          total_likes: 0,
          total_bookmarks: 0,
          total_views: 0
        }
      }
    }
  }

  async updateUser(userId, userData) {
    try {
      await this.initialize()

      const { email, preferences, stats } = userData
      const updates = []
      const bindings = []

      if (email !== undefined) {
        updates.push('email = ?')
        bindings.push(email)
      }
      if (preferences !== undefined) {
        updates.push('preferences = ?')
        bindings.push(JSON.stringify(preferences))
      }
      if (stats !== undefined) {
        updates.push('stats = ?')
        bindings.push(JSON.stringify(stats))
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')
      bindings.push(userId)

      const result = await this.db.prepare(`
        UPDATE users SET ${updates.join(', ')} WHERE id = ?
      `).bind(...bindings).run()

      if (result.success) {
        return { success: true, user: await this.getUser(userId) }
      } else {
        throw new Error('Failed to update user')
      }
    } catch (error) {
      console.log('Error updating user:', error)
      return { success: false, error: error.message }
    }
  }

  // User Likes Management
  async getUserLikes(userId, limit = 100, offset = 0) {
    try {
      await this.initialize()

      const results = await this.db.prepare(`
        SELECT * FROM user_likes 
        WHERE user_id = ? 
        ORDER BY liked_at DESC 
        LIMIT ? OFFSET ?
      `).bind(userId, limit, offset).all()

      return results.results || []
    } catch (error) {
      console.log('Error getting user likes:', error)
      return []
    }
  }

  async addUserLike(userId, article) {
    try {
      await this.initialize()

      const articleId = article.id || article.link
      
      const result = await this.db.prepare(`
        INSERT OR REPLACE INTO user_likes 
        (user_id, article_id, article_title, article_source, article_category)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        userId,
        articleId,
        article.title,
        article.source,
        article.category
      ).run()

      if (result.success) {
        // Update user stats
        await this.updateUserStats(userId, 'total_likes', 1)
        return { success: true }
      } else {
        throw new Error('Failed to add like')
      }
    } catch (error) {
      console.log('Error adding user like:', error)
      return { success: false, error: error.message }
    }
  }

  async removeUserLike(userId, articleId) {
    try {
      await this.initialize()

      const result = await this.db.prepare(`
        DELETE FROM user_likes WHERE user_id = ? AND article_id = ?
      `).bind(userId, articleId).run()

      if (result.success) {
        // Update user stats
        await this.updateUserStats(userId, 'total_likes', -1)
        return { success: true }
      } else {
        throw new Error('Failed to remove like')
      }
    } catch (error) {
      console.log('Error removing user like:', error)
      return { success: false, error: error.message }
    }
  }

  async isArticleLiked(userId, articleId) {
    try {
      await this.initialize()

      const result = await this.db.prepare(`
        SELECT id FROM user_likes WHERE user_id = ? AND article_id = ?
      `).bind(userId, articleId).first()

      return !!result
    } catch (error) {
      console.log('Error checking if article is liked:', error)
      return false
    }
  }

  // User Bookmarks Management
  async getUserBookmarks(userId, limit = 100, offset = 0) {
    try {
      await this.initialize()

      const results = await this.db.prepare(`
        SELECT * FROM user_bookmarks 
        WHERE user_id = ? 
        ORDER BY saved_at DESC 
        LIMIT ? OFFSET ?
      `).bind(userId, limit, offset).all()

      return results.results || []
    } catch (error) {
      console.log('Error getting user bookmarks:', error)
      return []
    }
  }

  async addUserBookmark(userId, article) {
    try {
      await this.initialize()

      const articleId = article.id || article.link
      
      const result = await this.db.prepare(`
        INSERT OR REPLACE INTO user_bookmarks 
        (user_id, article_id, article_title, article_description, article_source, 
         article_category, article_link, article_image_url, article_pub_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        articleId,
        article.title,
        article.description,
        article.source,
        article.category,
        article.link,
        article.imageUrl,
        article.pubDate
      ).run()

      if (result.success) {
        // Update user stats
        await this.updateUserStats(userId, 'total_bookmarks', 1)
        return { success: true }
      } else {
        throw new Error('Failed to add bookmark')
      }
    } catch (error) {
      console.log('Error adding user bookmark:', error)
      return { success: false, error: error.message }
    }
  }

  async removeUserBookmark(userId, articleId) {
    try {
      await this.initialize()

      const result = await this.db.prepare(`
        DELETE FROM user_bookmarks WHERE user_id = ? AND article_id = ?
      `).bind(userId, articleId).run()

      if (result.success) {
        // Update user stats
        await this.updateUserStats(userId, 'total_bookmarks', -1)
        return { success: true }
      } else {
        throw new Error('Failed to remove bookmark')
      }
    } catch (error) {
      console.log('Error removing user bookmark:', error)
      return { success: false, error: error.message }
    }
  }

  async isArticleBookmarked(userId, articleId) {
    try {
      await this.initialize()

      const result = await this.db.prepare(`
        SELECT id FROM user_bookmarks WHERE user_id = ? AND article_id = ?
      `).bind(userId, articleId).first()

      return !!result
    } catch (error) {
      console.log('Error checking if article is bookmarked:', error)
      return false
    }
  }

  // Reading History Management
  async addReadingHistory(userId, article, timeSpent = 0) {
    try {
      await this.initialize()

      const articleId = article.id || article.link
      
      const result = await this.db.prepare(`
        INSERT INTO user_reading_history 
        (user_id, article_id, article_title, article_source, article_category, time_spent)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        articleId,
        article.title,
        article.source,
        article.category,
        timeSpent
      ).run()

      if (result.success) {
        // Update user stats
        await this.updateUserStats(userId, 'total_views', 1)
        return { success: true }
      } else {
        throw new Error('Failed to add reading history')
      }
    } catch (error) {
      console.log('Error adding reading history:', error)
      return { success: false, error: error.message }
    }
  }

  async getUserReadingHistory(userId, limit = 50, offset = 0) {
    try {
      await this.initialize()

      const results = await this.db.prepare(`
        SELECT * FROM user_reading_history 
        WHERE user_id = ? 
        ORDER BY read_at DESC 
        LIMIT ? OFFSET ?
      `).bind(userId, limit, offset).all()

      return results.results || []
    } catch (error) {
      console.log('Error getting user reading history:', error)
      return []
    }
  }

  // User Statistics
  async updateUserStats(userId, statKey, increment) {
    try {
      const user = await this.getUser(userId)
      const currentStats = user.stats || {}
      
      currentStats[statKey] = Math.max(0, (currentStats[statKey] || 0) + increment)
      
      await this.updateUser(userId, { stats: currentStats })
    } catch (error) {
      console.log('Error updating user stats:', error)
    }
  }

  async getUserStats(userId) {
    try {
      const user = await this.getUser(userId)
      return user.stats || {
        total_likes: 0,
        total_bookmarks: 0,
        total_views: 0
      }
    } catch (error) {
      console.log('Error getting user stats:', error)
      return {
        total_likes: 0,
        total_bookmarks: 0,
        total_views: 0
      }
    }
  }

  // Cleanup and Maintenance
  async cleanupOldData(daysOld = 90) {
    try {
      await this.initialize()

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      const cutoffDateString = cutoffDate.toISOString()

      // Clean up old reading history
      const result = await this.db.prepare(`
        DELETE FROM user_reading_history WHERE read_at < ?
      `).bind(cutoffDateString).run()

      console.log(`Cleaned up ${result.changes} old reading history entries`)
      return { success: true, cleanedEntries: result.changes }
    } catch (error) {
      console.log('Error cleaning up old data:', error)
      return { success: false, error: error.message }
    }
  }

  // Batch operations for better performance
  async batchAddLikes(userId, articles) {
    try {
      await this.initialize()

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_likes 
        (user_id, article_id, article_title, article_source, article_category)
        VALUES (?, ?, ?, ?, ?)
      `)

      const batch = articles.map(article => {
        const articleId = article.id || article.link
        return stmt.bind(userId, articleId, article.title, article.source, article.category)
      })

      const results = await this.db.batch(batch)
      const successCount = results.filter(r => r.success).length

      if (successCount > 0) {
        await this.updateUserStats(userId, 'total_likes', successCount)
      }

      return { success: true, added: successCount, total: articles.length }
    } catch (error) {
      console.log('Error batch adding likes:', error)
      return { success: false, error: error.message }
    }
  }

  async batchAddBookmarks(userId, articles) {
    try {
      await this.initialize()

      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_bookmarks 
        (user_id, article_id, article_title, article_description, article_source, 
         article_category, article_link, article_image_url, article_pub_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const batch = articles.map(article => {
        const articleId = article.id || article.link
        return stmt.bind(
          userId, articleId, article.title, article.description,
          article.source, article.category, article.link,
          article.imageUrl, article.pubDate
        )
      })

      const results = await this.db.batch(batch)
      const successCount = results.filter(r => r.success).length

      if (successCount > 0) {
        await this.updateUserStats(userId, 'total_bookmarks', successCount)
      }

      return { success: true, added: successCount, total: articles.length }
    } catch (error) {
      console.log('Error batch adding bookmarks:', error)
      return { success: false, error: error.message }
    }
  }
}