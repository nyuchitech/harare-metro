// src/utils/logger.js - Centralized logging utility
/* eslint-env browser */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug('[DEBUG]', ...args)
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args) => {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', ...args)
  },
  error: (...args) => {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', ...args)
  }
}

export default logger