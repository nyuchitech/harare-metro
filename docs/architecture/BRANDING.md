# Harare Metro - Brand Guidelines

This document defines the visual identity, color system, typography, and design patterns for Harare Metro. All UI elements must adhere to these guidelines to maintain brand consistency.

---

## Brand Identity

**Mission**: Celebrate Zimbabwe journalism and provide a modern, mobile-first news aggregation platform that connects readers with quality local journalism.

**Voice**: Professional yet accessible, celebrating Zimbabwe's heritage while embracing modern technology.

**Visual Theme**: Zimbabwe flag colors integrated seamlessly into a dark, modern interface with clean typography and mobile-first design patterns.

---

## Color System

### Zimbabwe Flag Palette

The entire application uses colors from the Zimbabwe flag. These colors are **non-negotiable** and must be used consistently across all UI elements.

```css
:root {
  --zw-green: 140 100% 32%;   /* #00A651 - Growth, prosperity, agriculture */
  --zw-yellow: 48 98% 54%;    /* #FDD116 - Mineral wealth, sunshine */
  --zw-red: 354 85% 57%;      /* #EF3340 - Heritage, struggle, passion */
  --zw-black: 0 0% 0%;        /* #000000 - African heritage, strength */
  --zw-white: 0 0% 100%;      /* #FFFFFF - Peace, unity, progress */
}
```

### Color Usage Guidelines

#### Green (#00A651)
**Primary Action Color**
- Primary buttons and CTAs
- Success states and confirmations
- Positive indicators and metrics
- Growth-related visualizations
- Active/selected states
- Links and interactive elements

**Examples**:
```css
bg-[hsl(var(--zw-green))]           /* Solid backgrounds */
text-[hsl(var(--zw-green))]         /* Text and icons */
border-[hsl(var(--zw-green))]       /* Borders and outlines */
hover:bg-[hsl(var(--zw-green))]/80  /* Hover states */
```

#### Yellow (#FDD116)
**Accent and Highlight Color**
- Warning messages (non-critical)
- Highlighted content
- Featured items and badges
- Special announcements
- Accent elements in illustrations

**Examples**:
```css
bg-[hsl(var(--zw-yellow))]
text-[hsl(var(--zw-yellow))]
border-[hsl(var(--zw-yellow))]
```

#### Red (#EF3340)
**Error and Urgent Action Color**
- Error states and messages
- Destructive actions (delete, remove)
- Critical warnings
- Urgent notifications
- Error input borders

**Examples**:
```css
bg-[hsl(var(--zw-red))]
text-[hsl(var(--zw-red))]
border-[hsl(var(--zw-red))]
bg-[hsl(var(--zw-red))]/10  /* Subtle error backgrounds */
```

#### Black (#000000)
**Base Color**
- Primary background color (dark mode)
- Input backgrounds
- Card backgrounds (darker shade)
- High-contrast text

**Examples**:
```css
bg-black          /* Primary backgrounds */
bg-gray-900       /* Card/panel backgrounds */
bg-gray-800       /* Interactive elements */
text-black        /* High contrast text (on light backgrounds) */
```

#### White (#FFFFFF)
**Text and Highlight Color**
- Primary text on dark backgrounds
- Button text
- Icon colors
- Highlights and emphasis

**Examples**:
```css
text-white        /* Primary text */
bg-white          /* Light backgrounds (rare) */
border-white      /* High contrast borders */
```

### Gray Scale (Neutral Colors)

For backgrounds, borders, and secondary elements:

```css
gray-50: #F9FAFB   /* Lightest gray */
gray-100: #F3F4F6
gray-200: #E5E7EB
gray-300: #D1D5DB
gray-400: #9CA3AF  /* Mid gray - secondary text */
gray-500: #6B7280
gray-600: #4B5563
gray-700: #374151  /* Borders, secondary backgrounds */
gray-800: #1F2937  /* Interactive elements */
gray-900: #111827  /* Card backgrounds */
```

---

## Typography System

### Font Families

The application uses a **dual-font system** for optimal readability and brand consistency.

#### Serif Font - Georgia (Headings)
**Usage**: All headings (h1-h6), titles, and branded text

