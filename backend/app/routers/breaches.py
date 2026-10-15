from typing import List
from fastapi import APIRouter, HTTPException
from ..models import BreachRecord, BreachStatusUpdate
from ..data.repository import repository

router = APIRouter(prefix="/breaches", tags=["Breach Monitor"])

@router.get("", response_model=List[BreachRecord])
def get_breaches():
    """
    Returns breach exposure records for monitored corporate domains and emails.
    Passwords and sensitive raw hashes are never exposed.
    """
    return repository.get_breaches()

@router.patch("/{breach_id}/status", response_model=BreachRecord)
def update_breach_status(breach_id: str, payload: BreachStatusUpdate):
    """
    Updates remediation status for a breach record (active -> resolved).
    """
    breach = repository.update_breach_status(breach_id, payload.status)
    if not breach:
        raise HTTPException(status_code=404, detail=f"Breach record '{breach_id}' not found")
    return breach
