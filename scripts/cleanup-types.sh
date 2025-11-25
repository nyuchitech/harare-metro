#!/bin/bash
# Remove all TypeScript type annotations from JavaScript files

find app -name "*.jsx" -o -name "*.js" | while read file; do
  if [ -f "$file" ]; then
    # Remove type annotations
    perl -i -pe 's/\([a-z][a-zA-Z0-9]*: any\)/($1)/g' "$file"
    perl -i -pe 's/\([a-z][a-zA-Z0-9]*: [A-Z][a-zA-Z0-9<>|,\s]+\)/($1)/g' "$file"
    perl -i -pe 's/: any\[\]//g' "$file"
    perl -i -pe 's/: any//g' "$file"
    echo "Cleaned: $file"
  fi
done

echo "✓ TypeScript annotations removed"
