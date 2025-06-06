// Enhanced Worker with SSR support for SEO and Simple Image Extraction
import { getAssetFromKV } from '@cloudflare/kv-asset-handler'
import { XMLParser } from 'fast-xml-parser'

// Image URL patterns to match common formats
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?[^)]*)?/i,
  /\/[^\/]*\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)$/i
]

// Common image hosting domains for Zimbabwe news sites
const TRUSTED_IMAGE_DOMAINS = [
  'herald.co.zw',
  'newsday.co.zw', 
  'chronicle.co.zw',
  'zbc.co.zw',
  'businessweekly.co.zw',
  'techzim.co.zw',
  'thestandard.co.zw',
  'zimlive.com',
  'newzimbabwe.com',
  'theindependent.co.zw',
  'sundaymail.co.zw',
  '263chat.com',
  'iharare.com',
  'bulawayo24.com',
  'zimbabwesituation.com',
  'zwnews.com',
  'myzimbabwe.co.zw',
  'newsdzezimbabwe.co.uk',
  'dailynews.co.zw',
  'zimeye.net',
  'zimmorningpost.com',
  'mbaretimes.com',
  'nehandaradio.com',
  'pindula.co.zw',
  // Add CDN domains commonly used
  'wp.com',
  'wordpress.com',
  'cloudinary.com',
  'imgur.com',
  'gravatar.com',
  'amazonaws.com'
]

// Keywords to prioritize for Zimbabwe/Harare relevance
const PRIORITY_KEYWORDS = [
  'harare', 'zimbabwe', 'zim', 'bulawayo', 'mutare', 'gweru', 'kwekwe',
  'parliament', 'government', 'mnangagwa', 'zanu-pf', 'mdc', 'chamisa',
  'economy', 'inflation', 'currency', 'bond', 'rtgs', 'usd',
  'mining', 'tobacco', 'agriculture', 'maize', 'cotton',
  'warriors', 'dynamos', 'caps united', 'highlanders'
];

