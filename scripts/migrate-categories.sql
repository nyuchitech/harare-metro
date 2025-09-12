-- Update Categories to Comprehensive System
-- This script updates the categories table with the new comprehensive category system

-- Clear existing categories (except for foreign key references)
DELETE FROM categories WHERE id NOT IN (
  SELECT DISTINCT category_id FROM articles WHERE category_id IS NOT NULL
);

-- Insert new comprehensive categories
INSERT OR REPLACE INTO categories (id, name, emoji, color, description, keywords, sort_order) VALUES
-- Entertainment & Media
('movies_cinema', 'Movies & Cinema', '🎬', '#ff6b6b', 'Movies, cinema, film industry news', 'movies,cinema,film,entertainment,hollywood,bollywood,actors', 1),
('music_audio', 'Music & Audio', '🎵', '#4ecdc4', 'Music industry, artists, audio technology', 'music,songs,artists,albums,concerts,audio,streaming', 2),
('gaming_esports', 'Gaming & Esports', '🎮', '#45b7d1', 'Gaming industry and esports coverage', 'gaming,esports,video games,tournaments,streamers', 3),
('books_literature', 'Books & Literature', '📚', '#96ceb4', 'Books, literature, and publishing', 'books,literature,authors,publishing,novels,reading', 4),

-- Lifestyle & Culture
('fashion_style', 'Fashion & Style', '👗', '#ffa726', 'Fashion trends and style news', 'fashion,style,clothing,trends,designers,beauty', 5),
('food_culinary', 'Food & Culinary', '🍳', '#ef5350', 'Food, cooking, and culinary arts', 'food,cooking,recipes,restaurants,chefs,culinary', 6),
('travel_adventure', 'Travel & Adventure', '✈️', '#42a5f5', 'Travel destinations and adventures', 'travel,tourism,destinations,adventure,hotels,vacation', 7),
('fitness_wellness', 'Fitness & Wellness', '💪', '#66bb6a', 'Health, fitness, and wellness', 'fitness,health,wellness,exercise,nutrition,yoga', 8),

-- Technology & Innovation
('tech_gadgets', 'Technology & Gadgets', '📱', '#7e57c2', 'Technology news and gadget reviews', 'technology,tech,gadgets,smartphones,computers,innovation', 9),
('ai_future', 'AI & Future Tech', '🤖', '#5c6bc0', 'Artificial Intelligence and future technology', 'ai,artificial intelligence,machine learning,robotics,future tech', 10),
('crypto_blockchain', 'Crypto & Blockchain', '₿', '#ff9800', 'Cryptocurrency and blockchain technology', 'crypto,cryptocurrency,bitcoin,blockchain,defi,nft', 11),

-- Social & Community
('local_community', 'Local Community', '🏘️', '#8bc34a', 'Local community news and events', 'community,local,neighborhood,events,social,harare,zimbabwe', 12),
('social_activism', 'Social & Activism', '✊', '#e91e63', 'Social justice and activism', 'activism,social justice,rights,protests,advocacy', 13),
('relationships_dating', 'Relationships & Dating', '💕', '#f06292', 'Relationships and dating advice', 'relationships,dating,love,marriage,family', 14),

-- Business & Career
('entrepreneurship', 'Entrepreneurship', '🚀', '#ff7043', 'Startup and entrepreneurship news', 'entrepreneurship,startups,business,innovation,funding', 15),
('career_professional', 'Career & Professional', '💼', '#546e7a', 'Career development and professional growth', 'career,jobs,professional,workplace,skills,employment', 16),
('finance_investing', 'Finance & Investing', '💰', '#4caf50', 'Financial news and investing', 'finance,investing,money,stocks,economy,banking', 17),

-- Arts & Creativity
('visual_arts', 'Visual Arts', '🎨', '#ab47bc', 'Visual arts and creative expression', 'art,painting,sculpture,gallery,artists,creative', 18),
('photography', 'Photography', '📸', '#26c6da', 'Photography and visual storytelling', 'photography,photos,camera,visual,instagram,images', 19),
('design_creative', 'Design & Creative', '✨', '#ffee58', 'Design trends and creative industries', 'design,creative,graphics,ui,ux,branding', 20),

-- Education & Learning
('science_research', 'Science & Research', '🔬', '#29b6f6', 'Scientific research and discoveries', 'science,research,discovery,studies,laboratory,innovation', 21),
('history_culture', 'History & Culture', '🏛️', '#a1887f', 'Historical events and cultural heritage', 'history,culture,heritage,tradition,archaeology,museum', 22),
('languages_learning', 'Languages & Learning', '🗣️', '#9ccc65', 'Language learning and education', 'language,learning,education,skills,courses,knowledge', 23),

-- Sports & Recreation
('sports_athletics', 'Sports & Athletics', '⚽', '#ff8a65', 'Sports news and athletic events', 'sports,football,cricket,athletics,soccer,warriors', 24),
('outdoor_nature', 'Outdoor & Nature', '🌲', '#81c784', 'Outdoor activities and nature', 'outdoor,nature,hiking,camping,environment,wildlife', 25),
('hobbies_crafts', 'Hobbies & Crafts', '🧶', '#ba68c8', 'Hobbies and craft activities', 'hobbies,crafts,diy,making,creative,projects', 26),

