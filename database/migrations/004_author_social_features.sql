-- Migration: Author Social Features & Profile Management
-- Adds author profiles, follow functionality, cross-outlet support, and social engagement

-- ===== ENHANCE AUTHORS FOR SOCIAL FEATURES =====

-- Add social and profile fields to authors
ALTER TABLE authors ADD COLUMN slug TEXT UNIQUE; -- URL-friendly identifier (auto-generated)
ALTER TABLE authors ADD COLUMN profile_description TEXT; -- Rich bio/description
ALTER TABLE authors ADD COLUMN specialization TEXT; -- Main areas of expertise
ALTER TABLE authors ADD COLUMN years_experience INTEGER DEFAULT 0; -- Years in journalism
ALTER TABLE authors ADD COLUMN education TEXT; -- Educational background
ALTER TABLE authors ADD COLUMN awards TEXT; -- JSON array of awards/recognition
ALTER TABLE authors ADD COLUMN contact_email TEXT; -- Public contact email
ALTER TABLE authors ADD COLUMN website_url TEXT; -- Personal/professional website
ALTER TABLE authors ADD COLUMN instagram_handle TEXT;
ALTER TABLE authors ADD COLUMN facebook_url TEXT;
ALTER TABLE authors ADD COLUMN youtube_url TEXT;
ALTER TABLE authors ADD COLUMN is_verified BOOLEAN DEFAULT false; -- Editorial verification
ALTER TABLE authors ADD COLUMN follower_count INTEGER DEFAULT 0; -- Follower count
ALTER TABLE authors ADD COLUMN following_count INTEGER DEFAULT 0; -- Who they follow
ALTER TABLE authors ADD COLUMN total_engagement INTEGER DEFAULT 0; -- Likes + shares + comments
ALTER TABLE authors ADD COLUMN profile_views INTEGER DEFAULT 0; -- Profile page views
ALTER TABLE authors ADD COLUMN is_featured BOOLEAN DEFAULT false; -- Featured author status
ALTER TABLE authors ADD COLUMN featured_until TIMESTAMP; -- Featured author expiry
ALTER TABLE authors ADD COLUMN last_active TIMESTAMP; -- Last article published
ALTER TABLE authors ADD COLUMN status TEXT DEFAULT 'active'; -- 'active', 'inactive', 'retired'

-- ===== AUTHOR-OUTLET RELATIONSHIPS =====

-- Authors can write for multiple outlets (many-to-many)
CREATE TABLE IF NOT EXISTS author_outlets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    outlet_id TEXT NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'contributor', -- 'staff', 'freelance', 'contributor', 'correspondent', 'editor'
    start_date DATE,
    end_date DATE,
    is_primary BOOLEAN DEFAULT false, -- Primary outlet for the author
    articles_count INTEGER DEFAULT 0, -- Articles written for this outlet
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(author_id, outlet_id)
);

-- ===== SOCIAL FOLLOWING SYSTEM =====

-- User follows authors
CREATE TABLE IF NOT EXISTS user_author_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_preferences TEXT DEFAULT 'all', -- 'all', 'breaking', 'weekly', 'none'
    
    UNIQUE(user_id, author_id)
);

-- User follows news sources/outlets
CREATE TABLE IF NOT EXISTS user_source_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_preferences TEXT DEFAULT 'all',
    
    UNIQUE(user_id, source_id)
);

-- Author follows other authors (professional network)
CREATE TABLE IF NOT EXISTS author_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    following_author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(follower_author_id, following_author_id),
    CHECK(follower_author_id != following_author_id)
);

-- ===== AUTHOR ENGAGEMENT & ANALYTICS =====

-- Track author profile interactions
CREATE TABLE IF NOT EXISTS author_profile_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL, -- 'view', 'follow', 'unfollow', 'share', 'contact'
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Author collaboration tracking
CREATE TABLE IF NOT EXISTS author_collaborations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    primary_author_id INTEGER NOT NULL REFERENCES authors(id),
    collaborator_author_id INTEGER NOT NULL REFERENCES authors(id),
    collaboration_type TEXT DEFAULT 'co-author', -- 'co-author', 'editor', 'contributor'
    contribution_percentage REAL DEFAULT 50.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(article_id, primary_author_id, collaborator_author_id)
);

-- ===== AUTHOR VERIFICATION & CREDIBILITY =====

-- Author verification requests and process
CREATE TABLE IF NOT EXISTS author_verification_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    requested_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verification_type TEXT NOT NULL, -- 'identity', 'credentials', 'employment'
    evidence_urls TEXT, -- JSON array of supporting documents/links
    admin_notes TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

