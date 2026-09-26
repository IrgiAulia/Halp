# Halp

**Prioritize AI-generated pull request reviews before they pile up into a bottleneck.**

Built for the **IBM Bob 2.0 Hackathon (September 25–27, 2026)**.

---

## 🚨 The Problem

The development bottleneck in 2026 has shifted from writing code to validating it:

- **85% of developers and tech buyers** agree the bottleneck has moved from writing to reviewing and validating code (*GitLab AI Accountability Report, 2026*)
- **AI-generated pull requests wait 4.6 times longer** for first review, and get accepted only 32.7% of the time compared to 84.4% for human-written PRs (*LinearB 2026 Benchmarks*)
- **Teams with high AI adoption see PR review time increase by up to 91%** (*Faros AI Research, 2026*)
- Developers feel 20% faster using AI, but are measurably **19% slower** once review overhead is accounted for (*METR, 2025*)

Review queues become unordered, and reviewers have no way to tell which PR is the riskiest and needs attention first.

---

## 💡 The Solution

**Halp** (PR Risk Radar) analyzes open pull requests in any GitHub repository, scores each one for risk across 4 weighted signals, and reorders the review queue by priority instead of simple time of arrival — so your team audits the critical changes first.

---

## ⚖️ How It Works: Risk Scoring Formula

$$\text{Risk Score} = \sum_{i=1}^{4} w_i \cdot s_i(PR)$$

The risk score is calculated from **4 weighted signals**:

| Signal | Weight | Logic & What It Measures |
|---|---|---|
| 📏 **Size** | 30% | Linear scale from 50–1000 lines changed, bonus if more than 20 files |
| 🤖 **AI-Generated** | 25% | Co-author bot detection (50pts) + commit burst ≥3 in 10min (30pts) + add/delete ratio anomaly (20pts) |
| ⏰ **Age** | 25% | Linear scale from 4–72 hours since the PR was opened (long-lived PRs accumulate risk) |
| 🔥 **Hotspot** | 20% | Cross-PR file overlap + risky path patterns (`/auth`, `/payment`, `/admin`, `/config`) |

### Badge Mapping

| Score | Badge | Color | Action |
|---|---|---|---|
| 0–25 | 🟢 Low | Emerald | Skim or fast-track |
| 26–50 | 🟡 Medium | Amber | Standard review |
| 51–75 | 🟠 High | Orange | Thorough audit required |
| 76–100 | 🔴 Critical | Red | Priority triage & senior sign-off |

---

## ⚡ Quick Start

```bash
# 1. Clone and enter the project
git clone https://github.com/IrgiAulia/Halp.git
cd Halp

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.local.example .env.local

# 4. (Optional) Add your GitHub PAT to .env.local
# Or enter it in the UI at runtime — it's never stored permanently

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your repository.

---

## 🏗️ Architecture

```
Foundation Layer
├── src/types/index.ts      → TypeScript contracts & signal interfaces
├── src/lib/config.ts       → Scoring weights + thresholds (tune here)
└── src/lib/cache.ts        → TTL-based in-memory cache (5 min)

Backend Layer
├── src/lib/github.ts       → GitHub API client (native fetch, zero octokit)
├── src/lib/scoring.ts      → Score orchestrator (4 signals → 0-100)
└── src/lib/signals/
    ├── size.ts             → Lines/files changed (30% weight)
    ├── ai-generated.ts     → AI co-author + commit burst + ratio (25% weight)
    ├── age.ts              → Hours since PR opened (25% weight)
    └── hotspot.ts          → Risky paths + cross-PR overlap (20% weight)

API Routes
├── src/app/api/connect/    → POST — Validate PAT + repo connectivity
├── src/app/api/prs/        → GET  — Fetch, enrich, score, cache PRs
└── src/app/api/health/     → GET  — Health check

Frontend
├── src/app/page.tsx        → Dashboard orchestrator
└── src/components/
    ├── Header.tsx          → Sticky header + repo info & theme
    ├── RepoConnector.tsx   → PAT + repo input form
    ├── StatsBar.tsx        → Summary statistics & risk distribution
    ├── PRList.tsx          → Filterable, sortable PR list
    ├── PRCard.tsx          → Individual PR card
    ├── RiskBadge.tsx       → Color-coded risk pill
    └── RiskTooltip.tsx     → Expandable transparent signal breakdown
```

---

## ⚙️ Configuration

All scoring weights and thresholds are consolidated in [`src/lib/config.ts`](src/lib/config.ts). Change the numbers, not the code.

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_PAT` | No | Server-side GitHub PAT fallback (if not entered via UI) |
| `DEFAULT_REPO` | No | Default `owner/repo` to pre-load on startup |

> ⚠️ Never commit `.env.local`. It is strictly ignored by `.gitignore`.

---

## 🛠️ Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based API routes, modern React Server Components |
| Language | TypeScript (strict) | Zero `any` in user code, full type safety |
| Styling | Tailwind CSS | Zero runtime CSS, clean dark theme |
| HTTP | Native `fetch` | No axios, no octokit overhead |
| State | React `useState` + `useCallback` | Lightweight, zero external state library |
| Cache | In-memory `Map` with TTL | Zero cold start, zero database overhead |
| Bundle | 93.9 kB First Load JS | Only 3 runtime dependencies (`next`, `react`, `react-dom`) |

---

## 🔒 Security

- **PAT never logged** — not in console, error messages, or API responses
- **Input sanitized** — `owner` and `repo` validated with strict allowlist regex before URL construction
- **No stack traces** — API routes return user-safe error messages only
- **Method validation** — All routes return 405 for unexpected HTTP methods
- **HTTPS enforced** — `vercel.json` sets security headers (HSTS, X-Frame-Options, CSP, etc.)
- **In-memory only** — GitHub PAT is never written to `localStorage` or `sessionStorage`

---

## 🧪 Development & Testing

```bash
# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
```

---

## 🚀 Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

Set `GITHUB_PAT` in Vercel environment variables (optional — users can also enter it securely via the UI).

---

## 🤖 Built with IBM Bob 2.0

This project was conceived and developed using **IBM Bob 2.0** as an AI development partner during the IBM Bob 2.0 Hackathon (September 25–27, 2026).

- **Category**: Developer Tools / AI-assisted Development
- **Tech Tags**: Next.js, TypeScript, GitHub API, Risk Scoring, Code Review, AI Development Bottlenecks

---

## 📄 License

MIT © 2026 Irgi Aulia. See [LICENSE](./LICENSE) for details.