```css
font-family: Georgia, 'Times New Roman', serif;
```

**Tailwind Class**: `font-serif`

**Examples**:
- Page titles
- Article headlines
- Section headers
- Logo text ("Harare Metro")
- Feature titles

#### Sans-Serif Font - Inter (Body)
**Usage**: All body text, UI elements, buttons, inputs

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

**Tailwind Class**: `font-sans` (default)

**Examples**:
- Paragraphs
- Button text
- Form inputs
- Navigation items
- UI labels and descriptions

### Font Scale

```css
/* Headings */
text-4xl: 2.25rem (36px)  /* Hero titles */
text-3xl: 1.875rem (30px) /* Page titles */
text-2xl: 1.5rem (24px)   /* Section titles */
text-xl: 1.25rem (20px)   /* Subsection titles */
text-lg: 1.125rem (18px)  /* Large body */

/* Body */
text-base: 1rem (16px)    /* Default body text */
text-sm: 0.875rem (14px)  /* Secondary text */
text-xs: 0.75rem (12px)   /* Captions, labels */
```

### Font Weights

```css
font-normal: 400   /* Body text */
font-medium: 500   /* Emphasis */
font-semibold: 600 /* Headings, buttons */
font-bold: 700     /* Strong emphasis */
```

### Typography Examples

```tsx
{/* Hero Title */}
<h1 className="text-4xl font-serif font-bold text-white">
  Welcome to Harare Metro
</h1>

{/* Section Title */}
<h2 className="text-2xl font-serif font-semibold text-white mb-4">
  Latest News
</h2>

{/* Body Text */}
<p className="text-base font-sans text-gray-300">
  This is body text using Inter font for maximum readability.
</p>

{/* Button Text */}
<button className="font-sans font-semibold">
  Read More
</button>
```

---

## Brand Element: Zimbabwe Flag Strip

The Zimbabwe flag strip is a **core brand element** and must be present on all full-page layouts.

### Implementation

```tsx
{/* Zimbabwe Flag Strip - Always include in full-page layouts */}
<div className="fixed top-0 left-0 w-2 h-screen z-50 bg-gradient-to-b from-[hsl(var(--zw-green))] via-[hsl(var(--zw-yellow))] via-40% via-[hsl(var(--zw-red))] via-60% via-[hsl(var(--zw-black))] to-[hsl(var(--zw-white))]" />
```

### Specifications
- **Position**: Fixed to left edge
- **Width**: 8px (2 in Tailwind units)
- **Height**: Full viewport height
- **Z-index**: 1000 (above most content)
- **Color Stops**:
  - 0-20%: Green
  - 20-40%: Yellow
  - 40-60%: Red
  - 60-80%: Black
  - 80-100%: White

### Usage Guidelines
- **Always present** on full-page views (home, articles, profiles)
- **Optional** on modals and overlays
- **Never hide** or obscure with content
- Consider left padding (`pl-3` or `pl-4`) on main content to prevent overlap

---

## UI Components

### Buttons

#### Primary Button (Green)
```tsx
<button className="px-6 py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-xl transition-colors">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors">
  Secondary Action
</button>
```

#### Destructive Button (Red)
```tsx
<button className="px-6 py-3 bg-[hsl(var(--zw-red))] hover:bg-[hsl(var(--zw-red))]/80 text-white font-semibold rounded-xl transition-colors">
  Delete
</button>
```

#### Disabled State
```tsx
<button className="px-6 py-3 bg-[hsl(var(--zw-green))] text-white font-semibold rounded-xl opacity-50 cursor-not-allowed" disabled>
  Disabled
</button>
```

### Cards

```tsx
<div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-lg hover:border-gray-700 transition-colors">
  {/* Card content */}
</div>
```

**Specifications**:
- Background: `bg-gray-900`
- Border: `border border-gray-800`
- Rounded: `rounded-2xl` (16px)
- Padding: `p-6` (24px)
- Hover: `hover:border-gray-700`

### Form Inputs

```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-black border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[hsl(var(--zw-green))] focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20 transition-colors"
  placeholder="Enter text..."
/>
```

