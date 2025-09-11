import { XMLParser } from 'fast-xml-parser'

export class RSSFeedService {
  constructor(configService) {
    this.configService = configService
    this.trustedDomainsCache = null
    this.trustedDomainsCacheTime = 0
    this.TRUSTED_DOMAINS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
    
    // Initialize XML parser
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      ignoreNameSpace: false,
      removeNSPrefix: false,
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
      processEntities: true,
      htmlEntities: true
    })
  }

  // Cache trusted domains to avoid repeated KV calls
  async getTrustedDomains() {
    const now = Date.now()
    if (this.trustedDomainsCache && now < this.cacheExpiry) {
      return this.trustedDomainsCache
    }

    try {
      this.trustedDomainsCache = await this.configService.getTrustedImageDomains()
      this.cacheExpiry = now + (5 * 60 * 1000) // Cache for 5 minutes
      return this.trustedDomainsCache
    } catch (error) {
      console.log('Error getting trusted domains:', error)
      // Return a basic fallback list
      return [
        'herald.co.zw', 'heraldonline.co.zw', 'newsday.co.zw', 'techzim.co.zw',
        't3n9sm.c2.acecdn.net', 'chronicle.co.zw', 'wp.com', 'wordpress.com'
      ]
    }
  }

  // Enhanced HTML entity decoder
  decodeHtmlEntities(text) {
    if (!text || typeof text !== 'string') return text

    const entityMap = {
      // Quotes
      '&#8217;': "'",  '&#8216;': "'",  '&#8220;': '"',  '&#8221;': '"',
      '&#39;': "'",    '&quot;': '"',   '&apos;': "'",
      
      // Dashes
      '&#8211;': '–',  '&#8212;': '—',  '&#8213;': '―',
      
      // Spaces and special characters
      '&#160;': ' ',   '&nbsp;': ' ',   '&#8230;': '…',
      
      // Ampersands and basic entities
      '&amp;': '&',    '&lt;': '<',     '&gt;': '>',
      
      // Accented characters
      '&#224;': 'à',   '&#225;': 'á',   '&#226;': 'â',   '&#227;': 'ã',
      '&#228;': 'ä',   '&#233;': 'é',   '&#234;': 'ê',   '&#235;': 'ë',
      '&#237;': 'í',   '&#238;': 'î',   '&#243;': 'ó',   '&#244;': 'ô',
      '&#245;': 'õ',   '&#250;': 'ú',   '&#251;': 'û',
      
      // Currency and symbols
      '&#163;': '£',   '&#164;': '¤',   '&#165;': '¥',   '&#8364;': '€',
      '&#36;': '$',    '&#162;': '¢',   '&#215;': '×',   '&#247;': '÷',
      '&#177;': '±',   '&#8730;': '√',  '&#169;': '©',   '&#174;': '®',
      '&#8482;': '™',  '&#167;': '§',   '&#182;': '¶'
    }
    
    let decoded = text
    
    // Replace known entities first
    Object.entries(entityMap).forEach(([entity, replacement]) => {
      decoded = decoded.replace(new RegExp(entity, 'g'), replacement)
    })
    
    // Handle numeric entities (decimal)
    decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
      try {
        return String.fromCharCode(parseInt(num, 10))
      } catch (e) {
        return match
      }
    })
    
    // Handle hex entities
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16))
      } catch (e) {
        return match
      }
    })
    
    // Handle named entities
    const namedEntities = {
      'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'",
      'nbsp': ' ', 'copy': '©', 'reg': '®', 'trade': '™',
      'ldquo': '"', 'rdquo': '"', 'lsquo': "'", 'rsquo': "'",
      'ndash': '–', 'mdash': '—', 'hellip': '…', 'euro': '€'
    }
    
    Object.entries(namedEntities).forEach(([name, char]) => {
      decoded = decoded.replace(new RegExp(`&${name};`, 'g'), char)
    })
    
    return decoded
  }

  // Enhanced text cleaning function
  cleanText(text) {
    if (!text || typeof text !== 'string') return text
    
    let cleaned = this.decodeHtmlEntities(text)
    cleaned = cleaned.replace(/<[^>]*>/g, '')
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    cleaned = cleaned.replace(/\[…\]/g, '…')
    cleaned = cleaned.replace(/\[&hellip;\]/g, '…')
    cleaned = cleaned.replace(/\s{2,}/g, ' ')
    
    return cleaned
  }

  // Function to clean HTML content (UNLIMITED for full content)
  async cleanHtml(html, unlimited = false) {
    if (!html) return ''
    
    let cleaned = this.decodeHtmlEntities(html)
    cleaned = cleaned.replace(/<[^>]*>/g, '')
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // Only limit if not unlimited - get limit from config
    if (!unlimited) {
      // Use configurable limit or fallback to 3000
      const limit = this.configService ? await this.configService.getArticleContentLimit() : 3000
      cleaned = cleaned.substring(0, limit)
    }
      
    return cleaned
  }

  // Helper function to check if URL is an image
  isImageUrl(url) {
    if (!url || typeof url !== 'string') return false
    
    const imageExtensions = /\.(jpe?g|png|gif|webp|svg|bmp|avif|ico|tiff?)(\?.*)?$/i
    const imageParams = /[?&](format|f)=(jpe?g|png|gif|webp|svg|bmp|avif)/i
    
    return imageExtensions.test(url) || imageParams.test(url)
  }

  // Enhanced image extraction function
  async extractImageFromContent(item, link) {
    console.log(`[IMAGE] Extracting image for: ${item.title || 'Unknown title'}`)

    const imageMatches = []
    const trustedDomains = await this.getTrustedDomains()
    
    // 1. RSS Media tags (highest priority)
    try {
      if (item['media:content']) {
        const mediaContent = Array.isArray(item['media:content']) ? item['media:content'] : [item['media:content']]
        mediaContent.forEach(media => {
          if (media['@_url'] && media['@_medium'] === 'image') {
            console.log(`[IMAGE] Found media:content: ${media['@_url']}`)
            imageMatches.push(media['@_url'])
          }
        })
      }
    } catch (e) {
      console.log('[IMAGE] Error extracting media:content:', e.message)
    }
    
    // 2. RSS Enclosure tags
    try {
      if (item.enclosure) {
        const enclosures = Array.isArray(item.enclosure) ? item.enclosure : [item.enclosure]
        enclosures.forEach(enc => {
          if (enc['@_type']?.startsWith('image/') && enc['@_url']) {
            console.log(`[IMAGE] Found enclosure: ${enc['@_url']}`)
            imageMatches.push(enc['@_url'])
          }
        })
      }
    } catch (e) {
      console.log('[IMAGE] Error extracting enclosure:', e.message)
    }
    
    // 3. RSS Image tag
    try {
      if (item.image) {
        const imgUrl = typeof item.image === 'string' ? item.image : item.image.url || item.image['@_url']
        if (imgUrl && this.isImageUrl(imgUrl)) {
          console.log(`[IMAGE] Found RSS image: ${imgUrl}`)
          imageMatches.push(imgUrl)
        }
      }
    } catch (e) {
      console.log('[IMAGE] Error extracting RSS image:', e.message)
    }
    
    // 4. WordPress specific fields
    try {
      if (item['wp:featured_image']) {
        console.log(`[IMAGE] Found wp:featured_image: ${item['wp:featured_image']}`)
        imageMatches.push(item['wp:featured_image'])
      }
      
      if (item['wp:attachment_url'] && this.isImageUrl(item['wp:attachment_url'])) {
        console.log(`[IMAGE] Found wp:attachment_url: ${item['wp:attachment_url']}`)
        imageMatches.push(item['wp:attachment_url'])
      }
    } catch (e) {
      console.log('[IMAGE] Error extracting WordPress fields:', e.message)
    }
    
    // 5. Content fields to search
    const contentFields = [
      item.description,
      item['content:encoded'],
      item.content,
      item.summary
    ].filter(Boolean)
    
    // 6. Extract from content fields
    contentFields.forEach((content) => {
      try {
        if (typeof content === 'object') {
          content = content.text || content['#text'] || content._ || ''
        }
        
        if (typeof content === 'string' && content.length > 0) {
          // Extract img src attributes with better regex
          const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
          let match
          while ((match = imgRegex.exec(content)) !== null) {
            console.log(`[IMAGE] Found img tag: ${match[1]}`)
            imageMatches.push(match[1])
          }
          
          // Extract og:image meta tags
          const ogRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi
          let ogMatch
          while ((ogMatch = ogRegex.exec(content)) !== null) {
            console.log(`[IMAGE] Found og:image: ${ogMatch[1]}`)
            imageMatches.push(ogMatch[1])
          }
          
          // Extract direct image URLs
          const imageUrlRegex = /https?:\/\/[^\s<>"']+\.(?:jpe?g|png|gif|webp|svg|bmp|avif)(?:\?[^\s<>"']*)?/gi
          let urlMatch
          while ((urlMatch = imageUrlRegex.exec(content)) !== null) {
            console.log(`[IMAGE] Found direct URL: ${urlMatch[0]}`)
            imageMatches.push(urlMatch[0])
          }
        }
      } catch (e) {
        console.log('[IMAGE] Error processing content field:', e.message)
      }
    })
    
    // 7. Process and validate all found images
    const validImages = imageMatches
      .map(img => {
        try {
          if (!img || typeof img !== 'string') return null
          
          img = img.trim()
          
          // Remove HTML entities
          img = img.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
          
          // Handle relative URLs
          if (img.startsWith('//')) {
            return `https:${img}`
          } else if (img.startsWith('/')) {
            const baseUrl = new URL(link)
            return `${baseUrl.protocol}//${baseUrl.hostname}${img}`
          } else if (!img.startsWith('http')) {
            const baseUrl = new URL(link)
            return `${baseUrl.protocol}//${baseUrl.hostname}/${img.replace(/^\.\//, '')}`
          }
          return img
        } catch (e) {
          return null
        }
      })
      .filter(Boolean)
      .filter(img => {
        try {
          if (!this.isImageUrl(img)) return false
          
          const imgUrl = new URL(img)
          const hostname = imgUrl.hostname.toLowerCase()
          
          // Check if hostname matches any trusted domain
          const isTrusted = trustedDomains.some(domain => {
            const domainLower = domain.toLowerCase()
            return hostname === domainLower || 
                   hostname.endsWith('.' + domainLower) ||
                   hostname.includes(domainLower)
          })
          
          if (!isTrusted) {
            console.log(`[IMAGE] Rejected untrusted domain: ${hostname}`)
          }
          
          return isTrusted
        } catch (e) {
          console.log(`[IMAGE] Error validating URL: ${img}`, e.message)
          return false
        }
      })
      .filter((img, index, arr) => arr.indexOf(img) === index) // Remove duplicates
    
    const result = validImages.length > 0 ? validImages[0] : null
    
    if (result) {
      console.log(`[IMAGE] Successfully extracted: ${result}`)
    } else {
      console.log(`[IMAGE] No valid images found for: ${item.title || 'Unknown title'}`)
      if (imageMatches.length > 0) {
        console.log(`[IMAGE] Found ${imageMatches.length} images but none from trusted domains`)
        console.log(`[IMAGE] Sample URLs:`, imageMatches.slice(0, 3))
      }
    }
    
    return result
  }

  // Function to detect category based on content
  async detectCategory(content) {
    const categoryKeywords = await this.configService.getCategoryKeywords()
    let maxMatches = 0
    let detectedCategory = 'all' // Default to "all" instead of null

    // Skip "all" category during detection since it's the fallback
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (category === 'all') continue // Skip the catch-all category
      
      const matches = keywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      ).length

      if (matches > maxMatches) {
        maxMatches = matches
        detectedCategory = category
      }
    }

    return detectedCategory
  }

  // Function to calculate relevance score for sorting
  async calculateRelevanceScore(content, title) {
    const priorityKeywords = await this.configService.getPriorityKeywords()
    let score = 0
    
    priorityKeywords.forEach(keyword => {
      if (content.includes(keyword.toLowerCase())) {
        score += title.toLowerCase().includes(keyword.toLowerCase()) ? 3 : 1
      }
    })

    return Math.min(score, 10)
  }

  // Function to extract relevant keywords from article content
  async extractRelevantKeywords(item, category, source) {
    const categoryKeywords = await this.configService.getCategoryKeywords()
    const priorityKeywords = await this.configService.getPriorityKeywords()
    
    const title = this.cleanText(item.title?.text || item.title || '')
    const description = await this.cleanHtml(
      item.description?.text || 
      item.description || 
      item.summary?.text || 
      item.summary || 
      item['content:encoded'] ||
      ''
    )
    
    const fullText = `${title} ${description}`.toLowerCase()
    const keywords = new Set()
    
    // Get category-specific keywords
    const catKeywords = categoryKeywords[category] || []
    
    // Find matching keywords in the text
    catKeywords.forEach(keyword => {
      if (fullText.includes(keyword.toLowerCase())) {
        keywords.add(keyword)
      }
    })
    
    // Add priority keywords if found
    priorityKeywords.forEach(keyword => {
      if (fullText.includes(keyword.toLowerCase())) {
        keywords.add(keyword)
      }
    })
    
    // Convert to array and limit to top 5 most relevant
    const keywordArray = Array.from(keywords)
    
    // Sort by relevance (longer keywords first, then priority keywords)
    return keywordArray
      .sort((a, b) => {
        const aPriority = priorityKeywords.includes(a.toLowerCase())
        const bPriority = priorityKeywords.includes(b.toLowerCase())
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority // Priority keywords first
        }
        
        return b.length - a.length // Longer keywords first
      })
      .slice(0, 5) // Limit to 5 keywords
  }

  // Enhanced content extraction with UNLIMITED length
  async extractFullContent(item) {
    try {
      const contentFields = [
        item['content:encoded'],
        item.content,
        item.description,
        item.summary
      ].filter(Boolean)

      let fullContent = ''
      
      for (const content of contentFields) {
        let contentText = ''
        
        if (typeof content === 'object') {
          contentText = content.text || content['#text'] || content._ || ''
        } else if (typeof content === 'string') {
          contentText = content
        }
        
        if (contentText && contentText.length > fullContent.length) {
          fullContent = contentText
        }
      }

      // Clean the content - UNLIMITED for full content
      const cleanedFull = await this.cleanHtml(fullContent, true) // unlimited = true
      const cleanedExcerpt = cleanedFull.substring(0, 300)
      
      return {
        excerpt: cleanedExcerpt,                    // Still provide excerpt for previews
        fullContent: cleanedFull,                   // UNLIMITED full content
        wordCount: cleanedFull.split(' ').filter(word => word.length > 0).length,
        hasFullContent: cleanedFull.length > 300
      }
    } catch (error) {
      console.log('Error extracting full content:', error)
      return {
        excerpt: '',
        fullContent: '',
        wordCount: 0,
        hasFullContent: false
      }
    }
  }

  // Enhanced article processing with unlimited content
  async processArticleItem(item, source) {
    try {
      // Extract and clean title
      const rawTitle = item.title?.text || item.title || ''
      const title = this.cleanText(rawTitle)
      if (!title || title.length < 10) return null

      const link = item.link?.text || item.link || item.id || item.guid?.text || item.guid || '#'
      if (link === '#') return null

      // Extract UNLIMITED content
      const contentData = await this.extractFullContent(item)
      
      // Use excerpt for categorization and relevance scoring
      const content = `${title} ${contentData.excerpt}`.toLowerCase()
      const extractedImage = await this.extractImageFromContent(item, link)
      const detectedCategory = await this.detectCategory(content) || source.category
      const isPriority = await this.checkPriorityContent(content)
      const relevanceScore = await this.calculateRelevanceScore(content, title)
      
      // Extract keywords for this article
      const keywords = await this.extractRelevantKeywords(item, detectedCategory, source)

      // Parse date with fallback
      let pubDate
      try {
        const dateStr = item.pubDate || item.published || item.updated || item.date
        pubDate = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString()
      } catch {
        pubDate = new Date().toISOString()
      }

      return {
        title,
        description: contentData.excerpt,        // Short description for lists
        fullContent: contentData.fullContent,    // UNLIMITED full content
        link,
        pubDate,
        source: source.name,
        category: detectedCategory,
        priority: isPriority,
        relevanceScore,
        keywords,
        guid: item.guid?.text || item.guid || item.id || `${source.name}-${Date.now()}-${Math.random()}`,
        imageUrl: extractedImage,
        optimizedImageUrl: extractedImage ? `/api/image-proxy?url=${encodeURIComponent(extractedImage)}` : null,
        wordCount: contentData.wordCount,
        hasFullContent: contentData.hasFullContent,
        processed: new Date().toISOString()
      }
    } catch (error) {
      console.log('Error processing article item:', error)
      return null
    }
  }

  // Helper method to check priority content
  async checkPriorityContent(content) {
    const priorityKeywords = await this.configService.getPriorityKeywords()
    return priorityKeywords.some(keyword => 
      content.includes(keyword.toLowerCase())
    )
  }

  // Function to remove duplicate articles
  removeDuplicateArticles(articles) {
    const seen = new Set()
    const unique = []

    for (const article of articles) {
      // Create a normalized title for comparison
      const normalizedTitle = article.title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (!seen.has(normalizedTitle)) {
        seen.add(normalizedTitle)
        unique.push(article)
      }
    }

    return unique
  }

  // SINGLE main method to fetch and process RSS feeds with ENHANCED LIMITS
  async fetchAllFeeds(itemsPerSource = 100, maxArticles = 20000) {
    console.log(`RSS Feed fetching started with enhanced limits: ${itemsPerSource} per source, ${maxArticles} total`)
    
    const allFeeds = []
    const sources = await this.configService.getRSSources()
    const enabledSources = sources.filter(source => source.enabled)
    
    console.log(`Processing ${enabledSources.length} RSS sources`)

    // Process feeds in parallel with timeouts
    const feedPromises = enabledSources.map(async (source) => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout

        console.log(`[RSS] Fetching ${source.name}: ${source.url}`)

        const response = await fetch(source.url, {
          headers: {
            'User-Agent': 'Harare Metro News Aggregator/2.0 (Zimbabwe; +https://harare-metro.nyuchi.dev)',
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            'Cache-Control': 'no-cache'
          },
          signal: controller.signal,
          cf: {
            cacheTtl: 60,
            cacheEverything: false
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const xmlText = await response.text()
        if (!xmlText || xmlText.length < 100) {
          throw new Error('Empty or invalid RSS response')
        }

        console.log(`[RSS] Successfully fetched ${source.name}, parsing XML...`)

        const feedData = this.parser.parse(xmlText)
        
        let items = feedData?.rss?.channel?.item || 
                    feedData?.feed?.entry || 
                    feedData?.channel?.item || 
                    feedData?.rss?.item ||
                    []

        if (!Array.isArray(items)) {
          items = items ? [items] : []
        }

        if (items.length === 0) {
          console.log(`[RSS] No items found in ${source.name}`)
          return []
        }

        console.log(`[RSS] Processing ${Math.min(items.length, itemsPerSource)} items from ${source.name}`)

        const processedItems = []
        for (const item of items.slice(0, itemsPerSource)) {
          const processed = await this.processArticleItem(item, source)
          if (processed) {
            processedItems.push(processed)
          }
        }

        console.log(`[RSS] Successfully processed ${processedItems.length} articles from ${source.name}`)
        return processedItems

      } catch (error) {
        console.log(`[RSS] Error fetching ${source.name}:`, error.message)
        return []
      }
    })

    // Wait for all feeds with timeout
    const feedResults = await Promise.allSettled(feedPromises)
    
    // Collect successful results
    feedResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allFeeds.push(...result.value)
      } else if (result.status === 'rejected') {
        console.log(`RSS feed ${enabledSources[index].name} failed:`, result.reason)
      }
    })

    console.log(`RSS fetch collected: ${allFeeds.length} articles`)

    // Remove duplicates and sort
    const uniqueFeeds = this.removeDuplicateArticles(allFeeds)
    const sortedFeeds = uniqueFeeds
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority
        if (a.relevanceScore !== b.relevanceScore) return b.relevanceScore - a.relevanceScore
        return new Date(b.pubDate) - new Date(a.pubDate)
      })
      .slice(0, maxArticles)
    
    console.log(`RSS processing complete: ${sortedFeeds.length} final articles`)
    return sortedFeeds
  }

  // SINGLE background fetch method (optimized for scheduled runs)
  async fetchAllFeedsBackground(itemsPerSource = 100, maxArticles = 20000) {
    console.log('Background RSS feed fetching started with enhanced limits')
    
    try {
      const articles = await this.fetchAllFeeds(itemsPerSource, maxArticles)
      console.log(`Background RSS fetch completed: ${articles.length} articles`)
      return articles
    } catch (error) {
      console.log('Background RSS fetch error:', error)
      throw error
    }
  }

  // Get feed metadata
  async getFeedMetadata() {
    const sources = await this.configService.getRSSources()
    const categories = await this.configService.getCategories()
    
    return {
      sources: sources.filter(s => s.enabled).map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        enabled: s.enabled
      })),
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        emoji: c.emoji
      })),
      totalEnabledSources: sources.filter(s => s.enabled).length,
      totalCategories: categories.length
    }
  }
}

// Add default export at the end
export default RSSFeedService