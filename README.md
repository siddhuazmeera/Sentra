# Sentra — Attack Surface & Threat Intelligence Platform

> **"See your risk before attackers do"**

Sentra is a modern, high-density cybersecurity reconnaissance and attack-surface monitoring platform built with React 19, TypeScript, Vite, Tailwind CSS, Recharts, React Flow (`@xyflow/react`), and TanStack Query.

---

## Brand Identity & Design System

- **Brand Name**: Sentra
- **Tagline**: *"See your risk before attackers do"*
- **Wordmark**: Clean geometric sans-serif font (`Plus Jakarta Sans` / `Inter`), semi-bold, lowercase `sentra`, accompanied by a minimal geometric shield combined with an abstract scanning eye.
- **Color Palette**:
  - **Primary Accent**: Sentra Teal (`#14B8A6`)
  - **Background**: Near-Black (`#0B0F14`)
  - **Surfaces**: Elevated Slate Cards (`#101620`, `#151E2B`)
  - **Severity Hierarchy**: Critical (`#EF4444`), High (`#F97316`), Medium (`#EAB308`), Low (`#3B82F6`), Info (`#64748B`).
- **Typography**: Monospace (`JetBrains Mono`) for all IPs, domains, hashes, and CVE identifiers.
- **Brand Assets**: Vector logo component at [`src/components/ui/SentraLogo.tsx`](file:///C:/Users/nanis/.gemini/antigravity/scratch/threatlens/src/components/ui/SentraLogo.tsx) and high-resolution artworks in [`public/brand/`](file:///C:/Users/nanis/.gemini/antigravity/scratch/threatlens/public/brand/).

---

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + custom security operations components
- **Visualization**: Recharts (Risk Gauges, 30-day Area Trends, Severity Donut)
- **Topology**: `@xyflow/react` (Interactive Asset Relationship Node Graph)
- **Routing & State**: React Router 7 + TanStack Query v5
- **Unified API Client**: Exported as `sentraApi` from [`src/lib/api.ts`](file:///C:/Users/nanis/.gemini/antigravity/scratch/threatlens/src/lib/api.ts).

---

## Connecting a Real Backend (e.g. FastAPI / Python / Go)

Sentra features a clean, single-point API abstraction layer. All components interact with the backend exclusively via `sentraApi` from `/lib/api.ts`.

### 1. Environment Variables Configuration
In your `.env` file:
```env
# Switch to 'false' to route calls to the live REST API
VITE_USE_MOCKS=false

# Specify your backend REST API base URL
VITE_SENTRA_API_BASE_URL=http://localhost:8000/api/v1
```

### 2. Programmatic API Key Authentication
All programmatic REST tokens use the mandatory prefix:
- Production keys: `sn_live_xxxxxxxxxxxxxxxxxxxxxxxx`
- Staging / Testing keys: `sn_test_xxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Backend REST Endpoint Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/metrics?domain={domain}` | Returns `DashboardMetrics` (risk score, counts, top fixes, alerts) |
| `GET` | `/domains` | Returns list of monitored domains & verification status |
| `GET` | `/assets?domain={domain}&search={q}&severity={sev}` | Returns paginated `{ assets: Asset[], total: number }` |
| `GET` | `/assets/{id}` | Returns single `Asset` detail model with services & history |
| `GET` | `/cves?search={q}&severity={sev}&kevOnly={bool}` | Returns correlated CVEs list with EPSS scores |
| `GET` | `/cves/{id}` | Returns detailed CVE information and affected assets |
| `GET` | `/alerts?status={status}` | Returns streaming alerts |
| `PATCH` | `/alerts/{id}/status` | Updates alert triage status (`acknowledged`, `resolved`) |
| `GET` | `/breaches` | Returns HaveIBeenPwned & dark web breach dumps |
| `PATCH` | `/breaches/{id}/status` | Updates breach remediation status |
| `GET` | `/scan/verify-info?domain={domain}` | Returns required DNS TXT verification token (`_sentra-verify`) |
| `POST` | `/scan/verify` | Checks target DNS TXT propagation |
| `POST` | `/scan/start` | Initiates passive OSINT or deep active scan job |
| `GET` | `/scan/{id}` | Polls status of active scan job and data sources |
| `GET` | `/reports` | Lists generated incident reports |
| `POST` | `/reports` | Generates Executive, Technical, or CERT-In complaint report |
| `GET` | `/settings/api-keys` | Lists active API keys (`sn_live_...`) |
| `POST` | `/settings/api-keys` | Generates a new API key with "show once" token |
| `DELETE` | `/settings/api-keys/{id}` | Revokes an API key |
| `GET` | `/settings/data-sources` | Returns commercial API integration statuses |
| `PUT` | `/settings/data-sources/{id}` | Configures custom BYOK API key (Shodan, VT, etc.) |
| `GET` | `/settings/team` | Returns team members and access roles |
| `POST` | `/settings/team/invite` | Invites team member (Admin, Analyst, Viewer) |

---

## Running the Application

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run production build
npm run build
```
