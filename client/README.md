# Client — React Operator Dashboard

React 19 + Vite 8 single-page application. Operator interface for live camera
feeds, trajectory search, analytics dashboards, alert management, and the manual
upload/test portal.  
Runs on **port 5173**.

---

## Prerequisites

- Node.js 22 LTS or newer
- npm 10+

---

## One-time Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`. For local dev with mock data the defaults work out of the box
(`VITE_USE_MOCKS=true`). To connect to the real backend:

```env
VITE_USE_MOCKS=false
VITE_JAVA_API_BASE_URL=http://localhost:8080
VITE_PYTHON_API_BASE_URL=http://localhost:8000
VITE_DEFAULT_CITY_ID=default
```

---

## Running

```bash
npm run dev
```

Opens at http://localhost:5173

---

## Other Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |

---

## Environment Variables

See [`.env.example`](.env.example) for all variables.

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_JAVA_API_BASE_URL` | `http://localhost:8080` | Java backend base URL |
| `VITE_PYTHON_API_BASE_URL` | `http://localhost:8000` | Python ANPR engine base URL |
| `VITE_JAVA_WS_ALERTS_URL` | `ws://localhost:8080/ws/alerts` | WebSocket for live alerts |
| `VITE_JAVA_WS_ANALYTICS_URL` | `ws://localhost:8080/ws/analytics/live` | WebSocket for live analytics |
| `VITE_USE_MOCKS` | `true` | Set `false` to use real backends |
| `VITE_DEFAULT_CITY_ID` | `default` | cityId sent to Java for media registration and analytics queries |

---

## Pages

| Route | Page |
|-------|------|
| `/dashboard` | Live camera status, detection volume, system health |
| `/trajectory` | Plate number search → multi-camera route map |
| `/analytics` | Traffic volume, OD flow, congestion heatmap |
| `/alerts` | Real-time blacklist hit alerts |
| `/upload` | Manual upload & test portal — demonstrates full detection pipeline |
| `/blacklist` | Manage the plate blacklist |