-- Author credibility scores and factors
CREATE TABLE IF NOT EXISTS author_credibility (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL UNIQUE REFERENCES authors(id) ON DELETE CASCADE,
    
    -- Credibility factors
    fact_check_score REAL DEFAULT 0.5, -- 0-1 based on fact-checking
    source_reliability REAL DEFAULT 0.5, -- Based on outlet credibility
    peer_recognition REAL DEFAULT 0.5, -- Recognition from other journalists
    reader_trust REAL DEFAULT 0.5, -- Reader feedback and engagement
    correction_rate REAL DEFAULT 0.0, -- Rate of corrections/retractions
    
    -- Calculated overall score
    overall_credibility REAL DEFAULT 0.5,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== ENHANCED NEWS SOURCES FOR FOLLOWING =====

-- Add social features to news sources
ALTER TABLE news_sources ADD COLUMN follower_count INTEGER DEFAULT 0;
ALTER TABLE news_sources ADD COLUMN description TEXT; -- Source description for profiles
ALTER TABLE news_sources ADD COLUMN founded_year INTEGER; -- When the outlet was founded
ALTER TABLE news_sources ADD COLUMN headquarters TEXT; -- Location/headquarters
ALTER TABLE news_sources ADD COLUMN editor_in_chief TEXT; -- Current editor-in-chief
ALTER TABLE news_sources ADD COLUMN circulation INTEGER; -- Print circulation or web traffic
ALTER TABLE news_sources ADD COLUMN social_media_handles TEXT; -- JSON of social handles
ALTER TABLE news_sources ADD COLUMN awards TEXT; -- JSON array of awards/recognition

-- ===== CATEGORY MANAGEMENT ENHANCEMENTS =====

-- Category managers and editorial oversight
CREATE TABLE IF NOT EXISTS category_managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    manager_type TEXT DEFAULT 'editor', -- 'editor', 'moderator', 'contributor'
    permissions TEXT NOT NULL, -- JSON array of permissions
    appointed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    appointed_by INTEGER REFERENCES users(id),
    
    UNIQUE(category_id, user_id)
);

-- Author-category expertise mapping
CREATE TABLE IF NOT EXISTS author_category_expertise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    expertise_level TEXT DEFAULT 'general', -- 'expert', 'specialist', 'general', 'occasional'
    articles_written INTEGER DEFAULT 0,
    avg_quality_score REAL DEFAULT 0.0,
    reader_rating REAL DEFAULT 0.0,
    last_article_date TIMESTAMP,
    
    UNIQUE(author_id, category_id)
);

-- ===== ZIMBABWE JOURNALIST PROFILES =====

-- Populate verified Zimbabwe journalists with profiles
UPDATE authors SET 
    slug = LOWER(REPLACE(normalized_name, '_', '-')),
    profile_description = CASE 
        WHEN name = 'Innocent Mujeri' THEN 'Chief Reporter at The Herald covering politics and government affairs. Experienced in parliamentary reporting and policy analysis.'
        WHEN name = 'Farirai Machivenyika' THEN 'Senior political reporter with expertise in Zimbabwe parliament and governance issues.'
        WHEN name = 'Freeman Razemba' THEN 'Senior crime and security correspondent with extensive experience in law enforcement reporting.'
        WHEN name = 'Richard Muponde' THEN 'Political reporter covering government affairs and policy developments in Zimbabwe.'
        WHEN name = 'Mashudu Netsianda' THEN 'Senior reporter covering politics and local government issues in Matabeleland region.'
        WHEN name = 'Privilege Gumbodete' THEN 'Political Editor with deep analysis of Zimbabwe political landscape and policy implications.'
        WHEN name = 'Charles Rukuni' THEN 'Business Editor specializing in economic analysis and business development in Zimbabwe.'
        WHEN name = 'Miriam Mangwaya' THEN 'Political reporter focusing on governance and democratic processes.'
        ELSE 'Professional journalist contributing to Zimbabwe news coverage.'
    END,
    specialization = CASE
        WHEN title LIKE '%Business%' OR title LIKE '%Economic%' THEN 'Business & Economics'
        WHEN title LIKE '%Political%' OR title LIKE '%Politics%' THEN 'Politics & Government' 
        WHEN title LIKE '%Crime%' OR title LIKE '%Security%' THEN 'Crime & Security'
        WHEN title LIKE '%Editor%' THEN 'Editorial & Analysis'
        ELSE 'General News'
    END,
    years_experience = CASE
        WHEN title LIKE '%Senior%' OR title LIKE '%Chief%' THEN 10
        WHEN title LIKE '%Editor%' THEN 15
        ELSE 5
    END,
    is_verified = true,
    status = 'active',
    last_active = CURRENT_TIMESTAMP
WHERE verification_status = 'verified';

-- ===== INDEXES FOR PERFORMANCE =====

