// Fixed ShareModal.jsx - Add missing React import
import React, { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ShareIcon,
  LinkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const ShareModal = ({ article, isOpen, onClose, currentColors }) => {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    if (article) {
      // Create a shareable URL for the article
      const url = `${window.location.origin}?article=${encodeURIComponent(article.guid)}&source=${encodeURIComponent(article.source)}`
      setShareUrl(url)
    }
  }, [article])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: '💬',
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${article?.title}\n\n${shareUrl}`)}`
    },
    {
      name: 'Twitter',
      icon: '🐦',
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article?.title)}&url=${encodeURIComponent(shareUrl)}&hashtags=Zimbabwe,News`
    },
    {
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Telegram',
      icon: '✈️',
      color: 'bg-blue-400 hover:bg-blue-500',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(article?.title)}`
    }
  ]

  if (!isOpen || !article) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`${currentColors.cardBg} rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <ShareIcon className={`h-6 w-6 ${currentColors.text}`} />
            <h3 className={`text-lg font-semibold ${currentColors.text}`}>
              Share Article
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className={`h-5 w-5 ${currentColors.textMuted}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Article Preview */}
          <div className={`p-4 rounded-lg ${currentColors.statsBg}`}>
            <h4 className={`font-medium ${currentColors.text} mb-2 line-clamp-2`}>
              {article.title}
            </h4>
            <p className={`text-sm ${currentColors.textMuted}`}>
              {article.source} • {new Date(article.pubDate).toLocaleDateString()}
            </p>
          </div>

          {/* Copy Link */}
          <div>
            <label className={`block text-sm font-medium ${currentColors.text} mb-2`}>
              Copy Link
            </label>
            <div className="flex">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className={`flex-1 px-3 py-2 border rounded-l-lg ${currentColors.border} ${currentColors.inputBg} ${currentColors.text} text-sm`}
              />
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-r-lg transition-all ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {copied && (
              <p className="text-green-600 text-sm mt-1">Link copied to clipboard!</p>
            )}
          </div>

          {/* Share Options */}
          <div>
            <label className={`block text-sm font-medium ${currentColors.text} mb-3`}>
              Share on Social Media
            </label>
            <div className="grid grid-cols-2 gap-3">
              {shareOptions.map(option => (
                <a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium transition-all hover:scale-105 ${option.color}`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm">{option.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareModal