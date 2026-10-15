import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bug,
  Search,
  Filter,
  Flame,
  ShieldAlert,
  Server,
  ExternalLink,
  Copy,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react'
import { getCVEs, getAssets } from '@/lib/api'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { TableRowSkeleton } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { CVE, Severity } from '@/types'
import { useToast } from '@/context/ToastContext'

export const CVEFeed: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [kevOnly, setKevOnly] = useState(false)
  const [myAssetsOnly, setMyAssetsOnly] = useState(false)

  // Drawer state
  const [selectedCVE, setSelectedCVE] = useState<CVE | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const { data: cves, isLoading, isError, refetch } = useQuery({
    queryKey: ['cves', searchQuery, severityFilter, kevOnly, myAssetsOnly],
    queryFn: () =>
      getCVEs({
        search: searchQuery,
        severity: severityFilter,
        kevOnly,
        myAssetsOnly,
      }),
  })

  const { data: assetsData } = useQuery({
    queryKey: ['allAssetsForCve'],
    queryFn: () => getAssets({ limit: 100 }),
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

  // Find assets in inventory matching the selected CVE
  const affectedAssets = useMemo(() => {
    if (!selectedCVE || !assetsData) return []
    return assetsData.assets.filter(
      (a) =>
        selectedCVE.affectedAssetIds.includes(a.id) ||
        a.technologies.some((t) =>
          selectedCVE.affectedProduct.toLowerCase().includes(t.toLowerCase().split(' ')[0])
        )
    )
  }, [selectedCVE, assetsData])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Vulnerability & CVE Feed</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {cves?.length ?? '...'} Correlated
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continuous threat stream synchronized with NVD, CISA Known Exploited Vulnerabilities (KEV), and EPSS.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box (6 cols) */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by CVE ID (CVE-2024-...), vendor, product, or keyword..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-8 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
              aria-label="Filter CVEs"
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

          {/* Severity Dropdown (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
              aria-label="Filter by Severity"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical (CVSS 9.0 - 10.0)</option>
              <option value="high">High (CVSS 7.0 - 8.9)</option>
              <option value="medium">Medium (CVSS 4.0 - 6.9)</option>
            </select>
          </div>

          {/* Toggles (3 cols) */}
          <div className="md:col-span-3 flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={kevOnly}
                onChange={(e) => setKevOnly(e.target.checked)}
                className="rounded border-border text-teal-500 focus:ring-teal-500/30"
              />
              <span className="flex items-center gap-1 font-mono text-[11px] text-red-400">
                <Flame className="w-3.5 h-3.5" /> KEV Only
              </span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={myAssetsOnly}
                onChange={(e) => setMyAssetsOnly(e.target.checked)}
                className="rounded border-border text-teal-500 focus:ring-teal-500/30"
              />
              <span className="text-[11px] font-mono text-teal-400">
                My Assets Only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* CVE Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dense-table">
            <thead>
              <tr className="border-b border-border bg-card-subtle text-muted-foreground">
                <th className="px-4 py-3 text-xs uppercase font-semibold">CVE ID</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Title & Affected Product</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Severity & CVSS</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">EPSS Probability</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Inventory Impact</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono text-xs">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              ) : isError || !cves || cves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      title="No CVEs Match Search Filters"
                      description="Try clearing your filters or resetting the search query."
                      actionLabel="Reset Search"
                      onAction={() => {
                        setSearchQuery('')
                        setSeverityFilter('all')
                        setKevOnly(false)
                        setMyAssetsOnly(false)
                      }}
                    />
                  </td>
                </tr>
              ) : (
                cves.map((cve) => {
                  return (
                    <tr
                      key={cve.id}
                      onClick={() => setSelectedCVE(cve)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      {/* CVE ID */}
                      <td className="px-4 py-3 font-bold text-teal-400 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Bug className="w-4 h-4 text-teal-400 shrink-0" />
                          <span>{cve.id}</span>
                        </div>
                      </td>

                      {/* Title & Product */}
                      <td className="px-4 py-3">
                        <div className="min-w-0 max-w-md">
                          <span className="font-semibold text-foreground block truncate group-hover:text-teal-400 transition-colors font-sans text-xs">
                            {cve.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono block truncate mt-0.5">
                            {cve.affectedVendor} · {cve.affectedProduct} ({cve.affectedVersion})
                          </span>
                        </div>
                      </td>

                      {/* Severity & CVSS */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={cve.severity} size="sm" />
                          <span className="font-mono font-bold text-foreground">
                            {cve.cvss}
                          </span>
                        </div>
                      </td>

                      {/* EPSS */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-orange-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, cve.epss * 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-orange-400 font-semibold">
                            {(cve.epss * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>

                      {/* Inventory Impact */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cve.affectedAssetsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                            <Server className="w-3 h-3" /> {cve.affectedAssetsCount} target(s)
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            0 in inventory
                          </span>
                        )}
                      </td>

                      {/* Inspect */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedCVE(cve)
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
      </div>

      {/* CVE Detail Drawer */}
      {selectedCVE && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setSelectedCVE(null)}
        >
          <div
            className="w-full max-w-xl bg-card border-l border-border h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-base font-bold text-teal-400">
                    {selectedCVE.id}
                  </span>
                  <SeverityBadge severity={selectedCVE.severity} size="sm" />
                  {selectedCVE.cisaKev && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                      <Flame className="w-3 h-3 text-red-500" /> CISA KEV Exploited
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-foreground font-sans leading-snug">
                  {selectedCVE.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCVE(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg border border-border bg-card-subtle">
                <span className="text-[10px] text-muted-foreground block">Base CVSS Score</span>
                <span className="text-lg font-bold text-foreground mt-0.5 block">
                  {selectedCVE.cvss} / 10.0
                </span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-card-subtle">
                <span className="text-[10px] text-muted-foreground block">EPSS Probability</span>
                <span className="text-lg font-bold text-orange-400 mt-0.5 block">
                  {(selectedCVE.epss * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Vulnerability Summary
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed bg-background p-3 rounded-lg border border-border">
                {selectedCVE.description}
              </p>
            </div>

            {/* CVSS Vector */}
            {selectedCVE.cvssVector && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  CVSS Vector
                </h3>
                <div className="p-2.5 rounded bg-muted/60 font-mono text-xs text-muted-foreground flex items-center justify-between border border-border">
                  <span className="truncate">{selectedCVE.cvssVector}</span>
                  <button
                    onClick={() => handleCopy(selectedCVE.cvssVector!, 'CVSS Vector')}
                    className="hover:text-teal-400 p-1 shrink-0"
                  >
                    {copiedText === selectedCVE.cvssVector ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Plain language fix */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-teal-400">
                Action Steps & Fix Recommendation
              </h3>
              <div className="p-3 rounded-lg border border-teal-500/30 bg-teal-950/20 text-xs font-mono text-foreground space-y-2">
                <p>{selectedCVE.fixRecommendation}</p>
                <button
                  onClick={() => handleCopy(selectedCVE.fixRecommendation, 'Fix recommendation')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] hover:bg-teal-500/30 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Remediation Instructions</span>
                </button>
              </div>
            </div>

            {/* Affected Inventory Assets */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Affected Assets in Your Inventory</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {affectedAssets.length} host(s)
                </span>
              </h3>

              {affectedAssets.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono bg-card-subtle p-3 rounded border border-border">
                  No active assets in your perimeter match this vulnerability signature.
                </p>
              ) : (
                <div className="space-y-2">
                  {affectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      className="p-3 rounded-lg border border-border bg-card-subtle hover:border-teal-500/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Server className="w-4 h-4 text-teal-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-mono font-semibold text-foreground block truncate">
                            {asset.asset}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {asset.ip} · Ports: {asset.ports.join(', ')}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* External references */}
            {selectedCVE.references && selectedCVE.references.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Advisory References
                </span>
                <div className="space-y-1">
                  {selectedCVE.references.map((ref, idx) => (
                    <a
                      key={idx}
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:underline font-mono flex items-center gap-1.5 truncate"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{ref}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
