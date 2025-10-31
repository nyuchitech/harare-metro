-- Add Missing Categories and RSS Sources
-- Based on 002_seed_initial_data.sql

-- =============================================================================
-- ADD MISSING CATEGORIES
-- =============================================================================

INSERT OR IGNORE INTO categories (id, name, emoji, color, description, keywords, sort_order) VALUES
('harare', 'Harare', '🏙️', '#8bc34a', 'Harare city news and updates',
 '["harare", "capital", "city", "urban", "metropolitan", "avondale", "borrowdale", "eastlea", "highlands", "kopje", "mbare", "waterfalls", "westgate"]', 10),
('agriculture', 'Agriculture', '🌾', '#81c784', 'Agricultural news and farming',
 '["agriculture", "farming", "crop", "livestock", "tobacco", "maize", "cotton", "farmer", "harvest", "irrigation", "land", "rural", "commercial farming"]', 11),
('crime', 'Crime', '🚔', '#e57373', 'Crime and law enforcement news',
 '["crime", "police", "arrest", "court", "justice", "theft", "murder", "robbery", "investigation", "criminal", "law enforcement", "prison", "sentence"]', 12),
('environment', 'Environment', '🌍', '#81c784', 'Environmental news and conservation',
 '["environment", "climate", "conservation", "pollution", "wildlife", "deforestation", "recycling", "renewable energy", "sustainability", "ecosystem", "biodiversity"]', 13);

-- =============================================================================
-- ADD MISSING RSS SOURCES
-- =============================================================================

INSERT OR IGNORE INTO rss_sources (id, name, url, category, enabled, priority) VALUES
('the-herald', 'The Herald', 'https://www.herald.co.zw/feed/', 'general', 1, 5),
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
