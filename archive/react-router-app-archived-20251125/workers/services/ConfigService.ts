// worker/services/ConfigService.js
export class ConfigService {
  constructor(kvStorage) {
    // IMPORTANT: This should be HM_CONFIGURATIONS binding, not main storage
    this.kv = kvStorage // Make sure this is env.HM_CONFIGURATIONS
    this.fallbackConfig = this.initializeFallbackConfig()
    // Configs are static - no auto-refresh timers
  }

  // Central configuration keys
  static CONFIG_KEYS = {
    SYSTEM: 'hm:system',
    RSS_SOURCES: 'hm:rss_sources', 
    CATEGORIES: 'hm:categories',
    CATEGORY_KEYWORDS: 'hm:category_keywords',
    PRIORITY_KEYWORDS: 'hm:priority_keywords',
    TRUSTED_DOMAINS: 'hm:trusted_domains'
  }

  // Initialize comprehensive fallback configuration with ALL sources from old worker
  initializeFallbackConfig() {
    return {
      rss_sources: [
        {
          id: 'herald-zimbabwe',
          name: 'Herald Zimbabwe',
          url: 'https://www.herald.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 5
        },
        {
          id: 'newsday-zimbabwe',
          name: 'NewsDay Zimbabwe', 
          url: 'https://www.newsday.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 5
        },
        {
          id: 'chronicle-zimbabwe',
          name: 'Chronicle Zimbabwe',
          url: 'https://www.chronicle.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 5
        },
        {
          id: 'zbc-news',
          name: 'ZBC News',
          url: 'https://www.zbc.co.zw/feed/',
          category: 'news',
          enabled: true,
          priority: 4
        },
        {
          id: 'business-weekly',
          name: 'Business Weekly',
          url: 'https://businessweekly.co.zw/feed/',
          category: 'business',
          enabled: true,
          priority: 4
        },
        {
          id: 'techzim',
          name: 'Techzim',
          url: 'https://www.techzim.co.zw/feed/',
          category: 'technology',
          enabled: true,
          priority: 4
        },
        {
          id: 'the-standard',
          name: 'The Standard',
          url: 'https://www.thestandard.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 4
        },
        {
          id: 'zimlive',
          name: 'ZimLive',
          url: 'https://www.zimlive.com/feed/',
          category: 'general',
          enabled: true,
          priority: 4
        },
        {
          id: 'new-zimbabwe',
          name: 'New Zimbabwe',
          url: 'https://www.newzimbabwe.com/feed/',
          category: 'general',
          enabled: true,
          priority: 4
        },
        {
          id: 'the-independent',
          name: 'The Independent',
          url: 'https://www.theindependent.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 4
        },
        {
          id: 'sunday-mail',
          name: 'Sunday Mail',
          url: 'https://www.sundaymail.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        },
        {
          id: '263chat',
          name: '263Chat',
          url: 'https://263chat.com/feed/',
          category: 'general',
          enabled: true,
          priority: 4
        },
        {
          id: 'daily-news',
          name: 'Daily News',
          url: 'https://www.dailynews.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 4
        },
        {
          id: 'zimeye',
          name: 'ZimEye',
          url: 'https://zimeye.net/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        },
        {
          id: 'pindula-news',
          name: 'Pindula News',
          url: 'https://news.pindula.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        },
        {
          id: 'zimbabwe-situation',
          name: 'Zimbabwe Situation',
          url: 'https://zimbabwesituation.com/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        },
        {
          id: 'nehanda-radio',
          name: 'Nehanda Radio',
          url: 'https://nehandaradio.com/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        },
        {
          id: 'open-news-zimbabwe',
          name: 'Open News Zimbabwe',
          url: 'https://opennews.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        },
        {
          id: 'financial-gazette',
          name: 'Financial Gazette',
          url: 'https://fingaz.co.zw/feed/',
          category: 'business',
          enabled: true,
          priority: 4
        },
        {
          id: 'manica-post',
          name: 'Manica Post',
          url: 'https://manicapost.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        },
        {
          id: 'southern-eye',
          name: 'Southern Eye',
          url: 'https://southerneye.co.zw/feed/',
          category: 'general',
          enabled: true,
          priority: 3
        }
      ],
      categories: [
        // Entertainment & Media
        { id: 'movies_cinema', name: 'Movies & Cinema', emoji: '🎬', color: '#ff6b6b' },
        { id: 'music_audio', name: 'Music & Audio', emoji: '🎵', color: '#4ecdc4' },
        { id: 'gaming_esports', name: 'Gaming & Esports', emoji: '🎮', color: '#45b7d1' },
        { id: 'books_literature', name: 'Books & Literature', emoji: '📚', color: '#96ceb4' },
        
        // Lifestyle & Culture
        { id: 'fashion_style', name: 'Fashion & Style', emoji: '👗', color: '#ffa726' },
        { id: 'food_culinary', name: 'Food & Culinary', emoji: '🍳', color: '#ef5350' },
        { id: 'travel_adventure', name: 'Travel & Adventure', emoji: '✈️', color: '#42a5f5' },
        { id: 'fitness_wellness', name: 'Fitness & Wellness', emoji: '💪', color: '#66bb6a' },
        
        // Technology & Innovation
        { id: 'tech_gadgets', name: 'Technology & Gadgets', emoji: '📱', color: '#7e57c2' },
        { id: 'ai_future', name: 'AI & Future Tech', emoji: '🤖', color: '#5c6bc0' },
        { id: 'crypto_blockchain', name: 'Crypto & Blockchain', emoji: '₿', color: '#ff9800' },
        
        // Social & Community
        { id: 'local_community', name: 'Local Community', emoji: '🏘️', color: '#8bc34a' },
        { id: 'social_activism', name: 'Social & Activism', emoji: '✊', color: '#e91e63' },
        { id: 'relationships_dating', name: 'Relationships & Dating', emoji: '💕', color: '#f06292' },
        
        // Business & Career
        { id: 'entrepreneurship', name: 'Entrepreneurship', emoji: '🚀', color: '#ff7043' },
        { id: 'career_professional', name: 'Career & Professional', emoji: '💼', color: '#546e7a' },
        { id: 'finance_investing', name: 'Finance & Investing', emoji: '💰', color: '#4caf50' },
        
        // Arts & Creativity
        { id: 'visual_arts', name: 'Visual Arts', emoji: '🎨', color: '#ab47bc' },
        { id: 'photography', name: 'Photography', emoji: '📸', color: '#26c6da' },
        { id: 'design_creative', name: 'Design & Creative', emoji: '✨', color: '#ffee58' },
        
        // Education & Learning
        { id: 'science_research', name: 'Science & Research', emoji: '🔬', color: '#29b6f6' },
        { id: 'history_culture', name: 'History & Culture', emoji: '🏛️', color: '#a1887f' },
        { id: 'languages_learning', name: 'Languages & Learning', emoji: '🗣️', color: '#9ccc65' },
        
        // Sports & Recreation
        { id: 'sports_athletics', name: 'Sports & Athletics', emoji: '⚽', color: '#ff8a65' },
        { id: 'outdoor_nature', name: 'Outdoor & Nature', emoji: '🌲', color: '#81c784' },
        { id: 'hobbies_crafts', name: 'Hobbies & Crafts', emoji: '🧶', color: '#ba68c8' },
        
        // News & Current Events
        { id: 'politics_governance', name: 'Politics & Governance', emoji: '🏛️', color: '#78909c' },
        { id: 'world_news', name: 'World News', emoji: '🌍', color: '#42a5f5' },
        { id: 'local_news', name: 'Local News', emoji: '📰', color: '#66bb6a' },
        
        // Spirituality & Philosophy
        { id: 'spirituality_religion', name: 'Spirituality & Religion', emoji: '🙏', color: '#ce93d8' },
        { id: 'philosophy_thought', name: 'Philosophy & Thought', emoji: '🤔', color: '#90a4ae' },
        { id: 'personal_development', name: 'Personal Development', emoji: '🌱', color: '#a5d6a7' },

        // Legacy Zimbabwe-specific categories (keep for RSS feeds)
        { id: 'general', name: 'General', emoji: '📰', color: '#66bb6a' },
        { id: 'harare', name: 'Harare', emoji: '🏙️', color: '#8bc34a' },
        { id: 'agriculture', name: 'Agriculture', emoji: '🌾', color: '#81c784' },
        { id: 'health', name: 'Health', emoji: '🏥', color: '#66bb6a' },
        { id: 'education', name: 'Education', emoji: '🎓', color: '#9ccc65' },
        { id: 'crime', name: 'Crime', emoji: '🚔', color: '#e57373' },
        { id: 'environment', name: 'Environment', emoji: '🌍', color: '#81c784' }
      ],
      category_keywords: {
        // Entertainment & Media
        movies_cinema: [
          'movie', 'film', 'cinema', 'hollywood', 'bollywood', 'nollywood', 'actor', 'actress',
          'director', 'producer', 'box office', 'premiere', 'trailer', 'soundtrack', 'oscar',
          'award', 'festival', 'screening', 'review', 'blockbuster', 'documentary', 'indie'
        ],
        music_audio: [
          'music', 'song', 'album', 'artist', 'musician', 'band', 'concert', 'performance',
          'spotify', 'streaming', 'playlist', 'guitar', 'piano', 'vocals', 'lyrics', 'genre',
          'hip hop', 'jazz', 'rock', 'pop', 'classical', 'electronic', 'afrobeat', 'gospel'
        ],
        gaming_esports: [
          'gaming', 'esports', 'video game', 'console', 'pc gaming', 'mobile gaming', 'tournament',
          'streamer', 'twitch', 'youtube gaming', 'ps5', 'xbox', 'nintendo', 'steam', 'valorant',
          'fortnite', 'league of legends', 'call of duty', 'fifa', 'minecraft'
        ],
        books_literature: [
          'book', 'novel', 'author', 'writer', 'literature', 'poetry', 'publishing', 'bestseller',
          'reading', 'library', 'kindle', 'ebook', 'fiction', 'non-fiction', 'biography', 'memoir',
          'review', 'book club', 'literary', 'manuscript', 'publisher', 'amazon books'
        ],

        // Lifestyle & Culture
        fashion_style: [
          'fashion', 'style', 'clothing', 'designer', 'runway', 'model', 'brand', 'trend',
          'outfit', 'wardrobe', 'shopping', 'boutique', 'couture', 'streetwear', 'luxury',
          'accessories', 'shoes', 'jewelry', 'makeup', 'beauty', 'cosmetics'
        ],
        food_culinary: [
          'food', 'recipe', 'cooking', 'chef', 'restaurant', 'cuisine', 'meal', 'dish',
          'ingredients', 'kitchen', 'culinary', 'dining', 'menu', 'taste', 'flavor',
          'foodie', 'gastronomy', 'bakery', 'cafe', 'wine', 'beer', 'cocktail'
        ],
        travel_adventure: [
          'travel', 'tourism', 'vacation', 'holiday', 'adventure', 'destination', 'hotel',
          'flight', 'airline', 'backpacking', 'safari', 'beach', 'mountain', 'city break',
          'culture trip', 'expedition', 'journey', 'explore', 'discover', 'wanderlust'
        ],
        fitness_wellness: [
          'fitness', 'workout', 'exercise', 'gym', 'health', 'wellness', 'nutrition', 'diet',
          'yoga', 'meditation', 'mindfulness', 'mental health', 'therapy', 'running', 'cycling',
          'strength training', 'cardio', 'weight loss', 'muscle building', 'supplements'
        ],

        // Technology & Innovation
        tech_gadgets: [
          'technology', 'tech', 'gadget', 'smartphone', 'iphone', 'android', 'laptop', 'computer',
          'tablet', 'smart watch', 'headphones', 'camera', 'innovation', 'startup', 'app',
          'software', 'hardware', 'device', 'apple', 'google', 'microsoft', 'samsung'
        ],
        ai_future: [
          'artificial intelligence', 'ai', 'machine learning', 'deep learning', 'neural network',
          'automation', 'robot', 'robotics', 'future', 'innovation', 'chatgpt', 'openai',
          'algorithm', 'data science', 'big data', 'quantum computing', 'virtual reality',
          'augmented reality', 'metaverse', 'blockchain', 'iot', 'internet of things'
        ],
        crypto_blockchain: [
          'cryptocurrency', 'crypto', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'defi',
          'web3', 'trading', 'mining', 'wallet', 'exchange', 'coinbase', 'binance',
          'altcoin', 'token', 'smart contract', 'decentralized', 'digital currency'
        ],

        // Social & Community
        local_community: [
          'community', 'local', 'neighborhood', 'resident', 'civic', 'volunteer', 'charity',
          'fundraising', 'event', 'meeting', 'council', 'municipal', 'town', 'city',
          'harare', 'bulawayo', 'zimbabwe', 'africa', 'development', 'infrastructure'
        ],
        social_activism: [
          'activism', 'protest', 'social justice', 'human rights', 'equality', 'diversity',
          'inclusion', 'movement', 'campaign', 'advocacy', 'change', 'reform', 'awareness',
          'demonstration', 'march', 'petition', 'civil rights', 'feminism', 'environment'
        ],
        relationships_dating: [
          'relationship', 'dating', 'love', 'romance', 'marriage', 'wedding', 'couple',
          'family', 'friendship', 'dating app', 'tinder', 'bumble', 'advice', 'therapy',
          'counseling', 'partnership', 'commitment', 'breakup', 'divorce'
        ],

        // Business & Career
        entrepreneurship: [
          'entrepreneur', 'startup', 'business', 'innovation', 'funding', 'investment',
          'venture capital', 'angel investor', 'pitch', 'business plan', 'scale', 'growth',
          'founder', 'ceo', 'company', 'enterprise', 'small business', 'side hustle'
        ],
        career_professional: [
          'career', 'job', 'employment', 'professional', 'work', 'workplace', 'office',
          'hiring', 'recruitment', 'interview', 'resume', 'cv', 'linkedin', 'networking',
          'promotion', 'salary', 'skills', 'training', 'development', 'leadership'
        ],
        finance_investing: [
          'finance', 'investment', 'money', 'stock market', 'trading', 'portfolio', 'savings',
          'bank', 'loan', 'credit', 'debt', 'budget', 'financial planning', 'retirement',
          'pension', 'insurance', 'real estate', 'property', 'wealth', 'economy'
        ],

        // Arts & Creativity
        visual_arts: [
          'art', 'painting', 'sculpture', 'gallery', 'museum', 'artist', 'exhibition', 'canvas',
          'creativity', 'visual', 'contemporary art', 'abstract', 'portrait', 'landscape',
          'installation', 'curator', 'collector', 'auction', 'masterpiece'
        ],
        photography: [
          'photography', 'photographer', 'camera', 'photo', 'portrait', 'landscape', 'wedding',
          'studio', 'lens', 'editing', 'photoshop', 'lightroom', 'instagram', 'digital',
          'film', 'street photography', 'nature photography', 'fashion photography'
        ],
        design_creative: [
          'design', 'graphic design', 'web design', 'ui', 'ux', 'creative', 'branding',
          'logo', 'typography', 'color', 'layout', 'adobe', 'photoshop', 'illustrator',
          'figma', 'sketch', 'architecture', 'interior design', 'product design'
        ],

        // Education & Learning
        science_research: [
          'science', 'research', 'study', 'university', 'academic', 'scientist', 'discovery',
          'experiment', 'laboratory', 'peer review', 'publication', 'thesis', 'phd',
          'biology', 'chemistry', 'physics', 'medicine', 'engineering', 'climate'
        ],
        history_culture: [
          'history', 'culture', 'heritage', 'tradition', 'ancient', 'civilization', 'museum',
          'archaeology', 'anthropology', 'historical', 'cultural', 'artifact', 'monument',
          'preservation', 'folklore', 'customs', 'ritual', 'celebration', 'festival'
        ],
        languages_learning: [
          'language', 'learning', 'education', 'english', 'shona', 'ndebele', 'french',
          'spanish', 'chinese', 'translation', 'interpreter', 'fluent', 'bilingual',
          'grammar', 'vocabulary', 'pronunciation', 'course', 'teacher', 'student'
        ],

        // Sports & Recreation
        sports_athletics: [
          'sports', 'football', 'soccer', 'cricket', 'rugby', 'basketball', 'tennis', 'golf',
          'athletics', 'marathon', 'olympics', 'world cup', 'championship', 'tournament',
          'athlete', 'coach', 'team', 'league', 'match', 'game', 'competition'
        ],
        outdoor_nature: [
          'outdoor', 'nature', 'hiking', 'camping', 'wildlife', 'safari', 'conservation',
          'environment', 'national park', 'forest', 'mountain', 'river', 'lake',
          'adventure', 'eco-tourism', 'bird watching', 'fishing', 'hunting'
        ],
        hobbies_crafts: [
          'hobby', 'craft', 'diy', 'handmade', 'knitting', 'sewing', 'woodworking',
          'gardening', 'collecting', 'painting', 'drawing', 'pottery', 'jewelry making',
          'scrapbooking', 'model building', 'puzzle', 'board game', 'creative'
        ],

        // News & Current Events
        politics_governance: [
          'politics', 'government', 'parliament', 'election', 'party', 'minister', 'president',
          'policy', 'zanu', 'mdc', 'opposition', 'mnangagwa', 'chamisa', 'cabinet', 'senate',
          'mp', 'constituency', 'voter', 'ballot', 'democracy', 'governance', 'corruption'
        ],
        world_news: [
          'world', 'international', 'global', 'country', 'nation', 'foreign', 'diplomatic',
          'united nations', 'africa', 'europe', 'america', 'asia', 'summit', 'treaty',
          'ambassador', 'embassy', 'conflict', 'peace', 'war', 'crisis'
        ],
        local_news: [
          'local', 'zimbabwe', 'harare', 'bulawayo', 'mutare', 'gweru', 'masvingo',
          'chitungwiza', 'kwekwe', 'kadoma', 'municipal', 'council', 'mayor',
          'community', 'residents', 'development', 'infrastructure', 'services'
        ],

        // Spirituality & Philosophy
        spirituality_religion: [
          'spirituality', 'religion', 'faith', 'church', 'christian', 'islam', 'hinduism',
          'buddhism', 'traditional religion', 'prayer', 'worship', 'meditation', 'bible',
          'quran', 'scripture', 'pastor', 'priest', 'imam', 'prophet', 'divine'
        ],
        philosophy_thought: [
          'philosophy', 'philosopher', 'ethics', 'morality', 'wisdom', 'consciousness',
          'existence', 'meaning', 'truth', 'knowledge', 'logic', 'reasoning', 'debate',
          'theory', 'concept', 'idea', 'thought', 'reflection', 'intellectual'
        ],
        personal_development: [
          'personal development', 'self improvement', 'growth', 'motivation', 'inspiration',
          'success', 'goal setting', 'productivity', 'mindset', 'coaching', 'mentoring',
          'leadership', 'confidence', 'communication', 'habits', 'discipline', 'focus'
        ],

        // Legacy categories (existing Zimbabwe-specific)
        general: [
          'news', 'zimbabwe', 'africa', 'breaking', 'latest', 'update', 'report', 'story'
        ],
        harare: [
          'harare', 'capital', 'city', 'urban', 'metropolitan', 'avondale', 'borrowdale',
          'eastlea', 'highlands', 'kopje', 'mbare', 'waterfalls', 'westgate'
        ],
        agriculture: [
          'agriculture', 'farming', 'crop', 'livestock', 'tobacco', 'maize', 'cotton',
          'farmer', 'harvest', 'irrigation', 'land', 'rural', 'commercial farming'
        ],
        health: [
          'health', 'hospital', 'medical', 'doctor', 'patient', 'medicine', 'treatment',
          'disease', 'covid', 'vaccination', 'clinic', 'healthcare', 'wellness'
        ],
        education: [
          'education', 'school', 'university', 'student', 'teacher', 'learning', 'examination',
          'zimsec', 'ministry of education', 'tertiary', 'primary', 'secondary'
        ],
        crime: [
          'crime', 'police', 'arrest', 'court', 'justice', 'theft', 'murder', 'robbery',
          'investigation', 'criminal', 'law enforcement', 'prison', 'sentence'
        ],
        environment: [
          'environment', 'climate', 'conservation', 'pollution', 'wildlife', 'deforestation',
          'recycling', 'renewable energy', 'sustainability', 'ecosystem', 'biodiversity'
        ]
      },
      priority_keywords: [
        'harare', 'zimbabwe', 'zim', 'bulawayo', 'mutare', 'gweru', 'kwekwe',
        'parliament', 'government', 'mnangagwa', 'zanu-pf', 'mdc', 'chamisa',
        'economy', 'inflation', 'currency', 'bond', 'rtgs', 'usd',
        'mining', 'tobacco', 'agriculture', 'maize', 'cotton',
        'warriors', 'dynamos', 'caps united', 'highlanders'
      ],
      trusted_image_domains: [
        // Primary Zimbabwe news sites
        'herald.co.zw', 'heraldonline.co.zw', 'www.herald.co.zw', 'www.heraldonline.co.zw',
        'newsday.co.zw', 'www.newsday.co.zw',
        'chronicle.co.zw', 'www.chronicle.co.zw',
        'techzim.co.zw', 'www.techzim.co.zw', 't3n9sm.c2.acecdn.net',
        'zbc.co.zw', 'www.zbc.co.zw',
        'businessweekly.co.zw', 'www.businessweekly.co.zw',
        'thestandard.co.zw', 'www.thestandard.co.zw',
        'zimlive.com', 'www.zimlive.com',
        'newzimbabwe.com', 'www.newzimbabwe.com',
        'theindependent.co.zw', 'www.theindependent.co.zw',
        'sundaymail.co.zw', 'www.sundaymail.co.zw',
        '263chat.com', 'www.263chat.com',
        'dailynews.co.zw', 'www.dailynews.co.zw',
        'zimeye.net', 'www.zimeye.net',
        'pindula.co.zw', 'news.pindula.co.zw',
        'zimbabwesituation.com', 'www.zimbabwesituation.com',
        'nehandaradio.com', 'www.nehandaradio.com',
        'opennews.co.zw', 'www.opennews.co.zw',
        'fingaz.co.zw', 'www.fingaz.co.zw',
        'manicapost.co.zw', 'www.manicapost.co.zw',
        'southerneye.co.zw', 'www.southerneye.co.zw',
        
        // WordPress and common CMS domains
        'wp.com', 'wordpress.com', 'files.wordpress.com',
        'i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'i3.wp.com',
        
        // CDN and image hosting services
        'cloudinary.com', 'res.cloudinary.com',
        'imgur.com', 'i.imgur.com',
        'gravatar.com', 'secure.gravatar.com',
        'amazonaws.com', 's3.amazonaws.com', 'cloudfront.net',
        'unsplash.com', 'images.unsplash.com',
        'pexels.com', 'images.pexels.com',
        
        // Google services
        'googleusercontent.com', 'lh3.googleusercontent.com',
        'lh4.googleusercontent.com', 'lh5.googleusercontent.com',
        'blogger.googleusercontent.com', 'drive.google.com',
        
        // Social media image domains
        'fbcdn.net', 'scontent.fhre1-1.fna.fbcdn.net',
        'pbs.twimg.com', 'abs.twimg.com', 'instagram.com',
        
        // News agency images
        'ap.org', 'apnews.com', 'reuters.com',
        'bbci.co.uk', 'bbc.co.uk', 'cnn.com', 'media.cnn.com',
        
        // African news networks
        'africanews.com', 'mg.co.za', 'news24.com', 'timeslive.co.za',
        'iol.co.za', 'citizen.co.za',
        
        // Generic domains that might host images
        'photobucket.com', 'flickr.com', 'staticflickr.com',
        'wikimedia.org', 'upload.wikimedia.org'
      ],
      // Centralized system configuration - ALL limits in ONE place
      system: {
        siteName: 'Harare Metro',
        
        // Article limits
        maxTotalArticles: 40000,    // Total articles to cache
        maxArticlesPerSource: 500,  // Articles per RSS source  
        articleContentLimit: 1000000,  // Unlimited character limit per article (1 million chars = full content)
        
        // Mobile-first pagination (data-conscious for Africa)
        pagination: {
          initialLoad: 24,         // First load: 24 articles (lightweight)
          pageSize: 12,           // Subsequent pages: 12 articles each  
          preloadNextPage: true,  // Preload next page in background
          cachePages: 3,          // Keep 3 pages cached (72 articles max)
          imageCompression: true, // Compress images for mobile
          previewTextLimit: 400   // Show 400 chars preview initially (better reading experience)
        },
        
        // API limits  
        apiMinLimit: 12,           // Min articles per request (reduced)
        apiMaxLimit: 24,           // Max articles per request (mobile-friendly)
        
        // Smart caching for mobile
        cacheStrategy: {
          articlesTtl: 14 * 24 * 60 * 60, // 2 weeks in seconds
          refreshInterval: 60,     // Background refresh every 60 minutes
          maxCacheSize: '100MB',   // Production cache size
          mobileMaxCache: '25MB',  // Mobile-specific cache limit
          preloadCache: 24,        // Always keep 24 articles ready
          backgroundRefresh: true  // Refresh in background, don't interrupt user
        },
        
        // RSS fetching
        rssTimeout: 10000,         // RSS fetch timeout (ms)
        refreshIntervalMinutes: 60, // How often to refresh feeds
        
        // Data-conscious settings for African users
        dataOptimization: {
          compressImages: true,    // Always compress images
          lazyLoadImages: true,    // Load images only when needed
          prefetchLimit: 3,        // Only prefetch 3 next articles
          lowDataMode: false,      // Can be enabled by user
          textFirst: true,         // Load text before images
          backgroundUpdates: true  // Update content in background
        },
        
        // Content processing  
        unlimitedContent: true,    // Enable unlimited content extraction
        enableAnalytics: true,     // Enable analytics tracking
        enableCloudflareImages: true, // Enable image optimization
        
        // Security
        adminKey: 'hararemetro-admin-2025-secure-key',
        
        // Role configuration
        rolesEnabled: true,
        defaultRole: 'creator',
        adminRoles: ['admin', 'super_admin', 'moderator'],
        creatorRoles: ['creator', 'business-creator', 'author'],
        
        // Environment-specific overrides (mobile-optimized)
        preview: {
          maxArticlesPerSource: 200,  // Lower for preview
          maxCacheSize: '15MB',       // Even smaller cache for dev
          rssTimeout: 8000,          // Shorter timeout
          enableAnalytics: false,    // No analytics in preview
          pagination: {
            initialLoad: 12,         // Smaller initial load for dev
            pageSize: 6,            // Smaller pages for testing
            preloadNextPage: false  // No preload in dev
          }
        }
      }
    }
  }

  // Get system configuration with environment override support
  async getSystemConfig(isPreview = false) {
    try {
      const systemConfig = await this.get(ConfigService.CONFIG_KEYS.SYSTEM, this.fallbackConfig.system)
      
      // Apply preview overrides if in preview environment
      if (isPreview && systemConfig.preview) {
        return {
          ...systemConfig,
          ...systemConfig.preview
        }
      }
      
      return systemConfig
    } catch (error) {
      console.error('[CONFIG] Error getting system config:', error)
      return this.fallbackConfig.system
    }
  }

  // Convenience methods for commonly used system settings
  async getMaxArticlesPerSource(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.maxArticlesPerSource
  }

  async getMaxTotalArticles(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)  
    return config.maxTotalArticles
  }

  async getArticleContentLimit(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.articleContentLimit
  }

  async getCacheSettings(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return {
      articlesTtl: config.cacheArticlesTtl,
      refreshInterval: config.cacheRefreshInterval * 60 * 1000, // Convert to ms
      maxSize: config.maxCacheSize
    }
  }

  async getRssTimeout(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.rssTimeout
  }

  async getPaginationConfig(isPreview = false) {
    const config = await this.getSystemConfig(isPreview)
    return config.pagination
  }

  // Get config WITHOUT auto-refresh - configs are static
  async get(key, defaultValue = null) {
    try {
      if (!this.kv) {
        console.log(`[CONFIG] CONFIG_STORAGE not available, using fallback for: ${key}`)
        return this.getFallbackValue(key, defaultValue)
      }
      
      // Get from CONFIG_STORAGE KV (not main article storage)
      const value = await this.kv.get(key, { type: 'json' })
      return value !== null ? value : this.getFallbackValue(key, defaultValue)
    } catch (error) {
      console.log(`Error getting config ${key}:`, error)
      return this.getFallbackValue(key, defaultValue)
    }
  }

  getFallbackValue(key, defaultValue) {
    const configKey = key.replace('config:', '')
    if (this.fallbackConfig[configKey]) {
      return this.fallbackConfig[configKey]
    }
    return defaultValue
  }

  // Set config permanently in CONFIG_STORAGE (no expiration)
  async set(key, value, options = {}) {
    try {
      if (!this.kv) {
        console.log(`[CONFIG] CONFIG_STORAGE not available, cannot set: ${key}`)
        return { success: false, error: 'CONFIG_STORAGE not available' }
      }
      
      // Store permanently in CONFIG_STORAGE - no TTL for static configs
      await this.kv.put(key, JSON.stringify(value))
      console.log(`[CONFIG] Stored config in CONFIG_STORAGE: ${key}`)
      return { success: true }
    } catch (error) {
      console.log(`Error setting config ${key} in CONFIG_STORAGE:`, error)
      return { success: false, error: error.message }
    }
  }

  // RSS Sources - static, no auto-refresh
  async getRSSources() {
    const sources = await this.get('config:rss_sources', this.fallbackConfig.rss_sources)
    console.log(`[CONFIG] Retrieved ${sources.length} RSS sources`)
    return sources
  }

  async setRSSources(sources) {
    return await this.set('config:rss_sources', sources)
  }

  // Categories - static, no auto-refresh
  async getCategories() {
    const categories = await this.get('config:categories', this.fallbackConfig.categories)
    console.log(`[CONFIG] Retrieved ${categories.length} categories`)
    return categories
  }

  async setCategories(categories) {
    return await this.set('config:categories', categories)
  }

  // Category Keywords - static, no auto-refresh
  async getCategoryKeywords() {
    const keywords = await this.get('config:category_keywords', this.fallbackConfig.category_keywords)
    console.log(`[CONFIG] Retrieved keywords for ${Object.keys(keywords).length} categories`)
    return keywords
  }

  // Priority Keywords - static, no auto-refresh
  async getPriorityKeywords() {
    const keywords = await this.get('config:priority_keywords', this.fallbackConfig.priority_keywords)
    console.log(`[CONFIG] Retrieved ${keywords.length} priority keywords`)
    return keywords
  }

  // Trusted Image Domains - static, no auto-refresh
  async getTrustedImageDomains() {
    const domains = await this.get('config:trusted_image_domains', this.fallbackConfig.trusted_image_domains)
    console.log(`[CONFIG] Retrieved ${domains.length} trusted domains`)
    return domains
  }

  // Site Configuration - static, no auto-refresh
  async getSiteConfig() {
    const config = await this.get('config:site', this.fallbackConfig.site)
    console.log(`[CONFIG] Retrieved site config`)
    return config
  }

  // ADMIN ONLY: Initialize CONFIG_STORAGE with defaults if empty
  async initializeFromFallback() {
    if (!this.kv) {
      console.log('[CONFIG] CONFIG_STORAGE not available - using fallback only')
      return { success: true, message: 'Using fallback configuration' }
    }

    try {
      const operations = []
      
      // Only set if not already present in CONFIG_STORAGE
      const checks = [
        { key: 'config:rss_sources', data: this.fallbackConfig.rss_sources },
        { key: 'config:categories', data: this.fallbackConfig.categories },
        { key: 'config:category_keywords', data: this.fallbackConfig.category_keywords },
        { key: 'config:priority_keywords', data: this.fallbackConfig.priority_keywords },
        { key: 'config:trusted_image_domains', data: this.fallbackConfig.trusted_image_domains },
        { key: 'config:site', data: this.fallbackConfig.site }
      ]

      for (const check of checks) {
        const existing = await this.kv.get(check.key)
        if (!existing) {
          console.log(`[CONFIG] Initializing ${check.key} in CONFIG_STORAGE`)
          operations.push(this.kv.put(check.key, JSON.stringify(check.data)))
        } else {
          console.log(`[CONFIG] ${check.key} already exists in CONFIG_STORAGE, skipping`)
        }
      }

      await Promise.all(operations)
      
      return { 
        success: true, 
        message: `Initialized ${operations.length} configuration items in CONFIG_STORAGE`,
        initialized: operations.length
      }
    } catch (error) {
      console.log('Error initializing CONFIG_STORAGE from fallback:', error)
      return { success: false, error: error.message }
    }
  }

  // ADMIN ONLY: Force refresh all configs from fallback to CONFIG_STORAGE
  async forceRefreshFromFallback() {
    if (!this.kv) {
      return { success: false, error: 'CONFIG_STORAGE not available' }
    }

    try {
      console.log('[CONFIG] Force refreshing all configurations from fallback to CONFIG_STORAGE...')
      
      const operations = [
        this.kv.put('config:rss_sources', JSON.stringify(this.fallbackConfig.rss_sources)),
        this.kv.put('config:categories', JSON.stringify(this.fallbackConfig.categories)),
        this.kv.put('config:category_keywords', JSON.stringify(this.fallbackConfig.category_keywords)),
        this.kv.put('config:priority_keywords', JSON.stringify(this.fallbackConfig.priority_keywords)),
        this.kv.put('config:trusted_image_domains', JSON.stringify(this.fallbackConfig.trusted_image_domains)),
        this.kv.put('config:site', JSON.stringify(this.fallbackConfig.site))
      ]

      await Promise.all(operations)
      
      return { 
        success: true, 
        message: 'All configurations force refreshed from fallback to CONFIG_STORAGE',
        refreshed: operations.length
      }
    } catch (error) {
      console.log('Error force refreshing CONFIG_STORAGE from fallback:', error)
      return { success: false, error: error.message }
    }
  }

  // Remove the initializeDefaults method that was auto-refreshing

  // Default categories with "All" as catch-all
  getDefaultCategories() {
    return [
      {
        id: 'all',
        name: 'All News',
        emoji: '📰',
        description: 'All news articles from all sources',
        color: '#6B7280',
        keywords: [], // Empty keywords means it catches everything
        isDefault: true,
        order: 0
      },
      {
        id: 'politics',
        name: 'Politics',
        emoji: '🏛️',
        description: 'Political news and government affairs',
        color: '#DC2626',
        keywords: [
          'politics', 'government', 'election', 'vote', 'parliament', 'minister',
          'president', 'policy', 'law', 'legislation', 'democracy', 'party',
          'campaign', 'senate', 'congress', 'political', 'governance', 'reform',
          'zanu-pf', 'mdc', 'ccc', 'emmerson mnangagwa', 'nelson chamisa'
        ],
        order: 1
      },
      {
        id: 'economy',
        name: 'Economy',
        emoji: '💰',
        description: 'Economic news, business, and finance',
        color: '#059669',
        keywords: [
          'economy', 'business', 'finance', 'banking', 'investment', 'market',
          'economic', 'financial', 'money', 'currency', 'inflation', 'gdp',
          'trade', 'export', 'import', 'stock', 'bond', 'forex', 'dollar',
          'zimbabwe dollar', 'usd', 'bond notes', 'rtgs', 'mining', 'agriculture',
          'tobacco', 'gold', 'platinum', 'diamonds', 'reserve bank'
        ],
        order: 2
      },
      {
        id: 'technology',
        name: 'Technology',
        emoji: '💻',
        description: 'Technology, innovation, and digital news',
        color: '#2563EB',
        keywords: [
          'technology', 'tech', 'digital', 'innovation', 'startup', 'internet',
          'mobile', 'app', 'software', 'hardware', 'computer', 'ai', 'blockchain',
          'cryptocurrency', 'fintech', 'ecocash', 'telecash', 'onewallett',
          'econet', 'netone', 'telecel', 'zimbabwe online', 'ict', 'innovation hub'
        ],
        order: 3
      },
      {
        id: 'sports',
        name: 'Sports',
        emoji: '⚽',
        description: 'Sports news and events',
        color: '#DC2626',
        keywords: [
          'sports', 'football', 'soccer', 'cricket', 'rugby', 'tennis', 'athletics',
          'olympics', 'world cup', 'premier league', 'psl', 'zimbabwe national team',
          'warriors', 'chevrons', 'sables', 'dynamos', 'caps united', 'highlanders',
          'chicken inn', 'fc platinum', 'ngezi platinum', 'manica diamonds'
        ],
        order: 4
      },
      {
        id: 'health',
        name: 'Health',
        emoji: '🏥',
        description: 'Health, medical, and wellness news',
        color: '#059669',
        keywords: [
          'health', 'medical', 'hospital', 'doctor', 'medicine', 'healthcare',
          'covid', 'pandemic', 'vaccine', 'disease', 'treatment', 'wellness',
          'mental health', 'public health', 'clinic', 'nursing', 'pharmacy',
          'medical aid', 'psmas', 'cimas', 'premier medical aid'
        ],
        order: 5
      },
      {
        id: 'education',
        name: 'Education',
        emoji: '📚',
        description: 'Education news and academic affairs',
        color: '#7C3AED',
        keywords: [
          'education', 'school', 'university', 'student', 'teacher', 'learning',
          'academic', 'examination', 'zimsec', 'o level', 'a level', 'degree',
          'uz', 'msu', 'nust', 'cut', 'buse', 'great zimbabwe university',
          'africa university', 'lupane state university', 'hit'
        ],
        order: 6
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        emoji: '🎬',
        description: 'Entertainment, arts, and culture',
        color: '#EC4899',
        keywords: [
          'entertainment', 'music', 'movie', 'film', 'celebrity', 'artist',
          'culture', 'arts', 'theatre', 'concert', 'festival', 'book',
          'literature', 'zimbo', 'zim dancehall', 'sungura', 'gospel',
          'winky d', 'jah prayzah', 'ammara brown', 'takura', 'holy ten'
        ],
        order: 7
      },
      {
        id: 'international',
        name: 'International',
        emoji: '🌍',
        description: 'International and world news',
        color: '#0891B2',
        keywords: [
          'international', 'world', 'global', 'foreign', 'africa', 'sadc',
          'south africa', 'botswana', 'zambia', 'malawi', 'mozambique',
          'usa', 'uk', 'china', 'europe', 'brexit', 'trump', 'biden',
          'putin', 'ukraine', 'russia', 'middle east', 'israel', 'palestine'
        ],
        order: 8
      }
    ]
  }

  // Enhanced category detection that includes "All" fallback
  async detectCategory(content) {
    const categories = await this.getCategories()
    const categoryKeywords = await this.getCategoryKeywords()
    
    let maxMatches = 0
    let detectedCategory = 'all' // Default to "all" instead of null
    
    // Skip "all" category during detection since it's the fallback
    const categoriesForDetection = categories.filter(cat => cat.id !== 'all')
    
    for (const category of categoriesForDetection) {
      const keywords = categoryKeywords[category.id] || []
      const matches = keywords.filter(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      ).length

      if (matches > maxMatches) {
        maxMatches = matches
        detectedCategory = category.id
      }
    }

    return detectedCategory
  }

  // Check if KV storage is available and functional
  isKVAvailable() {
    return !!(this.kv && typeof this.kv.get === 'function')
  }
}

export default ConfigService