import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Server,
  AlertTriangle,
  Bug,
  AlertOctagon,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Check,
  Copy,
  ExternalLink,
  Flame,
  Radio,
  FileDown,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { getDashboardMetrics, updateAlertStatus } from '@/lib/api'
import { useDomain } from '@/context/DomainContext'
import { useToast } from '@/context/ToastContext'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { RiskGauge } from '@/components/ui/RiskGauge'
import { CardSkeleton, ChartSkeleton } from '@/components/ui/SkeletonLoader'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatNumber, formatRelativeTime } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { Finding } from '@/types'

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
  info: '#64748b',
}

export const Dashboard: React.FC = () => {
  const { selectedDomain } = useDomain()
  const { addToast } = useToast()
  const queryClient = useQueryClient()
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>('fnd-01')
  const [copiedStep, setCopiedStep] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboardMetrics', selectedDomain],
    queryFn: () => getDashboardMetrics(selectedDomain),
  })

  const alertMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'acknowledged' | 'resolved' }) =>
      updateAlertStatus(id, status),
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['dashboardMetrics'] })
      addToast({
        title: 'Alert Status Updated',
        description: `Alert marked as ${updatedAlert.status}.`,
        type: 'success',
      })
    },
  })

  const handleCopyStep = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(text)
    addToast({
      title: 'Action Step Copied',
      description: 'Remediation instruction copied to clipboard.',
      type: 'info',
    })
    setTimeout(() => setCopiedStep(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton height="h-72" />
          <ChartSkeleton height="h-72" />
          <ChartSkeleton height="h-72" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <ErrorState
        title="Failed to Load Dashboard Metrics"
        message={error instanceof Error ? error.message : 'Unable to aggregate attack surface data.'}
        onRetry={() => refetch()}
      />
    )
  }

  const donutData = [
    { name: 'Critical', value: data.findingsBySeverity.critical, color: SEVERITY_COLORS.critical },
    { name: 'High', value: data.findingsBySeverity.high, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: data.findingsBySeverity.medium, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: data.findingsBySeverity.low, color: SEVERITY_COLORS.low },
    { name: 'Info', value: data.findingsBySeverity.info, color: SEVERITY_COLORS.info },
  ]

  const totalFindings =
    data.findingsBySeverity.critical +
    data.findingsBySeverity.high +
    data.findingsBySeverity.medium +
    data.findingsBySeverity.low +
    data.findingsBySeverity.info

  return (
    <div className="space-y-6">
      {/* Top Banner / Domain Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Threat Intelligence Overview</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {selectedDomain === 'all' ? 'All Monitored Targets' : selectedDomain}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aggregated passive OSINT, CVE correlation, Shodan telemetry, and breach feeds
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/scan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 font-medium text-xs transition-colors shadow-glow-teal"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Run New Recon Scan</span>
          </Link>
          <Link
            to="/assets"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-foreground font-medium text-xs transition-colors"
          >
            <span>View All Assets</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Assets */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Assets
            </span>
            <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatNumber(data.totalAssets)}
            </span>
            <span className="text-xs text-emerald-400 font-medium">+3 new</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Subdomains, IPs & APIs</span>
            <Link to="/assets" className="text-teal-400 hover:underline inline-flex items-center gap-0.5">
              Explore →
            </Link>
          </div>
        </div>

        {/* Card 2: Critical Findings */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Critical Findings
            </span>
            <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 shadow-glow-critical">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-red-500">
              {formatNumber(data.criticalFindings)}
            </span>
            <span className="text-xs text-red-400 font-medium">Requires immediate action</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>RCE & public exposures</span>
            <span className="text-red-400/90 font-mono text-[10px]">CISA KEV flagged</span>
          </div>
        </div>

        {/* Card 3: Matching CVEs */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Inventory CVEs
            </span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <Bug className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {formatNumber(data.matchingCves)}
            </span>
            <span className="text-xs text-amber-400 font-medium">9 active in KEV</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Affecting your tech stack</span>
            <span className="text-muted-foreground font-mono text-[10px]">CVSS ≥ 8.0</span>
          </div>
        </div>

        {/* Card 4: Breached Accounts */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Breached Accounts
            </span>
            <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-orange-400">
              {formatNumber(data.breachedAccounts)}
            </span>
            <span className="text-xs text-orange-400 font-medium">Dark web dumps</span>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Passwords never revealed</span>
            <span className="text-muted-foreground font-mono text-[10px]">HIBP feeds</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Posture Section (3 Columns on Large Screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Overall Risk Score Gauge (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-xl border border-border bg-card flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Overall Risk Posture
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                0 - 100 Index
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Continuous weighted risk assessment based on open ports, CVE CVSS/EPSS, and public reputation.
            </p>
          </div>

          <div className="py-4">
            <RiskGauge score={data.overallRiskScore} />
          </div>

          <div className="pt-3 border-t border-border/70 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">CERT-In Compliance Readiness:</span>
              <span className="font-semibold text-amber-400">Review Pending</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Target Perimeter:</span>
              <span className="font-mono text-teal-400">{selectedDomain === 'all' ? 'Multi-domain' : selectedDomain}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Risk Trend Line Chart (last 30 days) (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-border bg-card flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Risk Trend (Last 30 Days)
              </h2>
              <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                +16 pts this month
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Daily threat index changes driven by new internet port discoveries and newly disclosed CVEs.
            </p>
          </div>

          <div className="h-52 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.riskScoreTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                />
                <YAxis
                  domain={[40, 100]}
                  tickLine={false}
                  axisLine={{ stroke: '#1e293b' }}
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-2 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-xl text-xs font-mono">
                          <p className="text-muted-foreground text-[10px]">{label}</p>
                          <p className="font-bold text-teal-400 mt-0.5">
                            Risk Score: {payload[0].value}/100
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#riskGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Min: 61</span>
            <span>Current: {data.overallRiskScore}</span>
            <span>Peak: 81 (Oct 11)</span>
          </div>
        </div>

        {/* Column 3: Findings by Severity Donut (3 cols) */}
        <div className="lg:col-span-3 p-5 rounded-xl border border-border bg-card flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Severity Breakdown
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground">
                {totalFindings} issues
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Active vulnerabilities categorized by CVSS severity.</p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload
                      return (
                        <div className="p-2 rounded-lg border border-border bg-card text-xs font-mono shadow-md">
                          <span style={{ color: item.color }} className="font-semibold">
                            {item.name}:
                          </span>{' '}
                          {item.value} findings
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono text-foreground leading-none">
                {totalFindings}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                Total
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t border-border/70 text-[11px]">
            {donutData.map((d) => (
              <div key={d.name} className="flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top 5 Things to Fix Now + Live Feed of Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Fixes (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Top 5 Things to Fix Now</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                  Prioritized
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Plain-language action steps addressing your highest-risk exposed assets.
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60 mt-2">
            {data.topFixes.slice(0, 5).map((fix: Finding, idx: number) => {
              const isExpanded = expandedFindingId === fix.id

              return (
                <div key={fix.id} className="py-3 transition-colors">
                  <div
                    onClick={() => setExpandedFindingId(isExpanded ? null : fix.id)}
                    className="flex items-start justify-between gap-3 cursor-pointer select-none group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0 mt-0.5 group-hover:text-teal-400">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xs font-semibold text-foreground group-hover:text-teal-400 transition-colors">
                            {fix.title}
                          </h3>
                          {fix.cveId && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                              {fix.cveId}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          Target: <span className="text-foreground">{fix.assetName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <SeverityBadge severity={fix.severity} size="sm" />
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Plain Language Action Steps */}
                  {isExpanded && (
                    <div className="mt-3 pl-7 pr-2 space-y-3 animate-in fade-in duration-150">
                      <p className="text-xs text-muted-foreground leading-relaxed bg-card-subtle/60 p-2.5 rounded-lg border border-border">
                        {fix.description}
                      </p>

                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Action Steps:
                        </h4>
                        <ol className="space-y-2">
                          {fix.actionSteps.map((step, sIdx) => (
                            <li
                              key={sIdx}
                              className="flex items-start justify-between gap-2 text-xs bg-muted/40 p-2 rounded border border-border/80 group/step"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <span className="font-mono text-[10px] text-teal-400 font-bold shrink-0 mt-0.5">
                                  {sIdx + 1}.
                                </span>
                                <span className="text-foreground font-mono text-[11px] break-all">
                                  {step}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopyStep(step)
                                }}
                                className="text-muted-foreground hover:text-teal-400 p-1 shrink-0 transition-colors"
                                title="Copy action step"
                                aria-label="Copy instruction"
                              >
                                {copiedStep === step ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Link
                          to={`/assets?search=${encodeURIComponent(fix.assetName)}`}
                          className="text-xs text-teal-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Inspect Asset Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Discovered: {formatRelativeTime(fix.discoveredAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Live Feed of Recent Alerts (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </div>
                <h2 className="text-sm font-bold text-foreground">Live Alert Feed</h2>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Streaming Recon Events
              </span>
            </div>

            <div className="divide-y divide-border/60 mt-2 space-y-0.5">
              {data.recentAlerts.map((alert) => (
                <div key={alert.id} className="py-2.5 text-xs hover:bg-muted/20 px-1 rounded transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-foreground leading-tight truncate">
                      {alert.title}
                    </span>
                    <SeverityBadge severity={alert.severity} size="sm" showIcon={false} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="truncate max-w-[170px] text-teal-400/90">
                      {alert.targetAsset || 'Global Recon'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{formatRelativeTime(alert.timestamp)}</span>
                      {alert.status === 'new' && (
                        <button
                          onClick={() => alertMutation.mutate({ id: alert.id, status: 'acknowledged' })}
                          className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground text-[10px] border border-border transition-colors"
                        >
                          Ack
                        </button>
                      )}
                      {alert.status === 'acknowledged' && (
                        <span className="text-emerald-400 font-mono text-[10px]">Ack'd</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="text-[11px] font-mono">Real-time socket: connected</span>
            <Link to="/alerts" className="text-teal-400 hover:underline font-medium inline-flex items-center gap-1">
              <span>Alerts Triage Console →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
