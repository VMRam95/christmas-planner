# Christmas Planner - Project Documentation

## Overview

App familiar para gestionar regalos de Navidad. Los usuarios crean su "carta a los Reyes Magos" y otros miembros pueden asignarse regalos sin que el destinatario sepa quién se lo va a regalar.

<!-- CODEAGENTSWARM PROJECT CONFIG START - DO NOT EDIT -->

## Project Configuration

**Project Name**: christmas-planner

_This project name is used for task organization in CodeAgentSwarm. All tasks created in this directory will be associated with this project._

_For complete CodeAgentSwarm instructions, see the global CLAUDE.md file at ~/.claude/CLAUDE.md_

<!-- CODEAGENTSWARM PROJECT CONFIG END -->

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v3 |
| Deployment | Vercel |
| Package Manager | pnpm |

---

## Project Structure

```
christmas-planner/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (providers, fonts)
│   │   ├── page.tsx            # Landing/Login page
│   │   ├── globals.css         # Global styles + Tailwind
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main dashboard after login
│   │   ├── my-wishes/
│   │   │   └── page.tsx        # User's own wish list (CRUD)
│   │   ├── family/
│   │   │   └── [userId]/
│   │   │       └── page.tsx    # View family member's wishes
│   │   └── api/                # API Routes
│   │       ├── auth/
│   │       │   └── route.ts    # Email validation endpoint
│   │       ├── wishes/
│   │       │   └── route.ts    # Wishes CRUD
│   │       ├── assignments/
│   │       │   └── route.ts    # Gift assignments
│   │       └── surprise-gifts/
│   │           └── route.ts    # Surprise gifts CRUD
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── badge.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Footer.tsx
│   │   ├── wishes/
│   │   │   ├── WishCard.tsx
│   │   │   ├── WishForm.tsx
│   │   │   └── WishList.tsx
│   │   ├── family/
│   │   │   └── FamilyMemberCard.tsx
│   │   └── effects/
│   │       └── SnowAnimation.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Browser client
│   │   │   ├── server.ts       # Server client
│   │   │   └── queries.ts      # Reusable queries
│   │   ├── auth.ts             # Session management
│   │   └── utils.ts            # Utility functions
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth state hook
│   │   └── useWishes.ts        # Wishes data hook
│   └── types/
│       ├── database.ts         # Supabase generated types
│       └── index.ts            # App-specific types
├── public/
│   └── images/                 # Static assets
├── supabase/
│   └── migrations/             # SQL migrations
│       └── 001_initial_schema.sql
├── .env.local                  # Local env vars (gitignored)
├── .env.example                # Env template
└── package.json
```

---

## Architecture Patterns

### 1. Data Flow
```
[Client Component] → [Server Action / API Route] → [Supabase Client] → [PostgreSQL]
```

### 2. Component Architecture
- **Server Components** (default): For data fetching and static content
- **Client Components**: Only when needed (`'use client'`) for interactivity
- **Composition Pattern**: Small, focused components composed together

### 3. State Management
- **Server State**: Supabase queries with React Server Components
- **Client State**: React hooks (`useState`, `useReducer`) for local UI state
- **Session**: Cookie-based simple auth (email stored in httpOnly cookie)

### 4. API Design
- RESTful API routes in `/app/api/`
- Consistent response format:
```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string }
```

---

## Database Schema

### Tables

```sql
-- Users (closed list of family members)
users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text UNIQUE NOT NULL,
  name        text NOT NULL,
  avatar_url  text,
  created_at  timestamptz DEFAULT now()
)

-- Wish list items
wishes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  url         text,
  priority    int CHECK (priority BETWEEN 1 AND 3) DEFAULT 2,
  created_at  timestamptz DEFAULT now()
)

-- Gift assignments (who is giving what)
assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id     uuid REFERENCES wishes(id) ON DELETE CASCADE UNIQUE,
  assigned_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
)

-- Surprise gifts (not requested)
surprise_gifts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giver_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  description  text NOT NULL,
  created_at   timestamptz DEFAULT now()
)
```

