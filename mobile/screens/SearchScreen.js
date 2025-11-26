import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Button,
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

/**
 * SearchScreen - Search news articles
 *
 * Features:
 * - Full-text search with debouncing
 * - Category filters
 * - Search suggestions
 * - Recent searches
 * - Results grid
 */
export default function SearchScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await categoriesAPI.getAll();
      if (result.data?.categories) {
        setCategories(result.data.categories);
      }
    } catch (err) {
      console.error('[Search] Load categories error:', err);
    }
  };

  const performSearch = async (query, category = null) => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setTotal(0);
      setActiveQuery('');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setActiveQuery(query);

      // Call search API
      const result = await articlesAPI.search({
        q: query,
        category,
        limit: 50,
      });

      if (result.error) {
        setError(result.error);
        setResults([]);
        setTotal(0);
      } else if (result.data) {
        setResults(result.data.results || []);
        setTotal(result.data.total || 0);
      }
    } catch (err) {
      console.error('[Search] Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);

    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new debounce timer (500ms delay)
    const timer = setTimeout(() => {
      if (text.trim().length > 0) {
        performSearch(text, selectedCategory);
      } else {
        setResults([]);
        setTotal(0);
        setActiveQuery('');
      }
    }, 500);

    setDebounceTimer(timer);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery, selectedCategory);
    }
  };

  const handleCategoryPress = async (category) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (selectedCategory === category) {
      setSelectedCategory(null);
      if (activeQuery) {
        await performSearch(activeQuery, null);
      }
    } else {
      setSelectedCategory(category);
      if (activeQuery) {
        await performSearch(activeQuery, category);
      }
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
          currentRoute="Search"
          isAuthenticated={isAuthenticated}
          title="Search"
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search Zimbabwe news..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearchSubmit}
              style={styles.searchbar}
              iconColor={mukokoTheme.colors.primary}
              loading={loading}
            />
          </View>

          {/* Search Info */}
          {activeQuery && (
            <View style={styles.searchInfo}>
              <Text style={styles.searchInfoTitle}>
                Search Results for "{activeQuery}"
              </Text>
              <Text style={styles.searchInfoSubtitle}>
                Found {total} article{total !== 1 ? 's' : ''} from Zimbabwe news sources
              </Text>
            </View>
          )}

          {/* Category Filters */}
          {categories.length > 0 && activeQuery && (
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
                🏠 All Categories
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

          {/* Error State */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* No Query State */}
          {!activeQuery && !loading && (
            <View style={styles.centerContainer}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Search Zimbabwe News</Text>
                <Text style={styles.emptyMessage}>
                  Find articles from trusted Zimbabwe news sources. Search by keywords, topics, or current events.
                </Text>
                {categories.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Suggested Topics:</Text>
                    <View style={styles.suggestionsChips}>
                      {categories.slice(0, 6).map((category) => (
                        <Chip
                          key={category.id}
                          onPress={() => {
                            setSearchQuery(category.name.toLowerCase());
                            performSearch(category.name.toLowerCase());
                          }}
                          style={styles.suggestionChip}
                          textStyle={styles.suggestionChipText}
                        >
                          {category.emoji} {category.name}
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* No Results State */}
          {activeQuery && results.length === 0 && !loading && !error && (
            <View style={styles.centerContainer}>
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyTitle}>No Results Found</Text>
                <Text style={styles.emptyMessage}>
                  No articles found for "{activeQuery}". Try different keywords or browse categories.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Home')}
                  style={styles.emptyButton}
                  buttonColor={mukokoTheme.colors.primary}
                >
                  Browse All News
                </Button>
              </View>
            </View>
          )}

          {/* Search Results */}
          {results.length > 0 && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
            >
              {results.map((article, index) => (
                <TouchableOpacity
                  key={article.id || index}
                  activeOpacity={0.7}
                  onPress={() => handleArticlePress(article)}
                  style={styles.resultCard}
                >
                  <Card style={styles.card}>
                    {article.image_url && (
                      <Image
                        source={{ uri: article.image_url }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    )}
                    <Card.Content style={styles.cardContent}>
                      {/* Meta */}
                      <View style={styles.cardMeta}>
                        <Chip
                          mode="flat"
                          style={styles.sourceChip}
                          textStyle={styles.sourceChipText}
                        >
                          {article.source || 'Unknown'}
                        </Chip>
                        <Text style={styles.cardDate}>
                          {formatDate(article.published_at)}
                        </Text>
                      </View>

                      {/* Title */}
                      <Text style={styles.cardTitle}>{article.title}</Text>

                      {/* Description */}
                      {article.description && (
                        <Text
                          style={styles.cardDescription}
                          numberOfLines={3}
                          ellipsizeMode="tail"
                        >
                          {article.description}
                        </Text>
                      )}

                      {/* Actions */}
                      <View style={styles.cardActions}>
                        <Text style={styles.readMoreText}>Read More →</Text>
                        <View style={styles.cardActionButtons}>
                          <IconButton
                            icon="heart-outline"
                            size={18}
                            iconColor={mukokoTheme.colors.onSurfaceVariant}
                            style={styles.actionIcon}
                          />
                          <IconButton
                            icon="bookmark-outline"
                            size={18}
                            iconColor={mukokoTheme.colors.onSurfaceVariant}
                            style={styles.actionIcon}
                          />
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Loading State */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={mukokoTheme.colors.primary} />
              <Text style={styles.loadingText}>Searching...</Text>
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
  searchContainer: {
    padding: mukokoTheme.spacing.md,
    backgroundColor: mukokoTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: mukokoTheme.colors.outline,
  },
  searchbar: {
    backgroundColor: mukokoTheme.colors.surfaceVariant,
    borderRadius: 24,
    elevation: 0,
  },
  searchInfo: {
    padding: mukokoTheme.spacing.md,
    backgroundColor: mukokoTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: mukokoTheme.colors.outline,
  },
  searchInfoTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    fontSize: 18,
    color: mukokoTheme.colors.onSurface,
    marginBottom: mukokoTheme.spacing.xs,
  },
  searchInfoSubtitle: {
    fontSize: 14,
    color: mukokoTheme.colors.onSurfaceVariant,
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
  errorContainer: {
    margin: mukokoTheme.spacing.md,
    padding: mukokoTheme.spacing.lg,
    backgroundColor: mukokoTheme.colors.errorContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: mukokoTheme.colors.error,
  },
  errorText: {
    color: mukokoTheme.colors.onErrorContainer,
    fontSize: 14,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: mukokoTheme.spacing.xl,
  },
  emptyCard: {
    backgroundColor: mukokoTheme.colors.surface,
    borderRadius: 16,
    padding: mukokoTheme.spacing.xl,
    alignItems: 'center',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: mukokoTheme.colors.outline,
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
    marginBottom: mukokoTheme.spacing.lg,
  },
  emptyButton: {
    borderRadius: 24,
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: mukokoTheme.spacing.md,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
    fontWeight: mukokoTheme.fonts.medium.fontWeight,
    color: mukokoTheme.colors.onSurface,
    marginBottom: mukokoTheme.spacing.sm,
  },
  suggestionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mukokoTheme.spacing.xs,
  },
  suggestionChip: {
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  suggestionChipText: {
    fontSize: 12,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: mukokoTheme.spacing.md,
    gap: mukokoTheme.spacing.md,
  },
  resultCard: {
    marginBottom: mukokoTheme.spacing.md,
  },
  card: {
    backgroundColor: mukokoTheme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: mukokoTheme.colors.outline,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: mukokoTheme.colors.surfaceVariant,
  },
  cardContent: {
    paddingVertical: mukokoTheme.spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: mukokoTheme.spacing.sm,
  },
  sourceChip: {
    backgroundColor: mukokoTheme.colors.primaryContainer,
    height: 24,
  },
  sourceChipText: {
    fontSize: 11,
    color: mukokoTheme.colors.onPrimaryContainer,
  },
  cardDate: {
    fontSize: 12,
    color: mukokoTheme.colors.onSurfaceVariant,
  },
  cardTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    fontWeight: mukokoTheme.fonts.serifBold.fontWeight,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: mukokoTheme.spacing.sm,
    color: mukokoTheme.colors.onSurface,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: mukokoTheme.colors.onSurfaceVariant,
    marginBottom: mukokoTheme.spacing.md,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
    fontWeight: mukokoTheme.fonts.medium.fontWeight,
    color: mukokoTheme.colors.primary,
  },
  cardActionButtons: {
    flexDirection: 'row',
    gap: mukokoTheme.spacing.xs,
  },
  actionIcon: {
    margin: 0,
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
});
