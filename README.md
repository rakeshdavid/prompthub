# PromptHub - The AI Prompt Directory

**[PromptHub](https://prompthub.maslow.ai)** is a real-time prompt management platform built with React, [Convex.dev](https://docs.convex.dev/), and Clerk authentication. It enables users to create, organize, and share AI prompts with features like custom categories, privacy controls, and community engagement through likes and comments. The platform features a sleek, responsive design with both grid and list views, real-time updates, and comprehensive search and filtering capabilities.

## Features

- **Modern Interface**: Clean, compact design with improved user experience and streamlined workflows
- **Searchable Directory**: Quickly find AI prompts and code generation rules tailored to your needs
- **Prompt Likes**: Like and sort top prompts in the directory
- **Category Organization**: Prompts are organized into clear, functional categories
- **Custom Categories**: Create your own personal categories for better organization
- **GitHub Integration**: Automatically link GitHub or social profiles submitted with prompts
- **Carbon Copy View**: View and copy prompts in a Carbon-style editor window
- **README Support**: Find and submit README examples for AI and code generation projects
- **Cursor Rules**: Find and submit Cursor rules for AI and code generation projects
- **Prompt Link Sharing**: Easily share prompts or cursor rules with others
- **Rich Comments**: Comment on prompts with rich text formatting using TipTap editor
- **Privacy Controls**: Create public prompts for the community or private prompts for personal use
- **Edit & Delete**: Full control over your own prompts with edit and delete functionality
- **Keyboard Shortcuts**: Efficient navigation with ESC to close modals and Ctrl/Cmd+Enter to submit forms

---

## Getting Started

### Submit a Prompt

1. Sign in with Clerk authentication or use the guest submission feature
2. Fill out the required fields in our streamlined form:
   - Title (Required)
   - Prompt content
   - Optional: Description, GitHub or social profile links
3. Choose whether to make the prompt public or private
4. Select from existing categories or create your own custom category
5. Submit and share with the community

### Search for Prompts

- Browse the directory by categories such as Cursor, Convex, or README examples
- Use the search bar to find prompts tailored to your specific framework or language
- Filter by categories in the sidebar to narrow down results
- Like prompts to save them for later reference

### Customize Your Experience

- Filter by "My Prompts" to view only your submissions
- Create custom categories for better personal organization
- Edit your prompts anytime with the built-in compact editor
- Toggle prompts between public and private visibility

## Tech Stack

**PromptHub** is powered by:

### Frontend Stack

- [React 18](https://react.dev/) - Modern React with hooks and concurrent features
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/overview) - Type-safe client-side routing
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework with custom design system
- [Vite](https://vitejs.dev/) - Fast build tool and development server

### Backend & Services

- [Convex.dev](https://docs.convex.dev/) - Real-time database and backend with automatic synchronization
- [Clerk](https://clerk.com/) - Authentication and user management
- [Netlify](https://netlify.com) - Static site hosting and deployment

### Development Tools

- [Bun](https://bun.sh/) - JavaScript runtime & package manager
- [ESLint](https://eslint.org/) - Code quality enforcement
- [TipTap](https://tiptap.dev/) - Rich text editor for comments

## Project Structure

```
promptstack/
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── ui/                   # Reusable UI components
│   │   ├── Header.tsx            # Navigation header with search
│   │   ├── Footer.tsx            # Site footer with prompt count
│   │   ├── PromptForm.tsx        # Modern, compact shared form component
│   │   ├── CodeBlock.tsx         # Code syntax highlighting
│   │   ├── CodeEditor.tsx        # Code editing component
│   │   ├── CommentSection.tsx    # Prompt comments system
│   │   ├── NotFound.tsx          # 404 component for access control
│   │   └── minimal-tiptap.tsx    # Rich text editor
│   ├── routes/                   # TanStack Router pages
│   │   ├── index.tsx             # Home page redirect
│   │   ├── addnew.tsx            # Add prompt form
│   │   ├── prompt.$slug.tsx      # Individual prompt page
│   │   ├── docs.tsx              # Documentation
│   │   ├── about.tsx             # About page
│   │   ├── prompt-guide.tsx      # Prompt creation guide
│   │   └── 404.tsx               # 404 error page
│   ├── constants/                # Application constants
│   │   └── categories.ts         # Predefined categories
│   ├── lib/                      # Utilities and types
│   │   ├── utils.ts              # Helper functions
│   │   └── types.ts              # TypeScript definitions
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Application entry point
│   ├── router.ts                 # Router configuration
│   └── ThemeContext.tsx          # Theme management
├── convex/                       # Backend (Convex.dev)
│   ├── schema.ts                 # Database schema
│   ├── prompts.ts                # Prompt queries/mutations
│   ├── comments.ts               # Comment system functions
│   └── auth.config.ts            # Authentication config
├── public/                       # Static assets
│   ├── prompthublogo.svg         # Main logo
│   ├── favicon.svg               # Site favicon
│   ├── og-image.png              # Social sharing image
│   └── fonts/                    # Custom fonts
├── package.json                  # Dependencies and scripts
├── vite.config.ts                # Vite configuration
├── tailwind.config.js            # Tailwind CSS config
├── tsconfig.json                 # TypeScript configuration
├── files.md                      # Detailed file documentation
└── changelog.md                  # Development changelog
```

For detailed information about each file and directory, see [`files.md`](./files.md).

## Environment Setup

Set up environment variables in `.env.local`:

```bash
# Convex
VITE_CONVEX_URL=your_convex_deployment_url

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

Start the development server:

```bash
npm run dev
```

## First-time setup (from zero)

### 1. Prerequisites

- **Node.js 18+** (project uses `.node-version` = 18; use nvm, fnm, or install from nodejs.org).
- **Bun** (recommended) or **npm** for installing dependencies.

### 2. Install dependencies

From the project root:

```bash
bun install
# or: npm install
```

### 3. Convex (backend)

1. Sign up at [convex.dev](https://convex.dev) and install the CLI if needed:
   ```bash
   npm install -g convex
   ```
2. Log in and create/link a Convex project:
   ```bash
   npx convex dev
   ```
   First run will prompt you to log in and create or select a project.
3. After it runs once, your **Convex deployment URL** is in the terminal output and in the [Convex dashboard](https://dashboard.convex.dev) under your project **Settings**. You need this for the frontend env.
4. In the Convex dashboard, go to **Settings > Environment Variables** and add:
   - **Name:** `CLERK_ISSUER_URL`
   - **Value:** Your Clerk Issuer URL (you get this after setting up Clerk in step 4; format like `https://your-app.clerk.accounts.dev`).

### 4. Clerk (auth)

1. Sign up at [clerk.com](https://clerk.com) and create an application.
2. In the Clerk dashboard, go to **API Keys** and copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`).
3. In **Configure > JWT template** (or **Paths**), ensure you have an issuer URL. In **API Keys** or **Paths** you'll see the **Issuer** (e.g. `https://your-app.clerk.accounts.dev`). Use that exact value as `CLERK_ISSUER_URL` in Convex (step 3).

### 5. Local env file

Create `.env.local` in the project root (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

- **VITE_CONVEX_URL** – Convex deployment URL from step 3 (e.g. `https://your-deployment.convex.cloud`).
- **VITE_CLERK_PUBLISHABLE_KEY** – Clerk publishable key from step 4.

Do not commit `.env.local`; it is gitignored.

### 6. Run the app

Start both the Vite frontend and Convex backend:

```bash
npm run dev
```

This runs `vite` and `convex dev --tail-logs` in parallel. The app is at **http://localhost:5173** (or the port Vite prints). Convex syncs your `convex/` functions and schema to your deployment.

### 7. Optional: run frontend only

If you only want the UI (no backend):

```bash
npm run dev:frontend
```

The app will still require `VITE_CONVEX_URL` and `VITE_CLERK_PUBLISHABLE_KEY`; without a valid Convex backend and Clerk config, some features will fail.

### Troubleshooting

- **"Missing Clerk Publishable Key" / "Missing Convex URL"** – Ensure `.env.local` exists and has `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL`. Restart the dev server after changing env.
- **Convex auth errors** – Ensure `CLERK_ISSUER_URL` is set in the Convex dashboard and matches your Clerk application's issuer (no trailing slash).
- **Port in use** – Vite uses 5173 by default; change in `vite.config.ts` if needed.

## Contributing

We welcome contributions from the community! Feel free to submit a pull request or open an issue to report bugs, suggest features, or provide feedback.

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
