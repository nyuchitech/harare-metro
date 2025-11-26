import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  Text,
  Chip,
  ActivityIndicator,
  IconButton,
  Card,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import mukokoTheme from '../theme';
import HeaderNavigation from '../components/HeaderNavigation';
import ZimbabweFlagStrip from '../components/ZimbabweFlagStrip';
import { useAuth } from '../contexts/AuthContext';
import { articles as articlesAPI, categories as categoriesAPI } from '../api/client';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - mukokoTheme.spacing.md * 3) / 2;

/**
 * DiscoverScreen - Trending and featured content
 *
 * Features:
 * - Trending articles grid
 * - Featured categories
 * - Visual masonry-style layout
 * - Pull-to-refresh
 */
export default function DiscoverScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([loadCategories(), loadArticles()]);
    setLoading(false);
  };

  const loadCategories = async () => {
    try {
      const result = await categoriesAPI.getAll();
      if (result.data?.categories) {
        setCategories(result.data.categories);
      }
    } catch (err) {
      console.error('[Discover] Load categories error:', err);
    }
  };

  const loadArticles = async (category = null) => {
    try {
      const result = await articlesAPI.getFeed({
        limit: 30,
        offset: 0,
        category: category || undefined,
      });

      if (result.data?.articles) {
        setArticles(result.data.articles);
        setTotal(result.data.total || 0);
        setTodayCount(result.data.todayCount || 0);
      }
    } catch (err) {
      console.error('[Discover] Load articles error:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArticles(selectedCategory);
    setRefreshing(false);
  };

  const handleCategoryPress = async (category) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedCategory === category) {
      setSelectedCategory(null);
      await loadArticles(null);
    } else {
      setSelectedCategory(category);
      await loadArticles(category);
    }
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleDetail', {
      articleId: article.id,
      source: article.source_id || article.source,
      slug: article.slug,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Today';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const renderArticleCard = (article, index) => {
    // Alternate between tall and short cards for visual interest
    const isTall = index % 3 === 0;

    return (
      <TouchableOpacity
        key={article.id}
        activeOpacity={0.7}
        onPress={() => handleArticlePress(article)}
        style={[
          styles.articleCard,
          isTall ? styles.articleCardTall : styles.articleCardShort,
        ]}
      >
        <Card style={styles.card}>
          {article.image_url && (
            <Image
              source={{ uri: article.image_url }}
              style={[
                styles.cardImage,
                isTall ? styles.cardImageTall : styles.cardImageShort,
              ]}
              resizeMode="cover"
            />
          )}
          <View style={styles.cardOverlay}>
            <View style={styles.cardContent}>
              {/* Source Badge */}
              <Chip
                mode="flat"
                style={styles.sourceChip}
                textStyle={styles.sourceChipText}
              >
                {article.source || 'Unknown'}
              </Chip>

              {/* Title */}
              <Text
                style={styles.cardTitle}
                numberOfLines={isTall ? 4 : 3}
                ellipsizeMode="tail"
              >
                {article.title}
              </Text>

              {/* Meta */}
              <View style={styles.cardMeta}>
                <Text style={styles.cardDate}>{formatDate(article.published_at)}</Text>
                {article.category && (
                  <>
                    <Text style={styles.metaDivider}>•</Text>
                    <Text style={styles.cardCategory}>{article.category}</Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Zimbabwe Flag Strip */}
        <ZimbabweFlagStrip />

        {/* Header */}
        <HeaderNavigation
          navigation={navigation}
          currentRoute="Discover"
          isAuthenticated={isAuthenticated}
          title="Discover"
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Stats Header */}
          {!loading && (
            <View style={styles.statsHeader}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todayCount}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{total}</Text>
                  <Text style={styles.statLabel}>Total Articles</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{categories.length}</Text>
                  <Text style={styles.statLabel}>Categories</Text>
                </View>
              </View>
            </View>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesContent}
            >
              <Chip
                selected={!selectedCategory}
                onPress={() => handleCategoryPress(null)}
                style={[
                  styles.categoryChip,
                  !selectedCategory && styles.categoryChipSelected,
                ]}
                textStyle={styles.categoryChipText}
              >
                🔥 Trending
              </Chip>
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  selected={selectedCategory === category.id}
                  onPress={() => handleCategoryPress(category.id)}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category.id && styles.categoryChipSelected,
                  ]}
                  textStyle={styles.categoryChipText}
                >
                  {category.emoji} {category.name}
                </Chip>
              ))}
            </ScrollView>
          )}

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={mukokoTheme.colors.primary} />
              <Text style={styles.loadingText}>Discovering trending news...</Text>
            </View>
          )}

          {/* Articles Grid */}
          {!loading && articles.length > 0 && (
            <ScrollView
              style={styles.articlesScroll}
              contentContainerStyle={styles.articlesContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[mukokoTheme.colors.primary]}
                  tintColor={mukokoTheme.colors.primary}
                />
              }
            >
              <View style={styles.articlesGrid}>
                {articles.map((article, index) => renderArticleCard(article, index))}
              </View>
            </ScrollView>
          )}

          {/* Empty State */}
          {!loading && articles.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>No Articles Found</Text>
              <Text style={styles.emptyMessage}>
                Try selecting a different category or check back later.
              </Text>
            </View>
          )}
        </View>
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
  content: {
    flex: 1,
  },
  statsHeader: {
    backgroundColor: mukokoTheme.colors.surface,
    paddingVertical: mukokoTheme.spacing.md,
    paddingHorizontal: mukokoTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: mukokoTheme.colors.outline,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    fontSize: 24,
    color: mukokoTheme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: mukokoTheme.colors.outline,
  },
  categoriesScroll: {
    backgroundColor: mukokoTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: mukokoTheme.colors.outline,
  },
  categoriesContent: {
    paddingHorizontal: mukokoTheme.spacing.md,
    paddingVertical: mukokoTheme.spacing.sm,
    gap: mukokoTheme.spacing.sm,
  },
  categoryChip: {
    marginRight: mukokoTheme.spacing.sm,
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  categoryChipSelected: {
    backgroundColor: mukokoTheme.colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: mukokoTheme.spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  articlesScroll: {
    flex: 1,
  },
  articlesContent: {
    padding: mukokoTheme.spacing.md,
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  articleCard: {
    width: CARD_WIDTH,
    marginBottom: mukokoTheme.spacing.md,
  },
  articleCardTall: {
    height: 320,
  },
  articleCardShort: {
    height: 240,
  },
  card: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: mukokoTheme.colors.outline,
  },
  cardImage: {
    width: '100%',
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  cardImageTall: {
    height: 200,
  },
  cardImageShort: {
    height: 140,
  },
  cardOverlay: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: mukokoTheme.spacing.sm,
    justifyContent: 'space-between',
  },
  sourceChip: {
    backgroundColor: mukokoTheme.colors.primaryContainer,
    alignSelf: 'flex-start',
    height: 22,
  },
  sourceChipText: {
    fontSize: 10,
    color: mukokoTheme.colors.onPrimaryContainer,
  },
  cardTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    fontSize: 14,
    lineHeight: 18,
    color: mukokoTheme.colors.onSurface,
    flex: 1,
    marginVertical: mukokoTheme.spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 11,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  metaDivider: {
    marginHorizontal: mukokoTheme.spacing.xs,
    color: mukokoTheme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  cardCategory: {
    fontSize: 11,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: mukokoTheme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: mukokoTheme.spacing.md,
  },
  emptyTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    fontSize: 20,
    marginBottom: mukokoTheme.spacing.sm,
    color: mukokoTheme.colors.onSurface,
    textAlign: 'center',
  },
  emptyMessage: {
    color: mukokoTheme.colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
  },
});
