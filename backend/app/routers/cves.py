from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..models import CVE
from ..data.repository import repository

router = APIRouter(prefix="/cves", tags=["CVE Feed"])

@router.get("", response_model=List[CVE])
def get_cves(
    search: Optional[str] = Query(None, description="Search term across CVE ID, title, product, vendor"),
    severity: Optional[str] = Query(None, description="Severity filter"),
    vendor: Optional[str] = Query(None, description="Vendor filter"),
    product: Optional[str] = Query(None, description="Product filter"),
    kevOnly: bool = Query(False, description="Only show CISA KEV (Known Exploited Vulnerabilities)"),
    myAssetsOnly: bool = Query(False, description="Only show CVEs affecting assets in inventory"),
):
    """
    Returns threat intelligence feed of correlated CVEs with CVSS scores,
    EPSS exploitation probabilities, and CISA KEV active exploitation indicators.
    """
    return repository.get_cves(
        search=search,
        severity=severity,
        vendor=vendor,
        product=product,
        kev_only=kevOnly,
        my_assets_only=myAssetsOnly,
    )

@router.get("/{cve_id}", response_model=CVE)
def get_cve_by_id(cve_id: str):
    """
    Returns complete CVE detail including CVSS vector, EPSS probability,
    affected assets from inventory, and remediation guidance.
    """
    cve = repository.get_cve_by_id(cve_id)
    if not cve:
        raise HTTPException(status_code=404, detail=f"CVE '{cve_id}' not found")
    return cve
