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
import { AuthProvider } from "./contexts/AuthContext";

export const links: Route.LinksFunction = () => [
  // PWA Manifest - Dynamic from D1 database
  { rel: "manifest", href: "/api/manifest.json" },
  
  // Favicon links
  { rel: "icon", href: "/favicon.ico", sizes: "any" },
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "icon", href: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
  { rel: "icon", href: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  
  // Font preconnects
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
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        {children}
        
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404 - Page Not Found" : `${error.status} - Error`;
    details =
      error.status === 404
        ? "The page you're looking for doesn't exist or has been moved."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
      {/* Zimbabwe Flag Strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      <div className="text-center p-8 max-w-md">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-5xl font-serif font-bold mb-2">
            Harare <span className="text-[hsl(var(--zw-green))]">Metro</span>
          </h1>
          <p className="text-gray-500 text-sm">Zimbabwe's Premier News Platform</p>
        </div>

        {/* Error Message */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-6">
          <h2 className="text-3xl font-serif font-bold text-[hsl(var(--zw-red))] mb-4">
            {message}
          </h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            {details}
          </p>
          {stack && (
            <pre className="w-full p-4 overflow-x-auto text-left bg-black rounded-xl text-xs text-gray-300 mb-6 border border-gray-800">
              <code>{stack}</code>
            </pre>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="px-6 py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Homepage
            </a>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="text-sm text-gray-500">
          <p className="mb-2">Need help?</p>
          <div className="flex justify-center gap-4">
            <a href="/" className="hover:text-[hsl(var(--zw-green))] transition-colors">
              Home
            </a>
            <a href="/search" className="hover:text-[hsl(var(--zw-green))] transition-colors">
              Search
            </a>
            <a href="/bytes" className="hover:text-[hsl(var(--zw-green))] transition-colors">
              Bytes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
