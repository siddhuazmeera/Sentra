from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import (
    dashboard,
    domains,
    assets,
    cves,
    alerts,
    breaches,
    scan,
    reports,
    settings as settings_router,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    # Sentra Threat Intelligence & Attack Surface API
    *See your risk before attackers do.*

    Comprehensive cybersecurity intelligence API providing:
    - Attack surface asset discovery (DNS, crt.sh, Shodan)
    - Prioritized risk scoring & CISA KEV vulnerability correlation
    - Breach monitoring and credential exposure tracking
    - Evidence-backed reporting with cryptographic SHA-256 seals & STIX 2.1 export
    """,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all feature routers under /api/v1
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(domains.router, prefix=settings.API_V1_PREFIX)
app.include_router(assets.router, prefix=settings.API_V1_PREFIX)
app.include_router(cves.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)
app.include_router(breaches.router, prefix=settings.API_V1_PREFIX)
app.include_router(scan.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router.router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Health & Info"])
def root():
    return {
        "name": "Sentra Cybersecurity API",
        "tagline": "See your risk before attackers do",
        "version": settings.VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "online",
        "apiPrefix": settings.API_V1_PREFIX,
    }

@app.get("/health", tags=["Health & Info"])
def health_check():
    return {"status": "healthy", "service": "sentra-api"}
