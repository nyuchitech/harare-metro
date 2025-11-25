/**
 * NewsBytesAuthGate - Login gate for unauthenticated users
 * Shown when user tries to access NewsBytes without being logged in
 */

export function NewsBytesAuthGate() {
  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      {/* Zimbabwe flag strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      <div className="text-center space-y-6 px-6 max-w-md">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[hsl(var(--zw-green))] to-[hsl(var(--zw-yellow))] flex items-center justify-center">
          <span className="text-5xl">📱</span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-3xl font-bold">News Bytes</h3>

        {/* Description */}
        <p className="text-white/80 font-sans leading-relaxed">
          Experience Zimbabwe news like never before. TikTok-style visual stories with AI-powered summaries,
          personalized content, and seamless engagement.
        </p>

        {/* Features list */}
        <div className="space-y-3 text-left bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <div className="flex items-start space-x-3">
            <span className="text-[hsl(var(--zw-green))] text-xl">⚡</span>
            <div>
              <h4 className="font-semibold text-sm">Pulse AI Summaries</h4>
              <p className="text-white/70 text-xs">Quick 150-character summaries of every story</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-[hsl(var(--zw-yellow))] text-xl">🎯</span>
            <div>
              <h4 className="font-semibold text-sm">Swipe to Explore</h4>
              <p className="text-white/70 text-xs">Navigate stories with intuitive gestures</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-[hsl(var(--zw-red))] text-xl">❤️</span>
            <div>
              <h4 className="font-semibold text-sm">Save & Share</h4>
              <p className="text-white/70 text-xs">Bookmark articles and share with friends</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <a
            href="/auth/login"
            className="px-6 py-4 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-full transition-all shadow-lg"
          >
            Sign In to Continue
          </a>
          <a
            href="/auth/register"
            className="px-6 py-4 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold rounded-full transition-all"
          >
            Create Free Account
          </a>
          <a
            href="/"
            className="text-white/70 hover:text-white transition-colors py-2 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
