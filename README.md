# Zen-Stream

A cinematic movie and TV-series streaming product: responsive web application first, Android application later.

This is a greenfield project. It is not derived from any previous codebase.

## Stack

- **Monorepo** — npm workspaces
- **apps/web** — React 19, Vite, TypeScript, React Router, plain CSS (cascade layers + design tokens)
- **apps/server** — Node.js, Express, TypeScript, Zod validation, API prefix `/api/v1`
- **packages/contracts** — shared Zod schemas and TypeScript types

## Getting started

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- Server: http://localhost:4000

The server proxies catalog metadata from an upstream media API. To enable
the discovery feed, set the server-side credentials first (see
`apps/server/.env.example`):

```bash
export MEDIA_API_BASE_URL=https://your-upstream-worker.example.com
export MEDIA_API_SECRET=your-worker-secret
npm run dev
```

Without these, the app still runs and every media request surfaces an
honest `MEDIA_NOT_CONFIGURED` state (503) instead of fake content.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Web + server with hot reload |
| `npm run dev:web` | Web only |
| `npm run dev:server` | Server only |
| `npm run build` | Production build of web and server |
| `npm run typecheck` | Strict TypeScript check across workspaces |
| `npm run lint` | ESLint across the repository |
| `npm run test` | Vitest across all workspaces |

## Content policy

Zen-Stream only streams content it is legally authorized to provide. Development
uses public-domain or appropriately licensed media. The MovieBox API worker is
treated as a compatibility reference only: Zen-Stream never copies its code or
assets, and its content is only reachable through the server-side proxy when a
user supplies their own credentials via `MEDIA_API_BASE_URL` / `MEDIA_API_SECRET`.

## Milestones

- M1: greenfield foundation — workspace, web, server, contracts, design
  tokens, base CSS, minimal primitives, health endpoint.
- M2 (current): streaming product — contracts for the media API, server
  proxy with env config and tests, typed web client and data hooks,
  watchlist store, and a MovieBox-style UI: streaming shell, API-driven
  home feed, movie/series browse, search with URL sync, details with
  seasons and episodes, honest player states, collections, and My List.