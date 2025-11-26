/**
 * NewsByteCard - Material UI enhanced article card for NewsBytes
 * Mukoko News design system with vibrant shadows and rounded corners
 *
 * Features:
 * - Material Design elevated surfaces
 * - Readable content with proper contrast
 * - Pulse AI summary integration
 * - Engagement metrics and actions
 * - Zimbabwe flag accent colors
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Chip,
  Box,
  Avatar,
  Stack,
  Fade,
  Collapse,
  Button,
  Backdrop,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  BookmarkBorder,
  Bookmark,
  Share,
  OpenInNew,
  Visibility,
  ChatBubbleOutline,
  Bolt,
} from '@mui/icons-material';

export function NewsByteCard({ article, isActive, onAuthRequired, user }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle share
  const handleShare = async () => {
    const url = `${window.location.origin}/${article.source_id}/${article.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description || article.title,
          url
        });
      } catch (err) {
        // User cancelled
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  // Handle like
  const handleLike = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setIsLiked(!isLiked);
    // TODO: API call
  };

  // Handle save
  const handleSave = () => {
    if (!user) {
      onAuthRequired();
      return;
    }
    setIsSaved(!isSaved);
    // TODO: API call
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'black',
      }}
    >
      {/* Background Image */}
      <Box
        component="img"
        src={article.image_url}
        alt={article.title}
        loading={isActive ? 'eager' : 'lazy'}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'brightness(0.7)', // Darken for better text contrast
        }}
      />

      {/* Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 40%, transparent 70%)',
        }}
      />

      {/* Content Container */}
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 3,
          pt: 'max(env(safe-area-inset-top), 16px)',
          pb: 'max(env(safe-area-inset-bottom) + 112px, 128px)',
        }}
      >
        {/* Top Section - Source Info */}
        <Fade in={isActive} timeout={500}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {/* Source Badge */}
            <Card
              elevation={8}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      background: 'linear-gradient(135deg, #729b63 0%, #8fb47f 100%)',
                      fontWeight: 700,
                    }}
                  >
                    {article.source?.charAt(0).toUpperCase() || 'N'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="white">
                      {article.source || 'News'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {formatTimeAgo(article.published_at)}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Category Chip */}
            {article.category && (
              <Chip
                label={article.category}
                size="small"
                sx={{
                  bgcolor: '#729b63',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: 4,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0px 4px 12px rgba(114, 155, 99, 0.4)',
                }}
              />
            )}
          </Box>
        </Fade>

        {/* Bottom Section - Article Content */}
        <Fade in={isActive} timeout={800}>
          <Box>
            <Stack direction="row" spacing={2} alignItems="flex-end">
              {/* Content Card */}
              <Box sx={{ flex: 1 }}>
                {/* Pulse AI Summary */}
                {article.pulse_summary && (
                  <Card
                    elevation={12}
                    sx={{
                      mb: 2,
                      bgcolor: '#ffcc00',
                      color: 'black',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <Avatar sx={{ width: 20, height: 20, bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
                          <Bolt sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Pulse
                        </Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.4 }}>
                        {article.pulse_summary}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Main Content Card */}
                <Card
                  elevation={16}
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 5,
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Title */}
                    <Typography
                      variant="h5"
                      component="h2"
                      fontWeight={700}
                      color="white"
                      sx={{
                        fontFamily: "'Noto Serif', Georgia, serif",
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        mb: article.description ? 1.5 : 0,
                      }}
                    >
                      {article.title}
                    </Typography>

                    {/* Description */}
                    {article.description && (
                      <Box>
                        <Typography
                          variant="body2"
                          color="rgba(255, 255, 255, 0.9)"
                          sx={{
                            lineHeight: 1.6,
                            display: showFullDescription ? 'block' : '-webkit-box',
                            WebkitLineClamp: showFullDescription ? 'unset' : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {article.description}
                        </Typography>
                        {article.description.length > 100 && (
                          <Button
                            size="small"
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            sx={{
                              color: '#ffcc00',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              mt: 0.5,
                              p: 0,
                              minWidth: 0,
                              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                            }}
                          >
                            {showFullDescription ? 'Show less' : 'Show more'}
                          </Button>
                        )}
                      </Box>
                    )}

                    {/* Engagement Metrics */}
                    {(article.view_count || article.like_count || article.comment_count) && (
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {article.view_count > 0 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Visibility sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }} />
                            <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
                              {article.view_count.toLocaleString()}
                            </Typography>
                          </Stack>
                        )}
                        {article.like_count > 0 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Favorite sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }} />
                            <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
                              {article.like_count.toLocaleString()}
                            </Typography>
                          </Stack>
                        )}
                        {article.comment_count > 0 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <ChatBubbleOutline sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.6)' }} />
                            <Typography variant="caption" color="rgba(255, 255, 255, 0.6)">
                              {article.comment_count.toLocaleString()}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    href={`/${article.source_id}/${article.slug}`}
                    sx={{
                      bgcolor: 'white',
                      color: 'black',
                      fontWeight: 600,
                      borderRadius: 6,
                      py: 1.5,
                      boxShadow: '0px 6px 16px rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0px 8px 20px rgba(255, 255, 255, 0.4)',
                      },
                    }}
                  >
                    Read Full Story
                  </Button>
                  <IconButton
                    href={article.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      borderRadius: 3,
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.75)',
                      },
                    }}
                  >
                    <OpenInNew />
                  </IconButton>
                </Stack>
              </Box>

              {/* Interaction Buttons (Vertical) */}
              <Stack spacing={1.5}>
                {/* Like */}
                <IconButton
                  onClick={handleLike}
                  sx={{
                    bgcolor: isLiked ? '#e03c31' : 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    width: 56,
                    height: 56,
                    boxShadow: isLiked ? '0px 6px 16px rgba(224, 60, 49, 0.5)' : '0px 4px 12px rgba(0, 0, 0, 0.4)',
                    '&:hover': {
                      bgcolor: isLiked ? '#cd6b76' : 'rgba(0, 0, 0, 0.85)',
                      boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.6)',
                    },
                  }}
                >
                  {isLiked ? <Favorite /> : <FavoriteBorder />}
                </IconButton>

                {/* Share */}
                <IconButton
                  onClick={handleShare}
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'white',
                    width: 56,
                    height: 56,
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.4)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.85)',
                      boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.6)',
                    },
                  }}
                >
                  <Share />
                </IconButton>

                {/* Bookmark */}
                <IconButton
                  onClick={handleSave}
                  sx={{
                    bgcolor: isSaved ? '#ffcc00' : 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: isSaved ? 'black' : 'white',
                    width: 56,
                    height: 56,
                    boxShadow: isSaved ? '0px 6px 16px rgba(255, 204, 0, 0.5)' : '0px 4px 12px rgba(0, 0, 0, 0.4)',
                    '&:hover': {
                      bgcolor: isSaved ? '#ffd633' : 'rgba(0, 0, 0, 0.85)',
                      boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.6)',
                    },
                  }}
                >
                  {isSaved ? <Bookmark /> : <BookmarkBorder />}
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
