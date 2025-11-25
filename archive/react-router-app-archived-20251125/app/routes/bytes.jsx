/**
 * NewsBytes Route - TikTok-style vertical news feed
 * Mukoko News - Material UI enhanced mobile-first experience
 */

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { NewsBytesScreen } from '../screens/newsbytes/NewsBytesScreen';
import { buildApiUrl } from '../lib/api-utils';
import theme from '../lib/theme';

export function meta() {
  return [
    { title: "News Bytes - Mukoko News" },
    { name: "description", content: "TikTok-style visual news from Zimbabwe's most trusted sources" },
    { name: "keywords", content: "Zimbabwe news bytes, visual news, quick news, breaking news, Harare news, Mukoko News" },
  ];
}

export async function loader({ request }) {
  // Check authentication
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const isAuthenticated = !!tokenMatch;

  // Auth required for NewsBytes
  if (!isAuthenticated) {
    return {
      articles: [],
      total: 0,
      error: null,
      requiresAuth: true
    };
  }

  try {
    // Fetch articles with images only
    const apiUrl = buildApiUrl(request, '/api/feeds', new URLSearchParams({
      limit: '50',
      with_images: 'true'
    }));

    const response = await fetch(apiUrl);
    const data = await response.json();

    // Filter articles that have images
    const articlesWithImages = (data.articles || []).filter((article) =>
      article.image_url
    );

    return {
      articles: articlesWithImages,
      total: articlesWithImages.length,
      error: null,
      requiresAuth: false
    };
  } catch (error) {
    console.error('[NEWSBYTES] Failed to load:', error);
    return {
      articles: [],
      total: 0,
      error: 'Failed to load news bytes',
      requiresAuth: false
    };
  }
}

export default function Bytes({ loaderData }) {
  const { articles, error, requiresAuth } = loaderData;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NewsBytesScreen
        articles={articles}
        requiresAuth={requiresAuth}
        error={error}
      />
    </ThemeProvider>
  );
}
