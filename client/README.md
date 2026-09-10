# City ANPR Platform — Web Frontend

React + Vite + TypeScript operator console for a city-wide ANPR system. Built against the
master prompt: trajectory search on a GIS map, live analytics, an alert console, blacklist
and user admin, and an **Upload & Test Portal** that demonstrates the two-backend detection
pipeline without live camera hardware.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

No backend is required to explore the app. `VITE_USE_MOCKS=true` (the default in `.env`)
routes every API call through realistic in-memory mock data and simulated WebSocket
traffic instead of hitting `localhost:8080` / `localhost:8000`. Flip it to `false` once the
real Java and Python services are running locally.

```bash
npm run build     # tsc -b && vite build — production build to dist/
npm run lint       # oxlint
npm run preview    # serve the production build locally
```

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `VITE_JAVA_API_BASE_URL` | Java REST base (default `http://localhost:8080`) |
| `VITE_PYTHON_API_BASE_URL` | Python inference base (default `http://localhost:8000`) |
| `VITE_JAVA_WS_ALERTS_URL` | `/ws/alerts` WebSocket URL |
| `VITE_JAVA_WS_ANALYTICS_URL` | `/ws/analytics/live` WebSocket URL |
| `VITE_USE_MOCKS` | `true`/`false` — toggle mock data vs. real backend calls |

## Routes

| Path | Page | Access |
|---|---|---|
| `/login` | Login | public |
| `/dashboard` | Camera Map / Dashboard | any authenticated role |
| `/trajectory` | Trajectory Viewer | Admin, Operator |
| `/analytics` | Analytics Dashboard | any authenticated role |
| `/alerts` | Alert Console | any authenticated role |
| `/upload` | Upload & Test Portal | any authenticated role |
| `/blacklist` | Blacklist Management | Admin, Operator |
| `/admin` | User / Role Admin | Admin only |

Demo login accepts any password for `ops.singh` (Admin), `insp.rao` / `insp.mehta`
(Operator), or `viewer.kumar` (Viewer) — role changes what the sidebar exposes.

## Architecture

```
src/
  components/
    ui/        generic component library (Button, DataTable, Dialog, Toast, ...)
    layout/     AppShell, Sidebar, Header
    maps/       Leaflet dark-basemap wrappers (CameraMap, TrajectoryMap)
  pages/        one file per route, composed from components/ui + components/maps
  lib/
    api/        http.ts (fetch wrapper) + java.ts + python.ts — the only files
                that know about backend URLs or mock/real switching
    auth-store.ts  in-memory session store (see Auth below)
  hooks/         useWebSocket, useAlertsFeed, useAnalyticsLive, useMediaResult
  context/       AuthContext
  mocks/         deterministic mock data + a mutable in-memory "store" so CRUD
                 mock endpoints (blacklist add/remove, alert acknowledge, media
                 upload) have somewhere real to write to during a session
  types/         shared domain types
```

### API separation (hard rule from the spec)

- `lib/api/java.ts` — everything metadata/business-logic: auth, cameras, trajectories,
  alerts, blacklist, media *metadata* (`POST /api/v1/media`, `GET /api/v1/media/{id}`), users.
- `lib/api/python.ts` — **only** raw file bytes for inference (`POST /infer/image`,
  `POST /infer/video`), sent directly to Python's host/port, never proxied through Java.

Both modules check `VITE_USE_MOCKS` internally and fall back to mock data with simulated
latency when true — the real `fetch` calls are written and ready, they're just not the
default path until a backend is reachable.

### Upload & Test Portal result-fetch abstraction

The master spec leaves polling vs. WebSocket push as an open decision for the result
fetch in step 3 of the upload flow. `src/hooks/useMediaResult.ts` is the single place
that decision lives — it currently polls `GET /api/v1/media/{mediaId}`. Switching to a
WS push later means rewriting the body of that one hook; nothing else in the app
(`UploadPage.tsx`) needs to change.

### Auth

The access token lives in a module-level variable (`lib/auth-store.ts`), never in
`localStorage`, per the spec's non-functional requirement. A hard page refresh in this
demo build will drop the session and require re-login — that's the accepted trade-off for
local/demo use called out in the spec rather than a silent insecure shortcut. Refresh is
scheduled ~60s before expiry via `POST /api/v1/auth/refresh`.

### Real-time

`hooks/useWebSocket.ts` is a generic reconnecting-WebSocket hook with exponential backoff
(1s → 15s cap). `useAlertsFeed` and `useAnalyticsLive` wrap it for the two live channels.
In mock mode both use a `mockSimulator` callback instead of a real socket, so the demo
still "streams" new alerts and analytics ticks without a backend.

### State management

No global store beyond `AuthContext` — each page owns its own data via `useEffect` +
the `lib/api` layer, which is enough given each page maps to one API surface. If the app
grows, React Query is the natural next step for caching/invalidation (the spec allows it;
this build keeps the dependency footprint smaller for a local demo build).

### Mock data

`src/mocks/data.ts` generates cameras, alerts, blacklist entries, users, media history,
and analytics history. `src/mocks/store.ts` re-exports mutable references to those arrays
so mock CRUD endpoints (add/remove blacklist entry, acknowledge alert, register/poll a
media job) persist changes for the rest of the session instead of resetting on every call.

## Testing performed

- `npx tsc -b --noEmit` — clean, no errors (TypeScript strict mode, no unexplained `any`)
- `npm run build` — production build succeeds; bundle ~880KB JS / 45KB CSS (gzip ~262KB/13KB).
  Not yet code-split — worth adding `React.lazy` per-route before a real deployment, not
  necessary for local dev.
- `npm run lint` (oxlint) — 0 errors, 7 warnings (conventional "setState in effect for
  data-loading" and "hook file also exports a Provider" patterns — both are standard
  React patterns, not bugs)
- Manual walkthrough of the demo flow in `C3` of the master prompt was written into the
  page logic (login → dashboard → alerts → trajectory search → analytics → upload →
  blacklist → admin) but **not visually verified in a running browser** in this session —
  the dev server didn't stay up across tool calls in the sandbox this was built in. Run
  `npm run dev` locally and click through before treating this as demo-ready.

## Known non-blocking limitations

- Bundle is a single ~880KB chunk; add route-level `React.lazy` before shipping anywhere
  that isn't local dev.
- No automated tests (unit/e2e) were written — the spec didn't request a test framework
  choice, and none is wired up yet.
- Map tile source is standard OpenStreetMap raster tiles (`tile.openstreetmap.org`) —
  free, no API key. They're light by default; `.map-tiles-dark` in `globals.css`
  inverts + tints them to fit the app's theme. (CARTO's basemap tiles were tried
  first but now require a free API key, which isn't worth the extra signup step
  for local dev — see their watermarked "API KEY REQUIRED" tiles if you're
  curious what that looks like.) Swap for a self-hosted tile server before any
  real deployment — OSM's tile usage policy isn't meant for production traffic.
- Session drops on hard refresh (by design — see Auth above).
- `useMediaResult` has not been swapped to a WS-based implementation; it polls every
  1.2s, which is fine for a demo but worth tuning once real inference latency is known.
