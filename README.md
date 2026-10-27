# Netlab

[![Deploy to GitHub Pages](https://github.com/EliseyRotar/Netlab/actions/workflows/deploy.yml/badge.svg)](https://github.com/EliseyRotar/Netlab/actions/workflows/deploy.yml)

Client-only IPv4 subnet calculator: VLSM, supernetting, equal split, cloud
addressing and more, with a dark-first dashboard, interactive charts and
Cisco IOS snippets.

**Live: https://eliseyrotar.github.io/Netlab/**

> Formerly *Eli6Subnets*: the old Pages URL keeps working and redirects here.

## Features

- **8 calculators** — single subnet, VLSM, equal split, supernetting,
  range → CIDR, overlap check, IPv6 basics, AWS/Azure cloud ranges
- **Reference views** — IPv4 classes A–E with drill-down, drag & drop
  network topology editor, guide + cheat sheet, saved projects
- **Per-tool dashboards** — KPIs, address-space donut, subnet treemap (ECharts)
- **Cisco IOS snippets** with one-click copy
- **Shareable links** (`?s=…` encodes the inputs), session persistence,
  saved projects — all in `localStorage`, nothing leaves the browser
- **i18n** Italian / English, **dark / light themes** (OKLCH palette,
  every pair verified WCAG AA)
- 32-bit binary viewer with didactic annotations

## Tech stack

- Vite + TypeScript (strict), no framework, hash router
- ECharts, bundled locally (no CDN)
- Plain CSS driven by design tokens (`src/styles/tokens.css`, OKLCH)

## Getting started

```powershell
npm install
npm run dev      # http://localhost:5173/Netlab/
npm test         # vitest
npm run build    # tsc --noEmit && vite build → dist/
```

## Project structure

```
src/
├── main.ts            # bootstrap: theme, i18n, routing, shell
├── calc/              # pure calculation layer (no DOM)
├── charts/            # ECharts option builders + theme-aware palette
├── i18n/              # it/en dictionaries + t()
├── state/             # store, persistence, URL sharing
├── styles/            # tokens + base/layout/components CSS
├── theme/             # light/dark toggle
└── ui/                # views, tools, shell (sidebar/topbar/footer)
```

## Deployment

Push to `main`: the `Deploy to GitHub Pages` workflow builds and publishes
to https://eliseyrotar.github.io/Netlab/.
