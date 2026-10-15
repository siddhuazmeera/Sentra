from typing import List
from fastapi import APIRouter, HTTPException
from ..models import Alert, AlertStatusUpdate
from ..data.repository import repository

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[Alert])
def get_alerts():
    """
    Returns prioritized live alert feed categorized by exposure, cve,
    reputation, certificate, and breach incidents.
    """
    return repository.get_alerts()

@router.patch("/{alert_id}/status", response_model=Alert)
def update_alert_status(alert_id: str, payload: AlertStatusUpdate):
    """
    Updates triage workflow status (new -> acknowledged -> resolved).
    """
    alert = repository.update_alert_status(alert_id, payload.status)
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    return alert
