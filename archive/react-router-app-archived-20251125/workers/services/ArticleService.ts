// worker/services/ArticleService.js
// Service for managing articles in D1 database with slugs and content scraping

export class ArticleService {
  constructor(articlesDb) {
    this.db = articlesDb
    
    // Web scraping configuration
    this.scraperConfig = {
      // Common content selectors for news websites
      contentSelectors: [
        '.entry-content',
        '.post-content', 
        '.article-content',
        '.story-body',
        '.content',
        '.post-body',
        '.article-body',
        'article p',
        '.single-post-content',
        '.td-post-content',
        '[data-testid="article-content"]'
      ],
      // Selectors to remove from content (ads, navigation, etc.)
      excludeSelectors: [
        '.advertisement',
        '.ad-container',
        '.social-share',
        '.related-posts',
        '.comments',
        '.newsletter-signup',
        '.author-bio',
        '.tags',
        '.breadcrumbs',
        'nav',
        'footer',
        '.sidebar'
      ],
      // Maximum content length (characters)
      maxContentLength: 50000,
      // Request timeout in milliseconds
      timeout: 10000
    }
  }

  // Generate URL-friendly slug from title
  generateSlug(title) {
    if (!title) return null
    
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single
      .trim()                   // Remove leading/trailing spaces
      .substring(0, 80)         // Limit length
      .replace(/-$/, '')        // Remove trailing hyphen
  }

  // Ensure slug is unique by appending number if needed
  async ensureUniqueSlug(baseSlug, excludeId = null) {
    if (!baseSlug) return null

    let slug = baseSlug
    let counter = 1

    while (true) {
      // Check if slug exists
      const query = excludeId 
        ? 'SELECT id FROM articles WHERE slug = ? AND id != ?'
        : 'SELECT id FROM articles WHERE slug = ?'
      
      const params = excludeId ? [slug, excludeId] : [slug]
      const existing = await this.db.prepare(query).bind(...params).first()

      if (!existing) {
        return slug // Slug is unique
      }

      // Try next variation
      slug = `${baseSlug}-${counter}`
      counter++

      // Prevent infinite loop
      if (counter > 100) {
        slug = `${baseSlug}-${Date.now()}`
        break
      }
    }

    return slug
  }

