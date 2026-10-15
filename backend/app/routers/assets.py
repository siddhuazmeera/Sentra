from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from ..models import Asset, AssetListResponse
from ..data.repository import repository

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=AssetListResponse)
def get_assets(
    domain: Optional[str] = Query(None, description="Domain filter"),
    search: Optional[str] = Query(None, description="Search term for asset, IP, tech or service"),
    severity: Optional[str] = Query(None, description="Severity filter (critical, high, medium, low, info)"),
    port: Optional[int] = Query(None, description="Open port filter"),
    technology: Optional[str] = Query(None, description="Technology stack filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    sortBy: str = Query("riskScore", description="Sort field (riskScore, asset, lastSeen, ports)"),
    sortOrder: str = Query("desc", description="Sort direction (asc, desc)"),
):
    """
    Returns paginated assets matching search, severity, port, and technology filters.
    """
    assets, total = repository.get_assets(
        domain=domain,
        search=search,
        severity=severity,
        port=port,
        technology=technology,
        page=page,
        limit=limit,
        sort_by=sortBy,
        sort_order=sortOrder,
    )
    return AssetListResponse(assets=assets, total=total)

@router.get("/{asset_id}", response_model=Asset)
def get_asset_by_id(asset_id: str):
    """
    Returns full details for a single asset:
    - Open ports & services (versions, products, banners)
    - Correlated CVE vulnerabilities & CISA KEV status
    - IP & domain threat reputation telemetry (VirusTotal, AbuseIPDB)
    - Event history timeline
    """
    asset = repository.get_asset_by_id(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
    return asset