### Key Relationships
- `wishes.user_id` → `users.id` (who wants the gift)
- `assignments.wish_id` → `wishes.id` (which wish is assigned)
- `assignments.assigned_by` → `users.id` (who will give the gift)
- `surprise_gifts.giver_id` → `users.id` (who gives)
- `surprise_gifts.recipient_id` → `users.id` (who receives)

---

## Coding Conventions

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Use `type` over `interface` for consistency
- Prefix types with `T` only for generics

```typescript
// Good
type User = { id: string; name: string }
type WishWithAssignment = Wish & { assignment?: Assignment }

// Avoid
interface IUser { ... }
```

### Components
- PascalCase for component files and names
- One component per file (colocate related components in folders)
- Props type defined above component

```typescript
type WishCardProps = {
  wish: Wish
  onAssign?: () => void
  showAssignment?: boolean
}

export function WishCard({ wish, onAssign, showAssignment = false }: WishCardProps) {
  // ...
}
```

### File Naming
- `kebab-case` for folders
- `PascalCase.tsx` for components
- `camelCase.ts` for utilities/hooks
- `route.ts` for API routes (Next.js convention)

### Imports Order
1. React/Next.js
2. External libraries
3. Internal absolute imports (`@/`)
4. Relative imports
5. Types (with `type` keyword)

```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@supabase/supabase-js'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

import { WishCard } from './WishCard'

import type { Wish } from '@/types'
```

---

## Styling Guide

### Theme Colors
```css
:root {
  --christmas-red: #c41e3a;
  --christmas-green: #228b22;
  --christmas-gold: #ffd700;
  --snow-white: #fffafa;
  --dark-green: #0f5132;
}
```

### Tailwind Custom Config
```javascript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#c41e3a',
          green: '#228b22',
          gold: '#ffd700',
          snow: '#fffafa',
          dark: '#0f5132',
        }
      }
    }
  }
}
```

### Component Styling
- Use Tailwind utility classes
- Extract common patterns to component variants
- Use `cn()` helper for conditional classes

```typescript
import { cn } from '@/lib/utils'

<button className={cn(
  "px-4 py-2 rounded-lg font-medium",
  "bg-christmas-red hover:bg-christmas-dark",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

---

## Security Considerations

### Visibility Rules
| Scenario | What user sees |
|----------|----------------|
| Viewing OWN wishes | Wish details, NO assignment info |
| Viewing OTHER's wishes | Wish details + "assigned" badge (but NOT by whom) |
| Viewing OTHER's wishes (assigned by ME) | Full details + "You're giving this" |

### API Protection
- All API routes validate user session
- User can only modify their own wishes
- Assignment queries filtered by visibility rules

---

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm type-check       # TypeScript check

# Database
pnpm db:generate      # Generate Supabase types
pnpm db:push          # Push migrations to Supabase
```

---

## Supabase Configuration

- **Project**: ICG-POC
- **Project ID**: `vxirigqzqixsihyunazf`
- **Schema**: `christmas_planner` (isolated from other tables)
- **Region**: eu-west-3

### Tables
- `christmas_planner.users` - Family members (closed list)
- `christmas_planner.wishes` - Gift wish list items
- `christmas_planner.assignments` - Who is giving what gift
- `christmas_planner.surprise_gifts` - Unannounced gifts

### RLS
All tables have RLS enabled with permissive policies for simplicity.

---

## Environment Variables

```bash
# .env.local (configured)
NEXT_PUBLIC_SUPABASE_URL=https://vxirigqzqixsihyunazf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configured>
SUPABASE_SERVICE_ROLE_KEY=<optional - get from Supabase Dashboard>
```

---

## Git Workflow

- `main` branch for production
- Commits in English following conventional commits:
  - `feat:` new features
  - `fix:` bug fixes
  - `refactor:` code changes without feature/fix
  - `style:` formatting, styling
  - `docs:` documentation
  - `chore:` maintenance

---

## Deployment

- **Platform**: Vercel (auto-deploy from `main`)
- **Environment**: Production env vars in Vercel dashboard
- **Domain**: TBD (Vercel default or custom)

---

## Notes

- Users are pre-configured in Supabase (closed list)
- No password authentication - email-only identification
- Mobile-first responsive design
- Accessibility: proper ARIA labels, keyboard navigation