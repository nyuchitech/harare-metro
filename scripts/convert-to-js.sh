#!/bin/bash
# Convert TypeScript files to JavaScript
# Removes type annotations and converts .tsx/.ts to .jsx/.js

set -e

echo "Converting TypeScript files to JavaScript..."

# Convert routes
for file in app/routes/*.tsx; do
  if [ -f "$file" ]; then
    base=$(basename "$file" .tsx)
    echo "Converting $file to $base.jsx"

    # Remove type annotations and convert
    sed -E \
      -e 's/import type \{ Route \} from "\.\/\+types\/[^"]+";?//g' \
      -e 's/: Route\.(LoaderArgs|ActionArgs|ComponentProps|MetaArgs)//g' \
      -e 's/: \{ error\?: string \}//g' \
      -e 's/ as string//g' \
      -e 's/ as \{ [^}]+ \}//g' \
      -e 's/useActionData<[^>]+>/useActionData/g' \
      -e 's/useLoaderData<[^>]+>/useLoaderData/g' \
      -e 's/\.tsx/.jsx/g' \
      "$file" > "app/routes/$base.jsx"

    echo "  ✓ Created app/routes/$base.jsx"
  fi
done

# Convert components
for file in app/components/**/*.tsx; do
  if [ -f "$file" ]; then
    dir=$(dirname "$file")
    base=$(basename "$file" .tsx)
    echo "Converting $file to $base.jsx"

    sed -E \
      -e 's/: React\.[A-Za-z]+//g' \
      -e 's/: [A-Z][A-Za-z]+Props//g' \
      -e 's/interface [A-Z][A-Za-z]+Props \{[^}]+\}//g' \
      -e 's/\.tsx/.jsx/g' \
      "$file" > "$dir/$base.jsx"

    echo "  ✓ Created $dir/$base.jsx"
  fi
done

# Convert lib files
for file in app/lib/*.ts; do
  if [ -f "$file" ] && [[ ! "$file" =~ \.d\.ts$ ]]; then
    base=$(basename "$file" .ts)
    echo "Converting $file to $base.js"

    sed -E \
      -e 's/: [A-Z][A-Za-z<>\[\]|]+//g' \
      -e 's/export interface [^{]+\{[^}]+\}//g' \
      -e 's/\.ts/.js/g' \
      "$file" > "app/lib/$base.js"

    echo "  ✓ Created app/lib/$base.js"
  fi
done

echo "✓ Conversion complete!"
echo ""
echo "Next steps:"
echo "1. Update app/routes.js to reference .jsx files"
echo "2. Remove old .tsx and .ts files"
echo "3. Run 'npm run build' to test"