// Enhanced category mapping with global trending categories
const CATEGORY_KEYWORDS = {
  // Zimbabwe-specific categories (highest priority)
  politics: [
    'parliament', 'government', 'election', 'party', 'minister', 'president', 'policy', 
    'zanu', 'mdc', 'opposition', 'mnangagwa', 'chamisa', 'cabinet', 'senate', 'mp', 
    'constituency', 'voter', 'ballot', 'democracy', 'governance', 'corruption',
    'sanctions', 'diplomatic', 'ambassador'
  ],
  economy: [
    'economy', 'economic', 'inflation', 'currency', 'budget', 'finance', 'bank', 
    'investment', 'gdp', 'trade', 'bond', 'rtgs', 'usd', 'forex', 'revenue',
    'tax', 'fiscal', 'monetary', 'debt', 'loan', 'imf', 'world bank', 'stock exchange',
    'zse', 'commodity', 'export', 'import', 'manufacturing'
  ],
  business: [
    'business', 'company', 'entrepreneur', 'startup', 'market', 'industry', 
    'corporate', 'commerce', 'mining', 'tobacco', 'retail', 'wholesale',
    'sme', 'tender', 'procurement', 'partnership', 'merger', 'acquisition',
    'ceo', 'director', 'shareholder', 'profit', 'revenue', 'growth'
  ],
  
  // Sports (enhanced)
  sports: [
    'sport', 'football', 'soccer', 'cricket', 'rugby', 'warriors', 'dynamos', 
    'caps united', 'highlanders', 'afcon', 'fifa', 'world cup', 'olympics',
    'athletics', 'boxing', 'tennis', 'golf', 'swimming', 'basketball',
    'volleyball', 'netball', 'hockey', 'cycling', 'marathon'
  ],
  
  // Local/Regional
  harare: [
    'harare', 'capital', 'city council', 'mayor', 'cbd', 'avondale', 'borrowdale', 
    'chitungwiza', 'municipality', 'ward', 'councillor', 'rates', 'water',
    'sewer', 'roads', 'traffic', 'parking', 'housing', 'suburbs'
  ],
  agriculture: [
    'agriculture', 'farming', 'maize', 'cotton', 'tobacco', 'crop', 'harvest', 
    'farmer', 'irrigation', 'drought', 'rain', 'season', 'seed', 'fertilizer',
    'pesticide', 'livestock', 'cattle', 'poultry', 'dairy', 'horticulture',
    'land reform', 'a1', 'a2', 'commercial farming'
  ],

  // Global trending categories
  technology: [
    'technology', 'tech', 'digital', 'internet', 'mobile', 'smartphone', 'app',
    'software', 'ai', 'artificial intelligence', 'blockchain', 'crypto', 'bitcoin',
    'fintech', 'ecommerce', 'social media', 'facebook', 'twitter', 'whatsapp',
    'google', 'microsoft', 'apple', 'innovation', 'startup', 'coding', 'programming',
    'cybersecurity', 'data', 'cloud', 'iot', 'automation', '5g', 'broadband'
  ],
  
  health: [
    'health', 'medical', 'hospital', 'doctor', 'nurse', 'patient', 'treatment',
    'medicine', 'vaccine', 'covid', 'pandemic', 'virus', 'disease', 'illness',
    'mental health', 'wellness', 'fitness', 'nutrition', 'diet', 'exercise',
    'pharmacy', 'clinic', 'surgery', 'emergency', 'maternal', 'child health',
    'hiv', 'aids', 'malaria', 'tuberculosis', 'cancer', 'diabetes'
  ],
  
  education: [
    'education', 'school', 'university', 'college', 'student', 'teacher', 'lecturer',
    'exam', 'zimsec', 'o level', 'a level', 'degree', 'graduation', 'scholarship',
    'tuition', 'fees', 'curriculum', 'syllabus', 'learning', 'literacy',
    'primary school', 'secondary school', 'higher education', 'vocational training',
    'apprenticeship', 'skills development'
  ],
  
  entertainment: [
    'entertainment', 'music', 'movie', 'film', 'celebrity', 'artist', 'musician',
    'actor', 'actress', 'concert', 'show', 'performance', 'festival', 'awards',
    'album', 'single', 'video', 'streaming', 'netflix', 'youtube', 'television',
    'radio', 'podcast', 'comedy', 'drama', 'documentary', 'theatre', 'dance',
    'culture', 'tradition', 'heritage'
  ],
  
  environment: [
    'environment', 'climate', 'weather', 'conservation', 'wildlife', 'nature',
    'pollution', 'green', 'renewable', 'solar', 'sustainability', 'recycling',
    'carbon', 'emissions', 'deforestation', 'biodiversity', 'ecosystem',
    'national park', 'safari', 'tourism', 'eco-tourism', 'endangered species',
    'global warming', 'climate change', 'drought', 'flood', 'cyclone'
  ],
  
  crime: [
    'crime', 'police', 'arrest', 'court', 'judge', 'trial', 'sentence', 'prison',
    'theft', 'robbery', 'murder', 'assault', 'fraud', 'corruption', 'bribery',
    'investigation', 'detective', 'evidence', 'witness', 'victim', 'justice',
    'law', 'legal', 'attorney', 'lawyer', 'magistrate', 'bail', 'fine'
  ],
  
  international: [
    'international', 'global', 'world', 'foreign', 'embassy', 'diplomat', 'un',
    'africa', 'sadc', 'south africa', 'botswana', 'zambia', 'mozambique',
    'malawi', 'namibia', 'china', 'usa', 'uk', 'europe', 'brexit', 'trade war',
    'sanctions', 'peacekeeping', 'humanitarian', 'refugee', 'migration'
  ],
  
  lifestyle: [
    'lifestyle', 'fashion', 'beauty', 'travel', 'food', 'recipe', 'cooking',
    'restaurant', 'hotel', 'vacation', 'holiday', 'wedding', 'family',
    'parenting', 'relationship', 'dating', 'home', 'property', 'real estate',
    'car', 'vehicle', 'shopping', 'consumer', 'brand', 'luxury'
  ],
  
  finance: [
    'finance', 'financial', 'money', 'cash', 'loan', 'credit', 'debt', 'savings',
    'pension', 'insurance', 'investment', 'stock', 'share', 'dividend', 'interest',
    'mortgage', 'microfinance', 'banking', 'mobile money', 'ecocash', 'onemoney',
    'telecash', 'fintech', 'cryptocurrency', 'forex', 'exchange rate'
  ]
};

