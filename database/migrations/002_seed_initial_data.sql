-- Migration 002: Seed Initial Data
-- Run this after 001_init_schema.sql to populate with default data

-- =============================================================================
-- SYSTEM CONFIGURATION
-- =============================================================================

INSERT OR IGNORE INTO system_config (key, value, description) VALUES
('site_name', '"Harare Metro"', 'Site name'),
('max_articles_per_source', '500', 'Maximum articles to cache per RSS source'),
('max_total_articles', '40000', 'Maximum total articles to cache'),
('article_content_limit', '1000000', 'Maximum character limit per article'),
('refresh_interval_minutes', '60', 'How often to refresh RSS feeds'),
('pagination_initial_load', '24', 'Articles to load on initial page load'),
('pagination_page_size', '12', 'Articles per page for subsequent loads'),
('pagination_preload_next_page', 'true', 'Preload next page in background'),
('pagination_cache_pages', '3', 'Keep 3 pages cached'),
('enable_analytics', 'true', 'Enable analytics tracking'),
('enable_cloudflare_images', 'true', 'Enable Cloudflare Images optimization'),
('admin_key', '"hararemetro-admin-2025-secure-key"', 'Admin authentication key'),
('cache_strategy_ttl', '14', 'Cache TTL in days'),
('cache_strategy_refresh_interval', '60', 'Background refresh every 60 minutes'),
('data_optimization_compress_images', 'true', 'Always compress images'),
('data_optimization_lazy_load', 'true', 'Load images only when needed'),
('data_optimization_text_first', 'true', 'Load text before images'),
('rss_timeout', '10000', 'RSS fetch timeout in milliseconds'),
('roles_enabled', 'true', 'Enable role-based access control'),
('default_role', '"creator"', 'Default user role'),
('admin_roles', '["admin", "super_admin", "moderator"]', 'Admin roles list'),
('creator_roles', '["creator", "business-creator", "author"]', 'Creator roles list');

-- =============================================================================
-- CATEGORIES
-- =============================================================================

INSERT OR IGNORE INTO categories (id, name, emoji, color, description, keywords, sort_order) VALUES
('all', 'All News', '📰', '#6B7280', 'All news articles from all sources', '[]', 0),
('politics', 'Politics', '🏛️', '#DC2626', 'Political news and government affairs', 
 '["politics", "government", "election", "vote", "parliament", "minister", "president", "policy", "law", "legislation", "democracy", "party", "campaign", "senate", "congress", "political", "governance", "reform", "zanu-pf", "mdc", "ccc", "emmerson mnangagwa", "nelson chamisa"]', 1),
('economy', 'Economy', '💰', '#059669', 'Economic news, business, and finance', 
 '["economy", "business", "finance", "banking", "investment", "market", "economic", "financial", "money", "currency", "inflation", "gdp", "trade", "export", "import", "stock", "bond", "forex", "dollar", "zimbabwe dollar", "usd", "bond notes", "rtgs", "mining", "agriculture", "tobacco", "gold", "platinum", "diamonds", "reserve bank"]', 2),
('technology', 'Technology', '💻', '#2563EB', 'Technology, innovation, and digital news', 
 '["technology", "tech", "digital", "innovation", "startup", "internet", "mobile", "app", "software", "hardware", "computer", "ai", "blockchain", "cryptocurrency", "fintech", "ecocash", "telecash", "onewallett", "econet", "netone", "telecel", "zimbabwe online", "ict", "innovation hub"]', 3),
('sports', 'Sports', '⚽', '#DC2626', 'Sports news and events', 
 '["sports", "football", "soccer", "cricket", "rugby", "tennis", "athletics", "olympics", "world cup", "premier league", "psl", "zimbabwe national team", "warriors", "chevrons", "sables", "dynamos", "caps united", "highlanders", "chicken inn", "fc platinum", "ngezi platinum", "manica diamonds"]', 4),
('health', 'Health', '🏥', '#059669', 'Health, medical, and wellness news', 
 '["health", "medical", "hospital", "doctor", "medicine", "healthcare", "covid", "pandemic", "vaccine", "disease", "treatment", "wellness", "mental health", "public health", "clinic", "nursing", "pharmacy", "medical aid", "psmas", "cimas", "premier medical aid"]', 5),
