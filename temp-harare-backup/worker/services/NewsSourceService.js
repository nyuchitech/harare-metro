// worker/services/NewsSourceService.js - News source profiles and logo management
export class NewsSourceService {
  constructor() {
    this.sourceProfiles = {
      'New Zimbabwe': {
        name: 'New Zimbabwe',
        shortName: 'NewZim',
        logo: 'https://www.newzimbabwe.com/wp-content/themes/newzimbabwe/images/logo.png',
        favicon: 'https://www.newzimbabwe.com/favicon.ico',
        domain: 'newzimbabwe.com',
        description: 'Zimbabwe\'s leading independent news source',
        established: 2005,
        category: 'general',
        credibility: 'high',
        colors: {
          primary: '#c41e3a',
          secondary: '#000000'
        },
        socialMedia: {
          twitter: '@NewZimbabweCom',
          facebook: 'newzimbabwe'
        }
      },
      'Herald Zimbabwe': {
        name: 'Herald Zimbabwe',
        shortName: 'Herald',
        logo: 'https://www.herald.co.zw/wp-content/uploads/sites/2/2019/05/herald-logo-2.png',
        favicon: 'https://www.herald.co.zw/favicon.ico',
        domain: 'herald.co.zw',
        description: 'Zimbabwe\'s national newspaper',
        established: 1891,
        category: 'general',
        credibility: 'high',
        colors: {
          primary: '#0066cc',
          secondary: '#003366'
        }
      },
      'Nehanda Radio': {
        name: 'Nehanda Radio',
        shortName: 'Nehanda',
        logo: 'https://nehandaradio.com/wp-content/uploads/2019/01/nehanda-radio-logo.png',
        favicon: 'https://nehandaradio.com/favicon.ico',
        domain: 'nehandaradio.com',
        description: 'Zimbabwe news and current affairs',
        established: 2010,
        category: 'general',
        credibility: 'medium',
        colors: {
          primary: '#e74c3c',
          secondary: '#c0392b'
        }
      },
      'Pindula News': {
        name: 'Pindula News',
        shortName: 'Pindula',
        logo: 'https://news.pindula.co.zw/wp-content/uploads/2020/04/pindula-news-logo.png',
        favicon: 'https://news.pindula.co.zw/favicon.ico',
        domain: 'news.pindula.co.zw',
        description: 'Breaking news from Zimbabwe',
        established: 2018,
        category: 'general',
        credibility: 'medium',
        colors: {
          primary: '#2ecc71',
          secondary: '#27ae60'
        }
      },
      'Chronicle': {
        name: 'Chronicle',
        shortName: 'Chronicle',
        logo: 'https://www.chronicle.co.zw/wp-content/uploads/sites/3/2019/05/chronicle-logo.png',
        favicon: 'https://www.chronicle.co.zw/favicon.ico',
        domain: 'chronicle.co.zw',
        description: 'Bulawayo\'s premier newspaper',
        established: 1894,
        category: 'general',
        credibility: 'high',
        colors: {
          primary: '#8e44ad',
          secondary: '#732d91'
        }
      },
      'NewsDay': {
        name: 'NewsDay',
        shortName: 'NewsDay',
        logo: 'https://www.newsday.co.zw/wp-content/uploads/2019/newsday-logo.png',
        favicon: 'https://www.newsday.co.zw/favicon.ico',
        domain: 'newsday.co.zw',
        description: 'Zimbabwe\'s independent daily',
        established: 2010,
        category: 'general',
        credibility: 'high',
        colors: {
          primary: '#f39c12',
          secondary: '#e67e22'
        }
      },
      '263Chat': {
        name: '263Chat',
        shortName: '263Chat',
        logo: 'https://263chat.com/wp-content/uploads/2020/01/263chat-logo.png',
        favicon: 'https://263chat.com/favicon.ico',
        domain: '263chat.com',
        description: 'Technology and business news for Zimbabwe',
        established: 2013,
        category: 'technology',
        credibility: 'medium',
        colors: {
          primary: '#3498db',
          secondary: '#2980b9'
        }
      },
      'ZimEye': {
        name: 'ZimEye',
        shortName: 'ZimEye',
        logo: 'https://zimeye.net/wp-content/uploads/2019/zimeye-logo.png',
        favicon: 'https://zimeye.net/favicon.ico',
        domain: 'zimeye.net',
        description: 'Breaking news and current affairs',
        established: 2015,
        category: 'general',
        credibility: 'medium',
        colors: {
          primary: '#e91e63',
          secondary: '#c2185b'
        }
      }
    }
  }

  // Get source profile by name
  getSourceProfile(sourceName) {
    return this.sourceProfiles[sourceName] || this.createFallbackProfile(sourceName)
  }

  // Create fallback profile for unknown sources
  createFallbackProfile(sourceName) {
    const initials = sourceName?.split(' ').map(word => word[0]).join('').toUpperCase() || 'N'
    
    return {
      name: sourceName || 'Unknown Source',
      shortName: sourceName || 'Unknown',
      logo: null,
      favicon: null,
      domain: null,
      description: 'News source',
      established: null,
      category: 'general',
      credibility: 'unknown',
      colors: {
        primary: '#6c757d',
        secondary: '#495057'
      },
      initials
    }
  }

  // Get logo URL with fallbacks
  async getSourceLogo(sourceName, article = null) {
    const profile = this.getSourceProfile(sourceName)
    
    // Try profile logo first
    if (profile.logo) {
      if (await this.isImageAccessible(profile.logo)) {
        return profile.logo
      }
    }

    // Try favicon as fallback
    if (profile.favicon) {
      if (await this.isImageAccessible(profile.favicon)) {
        return profile.favicon
      }
    }

    // Try to extract logo from article link domain
    if (article?.link) {
      const domain = new URL(article.link).hostname
      const potentialLogos = [
        `https://${domain}/wp-content/uploads/logo.png`,
        `https://${domain}/images/logo.png`,
        `https://${domain}/assets/logo.png`,
        `https://${domain}/favicon.ico`,
        `https://${domain}/apple-touch-icon.png`
      ]

      for (const logoUrl of potentialLogos) {
        if (await this.isImageAccessible(logoUrl)) {
          return logoUrl
        }
      }
    }

    return null // No logo found, will use initials
  }

  // Check if image is accessible
  async isImageAccessible(url) {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 3000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Harare Metro; +https://hararemetro.co.zw)'
        }
      })
      return response.ok && response.headers.get('content-type')?.startsWith('image/')
    } catch {
      return false
    }
  }

  // Get all source profiles
  getAllSourceProfiles() {
    return this.sourceProfiles
  }

  // Get sources by category
  getSourcesByCategory(category) {
    return Object.values(this.sourceProfiles).filter(profile => 
      profile.category === category
    )
  }

  // Get source credibility score
  getCredibilityScore(sourceName) {
    const profile = this.getSourceProfile(sourceName)
    const scores = {
      'high': 0.9,
      'medium': 0.7,
      'low': 0.4,
      'unknown': 0.5
    }
    return scores[profile.credibility] || 0.5
  }
}

export default NewsSourceService