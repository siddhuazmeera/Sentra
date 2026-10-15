import React, { useState, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react'
import {
  Network,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Server,
  Globe,
  Radio,
  Bug,
  ShieldAlert,
  Flame,
  ExternalLink,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { useDomain } from '@/context/DomainContext'
import { mockAssets, mockCVEs } from '@/lib/mock/data'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { Severity } from '@/types'
import { useNavigate } from 'react-router-dom'

interface NodeData extends Record<string, unknown> {
  label: string
  sublabel?: string
  nodeType: 'domain' | 'subdomain' | 'ip' | 'service' | 'cve'
  severity?: Severity
  metadata?: any
}

export const AssetGraph: React.FC = () => {
  const { selectedDomain } = useDomain()
  const navigate = useNavigate()

  const [selectedNodeData, setSelectedNodeData] = useState<NodeData | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  // Generate graph elements based on selected domain
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node<NodeData>[] = []
    const edges: Edge[] = []

    const domainName = selectedDomain === 'all' ? 'acme-defense.io' : selectedDomain
    const domainAssets = mockAssets.filter((a) => a.domain === domainName).slice(0, 8)

    // Root Domain Node
    nodes.push({
      id: `domain-${domainName}`,
      type: 'default',
      position: { x: 50, y: 250 },
      data: {
        label: domainName,
        sublabel: 'Monitored Root Domain',
        nodeType: 'domain',
        severity: 'info',
        metadata: { domain: domainName, assetCount: domainAssets.length },
      },
      style: {
        background: '#101620',
        color: '#14B8A6',
        border: '2px solid #14B8A6',
        borderRadius: '10px',
        padding: '12px 18px',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        fontSize: '12px',
        boxShadow: '0 0 15px rgba(20, 184, 166, 0.3)',
      },
    })

    // Subdomains
    domainAssets.forEach((asset, idx) => {
      const subId = `sub-${asset.id}`
      const yOffset = 50 + idx * 80
      const isCritical = asset.severity === 'critical'
      const isHigh = asset.severity === 'high'

      nodes.push({
        id: subId,
        position: { x: 300, y: yOffset },
        data: {
          label: asset.asset,
          sublabel: `Risk: ${asset.riskScore}/100`,
          nodeType: 'subdomain',
          severity: asset.severity,
          metadata: asset,
        },
        style: {
          background: '#101620',
          color: '#F8FAFC',
          border: `1.5px solid ${isCritical ? '#EF4444' : isHigh ? '#F97316' : '#1E2838'}`,
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '11px',
          fontFamily: 'monospace',
          boxShadow: isCritical ? '0 0 12px rgba(239, 68, 68, 0.3)' : undefined,
        },
      })

      // Edge from Domain -> Subdomain
      edges.push({
        id: `e-${domainName}-${subId}`,
        source: `domain-${domainName}`,
        target: subId,
        animated: isCritical,
        style: { stroke: isCritical ? '#EF4444' : '#1E2838', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isCritical ? '#EF4444' : '#64748B' },
      })

      // Level 2: IP Address Node
      const ipId = `ip-${asset.id}`
      nodes.push({
        id: ipId,
        position: { x: 550, y: yOffset },
        data: {
          label: asset.ip,
          sublabel: asset.location?.city || 'IP Endpoint',
          nodeType: 'ip',
          severity: asset.severity,
          metadata: { ip: asset.ip, location: asset.location },
        },
        style: {
          background: '#0B0F14',
          color: '#94A3B8',
          border: '1px solid #1E2838',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '10px',
          fontFamily: 'monospace',
        },
      })

      edges.push({
        id: `e-${subId}-${ipId}`,
        source: subId,
        target: ipId,
        style: { stroke: '#1E2838', strokeWidth: 1 },
      })

      // Level 3: Services (First port)
      if (asset.ports.length > 0) {
        const port = asset.ports[0]
        const serviceId = `svc-${asset.id}-${port}`
        nodes.push({
          id: serviceId,
          position: { x: 740, y: yOffset },
          data: {
            label: `Port ${port}`,
            sublabel: asset.services[0]?.name || 'Service',
            nodeType: 'service',
            severity: 'info',
            metadata: asset.services[0],
          },
          style: {
            background: '#151E2B',
            color: '#14B8A6',
            border: '1px solid #14B8A640',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '10px',
            fontFamily: 'monospace',
          },
        })

        edges.push({
          id: `e-${ipId}-${serviceId}`,
          source: ipId,
          target: serviceId,
          style: { stroke: '#14B8A640', strokeWidth: 1 },
        })

        // Level 4: CVEs if critical
        if (asset.cveCount > 0) {
          const matchedCve = mockCVEs.find((c) => c.affectedAssetIds.includes(asset.id))
          if (matchedCve) {
            const cveId = `cve-${matchedCve.id}-${asset.id}`
            nodes.push({
              id: cveId,
              position: { x: 920, y: yOffset },
              data: {
                label: matchedCve.id,
                sublabel: `CVSS ${matchedCve.cvss}`,
                nodeType: 'cve',
                severity: matchedCve.severity,
                metadata: matchedCve,
              },
              style: {
                background: '#450A0A',
                color: '#F87171',
                border: '1.5px solid #EF4444',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
              },
            })

            edges.push({
              id: `e-${serviceId}-${cveId}`,
              source: serviceId,
              target: cveId,
              animated: true,
              style: { stroke: '#EF4444', strokeWidth: 1.8 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#EF4444' },
            })
          }
        }
      }
    })

    return { initialNodes: nodes, initialEdges: edges }
  }, [selectedDomain])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Filter nodes based on user controls
  const filteredNodes = useMemo(() => {
    return initialNodes.filter((node) => {
      if (filterType !== 'all' && node.data.nodeType !== filterType) {
        return false
      }
      if (filterSeverity !== 'all' && node.data.severity !== filterSeverity) {
        return false
      }
      return true
    })
  }, [initialNodes, filterType, filterSeverity])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeData(node.data as NodeData)
  }, [])

  return (
    <div className="space-y-4 h-[calc(100vh-7.5rem)] flex flex-col">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Asset Relationship Graph</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
              Interactive Attack Path
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Topology visualization: Root Domain → Subdomains → IP Endpoints → Exposed Services → Matched CVEs.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs font-mono text-foreground focus:outline-none"
              aria-label="Filter Node Type"
            >
              <option value="all">All Node Types</option>
              <option value="domain">Root Domains</option>
              <option value="subdomain">Subdomains</option>
              <option value="ip">IP Addresses</option>
              <option value="service">Services / Ports</option>
              <option value="cve">Correlated CVEs</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1 text-xs">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent text-xs font-mono text-foreground focus:outline-none"
              aria-label="Filter Severity"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="info">Info / Clean</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas Container */}
      <div className="flex-1 w-full rounded-2xl border border-border bg-[#0B0F14] relative overflow-hidden shadow-2xl">
        <ReactFlow
          nodes={filteredNodes}
          edges={initialEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.2}
          maxZoom={2}
          className="dark"
        >
          <Background color="#1E2838" gap={20} size={1} />
          <Controls className="bg-card border border-border rounded-lg text-foreground" />
          <MiniMap
            nodeColor={(n: any) => {
              if (n.data.severity === 'critical') return '#EF4444'
              if (n.data.severity === 'high') return '#F97316'
              if (n.data.nodeType === 'domain') return '#14B8A6'
              return '#1E2838'
            }}
            maskColor="rgba(11, 15, 20, 0.8)"
            className="border border-border rounded-lg overflow-hidden"
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute top-4 left-4 p-3 rounded-lg border border-border bg-card/90 backdrop-blur-md text-[10px] font-mono space-y-1.5 shadow-lg pointer-events-none">
          <div className="text-[11px] font-bold text-foreground mb-1">Graph Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span className="text-muted-foreground">Domain / Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-muted-foreground">High Risk Asset</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-muted-foreground">Critical Vulnerability (KEV)</span>
          </div>
        </div>

        {/* Node Detail Slide-over Panel */}
        {selectedNodeData && (
          <div className="absolute top-4 right-4 w-80 max-w-[90vw] p-4 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl space-y-3 animate-in slide-in-from-right duration-200 z-50">
            <div className="flex items-start justify-between pb-2 border-b border-border">
              <div>
                <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block">
                  {selectedNodeData.nodeType}
                </span>
                <h3 className="font-mono text-xs font-bold text-foreground break-all">
                  {selectedNodeData.label}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedNodeData.severity && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Assigned Severity:</span>
                <SeverityBadge severity={selectedNodeData.severity} size="sm" />
              </div>
            )}

            {selectedNodeData.sublabel && (
              <p className="text-xs text-muted-foreground font-mono">
                {selectedNodeData.sublabel}
              </p>
            )}

            {selectedNodeData.metadata && (
              <div className="p-2.5 rounded bg-card-subtle text-[11px] font-mono text-muted-foreground space-y-1">
                {selectedNodeData.metadata.ip && (
                  <div>IP: <span className="text-foreground">{selectedNodeData.metadata.ip}</span></div>
                )}
                {selectedNodeData.metadata.ports && (
                  <div>Ports: <span className="text-foreground">{selectedNodeData.metadata.ports.join(', ')}</span></div>
                )}
                {selectedNodeData.metadata.cvss && (
                  <div>CVSS: <span className="text-red-400 font-bold">{selectedNodeData.metadata.cvss}</span></div>
                )}
              </div>
            )}

            {selectedNodeData.nodeType === 'subdomain' && (
              <button
                onClick={() => navigate(`/assets/${selectedNodeData.metadata.id}`)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors"
              >
                <span>Open Asset Detail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {selectedNodeData.nodeType === 'cve' && (
              <button
                onClick={() => navigate(`/cves?search=${encodeURIComponent(selectedNodeData.label)}`)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors"
              >
                <span>View in CVE Feed</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