  // Calculate reading time (average 200 words per minute)
  calculateReadingTime(content) {
    if (!content) return 0
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / 200)
  }

  // Insert or update article with slug
  async upsertArticle(articleData) {
    try {
      if (!articleData || !articleData.title) {
        throw new Error('Article title is required')
      }

      // Generate slug from title
      const baseSlug = this.generateSlug(articleData.title)
      if (!baseSlug) {
        throw new Error('Unable to generate slug from title')
      }

      // Ensure slug is unique
      const slug = await this.ensureUniqueSlug(baseSlug)

      // Calculate word count and reading time
      const content = articleData.content || ''
      const wordCount = content ? content.split(/\s+/).filter(word => word.length > 0).length : 0
      const readingTime = this.calculateReadingTime(content)

      // Prepare search content for full-text search
      const searchContent = [
        articleData.title,
        articleData.description,
        content,
        articleData.tags
      ].filter(Boolean).join(' ')

      // Check if article exists by RSS GUID or URL
      let existingArticle = null
      if (articleData.rss_guid) {
        existingArticle = await this.db.prepare(
          'SELECT id, slug FROM articles WHERE rss_guid = ?'
        ).bind(articleData.rss_guid).first()
      }

      if (!existingArticle && articleData.original_url) {
        existingArticle = await this.db.prepare(
          'SELECT id, slug FROM articles WHERE original_url = ?'
        ).bind(articleData.original_url).first()
      }

      const now = new Date().toISOString()

      if (existingArticle) {
        // Update existing article
        const result = await this.db.prepare(`
          UPDATE articles SET 
            title = ?, description = ?, content = ?, author = ?,
            source = ?, source_url = ?, category = ?, tags = ?,
            published_at = ?, updated_at = ?, word_count = ?, reading_time = ?,
            image_url = ?, optimized_image_url = ?, status = ?, priority = ?,
            original_url = ?, content_search = ?
          WHERE id = ?
        `).bind(
          articleData.title,
          articleData.description || '',
          content,
          articleData.author || '',
          articleData.source || '',
          articleData.source_url || '',
          articleData.category || 'general',
          articleData.tags || '',
          articleData.published_at || now,
          now,
          wordCount,
          readingTime,
          articleData.image_url || '',
          articleData.optimized_image_url || '',
          articleData.status || 'published',
          articleData.priority || 0,
          articleData.original_url || '',
          searchContent,
          existingArticle.id
        ).run()

        return {
          id: existingArticle.id,
          slug: existingArticle.slug,
          updated: true,
          ...result
        }
      } else {
        // Insert new article
        const result = await this.db.prepare(`
          INSERT INTO articles (
            slug, title, description, content, author, source, source_url,
            category, tags, published_at, created_at, updated_at, word_count,
            reading_time, image_url, optimized_image_url, status, priority,
            original_url, rss_guid, content_search
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          slug,
          articleData.title,
          articleData.description || '',
          content,
          articleData.author || '',
          articleData.source || '',
          articleData.source_url || '',
          articleData.category || 'general',
          articleData.tags || '',
          articleData.published_at || now,
          now,
          now,
          wordCount,
          readingTime,
          articleData.image_url || '',
          articleData.optimized_image_url || '',
          articleData.status || 'published',
          articleData.priority || 0,
          articleData.original_url || '',
          articleData.rss_guid || '',
          searchContent
        ).run()

        return {
          id: result.meta.last_row_id,
          slug,
          updated: false,
          ...result
        }
      }
    } catch (error) {
      console.error('[ARTICLES] Error upserting article:', error)
      throw error
    }
  }

  // Get article by slug
  async getArticleBySlug(slug) {
    try {
      if (!slug) return null

      const article = await this.db.prepare(`
        SELECT * FROM articles WHERE slug = ? AND status = 'published'
      `).bind(slug).first()

      if (article) {
        // Update view count
        await this.db.prepare(`
          UPDATE articles SET 
            view_count = view_count + 1,
            last_viewed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(article.id).run()
      }

      return article
    } catch (error) {
      console.error('[ARTICLES] Error getting article by slug:', error)
      throw error
    }
  }

  // Get articles with pagination
  async getArticles(options = {}) {
    try {
      const {
        category = null,
        source = null,
        limit = 25,
        offset = 0,
        orderBy = 'published_at',
        orderDirection = 'DESC',
        status = 'published',
        search = null
      } = options

      let query = 'SELECT * FROM articles WHERE status = ?'
      const params = [status]

      if (category) {
        query += ' AND category = ?'
        params.push(category)
      }

      if (source) {
        query += ' AND source = ?'
        params.push(source)
      }

      if (search) {
        query += ' AND content_search LIKE ?'
        params.push(`%${search}%`)
      }

      query += ` ORDER BY ${orderBy} ${orderDirection} LIMIT ? OFFSET ?`
      params.push(limit, offset)

      const articles = await this.db.prepare(query).bind(...params).all()

      return {
        articles: articles.results || [],
        count: articles.results?.length || 0,
        hasMore: (articles.results?.length || 0) === limit
      }
    } catch (error) {
      console.error('[ARTICLES] Error getting articles:', error)
      throw error
    }
  }

  // Bulk insert articles (for RSS import)
  async bulkInsertArticles(articlesData) {
    try {
      if (!articlesData || !Array.isArray(articlesData)) {
        return { success: false, message: 'Invalid articles data' }
      }

      const results = []
      const errors = []

      // Process in batches to avoid overwhelming D1
      const batchSize = 25
      for (let i = 0; i < articlesData.length; i += batchSize) {
        const batch = articlesData.slice(i, i + batchSize)
        
        for (const articleData of batch) {
          try {
            const result = await this.upsertArticle(articleData)
            results.push(result)
          } catch (error) {
            errors.push({
              article: articleData.title || 'Unknown',
              error: error.message
            })
            console.error('[ARTICLES] Error in bulk insert:', error)
          }
        }

        // Small delay between batches
        if (i + batchSize < articlesData.length) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      return {
        success: true,
        inserted: results.filter(r => !r.updated).length,
        updated: results.filter(r => r.updated).length,
        total: results.length,
        errors: errors.length,
        errorDetails: errors.slice(0, 5) // Limit error details
      }
    } catch (error) {
      console.error('[ARTICLES] Error in bulk insert:', error)
      return {
        success: false,
        message: error.message,
        errors: 1
      }
    }
  }

  // Track article analytics
  async trackArticleView(articleId, context = {}) {
    try {
      if (!articleId) return

      await this.db.prepare(`
        INSERT INTO article_analytics (
          article_id, event_type, user_id, session_id, ip_address,
          user_agent, referrer, reading_time, scroll_depth
        ) VALUES (?, 'view', ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        articleId,
        context.userId || null,
        context.sessionId || null,
        context.ipAddress || null,
        context.userAgent || null,
        context.referrer || null,
        context.readingTime || null,
        context.scrollDepth || null
      ).run()
    } catch (error) {
      console.error('[ARTICLES] Error tracking article view:', error)
      // Don't throw - analytics shouldn't break the main flow
    }
  }

  // Get article statistics
  async getArticleStats() {
    try {
      const stats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total_articles,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_articles,
          AVG(word_count) as avg_word_count,
          AVG(reading_time) as avg_reading_time,
          SUM(view_count) as total_views
        FROM articles
      `).first()

      return stats || {}
    } catch (error) {
      console.error('[ARTICLES] Error getting article stats:', error)
      return {}
    }
  }

  // Web Scraping Methods for Content Enhancement

  // Scrape full article content from URL
  async scrapeArticleContent(url) {
    if (!url) {
      throw new Error('Article URL is required')
    }

    try {
      console.log(`ArticleService: Scraping content from ${url}`)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Harare Metro Bot; +https://hararemetro.co.zw)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(this.scraperConfig.timeout)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      const extractedData = this.extractContentFromHTML(html, url)
      
      console.log(`ArticleService: Extracted ${extractedData.content.length} characters from ${url}`)
      if (extractedData.image) {
        console.log(`ArticleService: Found image ${extractedData.image} from ${url}`)
      }
      return extractedData
      
    } catch (error) {
      console.error(`ArticleService: Failed to scrape content from ${url}:`, error.message)
      throw new Error(`Failed to scrape article content: ${error.message}`)
    }
  }

  // Extract main content from HTML
  extractContentFromHTML(html, url) {
    try {
      let extractedContent = ''
      let title = ''
      let description = ''
      let extractedImage = null
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) {
        title = this.cleanText(titleMatch[1])
      }

      // Extract meta description
      const descriptionMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*/i)
      if (descriptionMatch) {
        description = this.cleanText(descriptionMatch[1])
      }

      // Extract images
      extractedImage = this.extractMainImage(html, url)

      // Try to extract content using various selectors
      for (const selector of this.scraperConfig.contentSelectors) {
        const content = this.extractContentBySelector(html, selector)
        if (content && content.length > extractedContent.length) {
          extractedContent = content
        }
      }

      // If no content found with selectors, try to extract paragraphs
      if (!extractedContent) {
        extractedContent = this.extractParagraphs(html)
      }

      // Clean and format content
      const cleanContent = this.cleanAndFormatContent(extractedContent)
      
      // Limit content length
      const finalContent = cleanContent.length > this.scraperConfig.maxContentLength
        ? cleanContent.substring(0, this.scraperConfig.maxContentLength) + '...'
        : cleanContent

      return {
        content: finalContent || description || 'Content could not be extracted from this article.',
        image: extractedImage,
        title: title,
        description: description
      }
      
    } catch (error) {
      console.error('ArticleService: HTML parsing error:', error.message)
      return {
        content: 'Error occurred while extracting article content.',
        image: null,
        title: null,
        description: null
      }
    }
  }

  // Extract content by CSS selector (basic implementation for Cloudflare Workers)
  extractContentBySelector(html, selector) {
    try {
      // Convert CSS selector to regex pattern (basic implementation)
      let pattern = ''
      
      if (selector.startsWith('.')) {
        // Class selector
        const className = selector.substring(1)
        pattern = `<[^>]*class=[^>]*\\b${className}\\b[^>]*>([\\s\\S]*?)<\/[^>]*>`
      } else if (selector.startsWith('#')) {
        // ID selector
        const id = selector.substring(1)
        pattern = `<[^>]*id=[^>]*\\b${id}\\b[^>]*>([\\s\\S]*?)<\/[^>]*>`
      } else if (selector === 'article p') {
        // Article paragraphs
        const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
        if (articleMatch) {
          return this.extractParagraphs(articleMatch[1])
        }
        return ''
      } else {
        // Element selector
        pattern = `<${selector}[^>]*>([\\s\\S]*?)<\/${selector}>`
      }

      if (pattern) {
        const regex = new RegExp(pattern, 'i')
        const match = html.match(regex)
        if (match && match[1]) {
          return this.stripHTML(match[1])
        }
      }
      
      return ''
    } catch (error) {
      return ''
    }
  }

  // Extract all paragraphs from HTML
  extractParagraphs(html) {
    const paragraphRegex = /<p[^>]*>([^<]+(?:<[^\/p][^>]*>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi
    const paragraphs = []
    let match

    while ((match = paragraphRegex.exec(html)) !== null) {
      const paragraphText = this.stripHTML(match[1])
      if (paragraphText.trim().length > 20) { // Only include substantial paragraphs
        paragraphs.push(paragraphText.trim())
      }
    }

    return paragraphs.join('\n\n')
  }

  // Strip HTML tags from text
  stripHTML(html) {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  // Extract main image from HTML
  extractMainImage(html, baseUrl) {
    try {
      const candidates = []
      
      // 1. Open Graph image
      const ogImageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"']+)["\'][^>]*/i)
      if (ogImageMatch) {
        candidates.push({ url: ogImageMatch[1], priority: 10, source: 'og:image' })
      }

      // 2. Twitter Card image
      const twitterImageMatch = html.match(/<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"']+)["\'][^>]*/i)
      if (twitterImageMatch) {
        candidates.push({ url: twitterImageMatch[1], priority: 9, source: 'twitter:image' })
      }

      // 3. Article featured image selectors
      const featuredImageSelectors = [
        '.featured-image img',
        '.post-thumbnail img',
        '.article-image img',
        '.hero-image img',
        '.entry-image img',
        'article img:first-of-type',
        '.content img:first-of-type'
      ]

      for (const selector of featuredImageSelectors) {
        const imgMatch = this.extractImageBySelector(html, selector)
        if (imgMatch) {
          candidates.push({ url: imgMatch, priority: 8, source: selector })
        }
      }

      // 4. Any large images in content
      const allImagesRegex = /<img[^>]*src=["\']([^"']+)["\'][^>]*>/gi
      let imgMatch
      while ((imgMatch = allImagesRegex.exec(html)) !== null) {
        const imgSrc = imgMatch[1]
        const imgTag = imgMatch[0]
        
        // Check for size indicators in width/height attributes
        const widthMatch = imgTag.match(/width=["\'](\d+)["\']/)
        const heightMatch = imgTag.match(/height=["\'](\d+)["\']/)
        
        let priority = 5
        if (widthMatch && heightMatch) {
          const width = parseInt(widthMatch[1])
          const height = parseInt(heightMatch[1])
          if (width >= 400 && height >= 200) {
            priority = 7 // Large image
          }
        }
        
        // Boost priority for images with article-related classes/alt text
        if (imgTag.match(/class=[^>]*(?:featured|hero|article|main|primary)/i) ||
            imgTag.match(/alt=[^>]*(?:article|story|news)/i)) {
          priority += 2
        }
        
        candidates.push({ url: imgSrc, priority, source: 'content' })
      }

      // Filter and normalize URLs
      const validCandidates = candidates
        .filter(candidate => candidate.url && !candidate.url.includes('data:'))
        .map(candidate => ({
          ...candidate,
          url: this.normalizeImageUrl(candidate.url, baseUrl)
        }))
        .filter(candidate => candidate.url)

      // Sort by priority and return the best match
      if (validCandidates.length > 0) {
        validCandidates.sort((a, b) => b.priority - a.priority)
        return validCandidates[0].url
      }

      return null
    } catch (error) {
      console.error('ArticleService: Image extraction error:', error.message)
      return null
    }
  }

  // Extract image URL from CSS selector
  extractImageBySelector(html, selector) {
    try {
      // Simple implementation for common selectors
      if (selector.includes('img')) {
        const className = selector.split(' ')[0].replace('.', '')
        const pattern = `<[^>]*class=[^>]*\\b${className}\\b[^>]*>[\\s\\S]*?<img[^>]*src=["\']([^"']+)["\']`
        const regex = new RegExp(pattern, 'i')
        const match = html.match(regex)
        if (match) return match[1]
      }
      return null
    } catch (error) {
      return null
    }
  }

  // Normalize image URL (resolve relative URLs)
  normalizeImageUrl(imgUrl, baseUrl) {
    try {
      // If already absolute URL, return as-is
      if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
        return imgUrl
      }
      
      // If protocol-relative URL
      if (imgUrl.startsWith('//')) {
        const protocol = baseUrl.startsWith('https://') ? 'https:' : 'http:'
        return protocol + imgUrl
      }
      
      // If relative URL, resolve against base URL
      if (imgUrl.startsWith('/')) {
        const urlObj = new URL(baseUrl)
        return `${urlObj.protocol}//${urlObj.hostname}${imgUrl}`
      }
      
      // If relative path without leading slash
      if (!imgUrl.startsWith('/')) {
        const urlObj = new URL(baseUrl)
        const basePath = urlObj.pathname.endsWith('/') 
          ? urlObj.pathname 
          : urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1)
        return `${urlObj.protocol}//${urlObj.hostname}${basePath}${imgUrl}`
      }
      
      return null
    } catch (error) {
      return null
    }
  }

  // Clean and format extracted content
  cleanAndFormatContent(content) {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .replace(/^\s+|\s+$/g, '') // Trim
      .replace(/([.!?])\s*([A-Z])/g, '$1\n\n$2') // Add paragraph breaks after sentences
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
  }

  // Clean text content
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim()
  }

  // Check if article content needs enhancement (is too short or generic)
  needsContentEnhancement(article) {
    if (!article.description && !article.content) {
      return true
    }

    const totalContent = (article.description || '') + (article.content || '')
    
    // Check if content is too short
    if (totalContent.length < 200) {
      return true
    }

    // Check for generic/placeholder content
    const genericPhrases = [
      'read more',
      'continue reading',
      'full article',
      'visit website',
      'more details',
      'click here',
      'loading...',
      'content not available'
    ]

    const lowerContent = totalContent.toLowerCase()
    if (genericPhrases.some(phrase => lowerContent.includes(phrase))) {
      return true
    }

    return false
  }

  // Enhance article with scraped content
  async enhanceArticle(article) {
    try {
      if (!this.needsContentEnhancement(article)) {
        console.log(`ArticleService: Article "${article.title}" has sufficient content, skipping enhancement`)
        return article
      }

      if (!article.link && !article.original_url) {
        console.log(`ArticleService: Article "${article.title}" has no link, cannot enhance`)
        return article
      }

      const url = article.link || article.original_url
      console.log(`ArticleService: Enhancing article "${article.title}" with scraped content`)
      
      const scrapedData = await this.scrapeArticleContent(url)
      
      // Merge content and image intelligently
      const enhancedArticle = {
        ...article,
        content: scrapedData.content,
        enhanced: true,
        enhancedAt: new Date().toISOString(),
        originalDescription: article.description
      }

      // Add scraped image if article doesn't have one
      if (scrapedData.image && !article.imageUrl && !article.image && !article.optimizedImageUrl) {
        enhancedArticle.imageUrl = scrapedData.image
        enhancedArticle.scrapedImage = true
        console.log(`ArticleService: Added scraped image to article "${article.title}": ${scrapedData.image}`)
      }

      // If original description was very short, replace it with an excerpt from scraped content
      if (!article.description || article.description.length < 100) {
        const excerpt = scrapedData.content.length > 300 
          ? scrapedData.content.substring(0, 300) + '...'
          : scrapedData.content
        enhancedArticle.description = excerpt
      }

      console.log(`ArticleService: Successfully enhanced article "${article.title}"`)
      return enhancedArticle
      
    } catch (error) {
      console.error(`ArticleService: Failed to enhance article "${article.title}":`, error.message)
      
      // Return original article with error flag
      return {
        ...article,
        enhancementError: error.message,
        enhancementAttempted: true,
        enhancementAttemptedAt: new Date().toISOString()
      }
    }
  }

  // Batch enhance multiple articles
  async enhanceArticles(articles, maxConcurrent = 3) {
    console.log(`ArticleService: Enhancing ${articles.length} articles with max ${maxConcurrent} concurrent requests`)
    
    const results = []
    
    // Process articles in batches to avoid overwhelming target servers
    for (let i = 0; i < articles.length; i += maxConcurrent) {
      const batch = articles.slice(i, i + maxConcurrent)
      
      const batchPromises = batch.map(article => 
        this.enhanceArticle(article).catch(error => {
          console.error(`ArticleService: Batch enhancement error for "${article.title}":`, error.message)
          return {
            ...article,
            enhancementError: error.message,
            enhancementAttempted: true
          }
        })
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Small delay between batches to be respectful to target servers
      if (i + maxConcurrent < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    const enhancedCount = results.filter(article => article.enhanced).length
    console.log(`ArticleService: Enhanced ${enhancedCount}/${articles.length} articles`)
    
    return results
  }
}

export default ArticleService