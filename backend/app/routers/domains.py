from typing import List
from fastapi import APIRouter
from ..models import DomainOverview
from ..data.repository import repository

router = APIRouter(prefix="/domains", tags=["Domains"])

@router.get("", response_model=List[DomainOverview])
def get_domains():
    """
    Returns all registered enterprise domains with their verification status,
    discovered asset counts, critical risk ratings, and last scan timestamps.
    """
    return repository.get_domains()
