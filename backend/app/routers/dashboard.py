from typing import Optional
from fastapi import APIRouter, Query
from ..models import DashboardMetrics
from ..data.repository import repository

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(domain: Optional[str] = Query(None, description="Optional domain filter")):
    """
    Returns prioritized security risk posture metrics:
    - Overall risk score (0-100 gauge)
    - 30-day risk trend line
    - Findings distribution by severity
    - Plain-language top 5 prioritized fixes
    - Live feed of critical & high alerts
    """
    return repository.get_dashboard_metrics(domain=domain)
