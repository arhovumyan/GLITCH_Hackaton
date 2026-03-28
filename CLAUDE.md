# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server (Turbopack) on localhost:3000
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — run ESLint (flat config, `eslint.config.mjs`)

No test framework is configured yet.

## Architecture

Next.js App Router project (no `src/` directory). All routing lives under `app/`.

### API Routes (all under `app/api/`)

- `parse/` — **BUILT** — POST endpoint: accepts `{ repoUrl }`, returns repo metadata, file tree, call graph, and raw source files
- `explain/` — NOT YET BUILT — code explanation (Gemini via `@google/generative-ai`)
- `summary/` — NOT YET BUILT — repository summarization
- `issues/` — NOT YET BUILT — GitHub issues integration
- `health/` — **BUILT** — GET endpoint returning `{ status, timestamp }`

### Key Libraries (all under `lib/`)

- `github.ts` — **BUILT** — `parseGitHubUrl(url)` and `fetchRepoData(owner, repo)` using Octokit. Fetches repo metadata, recursive file tree, and raw content of up to 50 .ts/.tsx/.js/.jsx files (skips node_modules, .next, dist, build, coverage).
- `parser.ts` — **BUILT** — `parseCodebase(rawFiles)` using web-tree-sitter. Extracts imports, exports, and function-level call graph from each file via AST traversal.
- `cache.ts` — **BUILT** — `getCache(key)` / `setCache(key, value)`. In-memory, 10 entries max, 15-minute TTL, evicts oldest on overflow.

### POST /api/parse Response Shape

```
{
  cache: "hit" | "miss",
  repoMeta: { name, description, language, stars },
  fileTree: [{ path, type: "file"|"dir", language }],
  callGraph: { [filePath]: { imports: string[], exports: string[], functions: { [name]: { calls: string[] } } } },
  rawFiles: { [filePath]: rawSourceString }
}
```

Error codes: 400 (bad URL), 404 (repo not found), 429 (rate limit), 500 (other).

### Components

- `components/` — React components (not yet built)

### External Services

- **GitHub API** — via `@octokit/rest`, authenticated with `GITHUB_TOKEN`
- **Google Gemini** — via `@google/generative-ai`, authenticated with `GEMINI_API_KEY` (not yet integrated)
- **Mermaid** — diagram rendering (installed, not yet used)

### Tree-sitter Setup (IMPORTANT)

Uses `web-tree-sitter` (WASM) instead of native `tree-sitter` (won't compile on Node 25). Key config:
- `next.config.ts` must have `serverExternalPackages: ["web-tree-sitter", "tree-sitter-typescript", "tree-sitter-javascript"]`
- `tree-sitter-javascript` and `tree-sitter-typescript` installed with `--ignore-scripts` (only .wasm files are used)
- Import as named exports: `import { Parser, Language } from "web-tree-sitter"` (NOT default)

### Environment

Copy `.env.local.example` to `.env.local` and fill in real values. Required vars: `GITHUB_TOKEN`, `GEMINI_API_KEY`, `NEXT_PUBLIC_API_URL`.

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`).

### Deployment

Railway via Nixpacks (`railway.json`). Healthcheck at `/api/health`.

### Important: Next.js Version

This uses a recent Next.js with potential breaking changes from older versions. Consult `node_modules/next/dist/docs/` before using APIs that may have changed.
