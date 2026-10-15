# Sentra — Attack Surface & Threat Intelligence Platform

> **"See your risk before attackers do"**

Sentra is a modern, high-density cybersecurity reconnaissance and attack-surface monitoring platform built with **React 19**, **TypeScript**, **Tailwind CSS**, **Recharts**, **React Flow** (`@xyflow/react`), and a **FastAPI** Python backend.

---

## ⚡ How to Implement & Run Sentra

You can run Sentra either **locally in development mode** or with **Docker**.

### 1. Run with Local Development Servers

#### Terminal 1: Start FastAPI Backend (Port 8000)
```bash
# Navigate to the backend directory
cd backend

# Install dependencies (FastAPI, Uvicorn, Pydantic, Httpx)
pip install -r requirements.txt

# Start the server with hot-reloading
python run.py
```
- API Base URL: `http://localhost:8000/api/v1`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Alternative ReDoc: `http://localhost:8000/redoc`

#### Terminal 2: Start React Frontend (Port 3000)
```bash
# In the project root directory
npm install

# Start Vite dev server on port 3000
npm run dev
```
- Web Application: `http://localhost:3000`

---

### 2. Switching Between Mock Mode and Real Backend

Sentra features a single typed API client layer at [`src/lib/api.ts`](file:///C:/Users/nanis/.gemini/antigravity/scratch/threatlens/src/lib/api.ts).

To route all UI components directly to the real FastAPI backend, edit [.env](file:///C:/Users/nanis/.gemini/antigravity/scratch/threatlens/.env):

```env
# Set to 'false' to use the real FastAPI backend
VITE_USE_MOCKS=false

# Point to your running FastAPI instance
VITE_SENTRA_API_BASE_URL=http://localhost:8000/api/v1
```

*(Set `VITE_USE_MOCKS=true` anytime you want to run offline without starting Python.)*

---

### 3. Run with Docker Compose (One-Click)

Run both the frontend and backend with a single command:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API & Docs: `http://localhost:8000/docs`

---

## 🛡️ Architecture & How It Works

```
┌────────────────────────────────────────────────────────┐
│               Sentra React Frontend                    │
│   (Dashboard, Asset Inventory, Graph, CVEs, Reports)   │
└──────────────────────────┬─────────────────────────────┘
                           │ (HTTP REST / JSON)
                           ▼
┌────────────────────────────────────────────────────────┐
│             FastAPI Backend (/api/v1)                  │
│       CORS, Pydantic Models, Swagger OpenAPI           │
└───────┬──────────────────┬──────────────────┬──────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────┐
│ Recon Engine │   │ Threat Intel │   │ Evidence Reports │
│ crt.sh (CT)  │   │  NVD CVEs    │   │  SHA-256 Seals   │
│ DNS Resolver │   │  CISA KEV    │   │  STIX 2.1 Bundle │
│ Port Prober  │   │  EPSS Prob   │   │  CERT-In Export  │
└──────────────┘   └──────────────┘   └──────────────────┘
```

1. **Reconnaissance Pipeline (`/api/v1/scan`)**:
   - `crt.sh`: Passive Certificate Transparency log queries to discover all registered subdomains without alerting the target.
   - `DNS & Shodan`: Resolves A records, hostnames, and checks open TCP ports (80, 443, 22, 8080, etc.).
   - `VirusTotal & HIBP`: Cross-references IP/domain reputation tags and credential leak exposure dumps.
   - Newly discovered assets are automatically ingested into the asset inventory and reflected in the risk graph.

2. **Vulnerability Correlation (`/api/v1/cves`)**:
   - Correlates detected service versions (Ivanti, OpenSSL, Apache, Kubernetes, Envoy) with NVD CVEs.
   - Flags active exploits with **CISA KEV** badges and computes real-world **EPSS exploitation probability**.

3. **Evidence-Backed Incident Reporting & CERT-In Compliance (`/api/v1/reports`)**:
   - Compiles incident timeline, affected assets, and evidence attachments.
   - Generates a canonical **SHA-256 cryptographic seal** for legal chain-of-custody.
   - Exports machine-readable **OASIS STIX 2.1** JSON bundles ready for submission to national CERTs / law enforcement.

4. **Security Operations Authentication (`/api/v1/settings/api-keys`)**:
   - Generates programmatic REST API tokens prefixed with `sn_live_...` (production) or `sn_test_...` (staging).
   - Enforces "show once" token visibility with masked storage representations.

---

## 📁 Project Directory Map

- **`src/`**: React application
  - `components/`: UI components, AppShell, Sidebar, TopBar, RiskGauge, CommandPalette (`Ctrl+K`)
  - `pages/`: Dashboard, AssetInventory, AssetDetail, AssetGraph, CVEFeed, BreachMonitor, Alerts, NewScan, Reports, Settings, Login
  - `types/`: Strict TypeScript interfaces for all security entities
  - `lib/api.ts`: Typed `sentraApi` client supporting both live REST and mock fallback
- **`backend/`**: FastAPI application
  - `app/main.py`: Application factory and route registration
  - `app/routers/`: Individual API controllers
  - `app/models/`: Pydantic schemas mirroring TypeScript models
  - `app/services/`: Recon pipeline, STIX 2.1 bundle builder, and SHA-256 seal generator
  - `app/data/`: Thread-safe persistence repository with rich pre-seeded threat datasets
- **`Dockerfile` & `docker-compose.yml`**: Containerized deployment configurations

---

## 🧪 Testing the API Manually

You can test any backend endpoint in PowerShell, curl, or directly via Swagger UI:

```powershell
# Check backend health
curl http://localhost:8000/health

# Get prioritized risk metrics
curl http://localhost:8000/api/v1/dashboard/metrics

# List critical assets
curl "http://localhost:8000/api/v1/assets?severity=critical"

# Export report in STIX 2.1 format for CERT-In
curl http://localhost:8000/api/v1/reports/rep-01/export/stix
```
