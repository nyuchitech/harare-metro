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

export async function loader({ context }: Route.LoaderArgs) {
  // For now, return placeholder data - we'll connect to the D1 API later
  return { 
    articles: [],
    message: "Harare Metro - Now powered by React Router + Hono + D1 Database",
    status: "template-ready"
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { message, status } = loaderData;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 via-yellow-500 to-red-500 flex items-center justify-center font-bold text-black">
                HM
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold text-white">Harare Metro</h1>
                <p className="text-xs text-gray-400">Zimbabwe's Premier News Platform</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-green-400 font-medium">Template Ready</div>
              <div className="text-xs text-gray-500">React Router + Hono + D1</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="font-serif text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">
            Harare Metro 2.0
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Successfully migrated to the modern Cloudflare React Router + Hono fullstack template with D1 database integration.
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-green-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Migration Complete</span>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-green-400 mb-4">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-semibold mb-2">Modern Template</h3>
            <p className="text-gray-400 text-sm">Built on the official Cloudflare React Router + Hono fullstack template for optimal performance.</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-yellow-400 mb-4">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-semibold mb-2">D1 Database</h3>
            <p className="text-gray-400 text-sm">Migrated from KV storage to Cloudflare D1 for better scalability and SQL capabilities.</p>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="text-red-400 mb-4">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-semibold mb-2">TypeScript Ready</h3>
            <p className="text-gray-400 text-sm">Full TypeScript support with proper type safety and developer experience.</p>
          </div>
        </section>

        {/* Status Section */}
        <section className="bg-gray-900/30 border border-gray-800 rounded-lg p-8 text-center">
          <h3 className="font-serif text-2xl font-bold mb-4">🚀 Ready for Development</h3>
          <p className="text-gray-400 mb-6">
            The template migration is complete. You can now continue building Harare Metro on this modern, scalable foundation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-900/20 border border-green-800 rounded p-4">
              <div className="text-green-400 font-medium mb-1">✅ Database</div>
              <div className="text-gray-400">D1 schema ready</div>
            </div>
            <div className="bg-yellow-900/20 border border-yellow-800 rounded p-4">
              <div className="text-yellow-400 font-medium mb-1">✅ API</div>
              <div className="text-gray-400">Hono endpoints ready</div>
            </div>
            <div className="bg-blue-900/20 border border-blue-800 rounded p-4">
              <div className="text-blue-400 font-medium mb-1">✅ Frontend</div>
              <div className="text-gray-400">React Router ready</div>
            </div>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mt-12">
          <h3 className="font-serif text-xl font-bold mb-6 text-center">Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-800 rounded-lg p-6">
              <h4 className="font-medium mb-3">1. Run Database Migration</h4>
              <code className="block bg-gray-800 rounded p-2 text-sm text-green-400">
                ./scripts/migrate-d1.sh
              </code>
            </div>
            <div className="border border-gray-800 rounded-lg p-6">
              <h4 className="font-medium mb-3">2. Start Development</h4>
              <code className="block bg-gray-800 rounded p-2 text-sm text-green-400">
                npm run dev
              </code>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-800 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-green-500 via-yellow-500 to-red-500"></div>
            <span className="font-serif font-bold">Harare Metro</span>
          </div>
          <p className="text-gray-400 text-sm">
            Now powered by React Router 7, Hono 4, and Cloudflare D1 Database
          </p>
          <p className="text-gray-500 text-xs mt-2">
            🇿🇼 Built with pride for Zimbabwe's news community
          </p>
        </footer>
      </main>
    </div>
  );
}
