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

// Generate cache manifest for both build/client and dist directories
const buildPath = path.resolve('./build/client')
const distPath = path.resolve('./dist')
let files = []

// Check build directory first (React Router build)
if (fs.existsSync(buildPath)) {
  files = getAllFiles(buildPath)
    .map(file => file.replace(buildPath, ''))
    .map(file => file.replace(/\\/g, '/'))
    .filter(file => !file.includes('sw.js') && !file.includes('.vite'))
} else if (fs.existsSync(distPath)) {
  // Fallback to dist directory
  files = getAllFiles(distPath)
    .map(file => file.replace(distPath, ''))
    .map(file => file.replace(/\\/g, '/'))
    .filter(file => !file.includes('sw.js'))
}

const cacheManifest = {
  static: files,
  version: Date.now()
}

console.log('📦 Generated cache manifest:', cacheManifest.static.length, 'files')

// Update service worker with cache list in both public and build directories
const publicSwPath = path.resolve('./public/sw.js')
const buildSwPath = path.resolve('./build/client/sw.js')

if (fs.existsSync(publicSwPath)) {
  let swContent = fs.readFileSync(publicSwPath, 'utf8')
  
  // Replace cache URLs
  swContent = swContent.replace(
    /const STATIC_CACHE_URLS = \[(.*?)\]/s,
    `const STATIC_CACHE_URLS = ${JSON.stringify(['/', ...cacheManifest.static], null, 2)}`
  )
  
  fs.writeFileSync(publicSwPath, swContent)
  console.log('✅ Service worker updated at:', publicSwPath)
  
  // Also update build directory if it exists
  if (fs.existsSync(path.dirname(buildSwPath))) {
    fs.writeFileSync(buildSwPath, swContent)
    console.log('✅ Service worker also updated at:', buildSwPath)
  }
} else {
  console.log('⚠️ Service worker not found at:', publicSwPath)
}