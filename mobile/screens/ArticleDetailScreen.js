import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Text, IconButton, Button, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import mukokoTheme from '../theme';
import HeaderNavigation from '../components/HeaderNavigation';
import ZimbabweFlagStrip from '../components/ZimbabweFlagStrip';
import { useAuth } from '../contexts/AuthContext';
import { articles as articlesAPI } from '../api/client';

/**
 * ArticleDetailScreen - Full article view
 *
 * Features:
 * - Full article content with image
 * - Like, save, share actions
 * - Comments section
 * - Read original link
 * - View tracking
 */
export default function ArticleDetailScreen({ route, navigation }) {
  const { articleId, source, slug } = route.params || {};
  const { user, isAuthenticated } = useAuth();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    loadArticle();
  }, [articleId, source, slug]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);

      let result;
      if (source && slug) {
        // Fetch by source and slug
        result = await articlesAPI.getBySourceSlug(source, slug);
      } else if (articleId) {
        // Fetch by ID (fallback)
        result = await articlesAPI.getById(articleId);
      } else {
        throw new Error('No article identifier provided');
      }

      if (result.error) {
        setError(result.error);
        setArticle(null);
      } else if (result.data?.article) {
        const articleData = result.data.article;
        setArticle(articleData);
        setIsLiked(articleData.isLiked || false);
        setIsSaved(articleData.isSaved || false);
        setLikesCount(articleData.likesCount || 0);

        // Track article view
        await articlesAPI.trackView(articleData.id);
      } else {
        setError('Article not found');
      }
    } catch (err) {
      console.error('[ArticleDetail] Load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Profile');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Optimistic update
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

      const result = await articlesAPI.like(article.id);
      if (result.error) {
        // Revert on error
        setIsLiked(isLiked);
        setLikesCount(likesCount);
        console.error('[ArticleDetail] Like error:', result.error);
      }
    } catch (error) {
      console.error('[ArticleDetail] Like error:', error);
      setIsLiked(isLiked);
      setLikesCount(likesCount);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      navigation.navigate('Profile');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Optimistic update
      setIsSaved(!isSaved);

      const result = await articlesAPI.save(article.id);
      if (result.error) {
        // Revert on error
        setIsSaved(isSaved);
        console.error('[ArticleDetail] Save error:', result.error);
      }
    } catch (error) {
      console.error('[ArticleDetail] Save error:', error);
      setIsSaved(isSaved);
    }
  };

  const handleShare = async () => {
    if (!article) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await Share.share({
        message: `${article.title}\n\nRead on Mukoko News: ${article.original_url}`,
        title: article.title,
        url: article.original_url,
      });
    } catch (error) {
      console.error('[ArticleDetail] Share error:', error);
    }
  };

  const handleReadOriginal = async () => {
    if (!article?.original_url) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(article.original_url);

      if (supported) {
        await Linking.openURL(article.original_url);
      } else {
        console.error('[ArticleDetail] Cannot open URL:', article.original_url);
      }
    } catch (error) {
      console.error('[ArticleDetail] Open URL error:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Today';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Zimbabwe Flag Strip */}
        <ZimbabweFlagStrip />

        {/* Header */}
        <HeaderNavigation
          navigation={navigation}
          currentRoute="ArticleDetail"
          isAuthenticated={isAuthenticated}
          showBack={true}
        />

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Loading State */}
          {loading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={mukokoTheme.colors.primary} />
              <Text style={styles.loadingText}>Loading article...</Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={styles.centerContainer}>
              <View style={styles.errorCard}>
                <Text style={styles.errorEmoji}>📰</Text>
                <Text style={styles.errorTitle}>Article Not Found</Text>
                <Text style={styles.errorMessage}>{error}</Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.goBack()}
                  style={styles.errorButton}
                  buttonColor={mukokoTheme.colors.primary}
                >
                  Go Back
                </Button>
              </View>
            </View>
          )}

          {/* Article Content */}
          {article && !loading && !error && (
            <View style={styles.articleContainer}>
              {/* Article Image */}
              {article.image_url && (
                <Image
                  source={{ uri: article.image_url }}
                  style={styles.articleImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.articleContent}>
                {/* Article Meta */}
                <View style={styles.metaContainer}>
                  <Text style={styles.metaSource}>{article.source || 'Unknown'}</Text>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.metaDate}>{formatDate(article.published_at)}</Text>
                </View>

                {/* Article Title */}
                <Text style={styles.articleTitle}>{article.title}</Text>

                {/* Article Description */}
                {article.description && (
                  <Text style={styles.articleDescription}>{article.description}</Text>
                )}

                {/* Article Full Content */}
                {article.content && (
                  <View style={styles.contentContainer}>
                    {article.content.split('\n\n').map((paragraph, index) => {
                      const trimmed = paragraph.trim();
                      return trimmed ? (
                        <Text key={index} style={styles.contentParagraph}>
                          {trimmed}
                        </Text>
                      ) : null;
                    })}
                  </View>
                )}

                <Divider style={styles.actionsDivider} />

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                  {/* Like Button */}
                  <TouchableOpacity
                    onPress={handleLike}
                    style={styles.actionButton}
                    activeOpacity={0.7}
                  >
                    <IconButton
                      icon={isLiked ? 'heart' : 'heart-outline'}
                      iconColor={isLiked ? mukokoTheme.colors.zwRed : mukokoTheme.colors.onSurface}
                      size={24}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.actionText}>
                      {likesCount > 0 ? likesCount : 'Like'}
                    </Text>
                  </TouchableOpacity>

                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={handleSave}
                    style={styles.actionButton}
                    activeOpacity={0.7}
                  >
                    <IconButton
                      icon={isSaved ? 'bookmark' : 'bookmark-outline'}
                      iconColor={isSaved ? mukokoTheme.colors.zwYellow : mukokoTheme.colors.onSurface}
                      size={24}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.actionText}>Save</Text>
                  </TouchableOpacity>

                  {/* Share Button */}
                  <TouchableOpacity
                    onPress={handleShare}
                    style={styles.actionButton}
                    activeOpacity={0.7}
                  >
                    <IconButton
                      icon="share-variant-outline"
                      iconColor={mukokoTheme.colors.onSurface}
                      size={24}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>

                  {/* Read Original Button */}
                  <TouchableOpacity
                    onPress={handleReadOriginal}
                    style={[styles.actionButton, styles.readOriginalButton]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.readOriginalText}>Read Original</Text>
                    <IconButton
                      icon="open-in-new"
                      iconColor={mukokoTheme.colors.onPrimary}
                      size={20}
                      style={styles.actionIcon}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: mukokoTheme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: mukokoTheme.spacing.xl,
    minHeight: 400,
  },
  loadingText: {
    marginTop: mukokoTheme.spacing.md,
    color: mukokoTheme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: mukokoTheme.colors.surface,
    borderRadius: 16,
    padding: mukokoTheme.spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: mukokoTheme.colors.outline,
  },
  errorEmoji: {
    fontSize: 60,
    marginBottom: mukokoTheme.spacing.md,
  },
  errorTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    fontSize: 20,
    marginBottom: mukokoTheme.spacing.sm,
    color: mukokoTheme.colors.onSurface,
  },
  errorMessage: {
    color: mukokoTheme.colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: mukokoTheme.spacing.lg,
  },
  errorButton: {
    borderRadius: 24,
  },
  articleContainer: {
    backgroundColor: mukokoTheme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: mukokoTheme.spacing.md,
    marginTop: mukokoTheme.spacing.md,
    borderWidth: 1,
    borderColor: mukokoTheme.colors.outline,
  },
  articleImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  articleContent: {
    padding: mukokoTheme.spacing.lg,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: mukokoTheme.spacing.md,
  },
  metaSource: {
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
    fontWeight: mukokoTheme.fonts.medium.fontWeight,
    fontSize: 14,
    color: mukokoTheme.colors.primary,
  },
  metaDivider: {
    marginHorizontal: mukokoTheme.spacing.xs,
    color: mukokoTheme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  metaDate: {
    fontSize: 14,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  articleTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    fontSize: 28,
    lineHeight: 36,
    marginBottom: mukokoTheme.spacing.md,
    color: mukokoTheme.colors.onSurface,
  },
  articleDescription: {
    fontSize: 18,
    lineHeight: 28,
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.lg,
  },
  contentContainer: {
    marginBottom: mukokoTheme.spacing.lg,
  },
  contentParagraph: {
    fontSize: 16,
    lineHeight: 26,
    color: mukokoTheme.colors.onSurface,
    marginBottom: mukokoTheme.spacing.md,
  },
  actionsDivider: {
    backgroundColor: mukokoTheme.colors.outline,
    marginVertical: mukokoTheme.spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mukokoTheme.spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: mukokoTheme.colors.surfaceVariant,
    borderRadius: 24,
    paddingHorizontal: mukokoTheme.spacing.sm,
    paddingVertical: mukokoTheme.spacing.xs,
  },
  actionIcon: {
    margin: 0,
    padding: 0,
  },
  actionText: {
    fontSize: 14,
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
    fontWeight: mukokoTheme.fonts.medium.fontWeight,
    color: mukokoTheme.colors.onSurface,
    marginLeft: -4,
  },
  readOriginalButton: {
    backgroundColor: mukokoTheme.colors.primary,
    marginLeft: 'auto',
  },
  readOriginalText: {
    fontSize: 14,
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
    fontWeight: mukokoTheme.fonts.medium.fontWeight,
    color: mukokoTheme.colors.onPrimary,
    marginHorizontal: mukokoTheme.spacing.sm,
  },
});
