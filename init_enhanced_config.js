const RSS_SOURCES = [
  {
    id: 'herald',
    name: 'Herald Zimbabwe',
    url: 'https://www.herald.co.zw/feed/',
    category: 'general',
    enabled: true,
    priority: 5,
    refresh_interval: 3600
  },
  {
    id: 'newsday',
    name: 'NewsDay Zimbabwe',
    url: 'https://www.newsday.co.zw/feed/',
    category: 'general',
    enabled: true,
    priority: 5,
    refresh_interval: 3600
  },
  {
    id: 'chronicle',
    name: 'Chronicle Zimbabwe',
    url: 'https://www.chronicle.co.zw/feed/',
    category: 'general',
    enabled: true,
    priority: 4,
    refresh_interval: 3600
  },
  {
    id: 'techzim',
    name: 'Techzim',
    url: 'https://www.techzim.co.zw/feed/',
    category: 'technology',
    enabled: true,
    priority: 3,
    refresh_interval: 1800
  },
  {
    id: 'businessweekly',
    name: 'Business Weekly',
    url: 'https://www.businessweekly.co.zw/feed/',
    category: 'business',
    enabled: true,
    priority: 3,
    refresh_interval: 3600
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All News', emoji: '📰', priority: 10, color: '#3B82F6' },
  { id: 'politics', name: 'Politics', emoji: '🏛️', priority: 9, color: '#DC2626' },
  { id: 'economy', name: 'Economy', emoji: '💰', priority: 8, color: '#059669' },
  { id: 'business', name: 'Business', emoji: '💼', priority: 7, color: '#7C2D12' },
  { id: 'sports', name: 'Sports', emoji: '⚽', priority: 6, color: '#EA580C' },
  { id: 'technology', name: 'Technology', emoji: '💻', priority: 5, color: '#7C3AED' },
  { id: 'health', name: 'Health', emoji: '🏥', priority: 4, color: '#059669' },
  { id: 'education', name: 'Education', emoji: '🎓', priority: 3, color: '#2563EB' }
];

const SITE_CONFIG = {
  name: 'Harare Metro',
  tagline: "Zimbabwe's Premier News Aggregator",
  description: 'Real-time news aggregation from trusted Zimbabwe sources',
  version: '2.0',
  features: {
    user_accounts: true,
    analytics: true,
    search: true,
    bookmarks: true,
    trending: true
  },
  limits: {
    max_articles_per_feed: 20,
    cache_ttl: 3600,
    user_bookmarks_limit: 1000,
    search_results_limit: 100
  }
};

const { execSync } = require('child_process');

async function initializeConfig() {
  console.log('📄 Initializing enhanced configuration...');
  
  try {
    // Check if HM_CONFIGURATIONS binding exists (might not until deployed)
    console.log('Setting RSS sources...');
    execSync(\`npx wrangler kv key put "config:rss_sources" '\${JSON.stringify(RSS_SOURCES)}' --binding HM_CONFIGURATIONS\`, { stdio: 'inherit' });
    
    console.log('Setting categories...');
    execSync(\`npx wrangler kv key put "config:categories" '\${JSON.stringify(CATEGORIES)}' --binding HM_CONFIGURATIONS\`, { stdio: 'inherit' });
    
    console.log('Setting site config...');
    execSync(\`npx wrangler kv key put "config:site" '\${JSON.stringify(SITE_CONFIG)}' --binding HM_CONFIGURATIONS\`, { stdio: 'inherit' });
    
    console.log('✅ Enhanced configuration initialized successfully');
  } catch (error) {
    console.log('⚠️ Configuration will be set after first deployment');
    console.log('This is normal if wrangler.toml bindings are not active yet');
    
    // Save config to file for manual initialization later
    require('fs').writeFileSync('config_data.json', JSON.stringify({
      RSS_SOURCES,
      CATEGORIES,
      SITE_CONFIG
    }, null, 2));
    
    console.log('💾 Configuration saved to config_data.json for later initialization');
  }
}

initializeConfig();
