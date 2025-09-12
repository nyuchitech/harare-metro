// Icon Component Usage Examples
import React from 'react'
import { logger } from '../../utils/logger'
import { IconButton } from '@/components/ui/icon-button'
import { IconGroup } from '@/components/ui/icon-group'
import { IconWrapper } from '@/components/ui/icon-wrapper'
import { 
  ActionButton, 
  ThemeToggleGroup, 
  ArticleActions,
  SearchButton,
  RefreshButton 
} from '@/components/ui/icon-utils'
import {
  HeartIcon,
  ShareIcon,
  BookmarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  StarIcon
} from '@heroicons/react/24/outline'

export const IconComponentExamples = () => {
  const [theme, setTheme] = React.useState('light')
  const [liked, setLiked] = React.useState(false)
  const [bookmarked, setBookmarked] = React.useState(false)

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Icon Component Examples</h2>
      
      {/* Basic IconButton */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Basic IconButton</h3>
        <IconGroup>
          <IconButton tooltip="Like">
            <IconWrapper size="sm">
              <HeartIcon />
            </IconWrapper>
          </IconButton>
          
          <IconButton variant="outline" tooltip="Share">
            <IconWrapper size="sm">
              <ShareIcon />
            </IconWrapper>
          </IconButton>
          
          <IconButton variant="secondary" tooltip="Bookmark">
            <IconWrapper size="sm">
              <BookmarkIcon />
            </IconWrapper>
          </IconButton>
        </IconGroup>
      </section>

      {/* Theme Toggle */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Theme Toggle</h3>
        <ThemeToggleGroup theme={theme} onThemeChange={setTheme} />
      </section>

      {/* Article Actions */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Article Actions</h3>
        <ArticleActions
          onLike={() => setLiked(!liked)}
          onShare={() => logger.debug('Share')}
          onBookmark={() => setBookmarked(!bookmarked)}
          isLiked={liked}
          isBookmarked={bookmarked}
        />
      </section>

      {/* Different Sizes */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Different Sizes</h3>
        <IconGroup>
          <IconButton size="sm" tooltip="Small">
            <IconWrapper size="xs">
              <StarIcon />
            </IconWrapper>
          </IconButton>
          
          <IconButton size="default" tooltip="Default">
            <IconWrapper size="sm">
              <StarIcon />
            </IconWrapper>
          </IconButton>
          
          <IconButton size="lg" tooltip="Large">
            <IconWrapper size="md">
              <StarIcon />
            </IconWrapper>
          </IconButton>
        </IconGroup>
      </section>

      {/* Utility Components */}
      <section>
        <h3 className="text-lg font-semibold mb-3">Utility Components</h3>
        <IconGroup>
          <SearchButton onClick={() => logger.debug('Search')} />
          <RefreshButton onClick={() => logger.debug('Refresh')} />
          <ActionButton 
            icon={StarIcon} 
            label="Favorite" 
            onClick={() => logger.debug('Favorite')}
          />
        </IconGroup>
      </section>
    </div>
  )
}