// Updated RSS feed sources for Zimbabwe news
const RSS_SOURCES = [
  {
    name: 'Herald Zimbabwe',
    url: 'https://www.herald.co.zw/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'NewsDay Zimbabwe', 
    url: 'https://www.newsday.co.zw/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'Chronicle Zimbabwe',
    url: 'https://www.chronicle.co.zw/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'ZBC News',
    url: 'https://www.zbc.co.zw/feed/',
    category: 'news',
    enabled: true
  },
  {
    name: 'Business Weekly',
    url: 'https://businessweekly.co.zw/feed/',
    category: 'business',
    enabled: true
  },
  {
    name: 'Techzim',
    url: 'https://www.techzim.co.zw/feed/',
    category: 'technology',
    enabled: true
  },
  {
    name: 'The Standard',
    url: 'https://www.thestandard.co.zw/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'ZimLive',
    url: 'https://www.zimlive.com/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'NewZimbabwe',
    url: 'https://www.newzimbabwe.com/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'The Sunday Mail',
    url: 'https://www.sundaymail.co.zw/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: '263Chat',
    url: 'https://www.263chat.com/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'iHarare',
    url: 'https://iharare.com/feed/',
    category: 'general',
    enabled: false
  },
  {
    name: 'Bulawayo24',
    url: 'https://bulawayo24.com/feeds-rss-rss.rss',
    category: 'general',
    enabled: true
  },
  {
    name: 'Zimbabwe Situation',
    url: 'https://www.zimbabwesituation.com/feed/',
    category: 'general',
    enabled: false
  },
  {
    name: 'ZW News',
    url: 'https://zwnews.com/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'My Zimbabwe',
    url: 'https://www.myzimbabwe.co.zw/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'NewsDzeZimbabwe',
    url: 'https://www.newsdzezimbabwe.co.uk/feeds/posts/default?alt=rss',
    category: 'general',
    enabled: false
  },
  {
    name: 'Daily News',
    url: 'https://dailynews.co.zw/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'ZimEye',
    url: 'https://www.zimeye.net/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'Zim Morning Post',
    url: 'https://zimmorningpost.com/feed/',
    category: 'general',
    enabled: true
  },
  {
    name: 'Mbare Times',
    url: 'https://mbaretimes.com/feed/',
    category: 'general',
    enabled: false
  },
  {
    name: 'Nehanda Radio',
    url: 'https://nehandaradio.com/feed/',
    category: 'general',
    enabled: false
  },
  {
    name: 'Pindula News',
    url: 'https://news.pindula.co.zw/feed/',
    category: 'general',
    enabled: false
  }
]

// Validation schemas for request parameters
const VALIDATION_SCHEMAS = {
  feeds: {
    category: {
      type: 'string',
      enum: ['politics', 'economy', 'business', 'sports', 'harare', 'agriculture', 
             'technology', 'health', 'education', 'entertainment', 'environment', 
             'crime', 'international', 'lifestyle', 'finance', 'general']
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 50
    },
    priority: {
      type: 'boolean'
    }
  }
}

// Define CATEGORIES constant for SSR
const CATEGORIES = [
  { id: 'all', label: 'All News', icon: '📰', primary: true },
  { id: 'politics', label: 'Politics', icon: '🏛️', primary: true },
  { id: 'economy', label: 'Economy', icon: '💰', primary: true },
  { id: 'business', label: 'Business', icon: '💼', primary: true },
  { id: 'sports', label: 'Sports', icon: '⚽', primary: true },
  { id: 'harare', label: 'Harare', icon: '🏙️', primary: true },
  { id: 'agriculture', label: 'Agriculture', icon: '🌾', primary: true },
  { id: 'technology', label: 'Technology', icon: '💻', primary: false },
  { id: 'health', label: 'Health', icon: '🏥', primary: false },
  { id: 'education', label: 'Education', icon: '🎓', primary: false },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭', primary: false },
  { id: 'environment', label: 'Environment', icon: '🌍', primary: false },
  { id: 'crime', label: 'Crime', icon: '🚔', primary: false },
  { id: 'international', label: 'International', icon: '🌐', primary: false },
  { id: 'lifestyle', label: 'Lifestyle', icon: '✨', primary: false },
  { id: 'finance', label: 'Finance', icon: '💳', primary: false }
]

