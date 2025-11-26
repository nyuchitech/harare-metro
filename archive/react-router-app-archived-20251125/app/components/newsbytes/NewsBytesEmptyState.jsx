/**
 * NewsBytesEmptyState - Empty state when no articles with images found
 * Shown when there's an error or no content available
 */

import { RefreshCw, ImageOff } from "lucide-react";

export function NewsBytesEmptyState({ error, onRefresh, isRefreshing }) {
  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      {/* Zimbabwe flag strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      <div className="text-center space-y-6 px-6 max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto rounded-full bg-white/5 flex items-center justify-center">
          <ImageOff className="w-12 h-12 text-white/50" />
        </div>

        {/* Title */}
        <h3 className="font-serif text-2xl font-bold">No Visual Stories</h3>

        {/* Message */}
        <p className="text-white/70 font-sans leading-relaxed">
          {error || "We couldn't find any articles with images right now. Try refreshing or check back later."}
        </p>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center space-x-2 px-6 py-4 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Stories'}</span>
        </button>

        {/* Back button */}
        <a
          href="/"
          className="block text-white/70 hover:text-white transition-colors py-2 font-medium"
        >
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
