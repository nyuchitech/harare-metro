// scripts/generate-sitemap.js
// Run this script to generate a sitemap for better SEO
// Usage: node scripts/generate-sitemap.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SITE_URL = 'https://www.hararemetro.co.zw'
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://admin.hararemetro.co.zw'

// Fetch categories from API
async function fetchCategories() {
  try {
    console.log('Fetching categories from D1 database via API...')
    const response = await fetch(`${BACKEND_API_URL}/api/categories`)
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`✅ Fetched ${data.categories.length} categories from D1 database`)
    
    return data.categories.filter(cat => cat.enabled).map(cat => cat.id)
  } catch (error) {
    console.warn('⚠️  Failed to fetch categories from API:', error.message)
    console.log('Using fallback categories...')
    
    // Fallback categories if API is unavailable
    return [
      'all', 'politics', 'economy', 'technology', 'sports', 'health',
      'education', 'entertainment', 'international', 'general', 'harare',
      'agriculture', 'crime', 'environment'
    ]
  }
}

async function generateSitemap() {
  const categories = await fetchCategories()
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
${categories.map(category => `  <url>
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

  // Write sitemap to both public and build directories
  const publicDir = path.join(__dirname, '..', 'public')
  const buildDir = path.join(__dirname, '..', 'build', 'client')
  const sitemapPath = path.join(publicDir, 'sitemap.xml')
  const buildSitemapPath = path.join(buildDir, 'sitemap.xml')
  
  fs.writeFileSync(sitemapPath, sitemap, 'utf-8')
  console.log(`✅ Sitemap generated at: ${sitemapPath}`)
  
  // Also write to build directory if it exists
  if (fs.existsSync(buildDir)) {
    fs.writeFileSync(buildSitemapPath, sitemap, 'utf-8')
    console.log(`✅ Sitemap also generated at: ${buildSitemapPath}`)
  }
  
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
  const buildRobotsPath = path.join(buildDir, 'robots.txt')
  
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8')
  console.log(`✅ robots.txt generated at: ${robotsPath}`)
  
  // Also write robots.txt to build directory if it exists
  if (fs.existsSync(buildDir)) {
    fs.writeFileSync(buildRobotsPath, robotsTxt, 'utf-8')
    console.log(`✅ robots.txt also generated at: ${buildRobotsPath}`)
  }
}

// Run the generator
generateSitemap()