// Simple image extraction function - returns original URL
function extractImageFromContent(content, link, enclosure = null, mediaContent = null) {
  if (!content && !enclosure && !mediaContent) return null

  const imageMatches = []
  
  // First priority: RSS enclosure or media:content tags
  if (mediaContent && mediaContent['@_url']) {
    const mediaUrl = mediaContent['@_url']
    if (IMAGE_PATTERNS.some(pattern => pattern.test(mediaUrl))) {
      imageMatches.push(mediaUrl)
    }
  }
  
  if (enclosure && enclosure['@_type']?.startsWith('image/') && enclosure['@_url']) {
    imageMatches.push(enclosure['@_url'])
  }
  
  // Second priority: Extract from content
  if (content) {
    // Extract img src attributes
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    let match
    while ((match = imgRegex.exec(content)) !== null) {
      imageMatches.push(match[1])
    }
    
    // Extract direct image URLs from text
    IMAGE_PATTERNS.forEach(pattern => {
      const matches = content.match(new RegExp(pattern.source, 'gi'))
      if (matches) {
        imageMatches.push(...matches)
      }
    })
  }
  
  // Filter and validate images
  const validImages = imageMatches
    .map(img => {
      try {
        // Handle relative URLs
        if (img.startsWith('//')) {
          return `https:${img}`
        } else if (img.startsWith('/')) {
          const baseUrl = new URL(link)
          return `${baseUrl.protocol}//${baseUrl.hostname}${img}`
        } else if (!img.startsWith('http')) {
          const baseUrl = new URL(link)
          return `${baseUrl.protocol}//${baseUrl.hostname}/${img}`
        }
        return img
      } catch {
        return null
      }
    })
    .filter(Boolean)
    .filter(img => {
      try {
        const imgUrl = new URL(img)
        return TRUSTED_IMAGE_DOMAINS.some(domain => 
          imgUrl.hostname.includes(domain)
        )
      } catch {
        return false
      }
    })
    .filter(img => IMAGE_PATTERNS.some(pattern => pattern.test(img)))
  
  // Return the first valid image URL directly
  return validImages.length > 0 ? validImages[0] : null
}

