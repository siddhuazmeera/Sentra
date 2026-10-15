import json
import os
import threading
from typing import List, Optional, Dict, Any
from copy import deepcopy
import datetime

from .seed_data import (
    INITIAL_DOMAINS,
    INITIAL_ASSETS,
    INITIAL_CVES,
    INITIAL_ALERTS,
    INITIAL_BREACHES,
    INITIAL_FINDINGS,
    INITIAL_API_KEYS,
    INITIAL_DATA_SOURCES,
    INITIAL_TEAM_MEMBERS,
    INITIAL_NOTIFICATION_CHANNELS,
    INITIAL_REPORTS,
)
from ..models import (
    Asset,
    CVE,
    Alert,
    BreachRecord,
    DomainOverview,
    Finding,
    Report,
    ApiKey,
    DataSourceConfig,
    TeamMember,
    NotificationChannel,
    ScanJob,
    DashboardMetrics,
    FindingsBySeverity,
    RiskTrendPoint,
    Severity,
)

STORAGE_FILE = os.path.join(os.path.dirname(__file__), "storage.json")

class Repository:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(Repository, cls).__new__(cls)
                    cls._instance._init_data()
        return cls._instance

    def _init_data(self):
        self.lock = threading.RLock()
        self.domains: List[DomainOverview] = [DomainOverview(**d) for d in INITIAL_DOMAINS]
        self.assets: List[Asset] = [Asset(**a) for a in INITIAL_ASSETS]
        self.cves: List[CVE] = [CVE(**c) for c in INITIAL_CVES]
        self.alerts: List[Alert] = [Alert(**al) for al in INITIAL_ALERTS]
        self.breaches: List[BreachRecord] = [BreachRecord(**b) for b in INITIAL_BREACHES]
        self.findings: List[Finding] = [Finding(**f) for f in INITIAL_FINDINGS]
        self.api_keys: List[ApiKey] = [ApiKey(**k) for k in INITIAL_API_KEYS]
        self.data_sources: List[DataSourceConfig] = [DataSourceConfig(**ds) for ds in INITIAL_DATA_SOURCES]
        self.team_members: List[TeamMember] = [TeamMember(**m) for m in INITIAL_TEAM_MEMBERS]
        self.notification_channels: List[NotificationChannel] = [NotificationChannel(**nc) for nc in INITIAL_NOTIFICATION_CHANNELS]
        self.reports: List[Report] = [Report(**r) for r in INITIAL_REPORTS]
        self.scans: Dict[str, ScanJob] = {}

        # Load persisted modifications if available
        self._load_from_disk()

    def _save_to_disk(self):
        try:
            data = {
                "domains": [d.model_dump() for d in self.domains],
                "assets": [a.model_dump() for a in self.assets],
                "cves": [c.model_dump() for c in self.cves],
                "alerts": [al.model_dump() for al in self.alerts],
                "breaches": [b.model_dump() for b in self.breaches],
                "findings": [f.model_dump() for f in self.findings],
                "api_keys": [k.model_dump() for k in self.api_keys],
                "data_sources": [ds.model_dump() for ds in self.data_sources],
                "team_members": [m.model_dump() for m in self.team_members],
                "notification_channels": [nc.model_dump() for nc in self.notification_channels],
                "reports": [r.model_dump() for r in self.reports],
            }
            with open(STORAGE_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

    def _load_from_disk(self):
        if not os.path.exists(STORAGE_FILE):
            return
        try:
            with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if "domains" in data:
                self.domains = [DomainOverview(**d) for d in data["domains"]]
            if "assets" in data:
                self.assets = [Asset(**a) for a in data["assets"]]
            if "cves" in data:
                self.cves = [CVE(**c) for c in data["cves"]]
            if "alerts" in data:
                self.alerts = [Alert(**al) for al in data["alerts"]]
            if "breaches" in data:
                self.breaches = [BreachRecord(**b) for b in data["breaches"]]
            if "findings" in data:
                self.findings = [Finding(**f) for f in data["findings"]]
            if "api_keys" in data:
                self.api_keys = [ApiKey(**k) for k in data["api_keys"]]
            if "data_sources" in data:
                self.data_sources = [DataSourceConfig(**ds) for ds in data["data_sources"]]
            if "team_members" in data:
                self.team_members = [TeamMember(**m) for m in data["team_members"]]
            if "notification_channels" in data:
                self.notification_channels = [NotificationChannel(**nc) for nc in data["notification_channels"]]
            if "reports" in data:
                self.reports = [Report(**r) for r in data["reports"]]
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Domains
    # ------------------------------------------------------------------
    def get_domains(self) -> List[DomainOverview]:
        with self.lock:
            # Sync asset counts and risk scores dynamically
            for d in self.domains:
                matching_assets = [a for a in self.assets if a.domain.lower() == d.domain.lower()]
                d.assetCount = len(matching_assets)
                d.criticalCount = sum(1 for a in matching_assets if a.severity == Severity.CRITICAL)
                if matching_assets:
                    d.riskScore = max(a.riskScore for a in matching_assets)
            return deepcopy(self.domains)

    def get_domain(self, domain: str) -> Optional[DomainOverview]:
        with self.lock:
            for d in self.domains:
                if d.domain.lower() == domain.lower():
                    return deepcopy(d)
            return None

    def upsert_domain(self, domain: str, verified: bool = False) -> DomainOverview:
        with self.lock:
            for d in self.domains:
                if d.domain.lower() == domain.lower():
                    if verified:
                        d.verified = True
                    self._save_to_disk()
                    return deepcopy(d)
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            new_dom = DomainOverview(
                domain=domain,
                verified=verified,
                lastScanned=now,
                assetCount=0,
                criticalCount=0,
                riskScore=0,
            )
            self.domains.append(new_dom)
            self._save_to_disk()
            return deepcopy(new_dom)

    # ------------------------------------------------------------------
    # Assets
    # ------------------------------------------------------------------
    def get_assets(
        self,
        domain: Optional[str] = None,
        search: Optional[str] = None,
        severity: Optional[str] = None,
        port: Optional[int] = None,
        technology: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
        sort_by: str = "riskScore",
        sort_order: str = "desc",
    ) -> (List[Asset], int):
        with self.lock:
            result = list(self.assets)

            if domain and domain != "all":
                result = [a for a in result if a.domain.lower() == domain.lower()]

            if search:
                q = search.lower()
                result = [
                    a for a in result
                    if q in a.asset.lower()
                    or q in a.ip.lower()
                    or any(q in t.lower() for t in a.technologies)
                    or any(q in s.name.lower() for s in a.services)
                ]

            if severity and severity != "all":
                result = [a for a in result if a.severity.value == severity]

            if port:
                result = [a for a in result if port in a.ports]

            if technology:
                tech_q = technology.lower()
                result = [a for a in result if any(tech_q in t.lower() for t in a.technologies)]

            # Sorting
            reverse = (sort_order == "desc")
            if sort_by == "riskScore":
                result.sort(key=lambda x: x.riskScore, reverse=reverse)
            elif sort_by == "asset":
                result.sort(key=lambda x: x.asset.lower(), reverse=reverse)
            elif sort_by == "lastSeen":
                result.sort(key=lambda x: x.lastSeen, reverse=reverse)
            elif sort_by == "ports":
                result.sort(key=lambda x: len(x.ports), reverse=reverse)
            else:
                result.sort(key=lambda x: x.riskScore, reverse=reverse)

            total = len(result)
            start = (page - 1) * limit
            paginated = result[start : start + limit]
            return [deepcopy(a) for a in paginated], total

    def get_asset_by_id(self, asset_id: str) -> Optional[Asset]:
        with self.lock:
            for a in self.assets:
                if a.id == asset_id or a.asset.lower() == asset_id.lower():
                    return deepcopy(a)
            return None

    def add_asset(self, asset: Asset) -> Asset:
        with self.lock:
            # Check if exists
            for idx, a in enumerate(self.assets):
                if a.id == asset.id or (a.domain == asset.domain and a.asset == asset.asset):
                    self.assets[idx] = asset
                    self._save_to_disk()
                    return deepcopy(asset)
            self.assets.append(asset)
            self._save_to_disk()
            return deepcopy(asset)

    # ------------------------------------------------------------------
    # CVEs
    # ------------------------------------------------------------------
    def get_cves(
        self,
        search: Optional[str] = None,
        severity: Optional[str] = None,
        vendor: Optional[str] = None,
        product: Optional[str] = None,
        kev_only: bool = False,
        my_assets_only: bool = False,
    ) -> List[CVE]:
        with self.lock:
            result = list(self.cves)

            if search:
                q = search.lower()
                result = [
                    c for c in result
                    if q in c.id.lower()
                    or q in c.title.lower()
                    or q in c.affectedProduct.lower()
                    or q in c.affectedVendor.lower()
                ]

            if severity and severity != "all":
                result = [c for c in result if c.severity.value == severity]

            if vendor:
                vq = vendor.lower()
                result = [c for c in result if vq in c.affectedVendor.lower()]

            if product:
                pq = product.lower()
                result = [c for c in result if pq in c.affectedProduct.lower()]

            if kev_only:
                result = [c for c in result if c.cisaKev]

            if my_assets_only:
                result = [c for c in result if c.affectedAssetsCount > 0]

            return [deepcopy(c) for c in result]

    def get_cve_by_id(self, cve_id: str) -> Optional[CVE]:
        with self.lock:
            for c in self.cves:
                if c.id.lower() == cve_id.lower():
                    return deepcopy(c)
            return None

    # ------------------------------------------------------------------
    # Alerts
    # ------------------------------------------------------------------
    def get_alerts(self) -> List[Alert]:
        with self.lock:
            return [deepcopy(a) for a in self.alerts]

    def update_alert_status(self, alert_id: str, status: str) -> Optional[Alert]:
        with self.lock:
            for a in self.alerts:
                if a.id == alert_id:
                    a.status = status
                    self._save_to_disk()
                    return deepcopy(a)
            return None

    # ------------------------------------------------------------------
    # Breaches
    # ------------------------------------------------------------------
    def get_breaches(self) -> List[BreachRecord]:
        with self.lock:
            return [deepcopy(b) for b in self.breaches]

    def update_breach_status(self, breach_id: str, status: str) -> Optional[BreachRecord]:
        with self.lock:
            for b in self.breaches:
                if b.id == breach_id:
                    b.status = status
                    self._save_to_disk()
                    return deepcopy(b)
            return None

    # ------------------------------------------------------------------
    # Reports
    # ------------------------------------------------------------------
    def get_reports(self) -> List[Report]:
        with self.lock:
            return [deepcopy(r) for r in self.reports]

    def get_report_by_id(self, report_id: str) -> Optional[Report]:
        with self.lock:
            for r in self.reports:
                if r.id == report_id:
                    return deepcopy(r)
            return None

    def add_report(self, report: Report) -> Report:
        with self.lock:
            self.reports.insert(0, report)
            self._save_to_disk()
            return deepcopy(report)

    # ------------------------------------------------------------------
    # Scans
    # ------------------------------------------------------------------
    def get_scan(self, scan_id: str) -> Optional[ScanJob]:
        with self.lock:
            job = self.scans.get(scan_id)
            return deepcopy(job) if job else None

    def save_scan(self, job: ScanJob):
        with self.lock:
            self.scans[job.id] = job

    # ------------------------------------------------------------------
    # Settings: API Keys
    # ------------------------------------------------------------------
    def get_api_keys(self) -> List[ApiKey]:
        with self.lock:
            return [deepcopy(k) for k in self.api_keys]

    def add_api_key(self, api_key: ApiKey) -> ApiKey:
        with self.lock:
            self.api_keys.insert(0, api_key)
            self._save_to_disk()
            return deepcopy(api_key)

    def revoke_api_key(self, key_id: str) -> bool:
        with self.lock:
            before_len = len(self.api_keys)
            self.api_keys = [k for k in self.api_keys if k.id != key_id]
            if len(self.api_keys) < before_len:
                self._save_to_disk()
                return True
            return False

    # ------------------------------------------------------------------
    # Settings: Data Sources
    # ------------------------------------------------------------------
    def get_data_sources(self) -> List[DataSourceConfig]:
        with self.lock:
            return [deepcopy(ds) for ds in self.data_sources]

    def update_data_source(self, service_id: str, api_key: str) -> Optional[DataSourceConfig]:
        with self.lock:
            for ds in self.data_sources:
                if ds.id == service_id or ds.service == service_id:
                    ds.apiKey = api_key
                    ds.connected = len(api_key) > 5
                    ds.status = "active" if ds.connected else "unconfigured"
                    ds.lastChecked = datetime.datetime.now(datetime.timezone.utc).isoformat()
                    self._save_to_disk()
                    return deepcopy(ds)
            return None

    # ------------------------------------------------------------------
    # Settings: Team Members
    # ------------------------------------------------------------------
    def get_team_members(self) -> List[TeamMember]:
        with self.lock:
            return [deepcopy(m) for m in self.team_members]

    def add_team_member(self, member: TeamMember) -> TeamMember:
        with self.lock:
            self.team_members.append(member)
            self._save_to_disk()
            return deepcopy(member)

    # ------------------------------------------------------------------
    # Settings: Notifications
    # ------------------------------------------------------------------
    def get_notification_channels(self) -> List[NotificationChannel]:
        with self.lock:
            return [deepcopy(nc) for nc in self.notification_channels]

    def update_notification_channel(self, channel_name: str, updates: Dict[str, Any]) -> Optional[NotificationChannel]:
        with self.lock:
            for nc in self.notification_channels:
                if nc.channel == channel_name:
                    if "enabled" in updates and updates["enabled"] is not None:
                        nc.enabled = updates["enabled"]
                    if "destination" in updates and updates["destination"] is not None:
                        nc.destination = updates["destination"]
                    if "categories" in updates and updates["categories"] is not None:
                        nc.categories = updates["categories"]
                    self._save_to_disk()
                    return deepcopy(nc)
            return None

    # ------------------------------------------------------------------
    # Dashboard Metrics Generator
    # ------------------------------------------------------------------
    def get_dashboard_metrics(self, domain: Optional[str] = None) -> DashboardMetrics:
        with self.lock:
            filtered_assets = self.assets
            if domain and domain != "all":
                filtered_assets = [a for a in self.assets if a.domain.lower() == domain.lower()]

            crit_count = sum(1 for a in filtered_assets if a.severity == Severity.CRITICAL)
            high_count = sum(1 for a in filtered_assets if a.severity == Severity.HIGH)
            med_count = sum(1 for a in filtered_assets if a.severity == Severity.MEDIUM)
            low_count = sum(1 for a in filtered_assets if a.severity == Severity.LOW)
            info_count = sum(1 for a in filtered_assets if a.severity == Severity.INFO)

            # Overall risk score calculation (weighted)
            if filtered_assets:
                top_asset_risk = max(a.riskScore for a in filtered_assets)
                overall_score = min(100, int(top_asset_risk * 0.85 + (crit_count * 3)))
            else:
                overall_score = 0

            # Filter findings matching selected assets
            asset_ids = {a.id for a in filtered_assets}
            top_fixes = [f for f in self.findings if f.assetId in asset_ids or f.assetName in [a.asset for a in filtered_assets]]
            if not top_fixes and self.findings:
                top_fixes = self.findings[:5]

            # Matching CVEs
            matching_cves = sum(a.cveCount for a in filtered_assets)

            # Breached accounts
            breached_accounts = sum(b.pwnCount or 1 for b in self.breaches)

            # 30-day realistic risk score trend
            trend = [
                {"date": "Day 1", "score": max(20, overall_score - 18)},
                {"date": "Day 5", "score": max(22, overall_score - 15)},
                {"date": "Day 10", "score": max(25, overall_score - 12)},
                {"date": "Day 15", "score": max(30, overall_score - 8)},
                {"date": "Day 20", "score": max(35, overall_score - 4)},
                {"date": "Day 25", "score": max(32, overall_score - 2)},
                {"date": "Today", "score": overall_score},
            ]

            # Recent alerts
            recent_alerts = self.alerts[:6]
            if domain and domain != "all":
                recent_alerts = [al for al in self.alerts if al.targetAsset and domain.lower() in al.targetAsset.lower()]
                if not recent_alerts:
                    recent_alerts = self.alerts[:4]

            return DashboardMetrics(
                totalAssets=len(filtered_assets),
                criticalFindings=crit_count,
                matchingCves=matching_cves,
                breachedAccounts=breached_accounts,
                overallRiskScore=overall_score,
                riskScoreTrend=[RiskTrendPoint(**pt) for pt in trend],
                findingsBySeverity=FindingsBySeverity(
                    critical=crit_count,
                    high=high_count,
                    medium=med_count,
                    low=low_count,
                    info=info_count,
                ),
                topFixes=top_fixes[:5],
                recentAlerts=recent_alerts,
            )

repository = Repository()
