#!/bin/bash
echo "🔧 Configuring KV storage..."

# RSS Sources
RSS_SOURCES='[{"id":"herald","name":"Herald Zimbabwe","url":"https://www.herald.co.zw/feed/","category":"general","enabled":true,"priority":5},{"id":"newsday","name":"NewsDay Zimbabwe","url":"https://www.newsday.co.zw/feed/","category":"general","enabled":true,"priority":5},{"id":"chronicle","name":"Chronicle Zimbabwe","url":"https://www.chronicle.co.zw/feed/","category":"general","enabled":true,"priority":4},{"id":"techzim","name":"Techzim","url":"https://www.techzim.co.zw/feed/","category":"technology","enabled":true,"priority":3}]'

# Categories
CATEGORIES='[{"id":"all","name":"All News","emoji":"📰","priority":10},{"id":"politics","name":"Politics","emoji":"🏛️","priority":9},{"id":"economy","name":"Economy","emoji":"💰","priority":8},{"id":"business","name":"Business","emoji":"💼","priority":7},{"id":"sports","name":"Sports","emoji":"⚽","priority":6},{"id":"technology","name":"Technology","emoji":"💻","priority":5}]'

echo "Setting RSS sources..."
npx wrangler kv key put "config:rss_sources" "$RSS_SOURCES" --binding CONFIG_STORAGE

echo "Setting categories..."
npx wrangler kv key put "config:categories" "$CATEGORIES" --binding CONFIG_STORAGE

echo "✅ KV configuration complete!"
