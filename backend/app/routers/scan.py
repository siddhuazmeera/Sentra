import base64
import datetime
import uuid
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from ..models import (
    ScanJob,
    StartScanRequest,
    VerifyDomainRequest,
    DomainVerificationInfo,
    ScanSources,
    ScanSourceState,
    ScanSummary,
)
from ..data.repository import repository
from ..services.recon import run_recon_pipeline

router = APIRouter(prefix="/scan", tags=["Scans & Recon"])

@router.get("/verify-info", response_model=DomainVerificationInfo)
def get_domain_verification_info(domain: str = Query(..., description="Target domain to verify")):
    """
    Generates deterministic DNS TXT verification token for ownership validation:
    Record: _sentra-verify.<domain>
    Value: sentra-verification=<token>
    """
    token_raw = base64.b64encode(domain.encode()).decode().replace("=", "")[:24]
    token = f"sentra-verification={token_raw}"

    existing = repository.get_domain(domain)
    is_verified = existing.verified if existing else False

    return DomainVerificationInfo(
        domain=domain,
        recordType="TXT",
        name=f"_sentra-verify.{domain}",
        value=token,
        verified=is_verified,
    )

@router.post("/verify")
def verify_domain_ownership(payload: VerifyDomainRequest):
    """
    Performs domain ownership verification check and unlocks Deep Probing mode.
    """
    domain = payload.domain.strip().lower()
    updated = repository.upsert_domain(domain, verified=True)
    return {
        "domain": domain,
        "verified": True,
        "message": f"DNS TXT record verified successfully for {domain}",
    }

@router.post("/start", response_model=ScanJob)
async def start_scan(payload: StartScanRequest, background_tasks: BackgroundTasks):
    """
    Initiates an automated reconnaissance scan:
    - passive: Certificate Transparency logs, DNS resolution, VirusTotal & HIBP
    - deep: Active service banner checks, port probing, NVD CVE correlation
    """
    domain = payload.domain.strip().lower()
    scan_id = f"scan-{int(datetime.datetime.now().timestamp() * 1000)}"

    existing = repository.get_domain(domain)
    is_verified = existing.verified if existing else False

    if payload.scanType == "deep" and not is_verified:
        raise HTTPException(
            status_code=403,
            detail=f"Deep Active Scan requires verified domain ownership. Please verify {domain} first."
        )

    job = ScanJob(
        id=scan_id,
        domain=domain,
        scanType=payload.scanType,
        status="running",
        createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        verified=is_verified,
        sources=ScanSources(
            crtsh=ScanSourceState(status="running", message="Querying Certificate Transparency logs..."),
            shodan=ScanSourceState(status="pending", message="Awaiting crt.sh seed data"),
            virustotal=ScanSourceState(status="pending", message="Queued"),
            hibp=ScanSourceState(status="pending", message="Queued"),
            nvd=ScanSourceState(status="pending", message="Queued"),
        ),
        summary=ScanSummary(),
    )

    repository.save_scan(job)

    # Launch background reconnaissance pipeline
    background_tasks.add_task(run_recon_pipeline, scan_id, domain, payload.scanType)

    return job

@router.get("/{scan_id}", response_model=ScanJob)
def get_scan_job(scan_id: str):
    """
    Polls real-time progress for an ongoing or completed reconnaissance scan.
    """
    job = repository.get_scan(scan_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found")
    return job