**Specifications**:
- Background: `bg-black`
- Border: `border-gray-700`
- Focus border: `focus:border-[hsl(var(--zw-green))]`
- Focus ring: `focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20`
- Rounded: `rounded-xl`

### Error Input

```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-black border border-[hsl(var(--zw-red))] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-red))]/20"
/>
<p className="text-xs text-[hsl(var(--zw-red))] mt-2">
  Error message here
</p>
```

### Success Input

```tsx
<input
  type="text"
  className="w-full px-4 py-3 bg-black border border-[hsl(var(--zw-green))] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--zw-green))]/20"
/>
```

---

## Design Patterns

### Mobile-First Approach

All components must be designed with mobile as the primary experience.

**Responsive Breakpoints**:
```css
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Touch-Friendly Elements

- **Minimum touch target**: 44px × 44px
- **Button height**: 48px (`py-3`)
- **Spacing between interactive elements**: 8px minimum

### Rounded Corners

**Standard Rounding**:
- Small elements (badges, tags): `rounded-lg` (8px)
- Buttons, inputs: `rounded-xl` (12px)
- Cards, panels: `rounded-2xl` (16px)
- Modals: `rounded-3xl` (24px)
- Avatars, icons: `rounded-full` (circular)

### Loading States

```tsx
{/* Spinner */}
<div className="w-6 h-6 border-2 border-[hsl(var(--zw-green))] border-t-transparent rounded-full animate-spin" />

{/* Skeleton */}
<div className="w-full h-4 bg-gray-800 rounded animate-pulse" />
```

### Transitions

All interactive elements should have smooth transitions:

```css
transition-colors   /* Color changes */
transition-all      /* All properties */
duration-200        /* 200ms (default) */
duration-300        /* 300ms (slower) */
```

---

## Layout Patterns

### Container Widths

```tsx
{/* Full width mobile, constrained desktop */}
<div className="w-full max-w-7xl mx-auto px-4">
  {/* Content */}
</div>

{/* Narrow content (forms, articles) */}
<div className="w-full max-w-2xl mx-auto px-4">
  {/* Content */}
</div>
```

### Spacing Scale

```css
gap-2: 0.5rem (8px)    /* Tight spacing */
gap-3: 0.75rem (12px)  /* Compact spacing */
gap-4: 1rem (16px)     /* Default spacing */
gap-6: 1.5rem (24px)   /* Comfortable spacing */
gap-8: 2rem (32px)     /* Generous spacing */
```

---

## Iconography

### Icon Library

**Primary**: Lucide React
```tsx
import { Heart, Bookmark, Share, ArrowRight } from 'lucide-react';
```

### Icon Sizing

```tsx
{/* Small icons */}
<Icon className="w-4 h-4" />

{/* Default icons */}
<Icon className="w-5 h-5" />

{/* Large icons */}
<Icon className="w-6 h-6" />

{/* Hero icons */}
<Icon className="w-8 h-8" />
```

### Icon Colors

- Default: `text-gray-400`
- Active/Selected: `text-[hsl(var(--zw-green))]`
- Destructive: `text-[hsl(var(--zw-red))]`
- White: `text-white`

---

## Accessibility

### Contrast Ratios

All text must meet WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum

### Focus States

All interactive elements must have visible focus states:

```tsx
focus:outline-none
focus:ring-2
focus:ring-[hsl(var(--zw-green))]
focus:ring-offset-2
focus:ring-offset-black
```

### Semantic HTML

- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<button>` for actions, `<a>` for navigation
- Include `aria-label` for icon-only buttons
- Provide alt text for all images

---

## Animation Guidelines

### Timing Functions

```css
ease-in-out  /* Default for most transitions */
ease-out     /* Enter animations */
ease-in      /* Exit animations */
```

### Animation Duration

- **Micro-interactions**: 150-200ms
- **Standard transitions**: 200-300ms
- **Large movements**: 300-500ms

### Common Animations

```tsx
{/* Fade in */}
<div className="animate-in fade-in duration-300">

{/* Slide up */}
<div className="animate-in slide-in-from-bottom duration-500">

{/* Scale */}
<button className="hover:scale-105 transition-transform">
```

---

## Do's and Don'ts

### ✅ Do