-- Author social features indexes
CREATE INDEX IF NOT EXISTS idx_authors_slug ON authors(slug);
CREATE INDEX IF NOT EXISTS idx_authors_follower_count ON authors(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_authors_is_featured ON authors(is_featured, featured_until);
CREATE INDEX IF NOT EXISTS idx_authors_status ON authors(status);
CREATE INDEX IF NOT EXISTS idx_authors_last_active ON authors(last_active DESC);

-- Following relationships indexes
CREATE INDEX IF NOT EXISTS idx_user_author_follows_user ON user_author_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_author_follows_author ON user_author_follows(author_id);
CREATE INDEX IF NOT EXISTS idx_user_source_follows_user ON user_source_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_source_follows_source ON user_source_follows(source_id);
CREATE INDEX IF NOT EXISTS idx_author_follows_follower ON author_follows(follower_author_id);
CREATE INDEX IF NOT EXISTS idx_author_follows_following ON author_follows(following_author_id);

-- Author-outlet relationship indexes
CREATE INDEX IF NOT EXISTS idx_author_outlets_author ON author_outlets(author_id);
CREATE INDEX IF NOT EXISTS idx_author_outlets_outlet ON author_outlets(outlet_id);
CREATE INDEX IF NOT EXISTS idx_author_outlets_primary ON author_outlets(is_primary);

-- Profile interaction indexes
CREATE INDEX IF NOT EXISTS idx_author_profile_interactions_author ON author_profile_interactions(author_id);
CREATE INDEX IF NOT EXISTS idx_author_profile_interactions_type ON author_profile_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_author_profile_interactions_date ON author_profile_interactions(created_at DESC);

-- Category management indexes
CREATE INDEX IF NOT EXISTS idx_category_managers_category ON category_managers(category_id);
CREATE INDEX IF NOT EXISTS idx_category_managers_user ON category_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_author_category_expertise_author ON author_category_expertise(author_id);
CREATE INDEX IF NOT EXISTS idx_author_category_expertise_category ON author_category_expertise(category_id);

-- ===== TRIGGERS FOR AUTOMATION =====

-- Auto-generate author slug when name changes
CREATE TRIGGER IF NOT EXISTS generate_author_slug
    AFTER INSERT ON authors
    FOR EACH ROW
    WHEN NEW.slug IS NULL
    BEGIN
        UPDATE authors 
        SET slug = LOWER(REPLACE(REPLACE(NEW.normalized_name, '_', '-'), '--', '-'))
        WHERE id = NEW.id;
    END;

-- Update follower counts when user follows author
CREATE TRIGGER IF NOT EXISTS update_author_follower_count_on_follow
    AFTER INSERT ON user_author_follows
    FOR EACH ROW
    BEGIN
        UPDATE authors 
        SET follower_count = follower_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.author_id;
    END;

-- Update follower counts when user unfollows author
CREATE TRIGGER IF NOT EXISTS update_author_follower_count_on_unfollow
    AFTER DELETE ON user_author_follows
    FOR EACH ROW
    BEGIN
        UPDATE authors 
        SET follower_count = follower_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.author_id;
    END;

-- Update source follower counts
CREATE TRIGGER IF NOT EXISTS update_source_follower_count_on_follow
    AFTER INSERT ON user_source_follows
    FOR EACH ROW
    BEGIN
        UPDATE news_sources 
        SET follower_count = follower_count + 1
        WHERE id = NEW.source_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_source_follower_count_on_unfollow
    AFTER DELETE ON user_source_follows
    FOR EACH ROW
    BEGIN
        UPDATE news_sources 
        SET follower_count = follower_count - 1
        WHERE id = OLD.source_id;
    END;

-- Update author following counts
CREATE TRIGGER IF NOT EXISTS update_author_following_count_on_follow
    AFTER INSERT ON author_follows
    FOR EACH ROW
    BEGIN
        UPDATE authors 
        SET following_count = following_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.follower_author_id;
    END;

CREATE TRIGGER IF NOT EXISTS update_author_following_count_on_unfollow
    AFTER DELETE ON author_follows
    FOR EACH ROW
    BEGIN
        UPDATE authors 
        SET following_count = following_count - 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.follower_author_id;
    END;

-- Track profile views
CREATE TRIGGER IF NOT EXISTS track_author_profile_view
    AFTER INSERT ON author_profile_interactions
    FOR EACH ROW
    WHEN NEW.interaction_type = 'view'
    BEGIN
        UPDATE authors 
        SET profile_views = profile_views + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.author_id;
    END;

-- Update last active when author publishes article
CREATE TRIGGER IF NOT EXISTS update_author_last_active
    AFTER INSERT ON article_authors
    FOR EACH ROW
    BEGIN
        UPDATE authors 
        SET last_active = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.author_id;
    END;

-- Update author-outlet article counts
CREATE TRIGGER IF NOT EXISTS update_author_outlet_article_count
    AFTER INSERT ON article_authors
    FOR EACH ROW
    BEGIN
        UPDATE author_outlets 
        SET articles_count = articles_count + 1
        WHERE author_id = NEW.author_id 
        AND outlet_id = (
            SELECT source FROM articles WHERE id = NEW.article_id
        );
    END;