-- News & Current Events  
('politics_governance', 'Politics & Governance', '🏛️', '#78909c', 'Political news and governance', 'politics,government,parliament,elections,mnangagwa,zanu-pf,mdc,chamisa', 27),
('world_news', 'World News', '🌍', '#42a5f5', 'International and world news', 'world,international,global,foreign,africa,regional', 28),
('local_news', 'Local News', '📰', '#66bb6a', 'Local Zimbabwe news and events', 'zimbabwe,harare,bulawayo,mutare,local,national', 29),

-- Spirituality & Philosophy
('spirituality_religion', 'Spirituality & Religion', '🙏', '#ce93d8', 'Spiritual and religious content', 'religion,spirituality,faith,church,prayer,belief', 30),
('philosophy_thought', 'Philosophy & Thought', '🤔', '#90a4ae', 'Philosophy and deep thinking', 'philosophy,thinking,wisdom,ethics,meaning,life', 31),
('personal_development', 'Personal Development', '🌱', '#a5d6a7', 'Self-improvement and personal growth', 'self-improvement,personal development,growth,mindset,motivation', 32),

-- Keep existing categories that have articles
('general', 'General', '📰', '#66bb6a', 'General news and miscellaneous content', 'general,news,misc,other', 100),
('all', 'All News', '📰', '#6B7280', 'All news articles', '', 0);

-- Update category keywords for better article classification
UPDATE categories SET keywords = 
  CASE id
    WHEN 'politics_governance' THEN 'politics,government,parliament,elections,mnangagwa,zanu-pf,mdc,chamisa,political,governance,policy'
    WHEN 'local_news' THEN 'zimbabwe,harare,bulawayo,mutare,gweru,kwekwe,local,national,zim'
    WHEN 'finance_investing' THEN 'economy,finance,business,money,currency,inflation,bond,rtgs,usd,banking,investing'
    WHEN 'sports_athletics' THEN 'sports,football,cricket,soccer,warriors,dynamos,caps united,highlanders,athletics'
    WHEN 'tech_gadgets' THEN 'technology,tech,digital,internet,mobile,computer,software,innovation'
    WHEN 'outdoor_nature' THEN 'environment,climate,nature,conservation,wildlife,mining,agriculture,farming'
    WHEN 'food_culinary' THEN 'agriculture,farming,maize,tobacco,cotton,food,cooking,nutrition'
    WHEN 'fitness_wellness' THEN 'health,medical,hospital,healthcare,wellness,fitness,nutrition'
    WHEN 'career_professional' THEN 'employment,jobs,career,work,education,skills,training'
    WHEN 'local_community' THEN 'community,social,events,culture,tradition,local,neighborhood'
    ELSE keywords
  END
WHERE id IN ('politics_governance', 'local_news', 'finance_investing', 'sports_athletics', 'tech_gadgets', 'outdoor_nature', 'food_culinary', 'fitness_wellness', 'career_professional', 'local_community');

-- Create category interest tracking table for analytics
CREATE TABLE IF NOT EXISTS user_category_interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  interest_score REAL DEFAULT 0.0,
  view_count INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  last_interaction_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(user_id, category_id)
);

-- Create category performance tracking table
CREATE TABLE IF NOT EXISTS category_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id TEXT NOT NULL,
  date DATE NOT NULL,
  article_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_engagements INTEGER DEFAULT 0,
  unique_readers INTEGER DEFAULT 0,
  avg_read_time REAL DEFAULT 0.0,
  bounce_rate REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE(category_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_category_interests_user_id ON user_category_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_interests_category_id ON user_category_interests(category_id);
CREATE INDEX IF NOT EXISTS idx_category_performance_category_date ON category_performance(category_id, date);
CREATE INDEX IF NOT EXISTS idx_category_performance_date ON category_performance(date);

-- Update existing articles to use better category mapping where possible
UPDATE articles SET category_id = 
  CASE 
    WHEN LOWER(title) LIKE '%politics%' OR LOWER(title) LIKE '%government%' OR LOWER(title) LIKE '%parliament%' THEN 'politics_governance'
    WHEN LOWER(title) LIKE '%economy%' OR LOWER(title) LIKE '%business%' OR LOWER(title) LIKE '%finance%' THEN 'finance_investing'
    WHEN LOWER(title) LIKE '%technology%' OR LOWER(title) LIKE '%tech%' OR LOWER(title) LIKE '%digital%' THEN 'tech_gadgets'
    WHEN LOWER(title) LIKE '%sports%' OR LOWER(title) LIKE '%football%' OR LOWER(title) LIKE '%cricket%' THEN 'sports_athletics'
    WHEN LOWER(title) LIKE '%health%' OR LOWER(title) LIKE '%medical%' OR LOWER(title) LIKE '%hospital%' THEN 'fitness_wellness'
    WHEN LOWER(title) LIKE '%harare%' OR LOWER(title) LIKE '%zimbabwe%' OR LOWER(title) LIKE '%local%' THEN 'local_news'
    ELSE 'general'
  END
WHERE category_id = 'general' OR category_id IS NULL;