import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  Share,
} from 'react-native';
import {
  Text,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { newsBytes, articles as articlesAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import mukokoTheme from '../theme';
import ZimbabweFlagStrip from '../components/ZimbabweFlagStrip';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function NewsBytesScreen({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bytes, setBytes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bytesState, setBytesState] = useState({});
  const flatListRef = useRef(null);

  useEffect(() => {
    loadNewsBytes();
  }, []);

  const loadNewsBytes = async () => {
    try {
      setLoading(true);
      const { data, error } = await newsBytes.getFeed({ limit: 20 });

      if (data?.articles) {
        // Transform articles into short-form bytes
        const transformedBytes = data.articles.map((article) => ({
          id: article.id,
          title: article.title,
          description: article.description || '',
          source: article.source,
          source_id: article.source_id,
          slug: article.slug,
          category: article.category,
          image_url: article.image_url || article.imageUrl,
          published_at: article.published_at || article.pubDate,
          likesCount: article.likesCount || 0,
          commentsCount: article.commentsCount || 0,
          isLiked: article.isLiked || false,
          isSaved: article.isSaved || false,
        }));

        // Initialize state for each byte
        const initialState = {};
        transformedBytes.forEach(byte => {
          initialState[byte.id] = {
            isLiked: byte.isLiked,
            isSaved: byte.isSaved,
            likesCount: byte.likesCount,
          };
        });
        setBytesState(initialState);
        setBytes(transformedBytes);
      }
    } catch (error) {
      console.error('[NewsBytes] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (byte) => {
    if (!isAuthenticated) {
      navigation.navigate('Profile');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Optimistic update
    setBytesState(prev => ({
      ...prev,
      [byte.id]: {
        ...prev[byte.id],
        isLiked: !prev[byte.id]?.isLiked,
        likesCount: prev[byte.id]?.isLiked
          ? (prev[byte.id]?.likesCount || 0) - 1
          : (prev[byte.id]?.likesCount || 0) + 1,
      },
    }));

    try {
      const result = await articlesAPI.like(byte.id);
      if (result.error) {
        // Revert on error
        setBytesState(prev => ({
          ...prev,
          [byte.id]: {
            ...prev[byte.id],
            isLiked: prev[byte.id]?.isLiked,
            likesCount: prev[byte.id]?.likesCount,
          },
        }));
      }
    } catch (error) {
      console.error('[NewsBytes] Like error:', error);
    }
  };

  const handleSave = async (byte) => {
    if (!isAuthenticated) {
      navigation.navigate('Profile');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setBytesState(prev => ({
      ...prev,
      [byte.id]: {
        ...prev[byte.id],
        isSaved: !prev[byte.id]?.isSaved,
      },
    }));

    try {
      const result = await articlesAPI.save(byte.id);
      if (result.error) {
        // Revert on error
        setBytesState(prev => ({
          ...prev,
          [byte.id]: {
            ...prev[byte.id],
            isSaved: !prev[byte.id]?.isSaved,
          },
        }));
      }
    } catch (error) {
      console.error('[NewsBytes] Save error:', error);
    }
  };

  const handleShare = async (byte) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await Share.share({
        message: `${byte.title}\n\nRead on Mukoko News`,
        title: byte.title,
      });
    } catch (error) {
      console.error('[NewsBytes] Share error:', error);
    }
  };

  const handleViewArticle = (byte) => {
    navigation.navigate('ArticleDetail', {
      articleId: byte.id,
      source: byte.source_id || byte.source,
      slug: byte.slug,
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderByte = ({ item, index }) => {
    const byteState = bytesState[item.id] || {};

    return (
      <TouchableOpacity
        style={styles.byteContainer}
        activeOpacity={1}
        onPress={() => handleViewArticle(item)}
      >
        {/* Background Image */}
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.backgroundImage, styles.placeholderBackground]} />
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />

      {/* Content */}
      <View style={styles.contentContainer}>
        {/* Category Badge */}
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}

        {/* Title */}
        <Text variant="headlineMedium" style={styles.byteTitle}>
          {item.title}
        </Text>

        {/* Description */}
        {item.description && (
          <Text variant="bodyMedium" style={styles.byteDescription}>
            {item.description.slice(0, 150)}...
          </Text>
        )}

        {/* Source */}
        <View style={styles.metaContainer}>
          <Text style={styles.sourceText}>{item.source}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.dateText}>
            {new Date(item.published_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Right Side Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item)}
        >
          <IconButton
            icon={byteState.isLiked ? "heart" : "heart-outline"}
            iconColor={byteState.isLiked ? mukokoTheme.colors.zwRed : mukokoTheme.colors.zwWhite}
            size={32}
          />
          <Text style={styles.actionText}>
            {byteState.likesCount || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewArticle(item)}
        >
          <IconButton
            icon="comment-outline"
            iconColor={mukokoTheme.colors.zwWhite}
            size={32}
          />
          <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <IconButton
            icon="share-variant-outline"
            iconColor={mukokoTheme.colors.zwWhite}
            size={32}
          />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleSave(item)}
        >
          <IconButton
            icon={byteState.isSaved ? "bookmark" : "bookmark-outline"}
            iconColor={byteState.isSaved ? mukokoTheme.colors.zwYellow : mukokoTheme.colors.zwWhite}
            size={32}
          />
        </TouchableOpacity>
      </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={mukokoTheme.colors.zwWhite} />
          <Text style={styles.loadingText}>Loading NewsBytes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Zimbabwe Flag Strip */}
      <ZimbabweFlagStrip />

      {/* Vertical Scrolling Bytes */}
      <FlatList
        ref={flatListRef}
        data={bytes}
        renderItem={renderByte}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {bytes.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mukokoTheme.colors.zwBlack,
  },
  flagStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: '100%',
    zIndex: 1000,
    backgroundColor: mukokoTheme.colors.zwGreen,
    borderRightWidth: 2,
    borderRightColor: mukokoTheme.colors.zwYellow,
  },
  byteContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: mukokoTheme.colors.zwBlack,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 140,
    left: mukokoTheme.spacing.md,
    right: 80,
    gap: mukokoTheme.spacing.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: mukokoTheme.colors.accent,
    paddingHorizontal: mukokoTheme.spacing.md,
    paddingVertical: mukokoTheme.spacing.xs,
    borderRadius: mukokoTheme.roundness,
  },
  categoryText: {
    color: mukokoTheme.colors.zwBlack,
    fontFamily: mukokoTheme.fonts.bold.fontFamily,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  byteTitle: {
    fontFamily: mukokoTheme.fonts.serifBold.fontFamily,
    color: mukokoTheme.colors.zwWhite,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  byteDescription: {
    color: mukokoTheme.colors.zwWhite,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: mukokoTheme.spacing.xs,
  },
  sourceText: {
    color: mukokoTheme.colors.accent,
    fontFamily: mukokoTheme.fonts.bold.fontFamily,
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dotSeparator: {
    color: mukokoTheme.colors.zwWhite,
    opacity: 0.7,
  },
  dateText: {
    color: mukokoTheme.colors.zwWhite,
    opacity: 0.8,
    fontSize: 13,
  },
  actionsContainer: {
    position: 'absolute',
    right: mukokoTheme.spacing.sm,
    bottom: 160,
    gap: mukokoTheme.spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    color: mukokoTheme.colors.zwWhite,
    fontSize: 12,
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: mukokoTheme.colors.accent,
    width: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: mukokoTheme.spacing.md,
  },
  loadingText: {
    color: mukokoTheme.colors.zwWhite,
    fontFamily: mukokoTheme.fonts.medium.fontFamily,
  },
});
