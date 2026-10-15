from typing import List, Optional
from pydantic import BaseModel
from .common import Severity

class CVE(BaseModel):
    id: str
    title: str
    description: str
    cvss: float
    severity: Severity
    epss: float
    cisaKev: bool = False
    affectedProduct: str
    affectedVendor: str
    affectedVersion: str
    fixRecommendation: str
    publishedDate: str
    affectedAssetsCount: int = 0
    affectedAssetIds: List[str] = []
    cvssVector: Optional[str] = None
    references: Optional[List[str]] = None
