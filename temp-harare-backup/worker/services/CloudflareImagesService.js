// worker/services/CloudflareImagesService.js
export class CloudflareImagesService {
  constructor(env) {
    // Get from environment/secrets
    this.accountId = env.CLOUDFLARE_IMAGES_ACCOUNT_ID
    this.imagesToken = env.CLOUDFLARE_IMAGES_TOKEN
    this.enabled = env.CLOUDFLARE_IMAGES_ENABLED === 'true'
    
    // Validate configuration
    if (this.enabled && (!this.accountId || !this.imagesToken)) {
      console.warn('⚠️ Cloudflare Images enabled but missing credentials')
      console.warn(`Account ID: ${this.accountId ? 'Set' : 'Missing'}`)
      console.warn(`Images Token: ${this.imagesToken ? 'Set' : 'Missing'}`)
      this.enabled = false
    }
    
    if (this.enabled) {
      this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`
      console.info('✅ Cloudflare Images service initialized')
    } else {
      console.info('ℹ️ Cloudflare Images service disabled')
    }
  }

  isEnabled() {
    return this.enabled && this.accountId && this.imagesToken
  }

  async uploadImage(imageBuffer, filename, metadata = {}) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Cloudflare Images not enabled or configured' }
    }

    try {
      const formData = new FormData()
      formData.append('file', new Blob([imageBuffer]), filename)
      
      // Add custom ID if provided in metadata
      if (metadata.customId) {
        formData.append('id', metadata.customId)
      }
      
      formData.append('metadata', JSON.stringify({
        source: 'harare-metro',
        uploadedAt: new Date().toISOString(),
        ...metadata
      }))

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.imagesToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      return {
        success: true,
        imageId: result.result.id,
        url: result.result.variants[0],
        variants: result.result.variants,
        filename: result.result.filename
      }
    } catch (error) {
      console.warn('❌ Cloudflare Images upload error:', error.message)
      return { success: false, error: error.message }
    }
  }

  async getImageUrl(imageId, variant = 'public') {
    if (!this.accountId) {
      throw new Error('Account ID not configured')
    }
    return `https://imagedelivery.net/${this.accountId}/${imageId}/${variant}`
  }

  async imageExists(imageId, variant = 'public') {
    try {
      const url = await this.getImageUrl(imageId, variant)
      const response = await fetch(url, { method: 'HEAD' })
      return response.ok
    } catch (error) {
      return false
    }
  }

  async deleteImage(imageId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Cloudflare Images not enabled' }
    }

    try {
      const response = await fetch(`${this.baseUrl}/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.imagesToken}`
        }
      })

      return { 
        success: response.ok,
        status: response.status 
      }
    } catch (error) {
      console.warn('❌ Cloudflare Images delete error:', error.message)
      return { success: false, error: error.message }
    }
  }

  // Get list of uploaded images (admin function)
  async listImages(page = 1, perPage = 50) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Cloudflare Images not enabled' }
    }

    try {
      const response = await fetch(`${this.baseUrl}?page=${page}&per_page=${perPage}`, {
        headers: {
          'Authorization': `Bearer ${this.imagesToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`List failed: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        images: result.result.images,
        count: result.result.count,
        pagination: {
          page,
          perPage,
          total: result.result.count
        }
      }
    } catch (error) {
      console.warn('❌ Cloudflare Images list error:', error.message)
      return { success: false, error: error.message }
    }
  }
}