('education', 'Education', '📚', '#7C3AED', 'Education news and academic affairs', 
 '["education", "school", "university", "student", "teacher", "learning", "academic", "examination", "zimsec", "o level", "a level", "degree", "uz", "msu", "nust", "cut", "buse", "great zimbabwe university", "africa university", "lupane state university", "hit"]', 6),
('entertainment', 'Entertainment', '🎬', '#EC4899', 'Entertainment, arts, and culture', 
 '["entertainment", "music", "movie", "film", "celebrity", "artist", "culture", "arts", "theatre", "concert", "festival", "book", "literature", "zimbo", "zim dancehall", "sungura", "gospel", "winky d", "jah prayzah", "ammara brown", "takura", "holy ten"]', 7),
('international', 'International', '🌍', '#0891B2', 'International and world news', 
 '["international", "world", "global", "foreign", "africa", "sadc", "south africa", "botswana", "zambia", "malawi", "mozambique", "usa", "uk", "china", "europe", "brexit", "trump", "biden", "putin", "ukraine", "russia", "middle east", "israel", "palestine"]', 8),
('general', 'General', '📰', '#66bb6a', 'General news and updates', 
 '["news", "zimbabwe", "africa", "breaking", "latest", "update", "report", "story"]', 9),
('harare', 'Harare', '🏙️', '#8bc34a', 'Harare city news and updates', 
 '["harare", "capital", "city", "urban", "metropolitan", "avondale", "borrowdale", "eastlea", "highlands", "kopje", "mbare", "waterfalls", "westgate"]', 10),
('agriculture', 'Agriculture', '🌾', '#81c784', 'Agricultural news and farming', 
 '["agriculture", "farming", "crop", "livestock", "tobacco", "maize", "cotton", "farmer", "harvest", "irrigation", "land", "rural", "commercial farming"]', 11),
('crime', 'Crime', '🚔', '#e57373', 'Crime and law enforcement news', 
 '["crime", "police", "arrest", "court", "justice", "theft", "murder", "robbery", "investigation", "criminal", "law enforcement", "prison", "sentence"]', 12),
('environment', 'Environment', '🌍', '#81c784', 'Environmental news and conservation', 
 '["environment", "climate", "conservation", "pollution", "wildlife", "deforestation", "recycling", "renewable energy", "sustainability", "ecosystem", "biodiversity"]', 13);

-- =============================================================================
-- RSS SOURCES
-- =============================================================================

INSERT OR IGNORE INTO rss_sources (id, name, url, category, enabled, priority) VALUES
('herald-zimbabwe', 'Herald Zimbabwe', 'https://www.herald.co.zw/feed/', 'general', 1, 5),
('newsday-zimbabwe', 'NewsDay Zimbabwe', 'https://www.newsday.co.zw/feed/', 'general', 1, 5),
('chronicle-zimbabwe', 'Chronicle Zimbabwe', 'https://www.chronicle.co.zw/feed/', 'general', 1, 5),
('zbc-news', 'ZBC News', 'https://www.zbc.co.zw/feed/', 'news', 1, 4),
('business-weekly', 'Business Weekly', 'https://businessweekly.co.zw/feed/', 'business', 1, 4),
('techzim', 'Techzim', 'https://www.techzim.co.zw/feed/', 'technology', 1, 4),
('the-standard', 'The Standard', 'https://www.thestandard.co.zw/feed/', 'general', 1, 4),
('zimlive', 'ZimLive', 'https://www.zimlive.com/feed/', 'general', 1, 4),
('new-zimbabwe', 'New Zimbabwe', 'https://www.newzimbabwe.com/feed/', 'general', 1, 4),
('the-independent', 'The Independent', 'https://www.theindependent.co.zw/feed/', 'general', 1, 4),
('sunday-mail', 'Sunday Mail', 'https://www.sundaymail.co.zw/feed/', 'general', 1, 3),
('263chat', '263Chat', 'https://263chat.com/feed/', 'general', 1, 4),
('daily-news', 'Daily News', 'https://www.dailynews.co.zw/feed/', 'general', 1, 4),
('zimeye', 'ZimEye', 'https://zimeye.net/feed/', 'general', 1, 3),
('pindula-news', 'Pindula News', 'https://news.pindula.co.zw/feed/', 'general', 1, 3),
('zimbabwe-situation', 'Zimbabwe Situation', 'https://zimbabwesituation.com/feed/', 'general', 1, 3),
('nehanda-radio', 'Nehanda Radio', 'https://nehandaradio.com/feed/', 'general', 1, 3),
('open-news-zimbabwe', 'Open News Zimbabwe', 'https://opennews.co.zw/feed/', 'general', 1, 3),
('financial-gazette', 'Financial Gazette', 'https://fingaz.co.zw/feed/', 'business', 1, 4),
('manica-post', 'Manica Post', 'https://manicapost.co.zw/feed/', 'general', 1, 3),
('southern-eye', 'Southern Eye', 'https://southerneye.co.zw/feed/', 'general', 1, 3);

