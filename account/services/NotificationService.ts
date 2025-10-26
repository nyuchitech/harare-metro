/**
 * NotificationService
 *
 * Handles user notifications:
 * - Create notifications
 * - Get user notifications
 * - Mark notifications as read
 * - Delete notifications
 *
 * Notification types:
 * - article_published: New article from followed author/category
 * - comment_reply: Someone replied to your comment
 * - comment_like: Someone liked your comment
 * - author_milestone: Followed author reached a milestone
 * - system: System announcements
 */

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  link_text?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  metadata?: any;
}

export interface CreateNotificationParams {
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  link_text?: string;
  metadata?: any;
}

export class NotificationService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ===========================================================================
  // CREATE NOTIFICATIONS
  // ===========================================================================

  /**
   * Create a notification for a user
   */
  async createNotification(params: CreateNotificationParams): Promise<string | null> {
    try {
      const notification_id = crypto.randomUUID();

      await this.db
        .prepare(
          `INSERT INTO notifications
          (id, user_id, type, title, message, link_url, link_text, is_read, created_at, metadata)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0, datetime('now'), ?)`
        )
        .bind(
          notification_id,
          params.user_id,
          params.type,
          params.title,
          params.message,
          params.link_url || null,
          params.link_text || null,
          params.metadata ? JSON.stringify(params.metadata) : null
        )
        .run();

      return notification_id;
    } catch (error: any) {
      console.error("[NOTIFICATION] Create notification error:", error);
      return null;
    }
  }

  /**
   * Create bulk notifications for multiple users
   */
  async createBulkNotifications(
    user_ids: string[],
    notification: Omit<CreateNotificationParams, "user_id">
  ): Promise<number> {
    try {
      let created = 0;

      for (const user_id of user_ids) {
        const result = await this.createNotification({
          user_id,
          ...notification,
        });

        if (result) {
          created++;
        }
      }

      return created;
    } catch (error: any) {
      console.error("[NOTIFICATION] Create bulk notifications error:", error);
      return 0;
    }
  }

  // ===========================================================================
  // GET NOTIFICATIONS
  // ===========================================================================

  /**
   * Get notifications for a user
   */
  async getNotifications(
    user_id: string,
    limit = 20,
    unread_only = false
  ): Promise<Notification[]> {
    try {
      let query = `
        SELECT
          id,
          user_id,
          type,
          title,
          message,
          link_url,
          link_text,
          is_read,
          created_at,
          read_at,
          metadata
        FROM notifications
        WHERE user_id = ?
      `;

      if (unread_only) {
        query += " AND is_read = 0";
      }

      query += " ORDER BY created_at DESC LIMIT ?";

      const result = await this.db.prepare(query).bind(user_id, limit).all();

      if (!result.results || result.results.length === 0) {
        return [];
      }

      return result.results.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        link_url: row.link_url,
        link_text: row.link_text,
        is_read: row.is_read === 1,
        created_at: row.created_at,
        read_at: row.read_at,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error: any) {
      console.error("[NOTIFICATION] Get notifications error:", error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(user_id: string): Promise<number> {
    try {
      const result = await this.db
        .prepare(
          "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0"
        )
        .bind(user_id)
        .first();

      return (result?.count as number) || 0;
    } catch (error: any) {
      console.error("[NOTIFICATION] Get unread count error:", error);
      return 0;
    }
  }

  // ===========================================================================
  // MARK AS READ
  // ===========================================================================

  /**
   * Mark a notification as read
   */
  async markAsRead(notification_id: string, user_id: string): Promise<boolean> {
    try {
      await this.db
        .prepare(
          `UPDATE notifications
          SET is_read = 1, read_at = datetime('now')
          WHERE id = ? AND user_id = ?`
        )
        .bind(notification_id, user_id)
        .run();

      return true;
    } catch (error: any) {
      console.error("[NOTIFICATION] Mark as read error:", error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(user_id: string): Promise<boolean> {
    try {
      await this.db
        .prepare(
          `UPDATE notifications
          SET is_read = 1, read_at = datetime('now')
          WHERE user_id = ? AND is_read = 0`
        )
        .bind(user_id)
        .run();

      return true;
    } catch (error: any) {
      console.error("[NOTIFICATION] Mark all as read error:", error);
      return false;
    }
  }

  // ===========================================================================
  // DELETE NOTIFICATIONS
  // ===========================================================================

  /**
   * Delete a notification
   */
  async deleteNotification(notification_id: string, user_id: string): Promise<boolean> {
    try {
      await this.db
        .prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?")
        .bind(notification_id, user_id)
        .run();

      return true;
    } catch (error: any) {
      console.error("[NOTIFICATION] Delete notification error:", error);
      return false;
    }
  }

  /**
   * Delete all read notifications for a user
   */
  async deleteReadNotifications(user_id: string): Promise<boolean> {
    try {
      await this.db
        .prepare("DELETE FROM notifications WHERE user_id = ? AND is_read = 1")
        .bind(user_id)
        .run();

      return true;
    } catch (error: any) {
      console.error("[NOTIFICATION] Delete read notifications error:", error);
      return false;
    }
  }

  // ===========================================================================
  // SPECIALIZED NOTIFICATION CREATORS
  // ===========================================================================

  /**
   * Notify followers when a new article is published by an author they follow
   */
  async notifyNewArticleFromAuthor(
    author_id: string,
    author_name: string,
    article_id: string,
    article_title: string,
    article_slug: string
  ): Promise<number> {
    try {
      // Get all users following this author
      const followers = await this.db
        .prepare(
          `SELECT user_id FROM user_follows
          WHERE entity_type = 'author' AND entity_id = ?`
        )
        .bind(author_id)
        .all();

      if (!followers.results || followers.results.length === 0) {
        return 0;
      }

      const user_ids = followers.results.map((f: any) => f.user_id);

      return await this.createBulkNotifications(user_ids, {
        type: "article_published",
        title: `New article by ${author_name}`,
        message: article_title,
        link_url: `/article/${article_slug}`,
        link_text: "Read article",
        metadata: {
          author_id,
          author_name,
          article_id,
          article_slug,
        },
      });
    } catch (error: any) {
      console.error("[NOTIFICATION] Notify new article error:", error);
      return 0;
    }
  }

  /**
   * Notify user when someone replies to their comment
   */
  async notifyCommentReply(
    user_id: string,
    commenter_name: string,
    article_title: string,
    article_slug: string,
    comment_id: string
  ): Promise<boolean> {
    try {
      const notification_id = await this.createNotification({
        user_id,
        type: "comment_reply",
        title: `${commenter_name} replied to your comment`,
        message: `On: ${article_title}`,
        link_url: `/article/${article_slug}#comment-${comment_id}`,
        link_text: "View reply",
        metadata: {
          commenter_name,
          article_slug,
          comment_id,
        },
      });

      return notification_id !== null;
    } catch (error: any) {
      console.error("[NOTIFICATION] Notify comment reply error:", error);
      return false;
    }
  }

  /**
   * Notify user when someone likes their comment
   */
  async notifyCommentLike(
    user_id: string,
    liker_name: string,
    article_title: string,
    article_slug: string,
    comment_id: string
  ): Promise<boolean> {
    try {
      const notification_id = await this.createNotification({
        user_id,
        type: "comment_like",
        title: `${liker_name} liked your comment`,
        message: `On: ${article_title}`,
        link_url: `/article/${article_slug}#comment-${comment_id}`,
        link_text: "View comment",
        metadata: {
          liker_name,
          article_slug,
          comment_id,
        },
      });

      return notification_id !== null;
    } catch (error: any) {
      console.error("[NOTIFICATION] Notify comment like error:", error);
      return false;
    }
  }

  /**
   * Notify followers when an author reaches a milestone
   */
  async notifyAuthorMilestone(
    author_id: string,
    author_name: string,
    milestone: string,
    description: string
  ): Promise<number> {
    try {
      // Get all users following this author
      const followers = await this.db
        .prepare(
          `SELECT user_id FROM user_follows
          WHERE entity_type = 'author' AND entity_id = ?`
        )
        .bind(author_id)
        .all();

      if (!followers.results || followers.results.length === 0) {
        return 0;
      }

      const user_ids = followers.results.map((f: any) => f.user_id);

      return await this.createBulkNotifications(user_ids, {
        type: "author_milestone",
        title: `${author_name} ${milestone}`,
        message: description,
        link_url: `/author/${author_id}`,
        link_text: "View profile",
        metadata: {
          author_id,
          author_name,
          milestone,
        },
      });
    } catch (error: any) {
      console.error("[NOTIFICATION] Notify author milestone error:", error);
      return 0;
    }
  }

  /**
   * Send system notification to all users
   */
  async sendSystemNotification(
    title: string,
    message: string,
    link_url?: string,
    link_text?: string
  ): Promise<number> {
    try {
      // Get all user IDs
      const users = await this.db.prepare("SELECT id FROM users").all();

      if (!users.results || users.results.length === 0) {
        return 0;
      }

      const user_ids = users.results.map((u: any) => u.id);

      return await this.createBulkNotifications(user_ids, {
        type: "system",
        title,
        message,
        link_url,
        link_text,
      });
    } catch (error: any) {
      console.error("[NOTIFICATION] Send system notification error:", error);
      return 0;
    }
  }
}
