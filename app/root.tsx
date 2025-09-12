import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet", 
    href: "https://fonts.googleapis.com/css2?family=Georgia:wght@400;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-black text-white font-sans antialiased">
        {/* Zimbabwe Flag Strip */}
        <div 
          className="fixed top-0 left-0 w-2 h-full z-50"
          style={{
            background: "linear-gradient(to bottom, #00A651 0% 20%, #FDD116 20% 40%, #EF3340 40% 60%, #000000 60% 80%, #FFFFFF 80% 100%)"
          }}
        />
        
        <div className="pl-3">
          {children}
        </div>
        
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-bold text-red-500 mb-4 font-serif">
          {message}
        </h1>
        <p className="text-gray-400 mb-6">
          {details}
        </p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto text-left bg-gray-900 rounded text-xs text-gray-300 mb-6">
            <code>{stack}</code>
          </pre>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Refresh Page
        </button>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Harare Metro - Zimbabwe's Premier News Platform</p>
        </div>
      </div>
    </div>
  );
}
