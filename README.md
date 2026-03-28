# GLITCH — AI-Powered Codebase Explainer

GLITCH analyzes any public GitHub repository and generates interactive, AI-powered explanations of its code. Point it at a repo URL, pick your experience level, and get streaming explanations, visual call graphs, and issue breakdowns — all in the browser.

## Features

- **Repository Analysis** — Fetches repo metadata, file tree, and source code via the GitHub API. Parses up to 50 TypeScript/JavaScript files using tree-sitter AST analysis to extract imports, exports, and function-level call graphs.
- **Streaming AI Explanations** — Gemini 2.0 Flash generates real-time streaming explanations for individual files and full repository summaries, tailored to your experience level (junior / mid / senior).
- **Interactive File Explorer** — Collapsible sidebar file tree. Click any file to get an AI explanation and its call graph side-by-side.
- **Mermaid Call Graph Visualization** — Renders interactive dependency diagrams showing imports, function definitions, and call relationships for each file.
- **GitHub Issues with Difficulty Classification** — Fetches open issues, classifies them by difficulty (easy/medium/hard), and generates AI explanations for each.
- **In-Memory Caching** — Parsed results are cached for 15 minutes to avoid redundant GitHub API calls.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Code Parsing | web-tree-sitter (WASM) |
| AI | Google Gemini 2.0 Flash |
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
git clone https://github.com/arhovumyan/GLITCH_Hackaton.git
cd GLITCH_Hackaton
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
  api/
    parse/       — GitHub ingestion + tree-sitter parsing
    explain/     — Streaming file explanations via Gemini
    summary/     — Streaming repo summaries via Gemini
    issues/      — GitHub issues with AI difficulty classification
    health/      — Healthcheck endpoint
  page.tsx       — Main dashboard UI
  layout.tsx     — Root layout

lib/
  github.ts      — GitHub URL parsing + Octokit data fetching
  parser.ts      — web-tree-sitter AST analysis
  gemini.ts      — Gemini API wrapper (streaming + non-streaming)
  prompts.ts     — Prompt builders for different explanation contexts
  cache.ts       — In-memory TTL cache

components/
  FileExplorer.tsx      — Collapsible file tree sidebar
  ExplanationPanel.tsx  — Streaming AI explanation display
  CallGraph.tsx         — Mermaid call graph visualization
  IssuesPanel.tsx       — Issues list with difficulty badges
```

## Deployment

Configured for Railway via `railway.json` with Nixpacks builder. Healthcheck at `/api/health`.

## License

MIT
