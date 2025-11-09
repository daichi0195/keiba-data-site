# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📚 Documentation Index

For comprehensive project documentation, please refer to:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: システム全体のアーキテクチャ、技術スタック、データフロー、デプロイメント戦略
- **[COMPONENTS.md](./COMPONENTS.md)**: 全コンポーネントの詳細リファレンス、Props型定義、開発ベストプラクティス
- **[CLAUDE.md](./CLAUDE.md)** (このファイル): 開発時のクイックリファレンス、コーディング規約、ワークフロー

## Quick Start Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000 (with Turbopack)

# Production
npm run build            # Build for production with Turbopack
npm start               # Start production server

# Linting
npm run lint            # Run ESLint
```

## Project Overview

**KEIBA DATA LAB** is a Next.js 15 application that displays Japanese horse racing statistics (競馬) organized by racecourse, surface type, and race distance. It presents data through interactive, responsive tables and a fixed navigation sidebar.

**Tech Stack**: Next.js 15.5.6, React 19.1.0, TypeScript 5, CSS Modules, Turbopack

## Architecture & High-Level Design

### Routing: Dynamic Course Pages

The application uses Next.js App Router with a single dynamic route:

```
/courses/[racecourse]/[surface]/[distance]/page.tsx
```

**Parameters:**
- `racecourse`: nakayama, tokyo, hanshin, kyoto
- `surface`: turf (芝), dirt (ダート)
- `distance`: 1200, 1400, 1600, 1800, 2000, 2400 meters

**Example URLs:**
- `/courses/nakayama/dirt/1800` → Central Nakayama, dirt surface, 1800m race
- `/courses/tokyo/turf/2400` → Tokyo racecourse, grass/turf, 2400m race

Each page is **server-side rendered** with dynamic metadata generation (`generateMetadata()`) for SEO. Breadcrumb navigation provides hierarchy clarity.

### Data Structure

Mock racing statistics are embedded in `app/courses/[racecourse]/[surface]/[distance]/page.tsx`. The structure for each race condition includes:

```typescript
{
  course_info: {
    name: string,          // "中山競馬場"
    surface: string,       // "ダート" or "芝"
    distance: number       // 1800
  },
  // 7 popularity bands (1st favorite, 2-3, etc.)
  popularity_stats: [{ band, races, wins, place_rate, ... }],

  // Gate position data (8 gates)
  gate_stats: [{ gate_number, color, races, wins, ... }],

  // Running style breakdown (escape, lead, pursue, close)
  running_style_stats: [{ style, races, wins, ... }],

  // Ranked lists
  jockey_stats: [{ rank, name, races, wins, ... }],     // Top 26
  pedigree_stats: [{ sire, races, wins, ... }],         // Top 15
  dam_sire_stats: [{ dam_sire, races, wins, ... }],     // Top 20
  trainer_stats: [{ trainer, races, wins, ... }]        // Top 20
}
```

All statistics include: `races`, `wins`, `places_2`, `places_3`, `win_rate`, `place_rate`, `quinella_rate`, `win_payback`, `place_payback`. Percentages are stored as numbers (e.g., `31.3`, not `"31.3%"`).

### Component Architecture

**Key Components in `components/`:**

| Component | Purpose | Notable Features |
|-----------|---------|------------------|
| `SectionNav.tsx` | Fixed bottom navigation bar tracking active sections | Intersection Observer for scroll tracking, horizontal scroll with snap points, active state styling |
| `DataTable.tsx` | Generic table for ranked data (jockeys, pedigrees, trainers, dam sires) | Sticky first column on scroll, horizontal scroll on mobile, max value highlighting, name truncation to 3 chars on scroll, expandable/collapsible rows |
| `GateTable.tsx` | Gate position statistics with color-coded badges | 8 gate positions with Japanese colors, sticky first column, responsive columns |
| `PopularityTable.tsx` | Popularity band breakdown (1st fav, 2-3, 6-9, 10+, etc.) | Color-coded band labels, column-based max value highlighting |
| `RunningStyleTable.tsx` | Running style analysis (escape/lead/pursue/close) | Style badges, consistent structure with other tables |

**Component Patterns:**
- All tables accept: `title` (string), `data` (array), `initialShow` (number, optional for collapsible rows)
- Components manage local UI state with `useState` (scroll position, collapsed rows, etc.)
- No global state manager (Redux/Zustand) currently needed
- Styled with scoped CSS Modules (e.g., `GateTable.module.css`)

**Page Layout Flow:**
1. `layout.tsx` provides root HTML with global header
2. Dynamic course page renders breadcrumbs and section headings
3. Each section rendered as a table component
4. `SectionNav` component tracks scroll position and provides navigation
5. Global `globals.css` provides base styles and custom properties

### Styling System

**Three-Layer Approach:**

1. **Global Styles** (`app/globals.css`)
   - Reset, base elements, custom CSS properties
   - Color palette (primary green #52af77, text, backgrounds, highlights)
   - Typography (Hiragino Kaku Gothic ProN for Japanese, font scales 0.8rem-2rem)
   - Mobile breakpoint: 768px

2. **Component Styles** (CSS Modules, e.g., `components/DataTable.module.css`)
   - Scoped to prevent conflicts
   - Sticky positioning for table columns
   - Responsive behavior (grid/flex layouts)
   - Hover/active states

3. **Inline Styles**
   - Minimal use: primarily for data-driven colors (gate badge colors from data)
   - `style={{ backgroundColor: row.color }}`

**Design Tokens:**
- Primary: #52af77 (green), #3d8b5c (darker green)
- Highlight: #CAFEE3 (light green), #FCEA7F (gold rank)
- Text: #2d3748 (dark), #666 (secondary)
- Backgrounds: #f5f7fa (light), #fff (white)
- Borders: #e2e8f0, #ddd

**CSS Features Used:** Grid, Flexbox, position sticky/fixed, backdrop-filter blur, gradients, media queries, CSS variables

### Performance Considerations

- **Server Components** for static layout (App Router default)
- **Client Components** (`'use client'`) for interactive tables and navigation
- **Static Generation** for dynamic routes (no real-time updates)
- **Sticky Columns** minimize layout reflow on scroll
- **Intersection Observer** in `SectionNav` for efficient scroll tracking
- **CSS Modules** prevent style name collisions

### Data Integration Points

Currently using mock data embedded in the page component. To integrate with a real API:

1. Create API routes in `app/api/races/` that serve racing statistics
2. Replace the hardcoded mock data object with `fetch()` calls in the page component
3. Keep component prop interfaces unchanged (DataTable expects same shape)
4. Consider caching strategies with `revalidateTag()` for frequent updates

## Development Notes

**TypeScript:** Strict mode enabled (`"strict": true` in tsconfig.json). Path aliases available with `@/` prefix (maps to project root).

**ESLint:** Configured with Next.js defaults. Lenient during build (`ignoreDuringBuilds: true` in next.config.ts) for development convenience.

**Turbopack:** Configured for faster dev and build cycles. Available in `npm run dev` and `npm run build`.

**Responsive Design:** Mobile-first approach with sticky table columns adapting for touch screens. Test at 768px breakpoint.

**Japanese Language Support:** Font stack prioritizes Hiragino Kaku Gothic ProN and Meiryo for optimal Japanese rendering.

## File Structure Reference

```
app/
  layout.tsx                          # Root layout with global header
  globals.css                         # Global styles and design tokens
  page.tsx                           # Default page (redirects or info)
  courses/
    [racecourse]/
      [surface]/
        [distance]/
          page.tsx                    # Main course stats page (server component)

