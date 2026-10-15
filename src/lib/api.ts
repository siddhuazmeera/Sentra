import {
  Asset,
  CVE,
  Alert,
  BreachRecord,
  DashboardMetrics,
  DomainOverview,
  Finding,
  Report,
  ScanJob,
  Severity,
  ApiKey,
  DataSourceConfig,
  TeamMember,
  NotificationChannel,
} from '@/types'
import {
  mockAssets,
  mockCVEs,
  mockAlerts,
  mockBreaches,
  mockDashboardMetrics,
  mockDomains,
  mockFindings,
  mockApiKeys,
  mockDataSources,
  mockTeamMembers,
  mockNotificationChannels,
  mockReports,
} from './mock/data'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'
const SENTRA_API_BASE_URL =
  import.meta.env.VITE_SENTRA_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000/api/v1'

// In-memory state clone for mock mode to support live scan and status updates
let currentAssets = [...mockAssets]
let currentAlerts = [...mockAlerts]
let currentBreaches = [...mockBreaches]
let currentDomains = [...mockDomains]
let currentReports: Report[] = [...mockReports]
let currentApiKeys: ApiKey[] = [...mockApiKeys]
let currentDataSources: DataSourceConfig[] = [...mockDataSources]
let currentTeamMembers: TeamMember[] = [...mockTeamMembers]
let currentNotificationChannels: NotificationChannel[] = [...mockNotificationChannels]
let activeScans: Record<string, ScanJob> = {}

// Helper to simulate realistic network latency (250ms - 600ms)
const simulateLatency = async (min = 250, max = 600): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min
  await new Promise((resolve) => setTimeout(resolve, ms))
}

// ----------------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------------

export async function getDashboardMetrics(domain?: string): Promise<DashboardMetrics> {
  if (!USE_MOCKS) {
    const url = new URL(`${SENTRA_API_BASE_URL}/dashboard/metrics`)
    if (domain) url.searchParams.set('domain', domain)
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Failed to fetch dashboard metrics: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(250, 500)
  if (domain && domain !== 'all') {
    const filteredAssets = currentAssets.filter((a) => a.domain === domain)
    const criticalCount = filteredAssets.filter((a) => a.severity === 'critical').length
    const highCount = filteredAssets.filter((a) => a.severity === 'high').length
    const medCount = filteredAssets.filter((a) => a.severity === 'medium').length
    const lowCount = filteredAssets.filter((a) => a.severity === 'low').length
    const infoCount = filteredAssets.filter((a) => a.severity === 'info').length

    return {
      ...mockDashboardMetrics,
      totalAssets: filteredAssets.length,
      criticalFindings: criticalCount,
      findingsBySeverity: {
        critical: criticalCount,
        high: highCount,
        medium: medCount,
        low: lowCount,
        info: infoCount,
      },
      topFixes: mockFindings.filter((f) => filteredAssets.some((a) => a.id === f.assetId)),
      recentAlerts: currentAlerts.filter((al) => al.targetAsset?.includes(domain)),
    }
  }

  return {
    ...mockDashboardMetrics,
    totalAssets: currentAssets.length,
    recentAlerts: currentAlerts.slice(0, 6),
  }
}

// ----------------------------------------------------------------------
// Domains
// ----------------------------------------------------------------------

export async function getDomains(): Promise<DomainOverview[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/domains`)
    if (!res.ok) throw new Error(`Failed to fetch domains: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 400)
  return [...currentDomains]
}

// ----------------------------------------------------------------------
// Assets
// ----------------------------------------------------------------------

export interface AssetFilterParams {
  domain?: string
  search?: string
  severity?: Severity | 'all'
  port?: number
  technology?: string
  page?: number
  limit?: number
  sortBy?: 'riskScore' | 'asset' | 'lastSeen' | 'ports'
  sortOrder?: 'asc' | 'desc'
}

