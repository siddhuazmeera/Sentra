from typing import List, Optional, Literal
from pydantic import BaseModel

RoleType = Literal["Admin", "Analyst", "Viewer"]

class ApiKey(BaseModel):
    id: str
    name: str
    keyMasked: str
    prefix: str = "sn_live"
    fullKey: Optional[str] = None
    role: RoleType = "Analyst"
    createdAt: str
    lastUsed: str = "Never"
    scopes: List[str] = []

class CreateApiKeyRequest(BaseModel):
    name: str
    role: RoleType = "Analyst"
    scopes: List[str] = ["read:assets", "read:cves"]

class DataSourceConfig(BaseModel):
    id: str
    name: str
    service: Literal["shodan", "virustotal", "censys", "hibp", "alienvault"]
    apiKey: str = ""
    connected: bool = False
    status: Literal["active", "rate_limited", "error", "unconfigured"] = "unconfigured"
    lastChecked: Optional[str] = None

class UpdateDataSourceKeyRequest(BaseModel):
    apiKey: str

class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: RoleType
    status: Literal["active", "pending"] = "active"
    twoFactorEnabled: bool = False
    lastActive: str = "Just now"

class InviteTeamMemberRequest(BaseModel):
    name: str
    email: str
    role: RoleType = "Analyst"

class NotificationChannel(BaseModel):
    channel: Literal["email", "telegram", "slack", "whatsapp"]
    enabled: bool = True
    destination: str = ""
    categories: List[Literal["cve", "exposure", "breach", "certificate"]] = ["cve", "exposure", "breach"]

class UpdateNotificationChannelRequest(BaseModel):
    enabled: Optional[bool] = None
    destination: Optional[str] = None
    categories: Optional[List[Literal["cve", "exposure", "breach", "certificate"]]] = None
