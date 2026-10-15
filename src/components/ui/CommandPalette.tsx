import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Server, ShieldAlert, Globe, ArrowRight, CornerDownLeft, X } from 'lucide-react'
import { mockAssets, mockCVEs, mockDomains } from '@/lib/mock/data'
import { SeverityBadge } from './SeverityBadge'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Filter items
  const cleanQuery = query.trim().toLowerCase()

  const matchedDomains = mockDomains.filter((d) => d.domain.toLowerCase().includes(cleanQuery))
  const matchedAssets = mockAssets
    .filter(
      (a) =>
        a.asset.toLowerCase().includes(cleanQuery) ||
        a.ip.includes(cleanQuery) ||
        a.technologies.some((t) => t.toLowerCase().includes(cleanQuery))
    )
    .slice(0, 5)
  const matchedCVEs = mockCVEs
    .filter(
      (c) =>
        c.id.toLowerCase().includes(cleanQuery) ||
        c.title.toLowerCase().includes(cleanQuery) ||
        c.affectedProduct.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 4)

  const allItems: Array<{
    type: 'domain' | 'asset' | 'cve' | 'action'
    id: string
    title: string
    subtitle: string
    badge?: any
    onSelect: () => void
  }> = []

  matchedDomains.forEach((d) => {
    allItems.push({
      type: 'domain',
      id: `domain-${d.domain}`,
      title: d.domain,
      subtitle: `${d.assetCount} assets · ${d.verified ? 'Verified DNS' : 'Unverified'}`,
      onSelect: () => {
        navigate(`/assets?domain=${d.domain}`)
        onClose()
      },
    })
  })

  matchedAssets.forEach((a) => {
    allItems.push({
      type: 'asset',
      id: `asset-${a.id}`,
      title: a.asset,
      subtitle: `${a.ip} · Ports: [${a.ports.join(', ')}]`,
      badge: <SeverityBadge severity={a.severity} size="sm" />,
      onSelect: () => {
        navigate(`/assets?search=${encodeURIComponent(a.asset)}`)
        onClose()
      },
    })
  })

  matchedCVEs.forEach((c) => {
    allItems.push({
      type: 'cve',
      id: `cve-${c.id}`,
      title: c.id,
      subtitle: c.title,
      badge: <SeverityBadge severity={c.severity} size="sm" />,
      onSelect: () => {
        navigate(`/assets?search=${encodeURIComponent(c.id)}`)
        onClose()
      },
    })
  })

  // Quick actions
  if (!cleanQuery || 'new scan'.includes(cleanQuery)) {
    allItems.push({
      type: 'action',
      id: 'action-scan',
      title: 'Initiate New Attack Surface Scan',
      subtitle: 'Passive OSINT or deep domain discovery',
      onSelect: () => {
        navigate('/scan')
        onClose()
      },
    })
  }

  if (!cleanQuery || 'graph relationship'.includes(cleanQuery)) {
    allItems.push({
      type: 'action',
      id: 'action-graph',
      title: 'Asset Relationship Graph',
      subtitle: 'Interactive visual attack paths & node topology',
      onSelect: () => {
        navigate('/graph')
        onClose()
      },
    })
  }

  if (!cleanQuery || 'cve feed vulnerabilities'.includes(cleanQuery)) {
    allItems.push({
      type: 'action',
      id: 'action-cves',
      title: 'Vulnerability & CVE Feed',
      subtitle: 'NVD, CISA KEV, and EPSS correlation',
      onSelect: () => {
        navigate('/cves')
        onClose()
      },
    })
  }

  if (!cleanQuery || 'reports cert-in'.includes(cleanQuery)) {
    allItems.push({
      type: 'action',
      id: 'action-reports',
      title: 'Reports & CERT-In Complaint Generator',
      subtitle: 'Cryptographically sealed PDF and STIX 2.1 bundles',
      onSelect: () => {
        navigate('/reports')
        onClose()
      },
    })
  }

  if (!cleanQuery || 'settings api keys'.includes(cleanQuery)) {
    allItems.push({
      type: 'action',
      id: 'action-settings',
      title: 'Platform Settings & API Keys (sn_live_...)',
      subtitle: 'Data sources, roles, and programmatic credentials',
      onSelect: () => {
        navigate('/settings')
        onClose()
      },
    })
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (allItems.length ? (prev + 1) % allItems.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (allItems.length ? (prev - 1 + allItems.length) % allItems.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (allItems[selectedIndex]) {
          allItems[selectedIndex].onSelect()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, allItems, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search Command Palette"
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col text-foreground animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-card-subtle/50">
          <Search className="w-5 h-5 text-teal-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search domains, IPs, hostnames, or CVE IDs..."
            className="w-full py-3.5 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none font-mono"
            aria-label="Search threat intelligence"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/40">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No matching assets, IPs, or vulnerabilities found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {allItems.map((item, idx) => {
                const isSelected = idx === selectedIndex
                return (
                  <div
                    key={item.id}
                    onClick={item.onSelect}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                        : 'hover:bg-muted/60 text-foreground border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 text-muted-foreground">
                        {item.type === 'domain' && <Globe className="w-4 h-4 text-emerald-400" />}
                        {item.type === 'asset' && <Server className="w-4 h-4 text-teal-400" />}
                        {item.type === 'cve' && <ShieldAlert className="w-4 h-4 text-red-400" />}
                        {item.type === 'action' && <ArrowRight className="w-4 h-4 text-teal-400" />}
                      </div>
                      <div className="truncate">
                        <div className="font-mono font-medium text-foreground tracking-tight truncate flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.badge}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 ml-3">
                      {isSelected && (
                        <span className="flex items-center text-[10px] text-muted-foreground font-mono">
                          <CornerDownLeft className="w-3 h-3 mr-0.5" /> Select
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-border bg-card-subtle flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 font-mono bg-muted border border-border rounded text-[10px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 font-mono bg-muted border border-border rounded text-[10px]">↓</kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 font-mono bg-muted border border-border rounded text-[10px]">↵</kbd>{' '}
              Open
            </span>
          </div>
          <span className="text-[10px] font-mono text-teal-500/80">Sentra Recon v1.0</span>
        </div>
      </div>
    </div>
  )
}
