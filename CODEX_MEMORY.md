# CODEX_MEMORY.md

Last updated: 2026-03-28

## Project Identity
- Name: GLITCH (AI-powered GitHub codebase explainer)
- Framework: Next.js App Router (`next@16.2.1`) + React 19 + TypeScript
- UI: Tailwind CSS v4
- AI: Google Gemini (`gemini-2.5-flash`)
- Parsing: `web-tree-sitter` (WASM) for JS/TS AST analysis

## High-Level Product Behavior
- User submits a public GitHub repo URL on `app/page.tsx`.
- `POST /api/parse` fetches repo metadata + tree + raw files, then parses call graph and dependency graph.
- UI stores parse response and starts `POST /api/summary` stream.
- Clicking a file triggers `POST /api/explain` stream for file-level explanation.
- `GET /api/issues` fetches open issues, classifies difficulty, and enriches with AI explanation.

## Key Directories and Ownership
- `app/`
- `app/page.tsx`: Main client UI and orchestration of parse/summary/explain flows.
- `app/api/*/route.ts`: API handlers.
- `components/`: UI panels (`FileExplorer`, `SummaryPanel`, `ExplanationPanel`, `CallGraph`, `IssuesPanel`).
- `lib/`: Core engine modules (`github`, `parser`, `dependency-graph`, `analyze`, `gemini`, `prompts`, caches).

## Core Backend Flow
- `lib/analyze.ts#getAnalysis(repoUrl)` is the shared orchestration point for parse/explain/summary.
- `lib/github.ts#fetchRepoData(owner, repo)`
- Fetches repo metadata, branch/contributor counts, recursive file tree.
- Fetches up to 80 non-binary extension-based files.
- Skips files > 100KB.
- `lib/parser.ts#parseCodebase(rawFiles)`
- Parses `.ts/.tsx/.js/.jsx` files only.
- Extracts imports, exports, and function call relationships.
- Other file types return empty structural entries.
- `lib/dependency-graph.ts#buildDependencyGraph(...)`
- Resolves relative and `@/` imports.
- Tags unresolved bare imports as external edges.

## Caching Model
- Repo analysis cache (`lib/cache.ts`):
- Key: `repoUrl`
- TTL: 15 minutes
- Max entries: 50
- AI response cache (`lib/ai-cache.ts`):
- Key format: `part1::part2::...`
- TTL: 60 minutes
- Max entries: 200
- Used by `summary`, `explain`, and `issues` routes.

## API Endpoints Snapshot
- `POST /api/parse`
- Validates GitHub URL.
- Returns `repoMeta`, `fileTree`, `callGraph`, `rawFiles`, `dependencyGraph`, and cache hit/miss.
- `POST /api/summary`
- Streams plain text markdown summary.
- Uses AI cache before calling Gemini.
- `POST /api/explain`
- Streams file explanation markdown.
- Uses file-level cross-file dependency context when available.
- `GET /api/issues?repoUrl=...&experienceLevel=...`
- Fetches up to 20 open issues.
- Difficulty heuristic from labels (`good first issue`, `help wanted`, else hard).
- AI explanations generated for first 10 issues max.
- `GET /api/health`
- Returns `{ status, timestamp }`.

## Current UX Notes
- Theme is dark/zinc with subtle grid background from `app/globals.css`.
- Summary uses horizontal expanding cards in `components/SummaryPanel.tsx`.
- Call graph component is currently a dependency/file structure tree (not Mermaid diagram rendering in current code).
- File explanation and issue explanations render markdown via `react-markdown` + `remark-gfm`.

## Constraints and Gotchas
- AGENTS rule: read relevant docs in `node_modules/next/dist/docs/` before writing Next.js code due breaking changes.
- `next.config.ts` must keep `serverExternalPackages` entries for tree-sitter WASM packages.
- `web-tree-sitter` is used intentionally (not native `tree-sitter`).
- No automated tests configured yet.
- README/aux docs are slightly stale in places (e.g., Gemini model version mentions 2.0 in docs but code uses 2.5).

## Environment Variables
- `GITHUB_TOKEN`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_API_URL`

## Fast Start Commands
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Memory Update Protocol
When making meaningful code changes, append an entry to `## Session Log` with:
- Date
- What changed
- Why it changed
- Any new risk or follow-up task

Keep this file concise and current; prefer adding deltas over rewriting entire sections.

## Session Log
- 2026-03-28: Initial codebase snapshot created after reading `CLAUDE.md`, `GEMINI.md`, and core source files in `app/`, `components/`, and `lib/`.
- 2026-03-28: Created branch `retro-ui-chaos` for UI system experimentation and replaced homepage shell with a Windows-95-inspired retro experience (beveled windows, marquee, vivid panels, richer onboarding copy, demo repo shortcuts, taskbar), plus themed summary/explorer/explanation/issues panels and lint-cleanup fixes.
