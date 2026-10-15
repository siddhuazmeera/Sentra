from typing import List, Optional, Literal
from pydantic import BaseModel

class AuditLogEntry(BaseModel):
    action: str
    user: str
    timestamp: str
    hash: Optional[str] = None

class EvidenceAttachment(BaseModel):
    id: str
    name: str
    size: str
    timestamp: str
    sha256: str

class Report(BaseModel):
    id: str
    title: str
    type: Literal["executive", "technical", "cert-in"]
    status: Literal["draft", "exported", "submitted"] = "exported"
    generatedAt: str
    targetDomain: str
    findingsCount: int
    fileFormat: Literal["pdf", "stix"]
    incidentDescription: Optional[str] = None
    evidenceAttachments: Optional[List[EvidenceAttachment]] = []
    selectedAssetIds: Optional[List[str]] = []
    selectedFindingIds: Optional[List[str]] = []
    sha256Hash: str
    auditLog: List[AuditLogEntry] = []

class CreateReportRequest(BaseModel):
    title: str
    type: Literal["executive", "technical", "cert-in"]
    targetDomain: str
    incidentDescription: str = ""
    selectedAssetIds: List[str] = []
    selectedFindingIds: List[str] = []
    evidenceAttachments: List[EvidenceAttachment] = []
    fileFormat: Literal["pdf", "stix"] = "pdf"
