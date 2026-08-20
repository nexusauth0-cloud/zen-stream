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

The server proxies catalog metadata from a self-hosted media worker. The
reference API is the [Spün MovieBox API](https://github.com/heisdanny64/spun-moviebox-api)
Cloudflare Worker (self-host it with your own secrets). To enable the
discovery feed, set the server-side credentials first (see
`apps/server/.env.example`):

```bash
export MEDIA_API_BASE_URL=https://your-worker.workers.dev
export MEDIA_API_SECRET=your-worker-secret
npm run dev
```

- `MEDIA_API_BASE_URL` is the worker root URL — the proxy calls its
  root-level routes (`/home`, `/search`, `/info/:subjectId`,
  `/season/:subjectId`, `/stream/:subjectId`); there is no `/api/v1`
  prefix on the worker.
- `MEDIA_API_SECRET` is sent as the `X-Worker-Secret` header and must match
  the secret the worker operator configured (`MOVIEBOX_SECRET` on the
  reference worker).

Without these, the app still runs and every media request surfaces an
honest `MEDIA_NOT_CONFIGURED` state (503) instead of fake content.

### Optional: TMDB secondary metadata provider

Zen-Stream can additionally use [TMDB](https://developer.themoviedb.org/) as
an optional **secondary metadata/discovery provider** (set `TMDB_API_KEY` in
your server environment; see `apps/server/.env.example`):

- **Optional** — without a key, Zen-Stream behaves exactly as before.
- **MovieBox remains the primary provider.** TMDB never replaces it.
- **Metadata/discovery only** — search and details fall back to TMDB when
  the primary provider fails upstream (e.g. an outage). A successful primary
  answer — including a genuine zero-result search — is never overridden.
- **Playback never comes from TMDB.** TMDB payloads always normalize to
  `hasResource: false`, so TMDB titles can never become playable through
  the availability model (`available` / `coming-soon` / `preview-only` /
  `unavailable` semantics are unchanged).
- The key is server-side only — never expose it to the browser.

### Metadata/discovery resilience

In addition to TMDB, Zen-Stream can use **Spün** and **DaraTech** as
secondary metadata/discovery providers (see `apps/server/.env.example`):

- **Spün** (`SPUN_MEDIA_BASE_URL`, default `https://media.byspun.xyz/v1`) is
  registered automatically — it requires no key. Search and details fall
  back to Spün when the primary MovieBox provider fails upstream, and Spün
  identity lookups (`/utility/resolve`) let any MovieBox/TMDB/IMDb id be
  resolved to the matching Spün subject without guessing.
- **DaraTech** (`DARATECH_BASE_URL`, `DARATECH_API_KEY`) is registered only
  when a server-side key is present. DaraTech ids are deterministic:
  `base64(<numeric MovieBox id>:::pica)`.
- **MovieBox remains the primary provider.** A successful primary answer —
  including a genuine zero-result search — is never overridden.
- **Playback never comes from Spün or DaraTech.** Their payloads always
  normalize to `hasResource: false`; their stream endpoints are not
  integrated, and Zen-Stream never bypasses their access controls
  (e.g. user-agent spoofing).
- Cross-provider results are merged and deduplicated by normalized title
  and type — a movie is never merged into a series. Release-date enrichment
  is conservative: missing backdrop/description/date may be filled from a
  secondary provider, but identity and availability fields always come from
  the primary provider.
- Failures surface as `MEDIA_UPSTREAM_ERROR` (502), never as fake "no
  results". `GET /api/v1/providers/health` reports per-provider health for
  observability.

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