// SEO-friendly HTML template for server-side rendering
function generateSEOHTML(feeds, category = 'all', searchQuery = '') {
  const categoryInfo = category !== 'all' 
    ? CATEGORIES.find(cat => cat.id === category) 
    : { label: 'All News', id: 'all' }
  
  // Generate dynamic metadata based on feeds
  const uniqueSources = [...new Set(feeds.map(feed => feed.source))]
  const popularCategories = [...new Set(feeds.slice(0, 10).map(feed => feed.category))]
  
  let title = 'Harare Metro - Zimbabwe News Aggregator'
  let description = 'Stay informed with the latest news from Zimbabwe. '
  let keywords = [
    'Zimbabwe news', 'Harare news', 'Zimbabwe politics', 'Zimbabwe economy',
    'Herald Zimbabwe', 'NewsDay', 'Chronicle', 'ZBC News'
  ]

  if (category !== 'all') {
    title = `${categoryInfo.label} News Zimbabwe | Harare Metro`
    description = `Latest ${categoryInfo.label.toLowerCase()} news and updates from Zimbabwe. `
    keywords.unshift(`Zimbabwe ${categoryInfo.label.toLowerCase()}`)
    keywords.unshift(`${categoryInfo.label} news Zimbabwe`)
  }

  if (searchQuery) {
    title = `Search: ${searchQuery} | Harare Metro`
    description = `Search results for "${searchQuery}" in Zimbabwe news. `
  }

  description += `Real-time aggregation from ${uniqueSources.slice(0, 3).join(', ')} and more trusted local sources.`
  
  // Add sources and categories to keywords
  keywords.push(...uniqueSources)
  popularCategories.forEach(cat => {
    if (cat !== 'general') {
      keywords.push(`Zimbabwe ${cat}`)
    }
  })

  const keywordsString = keywords.join(', ')
  const canonicalUrl = `https://www.hararemetro.co.zw${category !== 'all' ? `/?category=${category}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="keywords" content="${keywordsString}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <!-- Additional meta tags... -->
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`
}

// Check if request is from a bot/crawler
function isBot(userAgent) {
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider', 
    'yandexbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'whatsapp', 'telegram', 'slack', 'discord', 'pinterest', 'applebot',
    'semrushbot', 'ahrefsbot', 'mj12bot', 'dotbot'
  ]
  
  const ua = userAgent.toLowerCase()
  return botPatterns.some(bot => ua.includes(bot))
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const userAgent = request.headers.get('User-Agent') || ''
    
    console.log('Request:', url.pathname, 'User-Agent:', userAgent)
    
    try {
      // Handle API routes first (highest priority)
      if (url.pathname.startsWith('/api/')) {
        console.log('Handling API request:', url.pathname)
        return await handleApiRequest(request, env, ctx)
      }

      // For bots and crawlers, or when specifically requested, serve SSR version
      if (isBot(userAgent) || url.searchParams.get('_escaped_fragment_') !== null) {
        console.log('Bot detected, serving SSR version')
        
        try {
          // Get feeds for SSR
          const category = url.searchParams.get('category') || 'all'
          const searchQuery = url.searchParams.get('search') || ''
          
          // Fetch feeds from KV storage or API
          let feeds = []
          try {
            const cachedFeeds = await env.NEWS_STORAGE.get('cached_feeds')
            if (cachedFeeds) {
              feeds = JSON.parse(cachedFeeds)
            }
          } catch (e) {
            console.error('Failed to get cached feeds:', e)
          }
          
          // Filter feeds based on category and search
          if (category !== 'all') {
            feeds = feeds.filter(feed => feed.category === category)
          }
          
          if (searchQuery) {
            const query = searchQuery.toLowerCase()
            feeds = feeds.filter(feed => 
              feed.title.toLowerCase().includes(query) ||
              feed.description?.toLowerCase().includes(query) ||
              feed.source.toLowerCase().includes(query)
            )
          }
          
          // Generate SSR HTML
          const html = generateSEOHTML(feeds, category, searchQuery)
          
          return new Response(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
              'X-Robots-Tag': 'index, follow'
            }
          })
        } catch (error) {
          console.error('SSR Error:', error)
          // Fall back to regular SPA if SSR fails
        }
      }

      // Try to serve static assets from KV
      try {
        return await getAssetFromKV(
          {
            request,
            waitUntil: ctx.waitUntil.bind(ctx)
          },
          {
            ASSET_NAMESPACE: env.ASSETS,
            // Serve index.html for SPA routes
            mapRequestToAsset: (req) => {
              const url = new URL(req.url)
              const pathname = url.pathname
              
              // Serve actual files for assets (js, css, images, etc.)
              if (pathname.includes('.') && !pathname.endsWith('/')) {
                return req
              }
              
              // Serve index.html for SPA routes (everything else)
              return new Request(`${url.origin}/index.html`, req)
            }
          }
        )
      } catch (assetError) {
        console.log('Asset serving failed, falling back to enhanced HTML:', assetError.message)
        
        // Enhanced fallback HTML
        return new Response(getEnhancedFallbackHTML(), {
          headers: { 'Content-Type': 'text/html' }
        })
      }

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      })
    }
  },

  async scheduled(event, env, ctx) {
    console.log('Running scheduled feed update...')
    ctx.waitUntil(updateFeeds(env))
  }
}

async function handleApiRequest(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api', '')

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    switch (path) {
      case '/health':
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          sources: RSS_SOURCES.filter(s => s.enabled).length,
          totalSources: RSS_SOURCES.length,
          categories: Object.keys(CATEGORY_KEYWORDS).length,
          message: 'Harare Metro API is healthy!',
          features: ['enhanced-categorization', 'priority-detection', 'zimbabwe-focus', 'global-categories', 'original-images'],
          documentation: {
            schema: '/api/schema',
            swagger: 'https://petstore.swagger.io/?url=' + encodeURIComponent(request.url.replace('/api/health', '/api/schema'))
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case '/schema':
        return await serveApiSchema(request, corsHeaders)

      case '/feeds/sources':
        return new Response(JSON.stringify(RSS_SOURCES), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
          }
        })
      
      case '/feeds':
        return await getAllFeeds(request, env, corsHeaders)

      case '/feeds/cached':
        return await getCachedFeeds(env, corsHeaders)

      case '/categories':
        return new Response(JSON.stringify({
          categories: Object.keys(CATEGORY_KEYWORDS),
          keywords: CATEGORY_KEYWORDS,
          priority: PRIORITY_KEYWORDS,
          totalCategories: Object.keys(CATEGORY_KEYWORDS).length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Endpoint not found',
          available: ['/health', '/schema', '/feeds/sources', '/feeds', '/feeds/cached', '/categories'],
          documentation: '/api/schema'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

async function getAllFeeds(request, env, corsHeaders) {
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  
  // Validate request parameters
  const validationErrors = validateRequest(params, VALIDATION_SCHEMAS.feeds)
  if (validationErrors.length > 0) {
    return new Response(JSON.stringify({
      error: 'Invalid request parameters',
      validationErrors: validationErrors
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  const allFeeds = []
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: 'text'
  })

  const enabledSources = RSS_SOURCES.filter(source => source.enabled)
  
  const feedPromises = enabledSources.map(async (source) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(source.url, {
        headers: { 
          'User-Agent': 'Harare Metro News Aggregator/2.0 (Zimbabwe)',
          'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const xmlData = await response.text()
      const jsonData = parser.parse(xmlData)
      
      const channel = jsonData?.rss?.channel || jsonData?.feed
      const items = channel?.item || channel?.entry || []
      
      const processedItems = (Array.isArray(items) ? items : [items])
        .slice(0, 20)
        .map(item => {
          const title = item.title?.text || item.title || 'No title'
          
          // Enhanced description extraction - get more text content
          let description = ''
          const sources = [
            item.description?.text || item.description,
            item.summary?.text || item.summary,
            item.content?.text || item.content,
            item['content:encoded'],
            item.excerpt?.text || item.excerpt
          ].filter(Boolean)
          
          // Use the longest available description
          if (sources.length > 0) {
            description = sources.reduce((longest, current) => 
              (current && current.length > longest.length) ? current : longest
            , '')
          }
          
          // Clean and limit description to reasonable length for mobile
          description = cleanHtml(description, 800) // Increased from 300 to 800 characters
          
          const content = `${title} ${description}`.toLowerCase()
          const link = item.link?.text || item.link || item.id || '#'
          
          // Extract original image from content
          const rawContent = item.description || item.content || item.summary || item['content:encoded'] || ''
          const extractedImage = extractImageFromContent(
            rawContent, 
            link, 
            item.enclosure, 
            item['media:content']
          )
          
          const detectedCategory = detectCategory(content) || source.category
          const isPriority = PRIORITY_KEYWORDS.some(keyword => 
            content.includes(keyword.toLowerCase())
          )
          const relevanceScore = calculateRelevanceScore(content)
          
          return {
            title: title,
            description: description,
            link: link,
            pubDate: item.pubDate || item.published || item.updated || new Date().toISOString(),
            source: source.name,
            category: detectedCategory,
            priority: isPriority,
            relevanceScore: relevanceScore,
            guid: item.guid?.text || item.guid || item.id || `${source.name}-${Date.now()}-${Math.random()}`,
            imageUrl: extractedImage // Original image URL only
          }
        })
        .filter(item => item.title !== 'No title')

      return processedItems
    } catch (error) {
      console.error(`Error fetching ${source.name}:`, error.message)
      return []
    }
  })

  const results = await Promise.allSettled(feedPromises)
  
  results.forEach(result => {
    if (result.status === 'fulfilled') {
      allFeeds.push(...result.value)
    }
  })

  // Sort feeds
  allFeeds.sort((a, b) => {
    if (a.priority && !b.priority) return -1
    if (!a.priority && b.priority) return 1
    if (a.relevanceScore !== b.relevanceScore) {
      return b.relevanceScore - a.relevanceScore
    }
    return new Date(b.pubDate) - new Date(a.pubDate)
  })

  // Remove duplicates
  const uniqueFeeds = removeDuplicates(allFeeds)
  
  // Apply filters based on validated parameters
  let filteredFeeds = uniqueFeeds
  
  if (params.category) {
    filteredFeeds = filteredFeeds.filter(feed => feed.category === params.category)
  }
  
  if (params.priority !== undefined) {
    const priorityFilter = params.priority === 'true'
    filteredFeeds = filteredFeeds.filter(feed => feed.priority === priorityFilter)
  }
  
  const limit = params.limit ? parseInt(params.limit) : 50
  const limitedFeeds = filteredFeeds.slice(0, limit)

  return new Response(JSON.stringify(limitedFeeds), {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=600',
      'X-Total-Count': filteredFeeds.length.toString(),
      'X-Returned-Count': limitedFeeds.length.toString()
    }
  })
}

// Enhanced validation function
function validateRequest(params, schema) {
  const errors = []
  
  for (const [key, value] of Object.entries(params)) {
    if (schema[key]) {
      const fieldSchema = schema[key]
      
      // Type validation
      if (fieldSchema.type === 'integer') {
        const intValue = parseInt(value)
        if (isNaN(intValue)) {
          errors.push({
            field: key,
            message: `Expected integer, got: ${value}`,
            value: value
          })
          continue
        }
        
        // Range validation
        if (fieldSchema.minimum !== undefined && intValue < fieldSchema.minimum) {
          errors.push({
            field: key,
            message: `Value must be >= ${fieldSchema.minimum}`,
            value: intValue
          })
        }
        if (fieldSchema.maximum !== undefined && intValue > fieldSchema.maximum) {
          errors.push({
            field: key,
            message: `Value must be <= ${fieldSchema.maximum}`,
            value: intValue
          })
        }
      }
      
      // Enum validation
      if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
        errors.push({
          field: key,
          message: `Invalid value. Allowed values: ${fieldSchema.enum.join(', ')}`,
          value: value
        })
      }
      
      // Boolean validation
      if (fieldSchema.type === 'boolean') {
        if (value !== 'true' && value !== 'false') {
          errors.push({
            field: key,
            message: `Expected boolean (true/false), got: ${value}`,
            value: value
          })
        }
      }
    }
  }
  
  return errors
}

async function serveApiSchema(request, corsHeaders) {
  const accept = request.headers.get('Accept') || ''
  
  // Serve YAML schema content
  const yamlSchema = `openapi: 3.0.3
info:
  title: Harare Metro News API
  description: |
    Zimbabwe News Aggregation API with original image extraction.
    
    Features:
    - Real-time RSS feed aggregation
    - Enhanced categorization with Zimbabwe-specific keywords
    - Priority detection for Zimbabwe-relevant content
    - Original image extraction (no optimization)
    - Multiple news sources from Herald, NewsDay, Chronicle, ZBC, and more
  version: 2.0.0
  contact:
    name: Nyuchi Web Services
    url: https://www.nyuchi.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: ${new URL(request.url).origin}/api
    description: Current server

paths:
  /health:
    get:
      summary: Health check endpoint
      tags: [System]
      responses:
        '200':
          description: API is healthy

  /feeds:
    get:
      summary: Get all news feeds with original images
      tags: [News]
      parameters:
        - name: category
          in: query
          required: false
          schema:
            type: string
            enum: [politics, economy, business, sports, harare, agriculture, technology, health, education, entertainment, environment, crime, international, lifestyle, finance, general]
      responses:
        '200':
          description: Successfully retrieved news feeds
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    title:
                      type: string
                    description:
                      type: string
                    link:
                      type: string
                    imageUrl:
                      type: string
                      description: Original image URL from source
                    source:
                      type: string
                    category:
                      type: string
                    priority:
                      type: boolean

tags:
  - name: News
    description: News aggregation endpoints
  - name: System
    description: System health endpoints`

  if (accept.includes('application/json')) {
    return new Response(JSON.stringify({
      message: 'Schema available in YAML format',
      swagger_ui: 'https://petstore.swagger.io/?url=' + encodeURIComponent(new URL(request.url).href),
      yaml_endpoint: new URL(request.url).href
    }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  }

  return new Response(yamlSchema, {
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/yaml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}

function detectCategory(content) {
  let maxMatches = 0
  let detectedCategory = null
  let categoryScores = {}
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    ).length
    
    categoryScores[category] = matches
    
    if (matches > maxMatches) {
      maxMatches = matches
      detectedCategory = category
    }
  }
  
  const zimbabweCategories = ['politics', 'economy', 'harare', 'agriculture']
  if (maxMatches > 0) {
    for (const zwCategory of zimbabweCategories) {
      if (categoryScores[zwCategory] === maxMatches) {
        detectedCategory = zwCategory
        break
      }
    }
  }
  
  return detectedCategory
}

function calculateRelevanceScore(content) {
  let score = 0
  
  PRIORITY_KEYWORDS.forEach(keyword => {
    if (content.includes(keyword.toLowerCase())) {
      score += 3
    }
  })
  
  const cities = ['harare', 'bulawayo', 'mutare', 'gweru', 'kwekwe', 'masvingo', 'chitungwiza']
  cities.forEach(city => {
    if (content.includes(city)) {
      score += 2
    }
  })
  
  const govTerms = ['government', 'parliament', 'minister', 'president', 'cabinet']
  govTerms.forEach(term => {
    if (content.includes(term)) {
      score += 1
    }
  })
  
  return score
}

function removeDuplicates(feeds) {
  const seen = new Set()
  const unique = []
  
  for (const feed of feeds) {
    const normalizedTitle = feed.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    let isDuplicate = false
    for (const seenTitle of seen) {
      if (calculateSimilarity(normalizedTitle, seenTitle) > 0.8) {
        isDuplicate = true
        break
      }
    }
    
    if (!isDuplicate) {
      seen.add(normalizedTitle)
      unique.push(feed)
    }
  }
  
  return unique
}

function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ')
  const words2 = str2.split(' ')
  const intersection = words1.filter(word => words2.includes(word))
  const union = [...new Set([...words1, ...words2])]
  return intersection.length / union.length
}

async function getCachedFeeds(env, corsHeaders) {
  try {
    const cachedFeeds = await env.NEWS_STORAGE.get('cached_feeds')
    const lastUpdated = await env.NEWS_STORAGE.get('last_updated')
    
    if (cachedFeeds) {
      return new Response(JSON.stringify({
        feeds: JSON.parse(cachedFeeds),
        lastUpdated: lastUpdated || null,
        cached: true
      }), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      })
    }
    
    return await getAllFeeds(new Request('https://example.com/api/feeds'), env, corsHeaders)
  } catch (error) {
    console.error('Cache error:', error)
    return await getAllFeeds(new Request('https://example.com/api/feeds'), env, corsHeaders)
  }
}

async function updateFeeds(env) {
  try {
    console.log('Updating feed cache...')
    const response = await getAllFeeds(new Request('https://example.com/api/feeds'), env, {})
    const feedsData = await response.text()
    
    await env.NEWS_STORAGE.put('cached_feeds', feedsData)
    await env.NEWS_STORAGE.put('last_updated', new Date().toISOString())
    
    console.log('Feed cache updated successfully')
  } catch (error) {
    console.error('Failed to update feed cache:', error)
  }
}

function cleanHtml(html, maxLength = 300) {
  if (typeof html !== 'string') return ''
  
  let cleaned = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
  
  // If content is longer than maxLength, cut at sentence or word boundary
  if (cleaned.length > maxLength) {
    const truncated = cleaned.substring(0, maxLength)
    const lastPeriod = truncated.lastIndexOf('.')
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastPeriod > maxLength * 0.7) {
      return truncated.substring(0, lastPeriod + 1)
    } else if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...'
    }
    return truncated + '...'
  }
  
  return cleaned
}

function getEnhancedFallbackHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Harare Metro - Zimbabwe News Aggregator</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: Georgia, 'Times New Roman', serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          line-height: 1.4;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
        .loading { text-align: center; color: white; font-size: 1rem; padding: 2rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="loading">📡 Loading Harare Metro with original images...</div>
      </div>
      <script>
        async function loadNews() {
          try {
            const response = await fetch('/api/feeds?limit=6');
            const feeds = await response.json();
            console.log('Loaded feeds with original images:', feeds.filter(f => f.imageUrl).length);
          } catch (error) {
            console.error('Error:', error);
          }
        }
        loadNews();
      </script>
    </body>
    </html>
  `
}