components/
  SectionNav.tsx                      # Fixed navigation sidebar
  SectionNav.module.css
  DataTable.tsx                       # Generic ranked data table
  DataTable.module.css
  GateTable.tsx                       # Gate position table
  GateTable.module.css
  PopularityTable.tsx                 # Popularity bands table
  PopularityTable.module.css
  RunningStyleTable.tsx               # Running style table
  RunningStyleTable.module.css

public/
  scripts/highlight-max-values.js     # Utility for table highlighting (if used)
  *.svg                               # Icons/graphics

Configuration:
  tsconfig.json                       # TypeScript config (strict mode, path aliases)
  next.config.ts                      # Next.js config (Turbopack, lenient errors)
  eslint.config.mjs                   # ESLint rules (extends Next.js)
  package.json                        # Dependencies and scripts
```

## Common Workflows

**Add a new racecourse/surface/distance combination:**
1. Add data to the mock object in the course page component
2. Ensure data structure matches existing format
3. Page will auto-generate via dynamic routes

**Create a new data visualization:**
1. Add component to `components/` with `.module.css` file
2. Accept `title`, `data`, and optional `initialShow` props
3. Import and use in course page, passing relevant mock data
4. Style with component CSS Module following existing patterns

**Update colors or typography:**
1. Modify custom properties in `app/globals.css` or component-specific CSS
2. Avoid inline styles; prefer CSS classes
3. Test responsiveness at mobile breakpoint (768px)

**Debug table rendering issues:**
- Check data shape matches component expectations (rank, name/label, numeric stats)
- Verify sticky column positioning in CSS Module
- Test horizontal scroll on mobile viewports
- Check max value highlighting logic (compares all numeric columns)