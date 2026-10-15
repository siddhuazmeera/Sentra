from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from .common import Severity, AssetType

class ServiceDetail(BaseModel):
    port: int
    name: str
    protocol: Literal["tcp", "udp"] = "tcp"
    version: Optional[str] = None
    product: Optional[str] = None
    banner: Optional[str] = None

class DnsRecord(BaseModel):
    type: str
    name: str
    value: str
    ttl: Optional[int] = 300

class GeoLocation(BaseModel):
    country: str
    countryCode: str
    city: str
    asn: str
    isp: str

class ReputationData(BaseModel):
    maliciousScore: int = 0
    virustotalDetections: int = 0
    virustotalTotalEngines: int = 92
    abuseIpConfidence: int = 0
    threatTags: List[str] = []
    blacklisted: bool = False

class AssetHistoryEvent(BaseModel):
    timestamp: str
    event: str
    type: Literal["port", "vuln", "dns", "reputation"]
    severity: Optional[Severity] = None

class Asset(BaseModel):
    id: str
    domain: str
    asset: str
    type: AssetType
    ip: str
    ports: List[int] = []
    services: List[ServiceDetail] = []
    technologies: List[str] = []
    riskScore: int = Field(ge=0, le=100)
    severity: Severity
    lastSeen: str
    status: Literal["active", "unreachable", "investigating"] = "active"
    cveCount: int = 0
    dnsRecords: Optional[List[DnsRecord]] = None
    location: Optional[GeoLocation] = None
    reputation: Optional[ReputationData] = None
    history: Optional[List[AssetHistoryEvent]] = None

class AssetListResponse(BaseModel):
    assets: List[Asset]
    total: int
