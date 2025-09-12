// Generate cache list for service worker

import fs from 'fs'
import path from 'path'

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const fullPath = path.join(dirPath, file)
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles)
    } else {
      arrayOfFiles.push(fullPath)
    }
  })

  return arrayOfFiles
}

// Generate cache manifest
const distPath = path.resolve('./dist')
const files = getAllFiles(distPath)
  .map(file => file.replace(distPath, ''))
  .map(file => file.replace(/\\/g, '/'))
  .filter(file => !file.includes('sw.js'))

const cacheManifest = {
  static: files,
  version: Date.now()
}

console.log('📦 Generated cache manifest:', cacheManifest.static.length, 'files')

// Update service worker with cache list
const swPath = path.resolve('./dist/sw.js')
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, 'utf8')
  
  // Replace cache URLs
  swContent = swContent.replace(
    /const STATIC_CACHE_URLS = \[(.*?)\]/s,
    `const STATIC_CACHE_URLS = ${JSON.stringify(['/', ...cacheManifest.static], null, 2)}`
  )
  
  fs.writeFileSync(swPath, swContent)
  console.log('✅ Service worker updated with cache manifest')
}