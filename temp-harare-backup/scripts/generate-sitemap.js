// scripts/generate-sitemap.js
// Run this script to generate a sitemap for better SEO
// Usage: node scripts/generate-sitemap.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SITE_URL = 'https://www.hararemetro.co.zw'

// All available categories from the app
const CATEGORIES = [
  'politics',
  'economy',
  'business',
  'sports',
  'harare',
  'agriculture',
  'technology',
  'health',
  'education',
  'entertainment',
  'environment',
  'crime',
  'international',
  'lifestyle',
  'finance'
]

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0]
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <!-- Main page -->
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Category pages -->
${CATEGORIES.map(category => `  <url>
    <loc>${SITE_URL}/?category=${category}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')}
  
  <!-- API Documentation -->
  <url>
    <loc>${SITE_URL}/api/schema</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`

  // Write sitemap to public directory
  const publicDir = path.join(__dirname, '..', 'public')
  const sitemapPath = path.join(publicDir, 'sitemap.xml')
  
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8')
  console.log(`✅ Sitemap generated at: ${sitemapPath}`)
  
  // Also generate robots.txt
  const robotsTxt = `# Harare Metro Robots.txt
# https://www.hararemetro.co.zw

User-agent: *
Allow: /
Disallow: /api/
Allow: /api/schema

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml

# Crawl-delay
Crawl-delay: 1

# Zimbabwe news aggregator - optimized for search engines
# Categories: politics, economy, business, sports, harare, agriculture, 
# technology, health, education, entertainment, environment, crime, 
# international, lifestyle, finance`

  const robotsPath = path.join(publicDir, 'robots.txt')
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8')
  console.log(`✅ robots.txt generated at: ${robotsPath}`)
}

// Run the generator
generateSitemap()