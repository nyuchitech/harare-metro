// worker/utils/logger.js - Worker-compatible logging utility
/* eslint-env worker */

// In Cloudflare Workers, we don't have process.env.NODE_ENV, so we use a different approach
// Development is detected by checking if we're in the local dev environment
const isDevelopment = globalThis.ENVIRONMENT !== 'production'

export const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug('[WORKER-DEBUG]', ...args)
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info('[WORKER-INFO]', ...args)
    }
  },
  warn: (...args) => {
    // Always show warnings in workers
    // eslint-disable-next-line no-console
    console.warn('[WORKER-WARN]', ...args)
  },
  error: (...args) => {
    // Always show errors in workers
    // eslint-disable-next-line no-console
    console.error('[WORKER-ERROR]', ...args)
  }
}

export default logger