-- =============================================================================
-- TRUSTED DOMAINS
-- =============================================================================

INSERT OR IGNORE INTO trusted_domains (domain, type) VALUES
-- Primary Zimbabwe news sites
('herald.co.zw', 'image'),
('heraldonline.co.zw', 'image'),
('newsday.co.zw', 'image'),
('chronicle.co.zw', 'image'),
('techzim.co.zw', 'image'),
('zbc.co.zw', 'image'),
('businessweekly.co.zw', 'image'),
('thestandard.co.zw', 'image'),
('zimlive.com', 'image'),
('newzimbabwe.com', 'image'),
('theindependent.co.zw', 'image'),
('sundaymail.co.zw', 'image'),
('263chat.com', 'image'),
('dailynews.co.zw', 'image'),
('zimeye.net', 'image'),
('pindula.co.zw', 'image'),
('zimbabwesituation.com', 'image'),
('nehandaradio.com', 'image'),
('opennews.co.zw', 'image'),
('fingaz.co.zw', 'image'),
('manicapost.co.zw', 'image'),
('southerneye.co.zw', 'image'),

-- WordPress and CMS domains
('wp.com', 'image'),
('wordpress.com', 'image'),
('files.wordpress.com', 'image'),
('i0.wp.com', 'image'),
('i1.wp.com', 'image'),
('i2.wp.com', 'image'),
('i3.wp.com', 'image'),

-- CDN and image hosting services
('cloudinary.com', 'image'),
('res.cloudinary.com', 'image'),
('imgur.com', 'image'),
('i.imgur.com', 'image'),
('gravatar.com', 'image'),
('secure.gravatar.com', 'image'),
('amazonaws.com', 'image'),
('s3.amazonaws.com', 'image'),
('cloudfront.net', 'image'),
('unsplash.com', 'image'),
('images.unsplash.com', 'image'),
('pexels.com', 'image'),
('images.pexels.com', 'image'),

-- Google services
('googleusercontent.com', 'image'),
('lh3.googleusercontent.com', 'image'),
('lh4.googleusercontent.com', 'image'),
('lh5.googleusercontent.com', 'image'),
('blogger.googleusercontent.com', 'image'),
('drive.google.com', 'image'),

-- Social media image domains
('fbcdn.net', 'image'),
('scontent.fhre1-1.fna.fbcdn.net', 'image'),
('pbs.twimg.com', 'image'),
('abs.twimg.com', 'image'),
('instagram.com', 'image'),

-- News agency images
('ap.org', 'image'),
('apnews.com', 'image'),
('reuters.com', 'image'),
('bbci.co.uk', 'image'),
('bbc.co.uk', 'image'),
('cnn.com', 'image'),
('media.cnn.com', 'image'),

-- African news networks
('africanews.com', 'image'),
('mg.co.za', 'image'),
('news24.com', 'image'),
('timeslive.co.za', 'image'),
('iol.co.za', 'image'),
('citizen.co.za', 'image'),

-- Generic image hosting
('photobucket.com', 'image'),
('flickr.com', 'image'),
('staticflickr.com', 'image'),
('wikimedia.org', 'image'),
('upload.wikimedia.org', 'image');