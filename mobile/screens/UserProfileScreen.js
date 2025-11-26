import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, Button, Surface, Avatar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mukokoTheme } from '../theme';
import { Heart, Bookmark, Clock, Calendar, ArrowLeft } from 'lucide-react-native';

const AUTH_TOKEN_KEY = '@mukoko_auth_token';

export default function UserProfileScreen({ navigation, route }) {
  const { username } = route.params;
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('bookmarks');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (isOwnProfile && activeTab) {
      loadArticles(activeTab);
    }
  }, [activeTab, isOwnProfile]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      // Fetch user profile
      const profileResponse = await fetch(
        `https://admin.hararemetro.co.zw/api/user/${username}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!profileResponse.ok) {
        throw new Error('User not found');
      }

      const profileData = await profileResponse.json();
      setProfile(profileData);

      // Fetch user stats
      const statsResponse = await fetch(
        `https://admin.hararemetro.co.zw/api/user/${username}/stats`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Check if viewing own profile
      if (token) {
        const sessionResponse = await fetch(
          'https://admin.hararemetro.co.zw/api/auth/session',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (sessionResponse.ok) {
          const { user } = await sessionResponse.json();
          setIsOwnProfile(user && user.username === username);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async (tab) => {
    if (!isOwnProfile) return;

    setArticlesLoading(true);
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;

      const response = await fetch(
        `https://admin.hararemetro.co.zw/api/user/${username}/${tab}?limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setArticles(data[tab] || data.history || []);
      }
    } catch (err) {
      console.error('Error loading articles:', err);
    } finally {
      setArticlesLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const readingTimeHours = stats?.total_reading_time
    ? Math.round(stats.total_reading_time / 3600)
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={mukokoTheme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text>User not found</Text>
      </View>
    );
  }

  const renderArticleItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('ArticleDetail', {
        source: item.source,
        slug: item.slug
      })}
    >
      <Surface style={styles.articleCard} elevation={1}>
        <View style={styles.articleContent}>
          {item.image_url && (
            <Avatar.Image
              size={80}
              source={{ uri: item.image_url }}
              style={styles.articleImage}
            />
          )}
          <View style={styles.articleText}>
            <Text variant="titleMedium" numberOfLines={2} style={styles.articleTitle}>
              {item.title}
            </Text>
            {item.description && (
              <Text variant="bodySmall" numberOfLines={2} style={styles.articleDescription}>
                {item.description}
              </Text>
            )}
            <View style={styles.articleMeta}>
              <Text variant="labelSmall" style={styles.articleMetaText}>
                {item.source}
              </Text>
              <Text variant="labelSmall" style={styles.articleMetaText}>•</Text>
              <Text variant="labelSmall" style={styles.articleMetaText}>
                {formatDate(item.published_at || item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={1}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon={() => <ArrowLeft size={24} color={mukokoTheme.colors.onSurface} />}
          style={styles.backButton}
        >
          Back
        </Button>
      </Surface>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <Avatar.Text
            size={96}
            label={(profile.display_name || profile.displayName || profile.username)[0].toUpperCase()}
            style={styles.avatar}
            color={mukokoTheme.colors.onPrimary}
            labelStyle={styles.avatarLabel}
          />

          {/* Info */}
          <Text variant="headlineMedium" style={styles.displayName}>
            {profile.display_name || profile.displayName || profile.username}
          </Text>
          <Text variant="bodyMedium" style={styles.username}>
            @{profile.username}
          </Text>

          {profile.bio && (
            <Text variant="bodyMedium" style={styles.bio}>
              {profile.bio}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={styles.statValue}>
                {stats?.bookmarks || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Bookmarks
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={[styles.statValue, { color: mukokoTheme.colors.error }]}>
                {stats?.likes || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Likes
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="headlineSmall" style={[styles.statValue, { color: mukokoTheme.colors.accent }]}>
                {stats?.articles_read || 0}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Read
              </Text>
            </View>
          </View>

          {/* Member Since */}
          <View style={styles.metaRow}>
            <Calendar size={16} color={mukokoTheme.colors.onSurfaceVariant} />
            <Text variant="bodySmall" style={styles.metaText}>
              Member since {formatDate(stats?.member_since || profile.created_at || Date.now())}
            </Text>
          </View>

          {readingTimeHours > 0 && (
            <View style={styles.metaRow}>
              <Clock size={16} color={mukokoTheme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={styles.metaText}>
                {readingTimeHours} hours reading time
              </Text>
            </View>
          )}

          {/* Edit Profile Button (Own Profile Only) */}
          {isOwnProfile && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('ProfileSettings')}
              style={styles.editButton}
            >
              Edit Profile
            </Button>
          )}
        </View>

        {/* Tabs (Own Profile Only) */}
        {isOwnProfile && (
          <>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                {
                  value: 'bookmarks',
                  label: 'Bookmarks',
                  icon: () => <Bookmark size={20} color={mukokoTheme.colors.primary} />,
                },
                {
                  value: 'likes',
                  label: 'Likes',
                  icon: () => <Heart size={20} color={mukokoTheme.colors.error} />,
                },
                {
                  value: 'history',
                  label: 'History',
                  icon: () => <Clock size={20} color={mukokoTheme.colors.accent} />,
                },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Articles List */}
            {articlesLoading ? (
              <View style={styles.loadingArticles}>
                <ActivityIndicator size="small" color={mukokoTheme.colors.primary} />
              </View>
            ) : articles.length > 0 ? (
              <FlatList
                data={articles}
                renderItem={renderArticleItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.articlesList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  {activeTab === 'bookmarks' && 'No bookmarks yet'}
                  {activeTab === 'likes' && 'No liked articles yet'}
                  {activeTab === 'history' && 'No reading history yet'}
                </Text>
                <Button
                  mode="text"
                  onPress={() => navigation.navigate('Home')}
                  style={styles.exploreButton}
                >
                  Explore articles
                </Button>
              </View>
            )}
          </>
        )}

        {/* Not Own Profile */}
        {!isOwnProfile && (
          <View style={styles.privateProfile}>
            <Text variant="bodyMedium" style={styles.privateProfileText}>
              This profile is private. Only {profile.username} can see their activity.
            </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Home')}
              style={styles.exploreButton}
            >
              Back to Home
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mukokoTheme.colors.background,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mukokoTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: mukokoTheme.spacing.md,
    backgroundColor: mukokoTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: mukokoTheme.colors.outline,
  },
  backButton: {
    marginRight: mukokoTheme.spacing.sm,
  },
  scrollContent: {
    padding: mukokoTheme.spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: mukokoTheme.spacing.xl,
  },
  avatar: {
    backgroundColor: mukokoTheme.colors.primary,
    marginBottom: mukokoTheme.spacing.md,
  },
  avatarLabel: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontSize: 40,
  },
  displayName: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    marginBottom: mukokoTheme.spacing.xs,
  },
  username: {
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.md,
  },
  bio: {
    textAlign: 'center',
    marginBottom: mukokoTheme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: mukokoTheme.spacing.xl,
    marginBottom: mukokoTheme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: '700',
    color: mukokoTheme.colors.primary,
  },
  statLabel: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mukokoTheme.spacing.xs,
    marginBottom: mukokoTheme.spacing.xs,
  },
  metaText: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  editButton: {
    marginTop: mukokoTheme.spacing.lg,
  },
  segmentedButtons: {
    marginBottom: mukokoTheme.spacing.lg,
  },
  loadingArticles: {
    padding: mukokoTheme.spacing.xl,
    alignItems: 'center',
  },
  articlesList: {
    gap: mukokoTheme.spacing.md,
  },
  articleCard: {
    padding: mukokoTheme.spacing.md,
    borderRadius: mukokoTheme.roundness * 2,
    backgroundColor: mukokoTheme.colors.surface,
    marginBottom: mukokoTheme.spacing.md,
  },
  articleContent: {
    flexDirection: 'row',
    gap: mukokoTheme.spacing.md,
  },
  articleImage: {
    borderRadius: mukokoTheme.roundness,
  },
  articleText: {
    flex: 1,
  },
  articleTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    marginBottom: mukokoTheme.spacing.xs,
  },
  articleDescription: {
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.xs,
  },
  articleMeta: {
    flexDirection: 'row',
    gap: mukokoTheme.spacing.xs,
  },
  articleMetaText: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  emptyState: {
    padding: mukokoTheme.spacing.xxl,
    alignItems: 'center',
  },
  emptyStateText: {
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.md,
  },
  exploreButton: {
    marginTop: mukokoTheme.spacing.sm,
  },
  privateProfile: {
    padding: mukokoTheme.spacing.xxl,
    alignItems: 'center',
  },
  privateProfileText: {
    color: mukokoTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: mukokoTheme.spacing.md,
  },
});
