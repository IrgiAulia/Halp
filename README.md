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

**Halp** (PR Risk Radar) analyzes open pull requests in any GitHub repository, scores each one for risk across 6 weighted signals, and reorders the review queue by priority instead of simple time of arrival — so your team audits the critical changes first.

---

## ⚖️ How It Works: Risk Scoring Formula

$$\text{Risk Score} = \sum_{i=1}^{6} w_i \cdot s_i(PR)$$

The risk score is calculated from **6 weighted signals**:

| Signal | Weight | Logic & What It Measures |
|---|---|---|
| 📏 **Size** | 20% | Linear scale from 30–800 lines changed, bonus for many/critical files |
| 🤖 **AI-Generated** | 20% | Co-author bot detection (50pts) + commit burst ≥3 in 8min (35pts) + add/delete ratio anomaly (20pts) + AI-style commit messages (25pts) |
| ⏰ **Age** | 15% | Linear scale from 2–48 hours since the PR was opened, extra penalty past 72h of inactivity |
| 🔥 **Hotspot** | 20% | Cross-PR file overlap + risky path patterns (`/auth`, `/payment`, `/admin`, `/config`, `/security`, migrations, schemas, middleware) |
| 🧩 **Commit Complexity** | 15% | Generic/low-quality commit messages, high commit-to-file churn ratio |
| 👀 **Review Velocity** | 10% | No reviewers requested, freshly-pushed changes, high comment volume, changes-requested still unresolved |

### Badge Mapping

| Score | Badge | Color | Action |
|---|---|---|---|
| 0–20 | 🟢 Low | Emerald | Skim or fast-track |
| 21–45 | 🟡 Medium | Amber | Standard review |
| 46–70 | 🟠 High | Orange | Thorough audit required |
| 71–100 | 🔴 Critical | Red | Priority triage & senior sign-off |

> Weights and thresholds are tunable in a single place: [`src/lib/config.ts`](src/lib/config.ts).

---

## ⚡ Quick Start

### 🌐 Option 1: Use the Live Web App (Instant)

Open the deployed web application directly at **[halp-pr.vercel.app](https://halp-pr.vercel.app)**:
1. Enter your GitHub Personal Access Token (PAT) with `repo` scope (read-only is sufficient for public repos).
2. Enter the repository in `owner/repo` format (e.g., `facebook/react` or your own repository).
3. Click **Connect & Analyze** to view open pull requests prioritized and scored by risk.

*(Note: Live deployment is also accessible via [halp-psi.vercel.app](https://halp-psi.vercel.app)).*

---

### 💻 Option 2: Run Locally

```bash
# 1. Clone and enter the repository
git clone https://github.com/IrgiAulia/Halp.git
cd Halp

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local

# 4. (Optional) Add your GitHub PAT to .env.local
# You can also enter it securely in the UI at runtime — it's never stored permanently

# 5. Start the development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser to connect your repository.

---

## 🏗️ Architecture

```
Foundation Layer
├── src/types/index.ts      → TypeScript contracts & signal interfaces
├── src/lib/config.ts       → Scoring weights + thresholds (tune here)
└── src/lib/cache.ts        → TTL-based in-memory cache (5 min)

Backend Layer
├── src/lib/github.ts       → GitHub API client (native fetch, zero octokit)
├── src/lib/scoring.ts      → Score orchestrator (6 signals → 0-100)
└── src/lib/signals/
    ├── size.ts                 → Lines/files changed (20% weight)
    ├── ai-generated.ts         → AI co-author + commit burst + ratio (20% weight)
    ├── age.ts                  → Hours since PR opened (15% weight)
    ├── hotspot.ts              → Risky paths + cross-PR overlap (20% weight)
    ├── commit-complexity.ts    → Commit message quality + churn (15% weight)
    └── review-velocity.ts      → Reviewer engagement signals (10% weight)

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
| Framework | Next.js 16 (App Router) | File-based API routes, modern React Server Components |
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
- **Security headers** — `vercel.json` sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy` on every response
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

## 🚀 Deployment & Live Demo
 
- **Live demo**: [https://halp-pr.vercel.app](https://halp-pr.vercel.app) <!-- TODO: confirm this is the canonical URL before submitting; halp-psi.vercel.app also currently resolves to a deployment of this project -->
- **Vercel Team**: `origin-labs2`

To deploy your own instance to Vercel:

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy to production
vercel --prod
```

Set `GITHUB_PAT` in your Vercel project environment variables (optional — users can also enter it securely via the UI at runtime).

---

## 🤖 Built with IBM Bob 2.0

This project was conceived and planned using Claude Opus 4.6 and Claude Sonnet 5, but fully coded and developed using **IBM Bob 2.0** via Bob IDE. AI models outside IBM was used to preserve bobcoins so that it's enough for product development.

- **Category**: Developer Tools / AI-assisted Development
- **Tech Tags**: Next.js, TypeScript, GitHub API, Risk Scoring, Code Review, AI Development Bottlenecks

---

## 📄 License

MIT © 2026 Irgi Aulia. See [LICENSE](./LICENSE) for details.
