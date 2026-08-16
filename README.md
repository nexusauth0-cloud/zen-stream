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
uses public-domain or appropriately licensed media. The MovieBox API repository
is treated as research material only and is never imported, copied, or proxied.

## Milestones

M1 (current): greenfield foundation — workspace, web, server, contracts,
design tokens, base CSS, minimal primitives, health endpoint.