export async function getAssets(params?: AssetFilterParams): Promise<{ assets: Asset[]; total: number }> {
  if (!USE_MOCKS) {
    const url = new URL(`${SENTRA_API_BASE_URL}/assets`)
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.set(key, String(val))
        }
      })
    }
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Failed to fetch assets: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(250, 500)
  let result = [...currentAssets]

  if (params?.domain && params.domain !== 'all') {
    result = result.filter((a) => a.domain === params.domain)
  }

  if (params?.search) {
    const q = params.search.toLowerCase()
    result = result.filter(
      (a) =>
        a.asset.toLowerCase().includes(q) ||
        a.ip.toLowerCase().includes(q) ||
        a.technologies.some((t) => t.toLowerCase().includes(q)) ||
        a.services.some((s) => s.name.toLowerCase().includes(q))
    )
  }

  if (params?.severity && params.severity !== 'all') {
    result = result.filter((a) => a.severity === params.severity)
  }

  if (params?.port) {
    result = result.filter((a) => a.ports.includes(Number(params.port)))
  }

  if (params?.technology) {
    const tech = params.technology.toLowerCase()
    result = result.filter((a) => a.technologies.some((t) => t.toLowerCase().includes(tech)))
  }

  // Sorting
  const sortBy = params?.sortBy || 'riskScore'
  const sortOrder = params?.sortOrder || 'desc'
  result.sort((a, b) => {
    let comp = 0
    if (sortBy === 'riskScore') comp = a.riskScore - b.riskScore
    else if (sortBy === 'asset') comp = a.asset.localeCompare(b.asset)
    else if (sortBy === 'lastSeen') comp = new Date(a.lastSeen).getTime() - new Date(b.lastSeen).getTime()
    else if (sortBy === 'ports') comp = a.ports.length - b.ports.length
    return sortOrder === 'desc' ? -comp : comp
  })

  const total = result.length
  const page = params?.page || 1
  const limit = params?.limit || 10
  const paginated = result.slice((page - 1) * limit, page * limit)

  return { assets: paginated, total }
}

export async function getAssetById(id: string): Promise<Asset | null> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/assets/${id}`)
    if (!res.ok) return null
    return res.json()
  }

  await simulateLatency(200, 450)
  const found = currentAssets.find((a) => a.id === id || a.asset === id)
  if (!found) return null

  // Ensure rich default history timeline if none exists
  const enriched: Asset = {
    ...found,
    history: found.history || [
      {
        timestamp: '2026-10-13T22:04:00Z',
        event: 'Service scan detected open listening port 443 with Ivanti/PAN-OS signature.',
        type: 'port',
        severity: 'high',
      },
      {
        timestamp: '2026-10-13T22:05:12Z',
        event: 'CVE-2024-3400 correlated from NVD database with CISA KEV active status.',
        type: 'vuln',
        severity: 'critical',
      },
      {
        timestamp: '2026-10-13T21:40:00Z',
        event: 'VirusTotal threat intelligence check: 4 detections across 92 security engines.',
        type: 'reputation',
        severity: 'high',
      },
      {
        timestamp: '2026-10-12T14:10:00Z',
        event: 'Authoritative DNS resolution confirmed A record mapping to IP.',
        type: 'dns',
        severity: 'info',
      },
    ],
  }
  return enriched
}

// ----------------------------------------------------------------------
// CVEs
// ----------------------------------------------------------------------

export interface CVEFilterParams {
  search?: string
  severity?: Severity | 'all'
  vendor?: string
  product?: string
  kevOnly?: boolean
  myAssetsOnly?: boolean
}

export async function getCVEs(params?: CVEFilterParams): Promise<CVE[]> {
  if (!USE_MOCKS) {
    const url = new URL(`${SENTRA_API_BASE_URL}/cves`)
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val))
        }
      })
    }
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`Failed to fetch CVEs: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(250, 450)
  let result = [...mockCVEs]

  if (params?.search) {
    const q = params.search.toLowerCase()
    result = result.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.affectedProduct.toLowerCase().includes(q) ||
        c.affectedVendor.toLowerCase().includes(q)
    )
  }

  if (params?.severity && params.severity !== 'all') {
    result = result.filter((c) => c.severity === params.severity)
  }

  if (params?.kevOnly) {
    result = result.filter((c) => c.cisaKev)
  }

  if (params?.myAssetsOnly) {
    result = result.filter((c) => c.affectedAssetsCount > 0)
  }

  return result
}

