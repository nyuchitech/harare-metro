import type { Route } from "./+types/search";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Search - Harare Metro" },
    { name: "description", content: "Search Zimbabwe news articles from trusted sources" },
    { name: "keywords", content: "Zimbabwe news search, Harare news search, African news search" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const category = url.searchParams.get('category') || null;
  const limit = url.searchParams.get('limit') || '24';
  
  if (!query) {
    return {
      results: [],
      query: '',
      total: 0,
      categories: []
    };
  }
  
  try {
    // Build search URL with parameters
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit
    });
    if (category) {
      searchParams.set('category', category);
    }
    
    // Fetch search results from our D1 API
    const response = await fetch(`http://localhost:5173/api/search?${searchParams.toString()}`);
    const data = await response.json();
    
    // Fetch categories for filter
    const categoriesResponse = await fetch(`http://localhost:5173/api/categories`);
    const categoriesData = await categoriesResponse.json();
    
    return {
      results: data.results || [],
      query: data.query || query,
      total: data.total || 0,
      categories: categoriesData.categories || [],
      selectedCategory: category
    };
  } catch (error) {
    console.error('Search failed:', error);
    return {
      results: [],
      query,
      total: 0,
      categories: [],
      error: 'Search failed. Please try again.'
    };
  }
}

export default function Search({ loaderData }: Route.ComponentProps) {
  const { results, query, total, categories, selectedCategory, error } = loaderData;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <a href="/" className="flex items-center space-x-3">
                <img 
                  src="/hm-logo-compact.svg" 
                  alt="Harare Metro" 
                  className="w-10 h-10"
                />
                <div>
                  <h1 className="font-serif text-xl font-bold text-white">Harare Metro</h1>
                  <p className="text-xs text-gray-400">Zimbabwe's Premier News Platform</p>
                </div>
              </a>
            </div>
            
            <div className="flex-1 max-w-xl mx-8">
              <form method="GET" className="relative">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Search Zimbabwe news..."
                  className="w-full h-12 pl-12 pr-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <button
                  type="submit"
                  className="absolute right-2 top-2 h-8 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-green-400 font-medium">
                {query ? `${total} Results` : 'Search News'}
              </div>
              <div className="text-xs text-gray-500">Zimbabwe Sources</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Search Info */}
        {query && (
          <div className="mb-6">
            <h2 className="font-serif text-2xl font-bold mb-2">
              Search Results for "{query}"
            </h2>
            <p className="text-gray-400">
              Found {total} article{total !== 1 ? 's' : ''} from Zimbabwe news sources
            </p>
          </div>
        )}

        {/* Category Filters */}
        {categories.length > 0 && query && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              <a
                href={`/search?q=${encodeURIComponent(query)}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-green-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                All Categories
              </a>
              {categories.slice(1, 9).map((category) => (
                <a
                  key={category.id}
                  href={`/search?q=${encodeURIComponent(query)}&category=${category.id}`}
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
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* No Query State */}
        {!query && (
          <div className="text-center py-16">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-serif text-xl font-bold mb-2">Search Zimbabwe News</h3>
              <p className="text-gray-400 text-sm mb-6">
                Find articles from trusted Zimbabwe news sources. Search by keywords, topics, or current events.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['politics', 'economy', 'sports', 'technology'].map((topic) => (
                  <a
                    key={topic}
                    href={`/search?q=${topic}`}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-full transition-colors"
                  >
                    {topic}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Results State */}
        {query && results.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 max-w-md mx-auto">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="font-serif text-xl font-bold mb-2">No Results Found</h3>
              <p className="text-gray-400 text-sm mb-6">
                No articles found for "{query}". Try different keywords or browse categories.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Browse All News
              </a>
            </div>
          </div>
        )}

        {/* Search Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((article, index) => (
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

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <a
            href="/"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back to Home</span>
          </a>
        </div>
      </main>
    </div>
  );
}