from typing import Optional, Literal
from pydantic import BaseModel
from .common import Severity

class Alert(BaseModel):
    id: str
    title: str
    message: str
    severity: Severity
    status: Literal["new", "acknowledged", "resolved"] = "new"
    timestamp: str
    category: Literal["exposure", "cve", "reputation", "certificate", "breach"]
    targetAsset: Optional[str] = None

class AlertStatusUpdate(BaseModel):
    status: Literal["new", "acknowledged", "resolved"]
