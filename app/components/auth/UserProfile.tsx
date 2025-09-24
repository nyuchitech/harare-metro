import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, signOut, isConfigured } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'bookmarks' | 'settings'>('profile');

  useEffect(() => {
    if (isOpen && user && isConfigured) {
      loadUserData();
    }
  }, [isOpen, user, isConfigured]);

  const loadUserData = async () => {
    if (!user || typeof window === 'undefined') return;
    
    setLoading(true);
    try {
      // Dynamically import db functions on client side only
      const { db } = await import('../../lib/supabase.client');

      // Load profile
      const { data: profileData } = await db.profiles.get(user.id);
      setProfile(profileData);

      // Load bookmarks
      const { data: bookmarksData } = await db.bookmarks.get(user.id);
      setBookmarks(bookmarksData || []);

      // Load likes
      const { data: likesData } = await db.likes.get(user.id);
      setLikes((likesData || []).map((like: any) => like.article_id));

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!isOpen) return null;

  if (!isConfigured) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-center mb-4 font-serif text-white">
            Profile Unavailable
          </h2>
          <p className="text-gray-400 text-center mb-6">
            Supabase is not configured. Please check your environment variables.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-center mb-4 font-serif text-white">
            Not Signed In
          </h2>
          <p className="text-gray-400 text-center mb-6">
            Please sign in to view your profile.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ×
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {(profile?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold mb-2 font-serif text-white">
            {profile?.display_name || profile?.full_name || 'User'}
          </h2>
          <p className="text-gray-400">{user.email}</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'bookmarks'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Bookmarks
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Settings
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {bookmarks.length}
                    </div>
                    <div className="text-gray-400 text-sm">Bookmarked</div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {likes.length}
                    </div>
                    <div className="text-gray-400 text-sm">Liked</div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 font-serif">
                    Account Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email</span>
                      <span className="text-white">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Member since</span>
                      <span className="text-white">
                        {new Date(user.created_at).toISOString().split('T')[0]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last sign in</span>
                      <span className="text-white">
                        {user.last_sign_in_at ? 
                          new Date(user.last_sign_in_at).toISOString().split('T')[0] : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 font-serif">
                  Your Bookmarks
                </h3>
                {bookmarks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>No bookmarks yet</p>
                    <p className="text-sm mt-2">Start bookmarking articles to see them here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="bg-gray-800 rounded-xl p-4">
                        <h4 className="font-medium text-white mb-2">
                          {bookmark.article_title}
                        </h4>
                        <p className="text-sm text-gray-400 mb-2">
                          {bookmark.article_description}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{bookmark.source}</span>
                          <span>{new Date(bookmark.created_at).toISOString().split('T')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 font-serif">
                    Account Settings
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Sign Out Button */}
                    <button
                      onClick={handleSignOut}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 font-serif">
                    Preferences
                  </h3>
                  <p className="text-gray-400 text-sm">
                    More preference options coming soon...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;