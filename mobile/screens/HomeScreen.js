import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
  TouchableOpacity,
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

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [articlesList, setArticlesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadInitialData();
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

  const renderArticleCard = (article) => (
    <TouchableOpacity
      key={article.id}
      activeOpacity={0.7}
      onPress={() => handleArticlePress(article)}
    >
      <Card style={styles.articleCard}>
        {article.imageUrl && (
          <Card.Cover source={{ uri: article.imageUrl }} />
        )}
        <Card.Content style={styles.articleContent}>
          {article.category && (
            <Chip
              mode="flat"
              style={styles.categoryChip}
              textStyle={styles.categoryChipText}
            >
              {article.category}
            </Chip>
          )}
          <Text variant="headlineSmall" style={styles.articleTitle}>
            {article.title}
          </Text>
          {article.description && (
            <Text variant="bodyMedium" style={styles.articleDescription}>
              {article.description}
            </Text>
          )}
          <View style={styles.articleMeta}>
            <Text variant="bodySmall" style={styles.articleSource}>
              {article.source}
            </Text>
            <Text variant="bodySmall" style={styles.articleDate}>
              {new Date(article.pubDate).toLocaleDateString()}
            </Text>
          </View>
        </Card.Content>
        <Card.Actions>
          <IconButton icon="bookmark-outline" size={20} />
          <IconButton icon="share-variant-outline" size={20} />
        </Card.Actions>
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
      <ScrollView
        style={styles.articlesContainer}
        contentContainerStyle={styles.articlesContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[mukokoTheme.colors.primary]}
          />
        }
      >
        {articlesList.length === 0 ? (
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
        ) : (
          articlesList.map(renderArticleCard)
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
  categoriesContainer: {
    backgroundColor: mukokoTheme.colors.background,
    paddingVertical: mukokoTheme.spacing.xs,
  },
  categoriesContent: {
    paddingHorizontal: mukokoTheme.spacing.sm,
    gap: mukokoTheme.spacing.xs,
  },
  categoryFilter: {
    marginRight: mukokoTheme.spacing.xs,
    borderRadius: 20,
    height: 36,
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  articlesContainer: {
    flex: 1,
  },
  articlesContent: {
    padding: mukokoTheme.spacing.md,
    paddingTop: 0,
    paddingBottom: 100, // Extra space for floating tab bar
    gap: mukokoTheme.spacing.md,
  },
  articleCard: {
    marginBottom: mukokoTheme.spacing.md,
    borderRadius: mukokoTheme.roundness,
    backgroundColor: mukokoTheme.colors.surface,
    ...mukokoTheme.shadows.medium,
  },
  articleContent: {
    paddingVertical: mukokoTheme.spacing.md,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginBottom: mukokoTheme.spacing.sm,
    backgroundColor: mukokoTheme.colors.primaryContainer,
  },
  categoryChipText: {
    fontSize: 11,
    color: mukokoTheme.colors.onPrimaryContainer,
  },
  articleTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    marginBottom: mukokoTheme.spacing.sm,
    color: mukokoTheme.colors.onSurface,
  },
  articleDescription: {
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.sm,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: mukokoTheme.spacing.sm,
  },
  articleSource: {
    color: mukokoTheme.colors.primary,
    fontWeight: '600',
  },
  articleDate: {
    color: mukokoTheme.colors.onSurfaceVariant,
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
