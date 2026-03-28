# FISHLENS — Codebase Wide-Angle Scanner

FISHLENS analyzes any public GitHub repository and generates interactive, AI-powered explanations of its code. Point it at a repo URL, pick your experience level, and get streaming explanations, visual call graphs, and issue breakdowns — all wrapped in a retro Windows 95/XP-themed UI.

## Features

- **Repository Analysis** — Fetches repo metadata, file tree, and source code via the GitHub API. Parses up to 80 text files (any language) using tree-sitter AST analysis for JS/TS and generic AI analysis for everything else.
- **Streaming AI Explanations** — Gemini 2.5 Flash generates real-time streaming explanations for individual files and full repository summaries, tailored to your experience level (junior / mid / senior).
- **Cross-File Dependency Graph** — Resolves imports to actual files, tracks symbol usage across boundaries, and visualizes the full dependency web.
- **Two-Level Call Graph** — Repo-level view (files as nodes grouped by directory) and file-level view (function diagram with imports/calls). Zoom, pan, fullscreen, clickable nodes.
- **GitHub Issues with Difficulty Classification** — Fetches open issues, classifies them by difficulty (easy/medium/hard), and generates AI explanations for each.
- **Two-Tier Caching** — Repo data cached 15 min (50 entries), AI responses cached 60 min (200 entries). Same repo analyzed by 10 users = 1 set of API calls.
- **Retro UI** — Windows 95 windows, titlebars, and buttons. Y2K-era date display. XP hourglass page transitions. Pixel-art fish favicon and logo.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Code Parsing | web-tree-sitter (WASM) |
| AI | Google Gemini 2.5 Flash |
| GitHub API | @octokit/rest |
| Diagrams | Mermaid |
| Deployment | Railway (Nixpacks) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (for API access)
- A [Google Gemini API Key](https://aistudio.google.com/apikey)

### Setup

```bash
git clone https://github.com/arhovumyan/fishlens.git
cd fishlens
npm install
cp .env.local.example .env.local
```

Fill in your keys in `.env.local`:

```
GITHUB_TOKEN=your_github_personal_access_token
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a GitHub repo URL, select your experience level, and click **Analyze**.

## API Endpoints

### `POST /api/parse`

Ingests a GitHub repo: fetches metadata, file tree, raw source, and produces a full call graph via tree-sitter AST parsing.

**Request:** `{ "repoUrl": "https://github.com/owner/repo" }`

**Response:**
```json
{
  "cache": "hit | miss",
  "repoMeta": { "name": "", "description": "", "language": "", "stars": 0 },
  "fileTree": [{ "path": "", "type": "file | dir", "language": "" }],
  "callGraph": {
    "filePath": {
      "imports": ["..."],
      "exports": ["..."],
      "functions": { "name": { "calls": ["..."] } }
    }
  },
  "rawFiles": { "filePath": "source code" }
}
```

### `POST /api/explain`

Streams an AI explanation for a single file. Takes `repoUrl`, `filePath`, and `experienceLevel`.

### `POST /api/summary`

Streams a repository-wide AI summary. Takes `repoUrl` and `experienceLevel`.

### `GET /api/issues?repoUrl=...&experienceLevel=...`

Returns open GitHub issues with difficulty classification and AI-generated explanations.

### `GET /api/health`

Returns `{ "status": "ok", "timestamp": "..." }` — used by Railway for deployment healthchecks.

## Project Structure

```
app/
  page.tsx             — Landing page (retro boot screen)
  analyze/page.tsx     — Main analyzer dashboard
  icon.svg             — Pixel-art fish favicon
  api/
    parse/             — GitHub ingestion + tree-sitter parsing
    explain/           — Streaming file explanations via Gemini
    summary/           — Streaming repo summaries via Gemini
    issues/            — GitHub issues with AI difficulty classification
    health/            — Healthcheck endpoint

lib/
  github.ts            — GitHub URL parsing + Octokit data fetching
  parser.ts            — web-tree-sitter AST analysis
  analyze.ts           — Shared analysis pipeline (GitHub → parser → dependency graph → cache)
  dependency-graph.ts  — Cross-file import resolution and symbol tracking
  gemini.ts            — Gemini API wrapper (streaming + non-streaming)
  prompts.ts           — Prompt builders for different explanation contexts
  cache.ts             — Repo data TTL cache (50 entries, 15 min)
  ai-cache.ts          — AI response TTL cache (200 entries, 60 min)

components/
  FileExplorer.tsx     — Collapsible file tree sidebar
  ExplanationPanel.tsx — Streaming AI explanation display
  CallGraph.tsx        — Two-level Mermaid call graph (repo + file views)
  SummaryPanel.tsx     — Collapsible repo summary cards
  IssuesPanel.tsx      — Issues list with difficulty badges
  FishIcon.tsx         — Pixel-art fish logo component (transparent/teal bg)
```

## Deployment

Configured for Railway via `railway.json` with Nixpacks builder. Healthcheck at `/api/health`.

## License

MIT
