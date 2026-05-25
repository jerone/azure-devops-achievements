# Azure DevOps Achievements 🏆

Earn achievements by performing tasks in Azure DevOps — inspired by [GitHub Profile Achievements](https://github.com/Schweinepriester/github-profile-achievements).

## Achievements

| Badge | Icon | How to earn |
|---|---|---|
| Pull Shark | 🦈 | Merge pull requests (tiers: 2 / 10 / 50) |
| Code Reviewer | 🔍 | Review PRs (tiers: 5 / 25 / 100) |
| YOLO | 💥 | Merge a PR without any reviewers |
| Quickdraw | ⚡ | Close a work item within 5 min of creating it |
| Bug Squasher | 🐛 | Close bugs (tiers: 5 / 25 / 100) |
| Pipeline Pioneer | 🚀 | Run your first pipeline |
| Build Master | 🏗️ | Trigger successful builds (tiers: 10 / 50 / 250) |
| Sprint Warrior | 🏃 | Complete all work in a sprint |
| First Blood | 🩸 | Create your first work item |
| Pair Programmer | 👫 | Co-author a commit in a merged PR |
| Comment King | 👑 | Leave PR comments (tiers: 20 / 100 / 500) |
| Green Guardian | 🟢 | Accumulate passing test runs (tiers: 50 / 250 / 1000) |

## Development

### Prerequisites

- Node.js 18+
- A Visual Studio Marketplace publisher account
- `tfx-cli` for packaging: `npm install -g tfx-cli`

### Setup

```bash
npm install
```

### Build

```bash
npm run build        # production build
npm run build:dev    # development build
npm run watch        # watch mode
```

### Package & Publish

1. Update `publisher` in `vss-extension.json` with your publisher ID.
2. Replace `images/logo.png` with a real 128×128 PNG icon.

```bash
npm run package      # creates a .vsix file
tfx extension publish --vsix *.vsix
```

## Architecture

```
src/
├── achievements/
│   ├── definitions.ts   — Achievement catalog & EarnedAchievement type
│   ├── evaluator.ts     — REST API calls + data service persistence
│   └── styles.css       — Shared styles
├── my-achievements/     — Personal hub (React)
└── team-leaderboard/    — Project leaderboard (React)
dist/                    — Built JS + HTML (committed for the extension package)
vss-extension.json       — Extension manifest
```

The evaluator calls the following ADO REST APIs:
- **Git API** — PRs, reviews, commits, thread comments
- **Work Item Tracking API** — work items, bugs, sprint completion
- **Build API** — pipeline runs, build results
- **Test API** — test run pass/fail stats

Earned achievements are stored per-user in the **Extension Data Service** (scoped to the user) so the leaderboard can read everyone's cached data.
