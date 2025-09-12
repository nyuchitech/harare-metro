import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Harare Metro - Zimbabwe's Premier News Platform" },
    { name: "description", content: "Stay informed with the latest news from Zimbabwe's most trusted sources. Breaking news, politics, business, sports, and more." },
    { name: "keywords", content: "Zimbabwe news, Harare news, Zimbabwe politics, African news, breaking news" },
    { property: "og:title", content: "Harare Metro - Zimbabwe's Premier News Platform" },
    { property: "og:description", content: "Zimbabwe's most comprehensive news aggregation platform" },
    { property: "og:type", content: "website" },
  ];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || 'all';
  const limit = url.searchParams.get('limit') || '24';
  
  try {
    // Fetch articles from our D1 API (server-side in React Router dev uses local context)
    const response = await fetch(`http://localhost:5173/api/feeds?category=${category}&limit=${limit}`);
    const data = await response.json();
    
    // Fetch categories
    const categoriesResponse = await fetch(`http://localhost:5173/api/categories`);
    const categoriesData = await categoriesResponse.json();
    
    return {
      articles: data.articles || [],
      categories: categoriesData.categories || [],
      selectedCategory: category,
      total: data.total || 0
    };
  } catch (error) {
    console.error('Failed to load data:', error);
    // Return fallback data
    return {
      articles: [],
      categories: [],
      selectedCategory: 'all',
      total: 0,
      error: 'Failed to load articles'
    };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { articles, categories, selectedCategory, total, error } = loaderData;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/hm-logo-compact.svg" 
                alt="Harare Metro" 
                className="w-10 h-10"
              />
              <div>
                <h1 className="font-serif text-xl font-bold text-white">Harare Metro</h1>
                <p className="text-xs text-gray-400">Zimbabwe's Premier News Platform</p>
              </div>
            </div>
            
            {/* Search Bar - Hidden on mobile, shown on larger screens */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form method="GET" action="/search" className="relative w-full">
                <input
                  type="text"
                  name="q"
                  placeholder="Search news..."
                  className="w-full h-10 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </form>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile search button */}
              <a href="/search" className="md:hidden p-2 text-gray-400 hover:text-white">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </a>

              <div className="text-right">
                <div className="text-sm text-green-400 font-medium">{total} Articles</div>
                <div className="text-xs text-gray-500">Live Updates</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Categories Filter */}
        {categories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.slice(0, 8).map((category) => (
                <a
                  key={category.id}
                  href={`/?category=${category.id}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-500 text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {category.emoji} {category.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-2 text-red-400">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>Failed to load articles. Please check if RSS service is running.</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {articles.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📰</div>
              <h3 className="font-serif text-xl font-bold mb-2">No Articles Yet</h3>
              <p className="text-gray-400 text-sm mb-6">
                The RSS service needs to be configured to fetch news articles from Zimbabwe sources.
              </p>
              <div className="bg-gray-800 rounded p-4 text-xs text-green-400 font-mono">
                POST /api/admin/refresh-rss
              </div>
            </div>
          </div>
        )}

        {/* Articles Grid */}
        {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <article 
                key={article.id || index}
                className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors"
              >
                {article.image_url && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={article.image_url} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full">
                      {article.source || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  
                  <h3 className="font-serif font-bold text-lg leading-tight mb-3 line-clamp-3">
                    {article.title}
                  </h3>
                  
                  {article.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <a 
                      href={article.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 text-sm font-medium hover:text-green-300"
                    >
                      Read More →
                    </a>
                    
                    <div className="flex items-center space-x-3 text-gray-500">
                      <button className="hover:text-red-400 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className="hover:text-yellow-400 transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <img src="/hm-logo-compact.svg" alt="Harare Metro" className="w-6 h-6" />
            <span className="font-serif font-bold">Harare Metro</span>
          </div>
          <p className="text-gray-400 text-sm">
            Zimbabwe's most comprehensive news aggregation platform
          </p>
          <p className="text-gray-500 text-xs mt-2">
            🇿🇼 Built with pride for Zimbabwe's news community
          </p>
        </footer>
      </main>
    </div>
  );
}
