# Enterprise AI Hub | Maslow AI

**[Enterprise AI Hub](https://prompthub.maslow.ai)** is a business-focused AI prompt management platform built with React, [Convex.dev](https://docs.convex.dev/), and Clerk authentication. It enables enterprise teams to create, organize, and share AI prompt templates across departments like Marketing, Legal, Finance, HR, and Executive teams.

## Features

- **Department Organization**: Prompts organized by business department with color-coded badges
- **Business Categories**: Marketing Strategy, Legal Compliance, R&D Discovery, Finance & Audit, and more
- **Impact Scoring**: Track and sort prompts by business impact
- **Privacy Controls**: Public prompts for the organization or private prompts for personal use
- **Rich Discussion**: Comment on prompts with rich text formatting using TipTap editor
- **Prompt Templates**: Enterprise-ready prompt templates with structured placeholders
- **Shadcn UI Components**: Professional interface built on Shadcn/ui component system
- **Maslow Brand**: Full Maslow AI brand system with teal/pink/purple color palette

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Routing**: TanStack Router (file-based)
- **Backend/DB**: Convex.dev (real-time reactive database)
- **Auth**: Clerk
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or Bun

### Install

```bash
npm install
```

### Environment

Create `.env.local`:

```bash
VITE_CONVEX_URL=your_convex_deployment_url
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Set `CLERK_ISSUER_URL` in the Convex Dashboard environment variables.

### Deployment (Vercel)

Production URL: **https://jnj-prompthub-demo.vercel.app**

- **Vercel** (build-time): `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`
- **Convex Dashboard**: `CLERK_ISSUER_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`, `CLIENT_ORIGIN` (e.g. `https://jnj-prompthub-demo.vercel.app` or comma-separated list for CORS), optional `MCP_SERVER_URL`
- **Clerk Dashboard**: Add `https://jnj-prompthub-demo.vercel.app` and any preview URLs to allowed origins and redirect URLs.

Deploy Convex first (`npx convex deploy`), then connect the repo to Vercel; production branch `main` builds with `npm run build` and outputs `dist/`. If you use a custom domain (instead of the default Vercel URL), update canonical/OG/sitemap/robots URLs in `index.html`, `public/sitemap.xml`, `public/robots.txt`, and any route-level OG metadata (e.g. `src/routes/prompt.$slug.tsx`).

### Run

```bash
npm run dev          # Frontend + Backend
npm run dev:frontend # Frontend only
npm run build        # Production build
```

## License

MIT
