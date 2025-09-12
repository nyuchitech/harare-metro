// src/components/SEO.jsx - Vite Head Management
import { useEffect } from 'react'

const SEO = ({ 
  title, 
  description, 
  keywords, 
  image, 
  url,
  type = 'website',
  article = null 
}) => {
  const siteTitle = 'Harare Metro - Zimbabwe News Aggregator'
  const defaultDescription = 'Stay informed with the latest news from Zimbabwe. Real-time aggregation from Herald, NewsDay, Chronicle, ZBC and more trusted local sources.'
  const defaultKeywords = 'Zimbabwe news, Harare news, Zimbabwe politics, Zimbabwe economy, Herald Zimbabwe, NewsDay, Chronicle, ZBC News'
  const defaultImage = 'https://www.hararemetro.co.zw/og-image.png'
  const siteUrl = 'https://www.hararemetro.co.zw'
  
  const finalTitle = title ? `${title} | ${siteTitle}` : siteTitle
  const finalDescription = description || defaultDescription
  const finalKeywords = keywords || defaultKeywords
  const finalImage = image || defaultImage
  const finalUrl = url || siteUrl

  useEffect(() => {
    // Update document title
    document.title = finalTitle

    // Helper function to update or create meta tags
    const updateMetaTag = (name, content, property = false) => {
      const attribute = property ? 'property' : 'name'
      let meta = document.querySelector(`meta[${attribute}="${name}"]`)
      
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(attribute, name)
        document.head.appendChild(meta)
      }
      
      meta.setAttribute('content', content)
    }

    // Update meta tags
    updateMetaTag('description', finalDescription)
    updateMetaTag('keywords', finalKeywords)
    updateMetaTag('author', 'Harare Metro')
    updateMetaTag('robots', 'index, follow')
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0')

    // Open Graph tags
    updateMetaTag('og:title', finalTitle, true)
    updateMetaTag('og:description', finalDescription, true)
    updateMetaTag('og:image', finalImage, true)
    updateMetaTag('og:url', finalUrl, true)
    updateMetaTag('og:type', type, true)
    updateMetaTag('og:site_name', 'Harare Metro', true)

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', finalTitle)
    updateMetaTag('twitter:description', finalDescription)
    updateMetaTag('twitter:image', finalImage)

    // Article-specific meta tags
    if (article) {
      updateMetaTag('article:published_time', article.pubDate, true)
      updateMetaTag('article:author', article.source, true)
      updateMetaTag('article:section', article.category, true)
      updateMetaTag('article:tag', `${article.category}, Zimbabwe news, ${article.source}`, true)
    }

    // Theme color for mobile browsers
    updateMetaTag('theme-color', '#3b82f6')
    updateMetaTag('msapplication-TileColor', '#3b82f6')

    // Add structured data for articles
    if (article) {
      const existingScript = document.getElementById('structured-data')
      if (existingScript) {
        existingScript.remove()
      }

      const script = document.createElement('script')
      script.id = 'structured-data'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "description": article.description || finalDescription,
        "datePublished": article.pubDate,
        "dateModified": article.pubDate,
        "author": {
          "@type": "Organization",
          "name": article.source
        },
        "publisher": {
          "@type": "Organization",
          "name": "Harare Metro",
          "logo": {
            "@type": "ImageObject",
            "url": `${siteUrl}/logo.png`
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": article.link
        },
        "keywords": `${article.category}, Zimbabwe news, ${article.source}`,
        "articleSection": article.category
      })
      document.head.appendChild(script)
    }

  }, [finalTitle, finalDescription, finalKeywords, finalImage, finalUrl, type, article])

  // This component doesn't render anything
  return null
}

export default SEO
