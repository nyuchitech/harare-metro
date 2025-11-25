import { useLoaderData, Link, useSearchParams } from "react-router";

import { Heart, Bookmark, Clock, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { getBackendUrl } from "../lib/config";

interface UserProfile {
  username: string;
  displayName?: string;
  display_name?: string; // API returns snake_case
  bio?: string;
  avatarUrl?: string;
  avatar_url?: string; // API returns snake_case
  location?: string;
  created_at?: string; // API returns snake_case
}

interface UserStats {
  bookmarks?: number;
  likes?: number;
  articles_read?: number;
  member_since?: string;
  total_reading_time?: number;
}

// Loader to fetch user profile data
export async function loader({ params, request }) {
  const username = params.username;
  const backendUrl = getBackendUrl();

  // Get auth token from cookie if available
  const cookies = request.headers.get("Cookie") || "";
  const tokenMatch = cookies.match(/auth_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  try {
    // Fetch user profile
    const profileResponse = await fetch(
      `${backendUrl}/api/user/${username}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    if (!profileResponse.ok) {
      throw new Error("User not found");
    }

    const profile = await profileResponse.json() as UserProfile;

    // Fetch user stats
    const statsResponse = await fetch(
      `${backendUrl}/api/user/${username}/stats`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    const stats = statsResponse.ok ? await statsResponse.json() as UserStats : null;

    // Check if viewing own profile
    let isOwnProfile = false;
    if (token) {
      const sessionResponse = await fetch(
        `${backendUrl}/api/auth/session`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (sessionResponse.ok) {
        const { user } = await sessionResponse.json() };
        isOwnProfile = !!(user && user.username === username);
      }
    }

    return { profile, stats, isOwnProfile, token, backendUrl };
  } catch (error) {
    throw new Response("User not found", { status: 404 });
  }
}

export default function UserProfile({ loaderData }) {
  const { profile, stats, isOwnProfile, token, backendUrl } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "bookmarks";
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Guard: profile should always be defined (loader throws 404 otherwise)
  if (!profile) {
    return null;
  }

  // Load articles based on active tab
  const loadArticles = async (tab: string) => {
    if (!token || !isOwnProfile) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${backendUrl}/api/user/${profile.username}/${tab}?limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json() as Record<string, any[]>;
        setArticles(data[tab] || data.history || []);
      }
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load articles when tab changes
  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
    loadArticles(tab);
  };

  // Calculate reading time in hours
  const readingTimeHours = stats?.total_reading_time
    ? Math.round(stats.total_reading_time / 3600)
    : 0;

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Zimbabwe Flag Strip */}
      <div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />

      <div className="pl-8 max-w-5xl mx-auto py-8 px-4">
        {/* Profile Header */}
        <div className="mb-8">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Back to Home
          </Link>

          {/* Profile Info */}
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(var(--zw-green))] to-[hsl(var(--zw-yellow))] flex items-center justify-center text-4xl font-serif">
              {profile.display_name?.[0] || profile.username[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold mb-2">
                {profile.display_name || profile.username}
              </h1>
              <p className="text-gray-400 mb-2">@{profile.username}</p>
              {profile.bio && (
                <p className="text-gray-300 mb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-2xl font-bold text-[hsl(var(--zw-green))]">
                    {stats?.bookmarks || 0}
                  </span>
                  <span className="text-gray-400 ml-2">Bookmarks</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[hsl(var(--zw-red))]">
                    {stats?.likes || 0}
                  </span>
                  <span className="text-gray-400 ml-2">Likes</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-[hsl(var(--zw-yellow))]">
                    {stats?.articles_read || 0}
                  </span>
                  <span className="text-gray-400 ml-2">Read</span>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>
                  Member since{" "}
                  {new Date(stats?.member_since || profile.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>

              {readingTimeHours > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{readingTimeHours} hours reading time</span>
                </div>
              )}
            </div>

            {/* Edit Button (Own Profile Only) */}
            {isOwnProfile && (
              <Link
                to="/settings/profile"
                className="px-4 py-2 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 rounded-full font-semibold transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Tabs (Own Profile Only) */}
        {isOwnProfile && token && (
          <>
            <div className="border-b border-gray-800 mb-8">
              <div className="flex gap-8">
                <button
                  onClick={() => handleTabChange("bookmarks")}
                  className={`pb-4 px-2 font-semibold transition-colors relative ${
                    activeTab === "bookmarks"
                      ? "text-[hsl(var(--zw-green))]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Bookmark className="w-5 h-5 inline-block mr-2" />
                  Bookmarks
                  {activeTab === "bookmarks" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--zw-green))]" />
                  )}
                </button>

                <button
                  onClick={() => handleTabChange("likes")}
                  className={`pb-4 px-2 font-semibold transition-colors relative ${
                    activeTab === "likes"
                      ? "text-[hsl(var(--zw-red))]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Heart className="w-5 h-5 inline-block mr-2" />
                  Likes
                  {activeTab === "likes" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--zw-red))]" />
                  )}
                </button>

                <button
                  onClick={() => handleTabChange("history")}
                  className={`pb-4 px-2 font-semibold transition-colors relative ${
                    activeTab === "history"
                      ? "text-[hsl(var(--zw-yellow))]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Clock className="w-5 h-5 inline-block mr-2" />
                  History
                  {activeTab === "history" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--zw-yellow))]" />
                  )}
                </button>
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  Loading...
                </div>
              ) : articles.length > 0 ? (
                articles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/${article.source}/${article.slug}`}
                    className="block p-6 bg-gray-900 rounded-2xl hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex gap-4">
                      {article.image_url && (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-serif text-xl font-bold mb-2">
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                            {article.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span>
                            {new Date(
                              article.published_at || article.created_at
                            ).toLocaleDateString()}
                          </span>
                          {article.reading_time && (
                            <>
                              <span>•</span>
                              <span>{article.reading_time}s read</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">
                    {activeTab === "bookmarks" && "No bookmarks yet"}
                    {activeTab === "likes" && "No liked articles yet"}
                    {activeTab === "history" && "No reading history yet"}
                  </p>
                  <Link
                    to="/"
                    className="text-[hsl(var(--zw-green))] hover:underline"
                  >
                    Explore articles →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}

        {/* Not Own Profile */}
        {!isOwnProfile && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              This profile is private. Only {profile.username} can see their activity.
            </p>
            <Link
              to="/"
              className="text-[hsl(var(--zw-green))] hover:underline"
            >
              Back to Home →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
