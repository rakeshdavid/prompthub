# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptStack is a community platform for sharing and discovering AI prompts. Users can create, browse, rate, and comment on prompts with category filtering, privacy controls, and real-time updates.

**Live site:** https://promptstack.dev

## Commands

```bash
npm run dev              # Run frontend (Vite) + backend (Convex) concurrently
npm run dev:frontend     # Vite dev server only (port 5173)
npm run dev:backend      # Convex backend only with tail logs
npm run build            # TypeScript check + Vite production build
npm run tsc              # TypeScript type checking only
npm run lint             # ESLint
npm run preview          # Preview production build locally
```

**Deployment (Netlify):** `npx convex deploy && npm run build` → publishes `dist/`

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Routing:** TanStack Router (file-based, auto-generated route tree)
- **Backend/DB:** Convex.dev (real-time reactive database + serverless functions)
- **Auth:** Clerk (integrated with Convex via `ConvexProviderWithClerk`)
- **Rich Text:** TipTap editor for comments
- **Code Display:** Sandpack (CodeSandbox) for carbon-style code blocks
- **Hosting:** Netlify with SPA redirect rules

## Architecture

### Entry & Providers

`src/main.tsx` wraps the app in a provider chain: ClerkProvider → ConvexProviderWithClerk → ThemeProvider → QueryClientProvider → RouterProvider. Understanding this nesting order matters when debugging auth or data flow issues.

### Routing

TanStack Router with file-based routing in `src/routes/`. The route tree is auto-generated into `src/routeTree.gen.ts` by the Vite plugin — do not edit that file manually. Key routes:

- `index.tsx` → Home page (renders `App.tsx` with search, filters, prompt grid)
- `addnew.tsx` → Create prompt form
- `prompt.$slug.tsx` → Individual prompt detail/edit page (dynamic slug param)
- `docs.tsx`, `about.tsx`, `prompt-guide.tsx` → Static content pages

### Backend (Convex)

All backend logic lives in `convex/`. Schema is defined in `convex/schema.ts`. The two main function files:

- `convex/prompts.ts` — CRUD for prompts, likes, ratings, visibility toggle, custom categories
- `convex/comments.ts` — Comment CRUD with prompt-based indexing

**Key Convex patterns used in this codebase:**

- Auth checks via `ctx.auth.getUserIdentity()` — returns null for unauthenticated users
- Pass `"skip"` to `useQuery()` when auth is loading to prevent premature query execution
- Use `useConvexAuth()` hook to get `isLoading` and `isAuthenticated` states before querying
- All database IDs use Convex's `Id<"tableName">` type from `convex/_generated/dataModel`
- `_creationTime` is auto-generated on all documents — the schema's `createdAt` is a separate app-managed field

### Shared Components

- `PromptForm.tsx` — Shared between create and edit flows. Accepts `isModal`, `isEditing`, `initialData`, and `promptId` props to handle both cases in one component.
- `CommentSection.tsx` — TipTap-based rich text comments with real-time Convex updates
- `CodeBlock.tsx` / `CodeEditor.tsx` — Sandpack-powered syntax-highlighted code display
- `ThemeContext.tsx` — Dark/light mode via React Context

### Categories

Predefined categories live in `src/constants/categories.ts`. Users can also create custom categories stored per-user in the `customCategories` Convex table.

## Environment Variables

**Client-side (`.env.local`):**

```
VITE_CONVEX_URL=          # Convex deployment URL
VITE_CLERK_PUBLISHABLE_KEY=  # Clerk publishable key
```

**Server-side (set in Convex Dashboard):**

```
CLERK_ISSUER_URL=         # Clerk issuer URL
```

## Convex Conventions

- Prefer queries and mutations over actions. Actions are for third-party integrations only.
- Use indexes for any table that could exceed a few thousand documents.
- Use `v.` validators from `convex/values` for schema and function argument definitions.
- Helper functions in `convex/` can share business logic across functions while keeping everything in a single transaction.
- Don't call actions directly from the browser — trigger them via mutations that schedule background work.

## Tailwind Customizations

- Custom background color: `app-bg` (#F9EEE6)
- Custom breakpoint: `xs` (475px)
- Font: Inter via Google Fonts
- Typography plugin enabled for rich text styling