export async function getCVEById(id: string): Promise<CVE | null> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/cves/${id}`)
    if (!res.ok) return null
    return res.json()
  }

  await simulateLatency(200, 400)
  const found = mockCVEs.find((c) => c.id.toLowerCase() === id.toLowerCase())
  return found ? { ...found } : null
}

// ----------------------------------------------------------------------
// Alerts
// ----------------------------------------------------------------------

export async function getAlerts(): Promise<Alert[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/alerts`)
    if (!res.ok) throw new Error(`Failed to fetch alerts: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 400)
  return [...currentAlerts]
}

export async function updateAlertStatus(id: string, status: 'new' | 'acknowledged' | 'resolved'): Promise<Alert> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/alerts/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error(`Failed to update alert: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 400)
  const idx = currentAlerts.findIndex((a) => a.id === id)
  if (idx !== -1) {
    currentAlerts[idx] = { ...currentAlerts[idx], status }
    return currentAlerts[idx]
  }
  throw new Error(`Alert with id ${id} not found`)
}

// ----------------------------------------------------------------------
// Breach Monitoring
// ----------------------------------------------------------------------

export async function getBreaches(): Promise<BreachRecord[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/breaches`)
    if (!res.ok) throw new Error(`Failed to fetch breaches: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(250, 450)
  return [...currentBreaches]
}

export async function updateBreachStatus(id: string, status: 'active' | 'resolved'): Promise<BreachRecord> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/breaches/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) throw new Error(`Failed to update breach: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 400)
  const idx = currentBreaches.findIndex((b) => b.id === id)
  if (idx !== -1) {
    currentBreaches[idx] = { ...currentBreaches[idx], status }
    return currentBreaches[idx]
  }
  throw new Error(`Breach with id ${id} not found`)
}

// ----------------------------------------------------------------------
// Domain Verification & Scans
// ----------------------------------------------------------------------

export async function getDomainVerificationDetails(domain: string): Promise<{
  domain: string
  recordType: 'TXT'
  name: string
  value: string
  verified: boolean
}> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/scan/verify-info?domain=${encodeURIComponent(domain)}`)
    if (!res.ok) throw new Error(`Failed to get verification info: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(150, 300)
  const existing = currentDomains.find((d) => d.domain.toLowerCase() === domain.toLowerCase())
  const token = `sentra-verification=${btoa(domain).replace(/=/g, '').slice(0, 24)}`

  return {
    domain,
    recordType: 'TXT',
    name: `_sentra-verify.${domain}`,
    value: token,
    verified: existing ? existing.verified : false,
  }
}

export async function verifyDomainOwnership(domain: string): Promise<{
  domain: string
  verified: boolean
  message: string
}> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/scan/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    })
    if (!res.ok) throw new Error(`Domain verification failed: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(500, 900)
  const found = currentDomains.find((d) => d.domain.toLowerCase() === domain.toLowerCase())
  if (found) {
    found.verified = true
  } else {
    currentDomains.push({
      domain,
      verified: true,
      lastScanned: new Date().toISOString(),
      assetCount: 0,
      criticalCount: 0,
      riskScore: 0,
    })
  }

  return {
    domain,
    verified: true,
    message: `DNS TXT record verified successfully for ${domain}`,
  }
}

