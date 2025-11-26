/**
 * Deepseek AI Service via Cloudflare AI Gateway
 * Uses Deepseek V3 for high-quality, cost-effective AI
 *
 * Cloudflare AI Gateway provides:
 * - Caching (reduce costs)
 * - Analytics (monitor usage)
 * - Rate limiting
 * - Logging
 */

export class DeepseekAIService {
  constructor(env) {
    this.env = env;
    // Cloudflare AI Gateway endpoint
    this.gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/harare-metro/openai`;
    this.apiKey = env.DEEPSEEK_API_KEY;
  }

  /**
   * Generate Pulse summary (150 chars)
   * Fast, concise summary for article previews
   */
  async generatePulseSummary(article) {
    try {
      const prompt = `Summarize this Zimbabwe news article in exactly 150 characters or less. Be direct and informative.

Title: ${article.title}
Content: ${article.content?.substring(0, 500) || article.description || ''}

Summary (max 150 chars):`;

      const response = await fetch(this.gatewayUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a news summarization assistant. Create concise, informative summaries in 150 characters or less.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 50,
          temperature: 0.3, // Low temperature for consistent summaries
          top_p: 0.9
        })
      });

      if (!response.ok) {
        console.error('[DEEPSEEK] API error:', await response.text());
        return null;
      }

      const data = await response.json();
      const summary = data.choices[0].message.content.trim();

      // Ensure it's under 150 chars
      return summary.substring(0, 150);

    } catch (error) {
      console.error('[DEEPSEEK] Failed to generate pulse:', error);
      return null;
    }
  }

  /**
   * Answer user query for Insights chat
   * Context-aware responses about news and trends
   */
  async answerInsightsQuery(query, recentArticles) {
    try {
      // Build context from recent articles
      const context = recentArticles.map(a =>
        `- ${a.title} (${a.category_name || 'General'}, ${this.formatDate(a.published_at)})`
      ).join('\n');

      const systemPrompt = `You are a helpful news assistant for Harare Metro, Zimbabwe's premier news platform. Answer questions about current news, trends, and topics based on recent articles.

Recent Zimbabwe news articles:
${context}

Guidelines:
- Be concise (max 200 words)
- Reference specific articles when relevant
- Provide insights, not just summaries
- Be conversational and helpful
- Focus on Zimbabwe and regional news`;

      const response = await fetch(this.gatewayUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        console.error('[DEEPSEEK] API error:', await response.text());
        return {
          response: "I'm having trouble connecting right now. Please try again in a moment.",
          error: true
        };
      }

      const data = await response.json();
      return {
        response: data.choices[0].message.content.trim(),
        error: false
      };

    } catch (error) {
      console.error('[DEEPSEEK] Failed to answer query:', error);
      return {
        response: "I encountered an error processing your question. Please try again.",
        error: true
      };
    }
  }

  /**
   * Generate trending topics summary
   * For Analytics dashboard
   */
  async generateTrendingSummary(trendingData) {
    try {
      const topicsText = trendingData.map((topic, i) =>
        `${i + 1}. ${topic.name}: ${topic.view_count} views, ${topic.engagement_score} engagement`
      ).join('\n');

      const prompt = `Analyze these trending news topics from Zimbabwe and provide a 2-3 sentence insight about what people are most interested in today:

${topicsText}

Insight:`;

      const response = await fetch(this.gatewayUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a data analyst providing insights on news consumption trends.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.5
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('[DEEPSEEK] Failed to generate trending summary:', error);
      return null;
    }
  }

  /**
   * Helper: Format date for context
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
