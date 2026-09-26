# Halp

**Prioritize AI-generated pull request reviews before they pile up into a bottleneck.**

Built for the IBM Bob 2.0 Hackathon (2026).

---

## The Problem

The development bottleneck in 2026 has shifted from writing code to validating it:

- 85% of developers and tech buyers agree the bottleneck has moved from writing to reviewing and validating code (GitLab AI Accountability Report, 2026)
- AI-generated pull requests wait 4.6 times longer for first review, and get accepted only 32.7% of the time compared to 84.4% for human-written PRs (LinearB 2026 Benchmarks)
- Teams with high AI adoption see PR review time increase by up to 91% (Faros AI Research, 2026)
- Developers feel 20% faster using AI, but are measurably 19% slower once review overhead is accounted for (METR, 2025)

Review queues become unordered, and reviewers have no way to tell which PR is the riskiest and needs attention first.

## The Solution

**Halp** analyzes pull requests in a GitHub repository, scores each one for risk based on several signals, and reorders the review queue by priority instead of simple time of arrival.

## How It Works

The risk score is calculated from 4 weighted signals:

| Signal | Weight | Logic |
|---|---|---|
| Size | 30% | Linear scale from 50-1000 lines, bonus if more than 20 files |
| AI-Generated | 25% | Co-author detection + commit burst + ratio anomaly |
| Age | 25% | Linear scale from 4-72 hours since the PR was opened |
| Hotspot | 20% | Cross-PR file overlap + risky path patterns (`/auth`, `/payment`, etc.) |

The total score maps to a badge:

| Score | Badge |
|---|---|
| 0-25 | Low |
| 26-50 | Medium |
| 51-75 | High |
| 76-100 | Critical |

## Features

- Connect to a public GitHub repo with a Personal Access Token
- Dashboard that automatically sorts PRs by risk score
- Transparent tooltip breakdown of why a PR is considered risky
- Lightweight: 93.9 kB first load JS, only 3 runtime dependencies, zero database

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, native `fetch`
- **Data**: GitHub REST API, in-memory TTL cache
- **Deployment**: Vercel

## Quick Start


## Demo

- **Live demo**: [add Vercel link here]
- **Video presentation**: [add video link here]

## Built with IBM Bob 2.0

This project was developed using IBM Bob 2.0 as an AI dev partner. The exported session report is available at [add path/link to the Bob report here].

## Security

The GitHub PAT is never stored permanently or logged; it only lives in memory for the active session. Full details are in [`build-report.md`](./build-report.md).

## License

MIT, see [LICENSE](./LICENSE).

---

Built for the IBM Bob 2.0 Hackathon, September 25-27, 2026.