- Use Zimbabwe flag colors exclusively
- Apply `font-serif` to all headings
- Include the flag strip on full-page layouts
- Design mobile-first
- Use rounded corners consistently
- Provide loading and error states
- Maintain minimum 44px touch targets
- Use semantic HTML

### ❌ Don't

- Introduce new colors outside the flag palette
- Mix additional font families
- Use sharp corners (no `rounded-none`)
- Remove the Zimbabwe flag strip
- Use small touch targets (<44px)
- Skip focus states
- Use overly bright colors on dark backgrounds
- Ignore mobile experience

---

## Brand Assets

### Logo Usage

The "Harare Metro" logo should always use:
- Font: Georgia (serif)
- Colors: "Harare" in white, "Metro" in green
- Never stretch or distort
- Maintain minimum clear space

```tsx
<h1 className="font-serif font-bold text-3xl">
  Harare <span className="text-[hsl(var(--zw-green))]">Metro</span>
</h1>
```

---

## Examples

### Article Card

```tsx
<article className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
  {/* Category Badge */}
  <span className="inline-block px-3 py-1 bg-[hsl(var(--zw-green))]/20 text-[hsl(var(--zw-green))] text-xs font-semibold rounded-lg mb-3">
    Politics
  </span>

  {/* Title */}
  <h3 className="text-xl font-serif font-bold text-white mb-2">
    Article Headline Goes Here
  </h3>

  {/* Excerpt */}
  <p className="text-gray-400 text-sm mb-4">
    Article excerpt for preview...
  </p>

  {/* Actions */}
  <div className="flex items-center gap-4 text-gray-400 text-sm">
    <button className="flex items-center gap-1 hover:text-[hsl(var(--zw-green))] transition-colors">
      <Heart className="w-4 h-4" />
      24
    </button>
    <button className="flex items-center gap-1 hover:text-[hsl(var(--zw-green))] transition-colors">
      <Bookmark className="w-4 h-4" />
    </button>
  </div>
</article>
```

### Modal

```tsx
<div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div className="bg-gray-900 rounded-3xl p-8 max-w-md w-full border border-gray-800">
    {/* Close button */}
    <button className="ml-auto block text-gray-400 hover:text-white transition-colors">
      <X className="w-6 h-6" />
    </button>

    {/* Modal content */}
    <h2 className="text-2xl font-serif font-bold text-white mb-4">
      Modal Title
    </h2>
    <p className="text-gray-400 mb-6">
      Modal content goes here...
    </p>

    {/* Actions */}
    <div className="flex gap-3">
      <button className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors">
        Cancel
      </button>
      <button className="flex-1 px-4 py-3 bg-[hsl(var(--zw-green))] hover:bg-[hsl(var(--zw-green))]/80 text-white font-semibold rounded-xl transition-colors">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## Quick Reference

### Color Classes

```css
/* Green (Primary) */
bg-[hsl(var(--zw-green))]
text-[hsl(var(--zw-green))]
border-[hsl(var(--zw-green))]

/* Yellow (Accent) */
bg-[hsl(var(--zw-yellow))]
text-[hsl(var(--zw-yellow))]

/* Red (Error) */
bg-[hsl(var(--zw-red))]
text-[hsl(var(--zw-red))]

/* Black (Background) */
bg-black
bg-gray-900
bg-gray-800

/* White (Text) */
text-white
```

### Typography Classes

```css
/* Headings */
font-serif font-bold
font-serif font-semibold

/* Body */
font-sans (default)
```

### Common Component Classes

```css
/* Button */
px-6 py-3 bg-[hsl(var(--zw-green))] rounded-xl font-semibold

/* Card */
bg-gray-900 rounded-2xl p-6 border border-gray-800

/* Input */
px-4 py-3 bg-black border border-gray-700 rounded-xl
```

---

## Version History

- **v1.0** (2025-10-31): Initial brand guidelines documentation

---

## Questions?

For questions about brand guidelines or design decisions, refer to:
- [CLAUDE.md](/CLAUDE.md) - Development guide
- [PROJECT-STATUS.md](/PROJECT-STATUS.md) - Current implementation status
- [README.md](/README.md) - Project overview
