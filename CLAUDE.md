# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptHub is a community platform for sharing and discovering AI prompts. Users can create, browse, rate, and comment on prompts with category filtering, privacy controls, and real-time updates.

**Live site:** https://jnj-prompthub-demo.vercel.app

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

**Deployment (Vercel):** Deploy Convex separately (`npx convex deploy`). Vercel builds with `npm run build` and publishes `dist/`. Set `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY` in Vercel env.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Routing:** TanStack Router (file-based, auto-generated route tree)
- **Backend/DB:** Convex.dev (real-time reactive database + serverless functions)
- **Auth:** Clerk (integrated with Convex via `ConvexProviderWithClerk`)
- **Rich Text:** TipTap editor for comments
- **Code Display:** Sandpack (CodeSandbox) for carbon-style code blocks
- **Hosting:** Vercel with SPA rewrites (`vercel.json`)

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

## UI Styling Changes to Remember

### Suggestion Prompts & Streaming Status Badge

**Files:** `src/components/assistant-ui/thread.tsx`, `src/components/assistant-ui/streaming-status-badge.tsx`

Both use dark background styling for consistency:

- Background: `bg-[#0A0A0A]` (light mode), `dark:bg-[#EBF7F4]/15` (dark mode)
- Text: `text-[color:var(--tw-ring-offset-color)]` (light mode), `dark:text-foreground` (dark mode)
- Border: `border border-l-[3px] border-l-maslow-teal` (left accent)
- Shape: `rounded-2xl`, padding `px-4 py-3`
- Hover: `hover:bg-[#0A0A0A] hover:opacity-90` (light mode)

**Do not change** these styling patterns - they are intentionally consistent for demo visibility.

### Chat Composer Background

**File:** `src/components/assistant-ui/thread.tsx` (line 139), `src/index.css` (line 162)

Composer uses `.chat-input-bg` class which sets background to `var(--tw-ring-offset-color)`. This is standardized across chat inputs.

### Streaming Status System

**Files:** `src/contexts/StreamingStatusContext.tsx`, `src/components/assistant-ui/streaming-status-badge.tsx`, `src/components/assistant-ui/markdown-text.tsx`

- `StreamingStatusContext` provides streaming state (`thinking`, `searching`, `generating`, `tool_calling`)
- `StreamingStatusBadge` shows status above markdown content with dark theme styling
- `MarkdownText` shows "Agent is thinking..." etc. when streaming starts with no text yet
- Both use `useStreamingStatus()` hook from context

**Do not remove or modify** this context system - it provides essential demo visibility for streaming states.

## Demo Reset: Clearing User Conversation History

To reset chat history for a fresh demo (prompts remain intact):

### Find Your User ID

1. **Via Convex Dashboard**: Go to `conversations` table, find any row with your conversations, copy the `userId` field.
2. **Via Browser Console**: While logged in, run:
   ```javascript
   // In browser console on the app
   const identity = await fetch("/api/auth").then((r) => r.json());
   console.log("userId:", identity.subject);
   ```

### Delete All Your Conversations (Production)

```bash
# Replace YOUR_USER_ID with your Clerk subject ID
npx convex run --prod chat:deleteUserConversations '{"userId": "YOUR_USER_ID"}'
```

### Delete Conversations for One Specific Prompt

```bash
# Replace YOUR_USER_ID and PROMPT_ID
npx convex run --prod chat:deleteUserConversations '{"userId": "YOUR_USER_ID", "promptId": "PROMPT_ID"}'
```

### Verify Deletion

```bash
# List conversations for your user (should be empty after reset)
npx convex data --prod conversations --filter '{"userId": "YOUR_USER_ID"}'
```

**Note**: The `ChatPanel` component now automatically creates a fresh conversation on every Test open, so old DB history won't load even if it exists. The cleanup mutation is for one-time reset before demos.