export async function startScan(domain: string, scanType: 'passive' | 'deep'): Promise<ScanJob> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/scan/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, scanType }),
    })
    if (!res.ok) throw new Error(`Failed to start scan: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(300, 500)
  const isVerified = currentDomains.some((d) => d.domain.toLowerCase() === domain.toLowerCase() && d.verified)

  const scanId = `scan-${Date.now()}`
  const job: ScanJob = {
    id: scanId,
    domain,
    scanType,
    status: 'running',
    createdAt: new Date().toISOString(),
    verified: isVerified,
    sources: {
      crtsh: { status: 'running', message: 'Querying Certificate Transparency logs...' },
      shodan: { status: 'pending', message: 'Awaiting crt.sh seed data' },
      virustotal: { status: 'pending', message: 'Queued' },
      hibp: { status: 'pending', message: 'Queued' },
      nvd: { status: 'pending', message: 'Queued' },
    },
    summary: {
      discoveredSubdomains: 0,
      discoveredIPs: 0,
      openPorts: 0,
      criticalCVEs: 0,
    },
  }

  activeScans[scanId] = job
  return job
}

export async function getScanJob(id: string): Promise<ScanJob> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/scan/${id}`)
    if (!res.ok) throw new Error(`Scan not found: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(100, 250)
  const job = activeScans[id]
  if (!job) {
    throw new Error(`Scan ${id} not found`)
  }
  return job
}

// ----------------------------------------------------------------------
// Reports & Incident Submissions
// ----------------------------------------------------------------------

export async function getReports(): Promise<Report[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/reports`)
    if (!res.ok) throw new Error(`Failed to fetch reports: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 400)
  return [...currentReports]
}

export async function getReport(id: string): Promise<Report | null> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/reports/${id}`)
    if (!res.ok) return null
    return res.json()
  }

  await simulateLatency(200, 400)
  const found = currentReports.find((r) => r.id === id)
  return found ? { ...found } : null
}

export async function createReport(data: {
  title: string
  type: 'executive' | 'technical' | 'cert-in'
  targetDomain: string
  incidentDescription: string
  selectedAssetIds: string[]
  selectedFindingIds: string[]
  evidenceAttachments: Array<{ id: string; name: string; size: string; timestamp: string; sha256: string }>
  fileFormat: 'pdf' | 'stix'
}): Promise<Report> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`Failed to create report: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(400, 700)
  const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  const newReport: Report = {
    id: `rep-${Date.now().toString(36)}`,
    title: data.title,
    type: data.type,
    status: data.type === 'cert-in' ? 'submitted' : 'exported',
    generatedAt: new Date().toISOString(),
    targetDomain: data.targetDomain,
    findingsCount: data.selectedFindingIds.length || 3,
    fileFormat: data.fileFormat,
    incidentDescription: data.incidentDescription,
    evidenceAttachments: data.evidenceAttachments,
    selectedAssetIds: data.selectedAssetIds,
    selectedFindingIds: data.selectedFindingIds,
    sha256Hash: hash,
    auditLog: [
      {
        action: 'Report Generated & Cryptographically Stamped',
        user: 'SecOps Analyst (You)',
        timestamp: new Date().toISOString(),
        hash,
      },
    ],
  }

  currentReports = [newReport, ...currentReports]
  return newReport
}

// ----------------------------------------------------------------------
// Settings: API Keys (Prefix: sn_live_ / sn_test_)
// ----------------------------------------------------------------------

export async function getApiKeys(): Promise<ApiKey[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/api-keys`)
    if (!res.ok) throw new Error(`Failed to fetch API keys: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 350)
  return [...currentApiKeys]
}

export async function createApiKey(params: {
  name: string
  role: 'Admin' | 'Analyst' | 'Viewer'
  scopes: string[]
}): Promise<ApiKey> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error(`Failed to create API key: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(300, 600)
  const rawHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  const fullToken = `sn_live_${rawHex}`
  const masked = `sn_live_${rawHex.slice(0, 4)}••••••••••••••${rawHex.slice(-4)}`

  const newKey: ApiKey = {
    id: `key-${Date.now().toString(36)}`,
    name: params.name,
    prefix: 'sn_live',
    keyMasked: masked,
    fullKey: fullToken,
    role: params.role,
    createdAt: new Date().toISOString(),
    lastUsed: 'Never',
    scopes: params.scopes,
  }

  currentApiKeys = [newKey, ...currentApiKeys]
  return newKey
}

