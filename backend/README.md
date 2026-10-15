# Sentra Threat Intelligence Backend

FastAPI-powered cybersecurity threat intelligence and attack-surface monitoring backend for **Sentra** (*"See your risk before attackers do"*).

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Backend API Server
```bash
python run.py
```
Or directly with Uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 🔌 Connecting with the Frontend

In the root `.env` or `.env.local` file:
```env
VITE_USE_MOCKS=false
VITE_SENTRA_API_BASE_URL=http://localhost:8000/api/v1
```

Now start the frontend:
```bash
npm run dev
```
The React frontend at `http://localhost:3000` will now talk directly to the real FastAPI backend on port 8000.

---

## 🛡️ API Endpoints Reference

All endpoints are prefixed with `/api/v1`:

### Dashboard & Metrics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard/metrics?domain={domain}` | Returns risk posture score (0-100 gauge), 30-day risk trend, findings by severity, top 5 fixes, and recent alerts. |

### Domains
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/domains` | Returns monitored enterprise domains with verification status and asset metrics. |

### Asset Inventory & Details
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/assets` | Search, filter (severity, port, technology), sort, and paginate assets. |
| `GET` | `/assets/{id}` | Complete asset profile: open ports, service banners, CVE correlations, CISA KEV status, IP reputation, and audit timeline. |

### Vulnerability / CVE Feed
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cves` | Correlated CVE feed with CVSS, EPSS exploit probability, and CISA KEV flag. |
| `GET` | `/cves/{id}` | Single CVE detail with CVSS vector, references, and affected inventory assets. |

### Alerts Triage
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/alerts` | Live alert feed (exposure, cve, reputation, certificate, breach). |
| `PATCH` | `/alerts/{id}/status` | Updates alert state (`new`, `acknowledged`, `resolved`). |

### Breach Monitoring
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/breaches` | Monitored domain/email exposures from aggregated infostealer and data dumps. |
| `PATCH` | `/breaches/{id}/status` | Updates remediation status (`active`, `resolved`). |

### Reconnaissance & Scans
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/scan/verify-info?domain={d}` | Generates DNS TXT record (`_sentra-verify.<domain>`). |
| `POST` | `/scan/verify` | Validates domain ownership to unlock Deep Scan probing. |
| `POST` | `/scan/start` | Initiates multi-stage recon pipeline (`passive` or `deep`). |
| `GET` | `/scan/{id}` | Live progress of 5 threat-intel sources (`crt.sh`, `Shodan`, `VirusTotal`, `HIBP`, `NVD`). |

### Evidence-Backed Reports & CERT-In Filing
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports` | Lists generated reports with SHA-256 seals and chain-of-custody logs. |
| `GET` | `/reports/{id}` | Single report details. |
| `POST` | `/reports` | Generates Executive, Technical, or CERT-In statutory filing report with cryptographic digest. |
| `GET` | `/reports/{id}/export/stix` | Exports standard **OASIS STIX 2.1** JSON bundle for cybercrime/CERT-In submission. |
| `GET` | `/reports/{id}/export/pdf` | Formatted printable plaintext/markdown dossier with checksums. |

### Settings & Platform Administration
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/settings/api-keys` | Lists programmatic access keys (masked with `sn_live_...`). |
| `POST` | `/settings/api-keys` | Generates a new API key with Sentra `sn_live_` prefix (full key returned once). |
| `DELETE` | `/settings/api-keys/{id}` | Revokes an API key. |
| `GET` | `/settings/data-sources` | External threat intelligence credentials (Shodan, VT, Censys, HIBP, AlienVault). |
| `PUT` | `/settings/data-sources/{id}` | Saves external API key. |
| `GET` | `/settings/team` | Team roster with roles (Admin, Analyst, Viewer) and 2FA status. |
| `POST` | `/settings/team/invite` | Invites a new team member. |
| `GET` | `/settings/notifications` | Notification channel configurations (Email, Slack, Telegram, WhatsApp). |
| `PATCH` | `/settings/notifications/{ch}` | Updates notification channel destination and category filters. |

---

## 🔒 Security & Architecture Features
- **Cryptographic Chain of Custody**: Every report computes a canonical SHA-256 digest over incident descriptions, affected assets, and evidence artifacts for legal and law-enforcement compliance.
- **STIX 2.1 Standard Compliance**: Directly exports structured cyber threat intelligence (CTI) compatible with CERT-In and international incident reporting frameworks.
- **BYOK Data Sources**: Safely stores and manages external API keys for Shodan, VirusTotal, and Censys.
- **Non-destructive In-Memory & File Persistence**: Persists state changes to `backend/app/data/storage.json` across restarts while maintaining high performance.
