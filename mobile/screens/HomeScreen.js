import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  RefreshControl,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Appbar,
  Card,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Searchbar,
  IconButton,
} from 'react-native-paper';
import { articles, categories as categoriesAPI } from '../api/client';
import mukokoTheme from '../theme';

// Helper function to format date safely
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Recently';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch (error) {
    return 'Recently';
  }
};

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articlesList, setArticlesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [numColumns, setNumColumns] = useState(1);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Update number of columns based on screen width
  useEffect(() => {
    const updateLayout = () => {
      const { width } = Dimensions.get('window');
      if (width < 768) {
        setNumColumns(1); // Mobile: 1 column
      } else if (width < 1024) {
        setNumColumns(2); // Tablet: 2 columns
      } else {
        setNumColumns(3); // Desktop: 3 columns
      }
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);

    // Load categories
    const { data: categoriesData } = await categoriesAPI.getAll();
    if (categoriesData?.categories) {
      setCategoriesList(categoriesData.categories);
    }

    // Load articles
    await loadArticles();

    setLoading(false);
  };

  const loadArticles = async (category = null) => {
    const { data, error } = await articles.getFeed({
      limit: 20,
      offset: 0,
      category,
    });

    if (data?.articles) {
      setArticlesList(data.articles);
    }

    if (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArticles(selectedCategory);
    setRefreshing(false);
  };

  const handleCategoryPress = async (categorySlug) => {
    if (selectedCategory === categorySlug) {
      setSelectedCategory(null);
      await loadArticles(null);
    } else {
      setSelectedCategory(categorySlug);
      await loadArticles(categorySlug);
    }
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleDetail', {
      articleId: article.id,
      source: article.source_id || article.source,
      slug: article.slug,
    });
  };

  const renderArticleCard = ({ item: article }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleArticlePress(article)}
      style={styles.articleCardContainer}
    >
      <Card style={styles.articleCard}>
        {article.imageUrl && (
          <Card.Cover
            source={{ uri: article.imageUrl }}
            style={styles.articleImage}
          />
        )}
        <Card.Content style={styles.articleContent}>
          <Text variant="headlineSmall" style={styles.articleTitle} numberOfLines={3}>
            {article.title}
          </Text>
          {article.description && (
            <Text variant="bodyMedium" style={styles.articleDescription} numberOfLines={2}>
              {article.description}
            </Text>
          )}
          <View style={styles.articleMeta}>
            <Text variant="bodySmall" style={styles.articleSource}>
              {article.source}
            </Text>
            <Text variant="bodySmall" style={styles.articleDot}>•</Text>
            <Text variant="bodySmall" style={styles.articleDate}>
              {article.pubDate ? formatDate(article.pubDate) : 'Recently'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mukokoTheme.colors.primary} />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading Mukoko News...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categoriesList.map((category) => (
          <Chip
            key={category.id || category.slug}
            selected={selectedCategory === (category.id || category.slug)}
            onPress={() => handleCategoryPress(category.id || category.slug)}
            style={styles.categoryFilter}
            textStyle={styles.categoryFilterText}
          >
            {category.name} {category.article_count ? `(${category.article_count})` : ''}
          </Chip>
        ))}
      </ScrollView>

      {/* Articles Feed */}
      <FlatList
        key={numColumns} // Force re-render when columns change
        data={articlesList}
        renderItem={renderArticleCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
        contentContainerStyle={styles.articlesContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[mukokoTheme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No articles found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyDescription}>
              Try selecting a different category or refreshing the feed.
            </Text>
            <Button
              mode="contained"
              onPress={onRefresh}
              style={styles.emptyButton}
            >
              Refresh Feed
            </Button>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.background,
  },
  categoriesContainer: {
    backgroundColor: mukokoTheme.colors.surface,
    paddingVertical: 10,
    zIndex: 10,
    ...mukokoTheme.shadows.small,
  },
  categoriesContent: {
    paddingHorizontal: mukokoTheme.spacing.md,
    gap: 8,
  },
  categoryFilter: {
    marginRight: 6,
    borderRadius: 16,
    height: 32,
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  articlesContent: {
    padding: mukokoTheme.spacing.md,
    paddingTop: mukokoTheme.spacing.md,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: mukokoTheme.spacing.md,
  },
  articleCardContainer: {
    flex: 1,
    marginBottom: mukokoTheme.spacing.md,
    marginHorizontal: 4,
  },
  articleCard: {
    borderRadius: mukokoTheme.roundness,
    backgroundColor: mukokoTheme.colors.surface,
    overflow: 'hidden',
    ...mukokoTheme.shadows.small,
  },
  articleImage: {
    borderTopLeftRadius: mukokoTheme.roundness,
    borderTopRightRadius: mukokoTheme.roundness,
  },
  articleContent: {
    paddingVertical: mukokoTheme.spacing.md,
    paddingHorizontal: mukokoTheme.spacing.md,
  },
  articleTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontSize: 18,
    lineHeight: 24,
    marginBottom: mukokoTheme.spacing.sm,
    color: mukokoTheme.colors.onSurface,
  },
  articleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.sm,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: mukokoTheme.spacing.xs,
  },
  articleSource: {
    color: mukokoTheme.colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  articleDot: {
    color: mukokoTheme.colors.onSurfaceVariant,
    marginHorizontal: 6,
    fontSize: 12,
  },
  articleDate: {
    color: mukokoTheme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: mukokoTheme.spacing.md,
  },
  loadingText: {
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: mukokoTheme.spacing.xxl,
    gap: mukokoTheme.spacing.md,
  },
  emptyTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    color: mukokoTheme.colors.onSurface,
  },
  emptyDescription: {
    color: mukokoTheme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: mukokoTheme.spacing.xl,
  },
  emptyButton: {
    marginTop: mukokoTheme.spacing.md,
    borderRadius: mukokoTheme.roundness,
  },
});
