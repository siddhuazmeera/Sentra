import React, { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Server,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  Globe,
  Radio,
  X,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react'
import { getAssets, AssetFilterParams } from '@/lib/api'
import { useDomain } from '@/context/DomainContext'
import { useToast } from '@/context/ToastContext'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { TableRowSkeleton } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Asset, Severity } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

export const AssetInventory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { selectedDomain, setSelectedDomain } = useDomain()
  const { addToast } = useToast()
  const navigate = useNavigate()

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [portFilter, setPortFilter] = useState<string>('all')
  const [techFilter, setTechFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'riskScore' | 'asset' | 'lastSeen' | 'ports'>('riskScore')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)

  // Drawer modal for row click inspection
  const [inspectedAsset, setInspectedAsset] = useState<Asset | null>(null)
  const [copiedIp, setCopiedIp] = useState<string | null>(null)

  // Query parameters
  const queryParams: AssetFilterParams = useMemo(
    () => ({
      domain: selectedDomain,
      search: searchQuery,
      severity: severityFilter,
      port: portFilter !== 'all' ? Number(portFilter) : undefined,
      technology: techFilter !== 'all' ? techFilter : undefined,
      sortBy,
      sortOrder,
      page,
      limit,
    }),
    [selectedDomain, searchQuery, severityFilter, portFilter, techFilter, sortBy, sortOrder, page, limit]
  )

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['assets', queryParams],
    queryFn: () => getAssets(queryParams),
  })

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip)
    setCopiedIp(ip)
    addToast({
      title: 'IP Address Copied',
      description: `${ip} copied to clipboard.`,
      type: 'info',
    })
    setTimeout(() => setCopiedIp(null), 2000)
  }

  // Client-side CSV export
  const handleExportCSV = async () => {
    try {
      // Fetch all assets matching current domain and search
      const exportData = await getAssets({
        domain: selectedDomain,
        search: searchQuery,
        severity: severityFilter,
        page: 1,
        limit: 1000,
      })

      const headers = ['Asset', 'Type', 'Domain', 'IP Address', 'Risk Score', 'Severity', 'Open Ports', 'Technologies', 'Last Seen']
      const rows = exportData.assets.map((a) => [
        `"${a.asset}"`,
        `"${a.type}"`,
        `"${a.domain}"`,
        `"${a.ip}"`,
        a.riskScore,
        `"${a.severity}"`,
        `"${a.ports.join(';')}"`,
        `"${a.technologies.join(';')}"`,
        `"${a.lastSeen}"`,
      ])

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `threatlens-assets-${selectedDomain}-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      addToast({
        title: 'CSV Export Generated',
        description: `Exported ${exportData.total} assets to CSV file.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Export Failed',
        description: err.message || 'Could not generate CSV export.',
        type: 'error',
      })
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSeverityFilter('all')
    setPortFilter('all')
    setTechFilter('all')
    setPage(1)
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1

  return (
    <div className="space-y-6">
      {/* Header with Title and Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Asset Inventory</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {data?.total ?? '...'} Targets
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full perimeter index of subdomains, public IPs, open listening services, and detected tech stacks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-semibold transition-colors shadow-glow-teal"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Scan Domain</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Field (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search by hostname, IP address, or technology..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
              aria-label="Filter assets"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value as any)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
              aria-label="Filter by Severity"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
              <option value="info">Info Only</option>
            </select>
          </div>

          {/* Port Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={portFilter}
              onChange={(e) => {
                setPortFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
              aria-label="Filter by Port"
            >
              <option value="all">All Ports</option>
              <option value="443">Port 443 (HTTPS)</option>
              <option value="80">Port 80 (HTTP)</option>
              <option value="22">Port 22 (SSH)</option>
              <option value="8080">Port 8080 (Web-Alt)</option>
              <option value="9200">Port 9200 (Elastic)</option>
              <option value="6379">Port 6379 (Redis)</option>
              <option value="6443">Port 6443 (K8s API)</option>
              <option value="3000">Port 3000 (Grafana)</option>
            </select>
          </div>

          {/* Technology Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={techFilter}
              onChange={(e) => {
                setTechFilter(e.target.value)
                setPage(1)
              }}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
              aria-label="Filter by Technology"
            >
              <option value="all">All Technologies</option>
              <option value="ivanti">Ivanti Gateway</option>
              <option value="jenkins">Jenkins</option>
              <option value="teamcity">TeamCity</option>
              <option value="kubernetes">Kubernetes</option>
              <option value="elasticsearch">Elasticsearch</option>
              <option value="redis">Redis</option>
              <option value="nginx">Nginx</option>
              <option value="fastapi">FastAPI</option>
            </select>
          </div>

          {/* Sort By (1 col) */}
          <div className="md:col-span-1">
            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
              }}
              className="w-full h-full flex items-center justify-center gap-1 bg-background border border-border rounded-lg px-2 py-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
              title={`Sorting ${sortOrder.toUpperCase()}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="uppercase text-[10px]">{sortOrder}</span>
            </button>
          </div>
        </div>

        {/* Active Filter Indicators */}
        {(searchQuery || severityFilter !== 'all' || portFilter !== 'all' || techFilter !== 'all') && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground text-[11px]">Active Filters:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-border">
                Query: "{searchQuery}"
              </span>
            )}
            {severityFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-border">
                Severity: {severityFilter}
              </span>
            )}
            {portFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-border">
                Port: {portFilter}
              </span>
            )}
            {techFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono border border-border">
                Tech: {techFilter}
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="text-teal-400 hover:underline text-[11px] ml-auto font-medium"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Asset Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dense-table">
            <thead>
              <tr className="border-b border-border bg-card-subtle text-muted-foreground">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Asset / Hostname</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">IP Address</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Open Ports</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Detected Tech & Stack</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">
                  <div
                    onClick={() => {
                      setSortBy('riskScore')
                      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                    }}
                    className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                  >
                    <span>Risk Score</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Last Seen</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Inspect</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="p-6">
                    <ErrorState
                      title="Failed to Load Asset Inventory"
                      message={error instanceof Error ? error.message : 'Error communicating with reconnaissance database.'}
                      onRetry={() => refetch()}
                    />
                  </td>
                </tr>
              ) : !data || data.assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      title="No Assets Match Current Criteria"
                      description="Try clearing your filters or launching a new reconnaissance scan to discover perimeter hostnames."
                      actionLabel="Reset Filters"
                      onAction={handleResetFilters}
                    />
                  </td>
                </tr>
              ) : (
                data.assets.map((asset) => {
                  const isHighRisk = asset.riskScore >= 70

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setInspectedAsset(asset)}
                      className={`hover:bg-muted/40 transition-colors cursor-pointer group ${
                        isHighRisk ? 'hover:bg-red-950/10' : ''
                      }`}
                    >
                      {/* Asset / Hostname */}
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-teal-400 shrink-0 group-hover:text-teal-300" />
                          <div className="min-w-0">
                            <span className="font-mono font-medium text-foreground tracking-tight block truncate group-hover:text-teal-400 transition-colors">
                              {asset.asset}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {asset.domain}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-foreground/90">{asset.ip}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyIp(asset.ip)
                            }}
                            className="text-muted-foreground hover:text-teal-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Copy IP"
                          >
                            {copiedIp === asset.ip ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {asset.location && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {asset.location.city}, {asset.location.countryCode} · {asset.location.asn.split(' ')[0]}
                          </div>
                        )}
                      </td>

                      {/* Open Ports */}
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {asset.ports.map((port) => (
                            <span
                              key={port}
                              onClick={(e) => {
                                e.stopPropagation()
                                setPortFilter(String(port))
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border hover:border-teal-500/60 transition-colors ${
                                [443, 8443].includes(port)
                                  ? 'bg-muted text-foreground border-border'
                                  : [80, 8080, 8000].includes(port)
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : [22, 9200, 6379, 6443].includes(port)
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                              title={`Port ${port} - Click to filter`}
                            >
                              {port}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Technologies */}
                      <td className="px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {asset.technologies.slice(0, 3).map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-card-subtle border border-border text-foreground font-mono truncate"
                            >
                              {tech}
                            </span>
                          ))}
                          {asset.technologies.length > 3 && (
                            <span className="px-1 py-0.5 rounded text-[10px] text-muted-foreground font-mono">
                              +{asset.technologies.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={asset.severity} size="sm" />
                          <span className="font-mono font-bold text-foreground text-xs">
                            {asset.riskScore}
                          </span>
                        </div>
                      </td>

                      {/* Last Seen */}
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        <span title={new Date(asset.lastSeen).toLocaleString()}>
                          {formatRelativeTime(asset.lastSeen)}
                        </span>
                      </td>

                      {/* Inspect Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setInspectedAsset(asset)
                          }}
                          className="px-2 py-1 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground text-xs font-medium border border-border transition-colors inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.total > 0 && (
          <div className="p-3 border-t border-border bg-card-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span>
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, data.total)} of {data.total} assets
              </span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <span>Rows:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="bg-card border border-border rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
                  aria-label="Items per page"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-border bg-card hover:bg-muted disabled:opacity-40 text-foreground"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-2 text-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-border bg-card hover:bg-muted disabled:opacity-40 text-foreground"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Row Inspection Slide-over Drawer (Preparing Stage 2 Asset Detail transition) */}
      {inspectedAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setInspectedAsset(null)}
        >
          <div
            className="w-full max-w-lg bg-card border-l border-border h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge severity={inspectedAsset.severity} size="md" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    Risk: {inspectedAsset.riskScore}/100
                  </span>
                </div>
                <h2 className="text-base font-bold font-mono text-foreground truncate">
                  {inspectedAsset.asset}
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  IP: {inspectedAsset.ip} · Domain: {inspectedAsset.domain}
                </p>
              </div>

              <button
                onClick={() => setInspectedAsset(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg border border-border bg-card-subtle">
                <span className="text-[10px] text-muted-foreground block uppercase">Open Services</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {inspectedAsset.ports.length} listening ports
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card-subtle">
                <span className="text-[10px] text-muted-foreground block uppercase">Matched CVEs</span>
                <span className="text-sm font-bold text-red-500 mt-0.5 block">
                  {inspectedAsset.cveCount} detected
                </span>
              </div>
            </div>

            {/* Services & Ports List */}
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Listening Services & Banners
              </h3>
              <div className="space-y-2">
                {inspectedAsset.services.map((srv, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-background text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-400">
                        Port {srv.port}/{srv.protocol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                        {srv.name}
                      </span>
                    </div>
                    {srv.version && (
                      <p className="text-[11px] text-foreground font-sans">{srv.version}</p>
                    )}
                    {srv.product && (
                      <p className="text-[10px] text-muted-foreground font-sans">Product: {srv.product}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detected Technologies */}
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                Detected Technologies & Frameworks
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {inspectedAsset.technologies.map((t, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-muted border border-border text-foreground text-xs font-mono"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Threat Reputation Overview */}
            {inspectedAsset.reputation && (
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  VirusTotal & AbuseIPDB Verdict
                </h3>
                <div className="p-3.5 rounded-lg border border-border bg-card-subtle space-y-2 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-muted-foreground">VT Detections:</span>
                    <span className={inspectedAsset.reputation.virustotalDetections > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {inspectedAsset.reputation.virustotalDetections} / {inspectedAsset.reputation.virustotalTotalEngines} engines
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-muted-foreground">AbuseIP Confidence:</span>
                    <span className={inspectedAsset.reputation.abuseIpConfidence > 50 ? 'text-orange-400 font-bold' : 'text-foreground'}>
                      {inspectedAsset.reputation.abuseIpConfidence}%
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {inspectedAsset.reputation.threatTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Direct navigation to Asset Detail */}
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => navigate(`/assets/${inspectedAsset.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors shadow-glow-teal"
              >
                <span>Open Full Asset Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