export async function revokeApiKey(id: string): Promise<{ success: boolean }> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/api-keys/${id}`, {
      method: 'DELETE',
    })
    if (!res.ok) throw new Error(`Failed to revoke API key: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(250, 450)
  currentApiKeys = currentApiKeys.filter((k) => k.id !== id)
  return { success: true }
}

// ----------------------------------------------------------------------
// Settings: Connected Data Sources
// ----------------------------------------------------------------------

export async function getDataSources(): Promise<DataSourceConfig[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/data-sources`)
    if (!res.ok) throw new Error(`Failed to fetch data sources: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 400)
  return [...currentDataSources]
}

export async function updateDataSourceKey(
  serviceId: string,
  apiKey: string
): Promise<DataSourceConfig> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/data-sources/${serviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    })
    if (!res.ok) throw new Error(`Failed to update data source: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(300, 600)
  const idx = currentDataSources.findIndex((d) => d.id === serviceId)
  if (idx !== -1) {
    currentDataSources[idx] = {
      ...currentDataSources[idx],
      apiKey,
      connected: apiKey.length > 5,
      status: apiKey.length > 5 ? 'active' : 'unconfigured',
      lastChecked: new Date().toISOString(),
    }
    return currentDataSources[idx]
  }
  throw new Error(`Data source ${serviceId} not found`)
}

// ----------------------------------------------------------------------
// Settings: Team Members
// ----------------------------------------------------------------------

export async function getTeamMembers(): Promise<TeamMember[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/team`)
    if (!res.ok) throw new Error(`Failed to fetch team: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(150, 350)
  return [...currentTeamMembers]
}

export async function inviteTeamMember(params: {
  name: string
  email: string
  role: 'Admin' | 'Analyst' | 'Viewer'
}): Promise<TeamMember> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/team/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error(`Failed to invite team member: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(250, 500)
  const newMember: TeamMember = {
    id: `usr-${Date.now().toString(36)}`,
    name: params.name,
    email: params.email,
    role: params.role,
    status: 'pending',
    twoFactorEnabled: false,
    lastActive: 'Invitation sent',
  }
  currentTeamMembers = [...currentTeamMembers, newMember]
  return newMember
}

// ----------------------------------------------------------------------
// Settings: Alert Notification Channels
// ----------------------------------------------------------------------

export async function getNotificationChannels(): Promise<NotificationChannel[]> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/notifications`)
    if (!res.ok) throw new Error(`Failed to fetch notification channels: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(150, 300)
  return [...currentNotificationChannels]
}

export async function updateNotificationChannel(
  channelName: string,
  updates: Partial<NotificationChannel>
): Promise<NotificationChannel> {
  if (!USE_MOCKS) {
    const res = await fetch(`${SENTRA_API_BASE_URL}/settings/notifications/${channelName}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) throw new Error(`Failed to update notification channel: ${res.statusText}`)
    return res.json()
  }

  await simulateLatency(200, 400)
  const idx = currentNotificationChannels.findIndex((c) => c.channel === channelName)
  if (idx !== -1) {
    currentNotificationChannels[idx] = { ...currentNotificationChannels[idx], ...updates }
    return currentNotificationChannels[idx]
  }
  throw new Error(`Channel ${channelName} not found`)
}

// ----------------------------------------------------------------------
// Sentra API Client Export
// ----------------------------------------------------------------------

export const sentraApi = {
  getDashboardMetrics,
  getDomains,
  getAssets,
  getAssetById,
  getCVEs,
  getCVEById,
  getAlerts,
  updateAlertStatus,
  getBreaches,
  updateBreachStatus,
  getDomainVerificationDetails,
  verifyDomainOwnership,
  startScan,
  getScanJob,
  getReports,
  getReport,
  createReport,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getDataSources,
  updateDataSourceKey,
  getTeamMembers,
  inviteTeamMember,
  getNotificationChannels,
  updateNotificationChannel,
}

export default sentraApi
