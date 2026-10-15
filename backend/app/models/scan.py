from typing import Optional, Literal, Dict
from pydantic import BaseModel

ScanSourceStatus = Literal["pending", "running", "done", "failed"]

class ScanSourceState(BaseModel):
    status: ScanSourceStatus = "pending"
    count: Optional[int] = 0
    message: Optional[str] = None
    durationMs: Optional[int] = 0

class ScanSources(BaseModel):
    crtsh: ScanSourceState = ScanSourceState(status="pending", message="Queued")
    shodan: ScanSourceState = ScanSourceState(status="pending", message="Queued")
    virustotal: ScanSourceState = ScanSourceState(status="pending", message="Queued")
    hibp: ScanSourceState = ScanSourceState(status="pending", message="Queued")
    nvd: ScanSourceState = ScanSourceState(status="pending", message="Queued")

class ScanSummary(BaseModel):
    discoveredSubdomains: int = 0
    discoveredIPs: int = 0
    openPorts: int = 0
    criticalCVEs: int = 0

class ScanJob(BaseModel):
    id: str
    domain: str
    scanType: Literal["passive", "deep"]
    status: Literal["idle", "queued", "running", "completed", "failed"] = "running"
    createdAt: str
    completedAt: Optional[str] = None
    verified: bool = False
    verificationToken: Optional[str] = None
    verificationRecord: Optional[Dict[str, str]] = None
    sources: ScanSources
    summary: Optional[ScanSummary] = ScanSummary()

class StartScanRequest(BaseModel):
    domain: str
    scanType: Literal["passive", "deep"] = "passive"

class VerifyDomainRequest(BaseModel):
    domain: str

class DomainVerificationInfo(BaseModel):
    domain: str
    recordType: Literal["TXT"] = "TXT"
    name: str
    value: str
    verified: bool = False

class DomainOverview(BaseModel):
    domain: str
    verified: bool
    lastScanned: str
    assetCount: int
    criticalCount: int
    riskScore: int
