from typing import List, Optional, Literal
from pydantic import BaseModel
from .common import Severity
from .alert import Alert

class Finding(BaseModel):
    id: str
    title: str
    description: str
    actionSteps: List[str]
    severity: Severity
    assetId: str
    assetName: str
    cveId: Optional[str] = None
    status: Literal["open", "mitigating", "resolved"] = "open"
    discoveredAt: str
    cvssScore: Optional[float] = None

class RiskTrendPoint(BaseModel):
    date: str
    score: int
    label: Optional[str] = None

class FindingsBySeverity(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0

class DashboardMetrics(BaseModel):
    totalAssets: int
    criticalFindings: int
    matchingCves: int
    breachedAccounts: int
    overallRiskScore: int
    riskScoreTrend: List[RiskTrendPoint]
    findingsBySeverity: FindingsBySeverity
    topFixes: List[Finding]
    recentAlerts: List[Alert]
