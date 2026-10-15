import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Server,
  ArrowLeft,
  Globe,
  Shield,
  ShieldAlert,
  Flame,
  Radio,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Layers,
  Bug,
  Activity,
  History,
  FileCode,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { getAssetById, getCVEs } from '@/lib/api'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import { formatRelativeTime } from '@/lib/utils'

export const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState<'overview' | 'ports' | 'cves' | 'reputation' | 'history'>('overview')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const { data: asset, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => getAssetById(id || ''),
    enabled: Boolean(id),
  })

  const { data: cves } = useQuery({
    queryKey: ['cvesForAsset', id],
    queryFn: () => getCVEs(),
  })

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    addToast({
      title: 'Copied to Clipboard',
      description: `${label} copied.`,
      type: 'info',
    })
    setTimeout(() => setCopiedText(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 bg-slate-800 animate-pulse rounded" />
        </div>
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  if (isError || !asset) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/assets')}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Asset Inventory
        </button>
        <ErrorState
          title="Asset Not Found"
          message={`Unable to locate asset record with identifier '${id}'.`}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  // Filter CVEs affecting this specific asset
  const matchedCVEs = (cves || []).filter(
    (c) => c.affectedAssetIds.includes(asset.id) || asset.technologies.some((t) => c.affectedProduct.toLowerCase().includes(t.toLowerCase().split(' ')[0]))
  )

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2 text-xs">
          <Link to="/assets" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Assets
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-mono font-semibold text-foreground">{asset.asset}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(asset.ip, 'IP Address')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-mono text-foreground transition-colors"
          >
            {copiedText === asset.ip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            <span>{asset.ip}</span>
          </button>
          <button
            onClick={() => navigate(`/scan`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors shadow-glow-teal"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Rescan Target</span>
          </button>
        </div>
      </div>

      {/* Asset Hero Header Card */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
                <Server className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-foreground">
                  {asset.asset}
                </h1>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Domain Scope: <span className="text-foreground">{asset.domain}</span> · Type: <span className="uppercase text-teal-400 font-semibold">{asset.type}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                Risk Posture
              </span>
              <div className="flex items-center gap-2 justify-end mt-1">
                <SeverityBadge severity={asset.severity} size="md" />
                <span className="text-xl font-bold font-mono text-foreground">
                  {asset.riskScore}
                  <span className="text-xs text-muted-foreground font-normal">/100</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick telemetry metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/70 text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground block">IP Address</span>
            <span className="text-foreground font-semibold">{asset.ip}</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Listening Ports</span>
            <span className="text-teal-400 font-semibold">{asset.ports.length} services</span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Correlated CVEs</span>
            <span className={asset.cveCount > 0 ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
              {asset.cveCount} detected
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">Last Scanned</span>
            <span className="text-muted-foreground">{formatRelativeTime(asset.lastSeen)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-medium" aria-label="Asset Sections">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'ports', label: `Ports & Services (${asset.ports.length})`, icon: Server },
            { id: 'cves', label: `Vulnerabilities (${matchedCVEs.length})`, icon: Bug },
            { id: 'reputation', label: 'Reputation & Feeds', icon: Shield },
            { id: 'history', label: 'Audit History', icon: History },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'border-teal-500 text-teal-400 font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Left Column: Tech Stack & Location (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tech Stack Card */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-teal-400" />
                <span>Fingerprinted Technologies & Frameworks</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {asset.technologies.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-border bg-card-subtle font-mono text-xs flex items-center gap-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span className="font-semibold text-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Geo Location Card */}
            {asset.location && (
              <div className="p-5 rounded-xl border border-border bg-card space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Geographic & Routing Telemetry</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg border border-border bg-card-subtle">
                    <span className="text-[10px] text-muted-foreground block">Country & City</span>
                    <span className="text-foreground font-semibold mt-0.5 block">
                      {asset.location.city}, {asset.location.country} ({asset.location.countryCode})
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card-subtle">
                    <span className="text-[10px] text-muted-foreground block">Autonomous System (ASN)</span>
                    <span className="text-foreground font-semibold mt-0.5 block truncate">
                      {asset.location.asn}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card-subtle col-span-2">
                    <span className="text-[10px] text-muted-foreground block">Hosting Provider / ISP</span>
                    <span className="text-foreground font-semibold mt-0.5 block">
                      {asset.location.isp}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Risk Gauge & DNS (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 rounded-xl border border-border bg-card flex flex-col items-center justify-center text-center">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Risk Posture Evaluation
              </h3>
              <RiskGauge score={asset.riskScore} size={180} />
            </div>

            {/* DNS Records */}
            <div className="p-5 rounded-xl border border-border bg-card space-y-3">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-400" />
                <span>Authoritative DNS Mapping</span>
              </h3>
              <div className="divide-y divide-border/60 text-xs font-mono">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-teal-400 font-bold">A Record</span>
                  <span className="text-foreground">{asset.ip}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-teal-400 font-bold">Host</span>
                  <span className="text-foreground truncate max-w-[200px]">{asset.asset}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-teal-400 font-bold">Domain TTL</span>
                  <span className="text-muted-foreground">300s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PORTS & SERVICES */}
      {activeTab === 'ports' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in duration-150">
          <table className="w-full text-left border-collapse dense-table">
            <thead>
              <tr className="border-b border-border bg-card-subtle text-muted-foreground">
                <th className="px-4 py-3 text-xs uppercase font-semibold">Port</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Protocol</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Service Name</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Version Banner</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Software Product</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono text-xs">
              {asset.services.map((srv, idx) => (
                <tr key={idx} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-bold text-teal-400">
                    {srv.port}
                  </td>
                  <td className="px-4 py-3 uppercase text-muted-foreground">
                    {srv.protocol}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {srv.name}
                  </td>
                  <td className="px-4 py-3 text-foreground/90 font-sans">
                    {srv.version || 'Banner suppressed'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-sans">
                    {srv.product || 'Standard Daemon'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" /> Listening
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: VULNERABILITIES (CVEs) */}
      {activeTab === 'cves' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {matchedCVEs.length === 0 ? (
            <EmptyState
              title="No Vulnerabilities Correlated"
              description="No unpatched CVEs currently match the detected software versions on this asset."
            />
          ) : (
            matchedCVEs.map((cve) => (
              <div
                key={cve.id}
                className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3 hover:border-teal-500/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {cve.id}
                    </span>
                    <SeverityBadge severity={cve.severity} size="sm" />
                    {cve.cisaKev && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 shadow-glow-critical">
                        <Flame className="w-3 h-3 text-red-500" /> CISA KEV Exploited
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-muted-foreground">CVSS Score:</span>{' '}
                      <span className="font-bold text-foreground">{cve.cvss} / 10.0</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">EPSS Prob:</span>{' '}
                      <span className="font-bold text-orange-400">{(cve.epss * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cve.description}
                </p>

                {/* Plain language fix recommendation */}
                <div className="p-3 rounded-lg border border-border/80 bg-card-subtle text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono block">
                    Remediation & Fix Recommendation
                  </span>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-foreground">
                    <span>{cve.fixRecommendation}</span>
                    <button
                      onClick={() => handleCopy(cve.fixRecommendation, 'Fix recommendation')}
                      className="text-muted-foreground hover:text-teal-400 shrink-0 p-1"
                      title="Copy fix command"
                    >
                      {copiedText === cve.fixRecommendation ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: REPUTATION */}
      {activeTab === 'reputation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          {/* VirusTotal Verdict */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>VirusTotal Threat Intelligence</span>
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">v3 API Live</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Malicious Detections:</span>
                <span className={asset.reputation && asset.reputation.virustotalDetections > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {asset.reputation?.virustotalDetections || 0} / {asset.reputation?.virustotalTotalEngines || 92} engines
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">IP Blacklist Status:</span>
                <span className={asset.reputation?.blacklisted ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {asset.reputation?.blacklisted ? 'Flagged / Blacklisted' : 'Clean / Unlisted'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-muted-foreground block mb-1.5 uppercase font-mono">
                  Threat Actor Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(asset.reputation?.threatTags || ['clean']).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AbuseIPDB Verdict */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <span>AbuseIPDB Confidence Score</span>
              </h3>
              <span className="text-[10px] font-mono text-muted-foreground">Abuse Database</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Abuse Confidence:</span>
                <span className="font-bold text-orange-400">
                  {asset.reputation?.abuseIpConfidence || 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${asset.reputation?.abuseIpConfidence || 0}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Confidence rating based on reported malicious scanning, brute force attempts, and honeypot connections.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HISTORY */}
      {activeTab === 'history' && (
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              <span>Asset Perimeter Change Log</span>
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">Immutable Trail</span>
          </div>

          <div className="divide-y divide-border/60">
            {(asset.history || []).map((h, i) => (
              <div key={i} className="py-3 flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{h.event}</p>
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">
                    {formatRelativeTime(h.timestamp)} ({new Date(h.timestamp).toLocaleString()})
                  </span>
                </div>
                {h.severity && <SeverityBadge severity={h.severity} size="sm" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
