export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export type AssetType = 'domain' | 'subdomain' | 'ip' | 'service' | 'endpoint'

export interface ServiceDetail {
  port: number
  name: string
  protocol: 'tcp' | 'udp'
  version?: string
  product?: string
  banner?: string
}

export interface DnsRecord {
  type: string
  name: string
  value: string
  ttl?: number
}

export interface GeoLocation {
  country: string
  countryCode: string
  city: string
  asn: string
  isp: string
}

export interface ReputationData {
  maliciousScore: number // 0-100
  virustotalDetections: number
  virustotalTotalEngines: number
  abuseIpConfidence: number
  threatTags: string[]
  blacklisted: boolean
}

export interface AssetHistoryEvent {
  timestamp: string
  event: string
  type: 'port' | 'vuln' | 'dns' | 'reputation'
  severity?: Severity
}

export interface Asset {
  id: string
  domain: string
  asset: string // hostname or IP
  type: AssetType
  ip: string
  ports: number[]
  services: ServiceDetail[]
  technologies: string[]
  riskScore: number // 0-100
  severity: Severity
  lastSeen: string
  status: 'active' | 'unreachable' | 'investigating'
  cveCount: number
  dnsRecords?: DnsRecord[]
  location?: GeoLocation
  reputation?: ReputationData
  history?: AssetHistoryEvent[]
}

export interface Finding {
  id: string
  title: string
  description: string
  actionSteps: string[]
  severity: Severity
  assetId: string
  assetName: string
  cveId?: string
  status: 'open' | 'mitigating' | 'resolved'
  discoveredAt: string
  cvssScore?: number
}

export interface CVE {
  id: string // e.g. CVE-2024-3094
  title: string
  description: string
  cvss: number
  severity: Severity
  epss: number // e.g. 0.942 (94.2%)
  cisaKev: boolean
  affectedProduct: string
  affectedVendor: string
  affectedVersion: string
  fixRecommendation: string
  publishedDate: string
  affectedAssetsCount: number
  affectedAssetIds: string[]
  cvssVector?: string
  references?: string[]
}

export interface Alert {
  id: string
  title: string
  message: string
  severity: Severity
  status: 'new' | 'acknowledged' | 'resolved'
  timestamp: string
  category: 'exposure' | 'cve' | 'reputation' | 'certificate' | 'breach'
  targetAsset?: string
}

export interface BreachRecord {
  id: string
  domainOrEmail: string
  breachName: string
  breachDate: string
  dataExposed: string[]
  recommendedActions: string[]
  status: 'active' | 'resolved'
  pwnCount?: number
}

export type ScanSourceStatus = 'pending' | 'running' | 'done' | 'failed'

export interface ScanSourceState {
  status: ScanSourceStatus
  count?: number
  message?: string
  durationMs?: number
}

export interface ScanJob {
  id: string
  domain: string
  scanType: 'passive' | 'deep'
  status: 'idle' | 'queued' | 'running' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  verified: boolean
  verificationToken?: string
  verificationRecord?: {
    recordType: 'TXT'
    name: string
    value: string
  }
  sources: {
    crtsh: ScanSourceState
    shodan: ScanSourceState
    virustotal: ScanSourceState
    hibp: ScanSourceState
    nvd: ScanSourceState
  }
  summary?: {
    discoveredSubdomains: number
    discoveredIPs: number
    openPorts: number
    criticalCVEs: number
  }
}

export interface DashboardMetrics {
  totalAssets: number
  criticalFindings: number
  matchingCves: number
  breachedAccounts: number
  overallRiskScore: number
  riskScoreTrend: Array<{ date: string; score: number; label?: string }>
  findingsBySeverity: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  topFixes: Finding[]
  recentAlerts: Alert[]
}

export interface AuditLogEntry {
  action: string
  user: string
  timestamp: string
  hash?: string
}

export interface EvidenceAttachment {
  id: string
  name: string
  size: string
  timestamp: string
  sha256: string
}

export interface Report {
  id: string
  title: string
  type: 'executive' | 'technical' | 'cert-in'
  status: 'draft' | 'exported' | 'submitted'
  generatedAt: string
  targetDomain: string
  findingsCount: number
  fileFormat: 'pdf' | 'stix'
  incidentDescription?: string
  evidenceAttachments?: EvidenceAttachment[]
  selectedAssetIds?: string[]
  selectedFindingIds?: string[]
  sha256Hash: string
  auditLog: AuditLogEntry[]
}

export interface DomainOverview {
  domain: string
  verified: boolean
  lastScanned: string
  assetCount: number
  criticalCount: number
  riskScore: number
}

export interface ApiKey {
  id: string
  name: string
  keyMasked: string
  prefix: string
  fullKey?: string // Only shown once right after generation
  role: 'Admin' | 'Analyst' | 'Viewer'
  createdAt: string
  lastUsed: string
  scopes: string[]
}

export interface DataSourceConfig {
  id: string
  name: string
  service: 'shodan' | 'virustotal' | 'censys' | 'hibp' | 'alienvault'
  apiKey: string
  connected: boolean
  status: 'active' | 'rate_limited' | 'error' | 'unconfigured'
  lastChecked?: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Analyst' | 'Viewer'
  status: 'active' | 'pending'
  twoFactorEnabled: boolean
  lastActive: string
}

export interface NotificationChannel {
  channel: 'email' | 'telegram' | 'slack' | 'whatsapp'
  enabled: boolean
  destination: string
  categories: Array<'cve' | 'exposure' | 'breach' | 'certificate'>
}
