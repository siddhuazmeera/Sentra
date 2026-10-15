import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  PlusCircle,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  History,
  Lock,
  X,
  FileCode,
  AlertTriangle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react'
import { getReports, createReport, getAssets, getCVEs } from '@/lib/api'
import { useDomain } from '@/context/DomainContext'
import { useToast } from '@/context/ToastContext'
import { Report, EvidenceAttachment } from '@/types'
import { SentraLogo } from '@/components/ui/SentraLogo'

export const Reports: React.FC = () => {
  const { selectedDomain } = useDomain()
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  // Wizard state
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [reportTitle, setReportTitle] = useState('Cybersecurity Perimeter Incident Brief')
  const [reportType, setReportType] = useState<'executive' | 'technical' | 'cert-in'>('cert-in')
  const [fileFormat, setFileFormat] = useState<'pdf' | 'stix'>('pdf')
  const [incidentDescription, setIncidentDescription] = useState(
    'Disclosed unauthenticated remote code execution vulnerability (CVE-2024-3400) on Internet-exposed perimeter gateway with active threat actor exploitation attempts.'
  )
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(['ast-01', 'ast-23'])
  const [selectedFindingIds, setSelectedFindingIds] = useState<string[]>(['fnd-01', 'fnd-03'])
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceAttachment[]>([
    {
      id: 'ev-new-1',
      name: 'packet_pcap_exploit_trace.pcap',
      size: '1.8 MB',
      timestamp: new Date().toISOString(),
      sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    },
  ])

  // Modals for Audit Log and PDF Viewer
  const [activeAuditReport, setActiveAuditReport] = useState<Report | null>(null)
  const [activePdfReport, setActivePdfReport] = useState<Report | null>(null)
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => getReports(),
  })

  const { data: assetsData } = useQuery({
    queryKey: ['assetsForReport'],
    queryFn: () => getAssets({ limit: 50 }),
  })

  const reportMutation = useMutation({
    mutationFn: (data: any) => createReport(data),
    onSuccess: (newReport) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      setShowWizard(false)
      setWizardStep(1)
      addToast({
        title: 'Report Generated & Stamped',
        description: `Cryptographic SHA-256 seal: ${newReport.sha256Hash.slice(0, 12)}...`,
        type: 'success',
      })
      setActivePdfReport(newReport)
    },
  })

  const handleDownloadStix = (report: Report) => {
    const stixBundle = {
      type: 'bundle',
      id: `bundle--${report.id}`,
      spec_version: '2.1',
      objects: [
        {
          type: 'report',
          id: `report--${report.id}`,
          created: report.generatedAt,
          modified: report.generatedAt,
          name: report.title,
          description: report.incidentDescription || '',
          report_types: [report.type],
          published: report.generatedAt,
          confidence: 95,
          custom_properties: {
            sha256_hash: report.sha256Hash,
            sentra_target_domain: report.targetDomain,
            generator: 'Sentra Threat Intelligence Platform v1.0',
          },
        },
      ],
    }

    const blob = new Blob([JSON.stringify(stixBundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sentra-stix-${report.targetDomain}-${report.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    addToast({
      title: 'STIX 2.1 Bundle Downloaded',
      description: 'Standard machine-readable threat intelligence package saved.',
      type: 'info',
    })
  }

  const handleAddSampleEvidence = () => {
    const randomHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
    const newEv: EvidenceAttachment = {
      id: `ev-${Date.now()}`,
      name: `forensic_scan_dump_${Date.now().toString().slice(-4)}.json`,
      size: '240 KB',
      timestamp: new Date().toISOString(),
      sha256: randomHash,
    }
    setEvidenceFiles((prev) => [...prev, newEv])
    addToast({
      title: 'Evidence File Added',
      description: 'SHA-256 integrity hash calculated.',
      type: 'info',
    })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHash(text)
    addToast({
      title: 'Hash Copied',
      description: 'Cryptographic SHA-256 string copied.',
      type: 'info',
    })
    setTimeout(() => setCopiedHash(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Incident Reports & CERT-In Submissions</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
              Evidence-Backed
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cryptographically sealed incident packages formatted for statutory compliance, C-suite briefing, or Indian Computer Emergency Response Team (CERT-In) reporting.
          </p>
        </div>

        <button
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors shadow-glow-teal"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Reports History Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-card-subtle flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            Report Vault & Chain of Custody
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {reports?.length || 0} Archival Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse dense-table">
            <thead>
              <tr className="border-b border-border bg-card text-muted-foreground">
                <th className="px-4 py-3 text-xs uppercase font-semibold">Report Title</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Type</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Target Domain</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Format</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Status</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold">Cryptographic Hash</th>
                <th className="px-4 py-3 text-xs uppercase font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono text-xs">
              {(reports || []).map((rep) => (
                <tr key={rep.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground font-sans">
                    {rep.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        rep.type === 'cert-in'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : rep.type === 'executive'
                          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {rep.type === 'cert-in' ? 'CERT-In Complaint' : rep.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {rep.targetDomain}
                  </td>
                  <td className="px-4 py-3 uppercase text-teal-400">
                    {rep.fileFormat}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        rep.status === 'submitted'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : rep.status === 'exported'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <span>{rep.sha256Hash.slice(0, 8)}...{rep.sha256Hash.slice(-6)}</span>
                      <button
                        onClick={() => handleCopy(rep.sha256Hash)}
                        className="hover:text-teal-400 p-0.5"
                        title="Copy SHA-256"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActivePdfReport(rep)}
                        className="px-2 py-1 rounded bg-card hover:bg-muted text-foreground border border-border text-xs inline-flex items-center gap-1"
                        title="View Official Report Document"
                      >
                        <Printer className="w-3 h-3 text-teal-400" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => handleDownloadStix(rep)}
                        className="px-2 py-1 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-xs inline-flex items-center gap-1"
                        title="Download STIX 2.1 Package"
                      >
                        <Download className="w-3 h-3" />
                        <span>STIX</span>
                      </button>

                      <button
                        onClick={() => setActiveAuditReport(rep)}
                        className="px-2 py-1 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-xs inline-flex items-center gap-1"
                        title="Audit Log"
                      >
                        <History className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI-STEP REPORT GENERATION WIZARD MODAL */}
      {showWizard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowWizard(false)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-150 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Incident Report Generator — Step {wizardStep} of 3</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate official CERT-In statutory filings, executive briefs, and technical threat packages.
                </p>
              </div>
              <button
                onClick={() => setShowWizard(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: REPORT TYPE & DETAILS */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground block">
                    Report Classification & Template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'cert-in',
                        title: 'Cybercrime / CERT-In',
                        desc: 'Statutory 6-hour incident report format compliant with CERT-In directives.',
                        badge: 'Official Filing',
                      },
                      {
                        id: 'executive',
                        title: 'Executive Brief',
                        desc: 'High-level synthesis for board & C-suite with posture index and trends.',
                        badge: 'C-Level',
                      },
                      {
                        id: 'technical',
                        title: 'Technical Threat Report',
                        desc: 'Granular asset discovery, open ports, banners, and CVSS / EPSS vectors.',
                        badge: 'Engineers',
                      },
                    ].map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setReportType(tpl.id as any)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
                          reportType === tpl.id
                            ? 'border-teal-500 bg-teal-500/10 text-foreground ring-1 ring-teal-500/40'
                            : 'border-border bg-card-subtle hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-foreground">{tpl.title}</span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-teal-500/20 text-teal-400">
                            {tpl.badge}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed mt-1">{tpl.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Export Output Format
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="fileFormat"
                        value="pdf"
                        checked={fileFormat === 'pdf'}
                        onChange={() => setFileFormat('pdf')}
                        className="text-teal-500 focus:ring-teal-500/30"
                      />
                      <span className="font-mono text-xs">PDF Document (with Sentra Header & Watermark)</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="radio"
                        name="fileFormat"
                        value="stix"
                        checked={fileFormat === 'stix'}
                        onChange={() => setFileFormat('stix')}
                        className="text-teal-500 focus:ring-teal-500/30"
                      />
                      <span className="font-mono text-xs">STIX 2.1 Threat Bundle JSON</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT ASSETS & FINDINGS */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Select Target Assets to Include</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {selectedAssetIds.length} assets selected
                    </span>
                  </label>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border bg-card-subtle p-2">
                    {(assetsData?.assets || []).map((ast) => {
                      const isChecked = selectedAssetIds.includes(ast.id)
                      return (
                        <label
                          key={ast.id}
                          className="py-2 px-2 flex items-center justify-between text-xs font-mono hover:bg-muted/40 cursor-pointer rounded"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedAssetIds(
                                  e.target.checked
                                    ? [...selectedAssetIds, ast.id]
                                    : selectedAssetIds.filter((id) => id !== ast.id)
                                )
                              }}
                              className="rounded border-border text-teal-500"
                            />
                            <span className="font-semibold text-foreground">{ast.asset}</span>
                            <span className="text-muted-foreground text-[10px]">({ast.ip})</span>
                          </div>
                          <span className="text-[10px] text-teal-400">Risk: {ast.riskScore}/100</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Incident Narrative & Executive Description
                  </label>
                  <textarea
                    rows={4}
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: EVIDENCE ATTACHMENTS & FINAL SEAL */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Cryptographic Evidence Attachments
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSampleEvidence}
                      className="text-xs text-teal-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Attach Simulated Forensic File</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {evidenceFiles.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg border border-border bg-card-subtle flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-teal-400" />
                            <span className="font-semibold text-foreground">{ev.name}</span>
                            <span className="text-muted-foreground text-[10px]">({ev.size})</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-sm">
                            SHA-256: {ev.sha256}
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          Hashed ✓
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Final seal summary box */}
                <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-950/20 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-teal-400 font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sentra Cryptographic Audit Guarantee</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    Upon generating this report, Sentra will compute an immutable SHA-256 hash of all findings, assets, and attached forensic evidence files to satisfy CERT-In chain-of-custody statutory requirements.
                  </p>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => (s - 1) as any)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Back
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep((s) => (s + 1) as any)}
                  className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors shadow-glow-teal flex items-center gap-1.5"
                >
                  <span>Continue to Step {wizardStep + 1}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    reportMutation.mutate({
                      title: reportTitle,
                      type: reportType,
                      targetDomain: selectedDomain === 'all' ? 'acme-defense.io' : selectedDomain,
                      incidentDescription,
                      selectedAssetIds,
                      selectedFindingIds,
                      evidenceAttachments: evidenceFiles,
                      fileFormat,
                    })
                  }
                  disabled={reportMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs transition-all shadow-glow-teal flex items-center gap-1.5"
                >
                  <span>{reportMutation.isPending ? 'Computing Cryptographic Seal...' : 'Generate & Stamp Report'}</span>
                  <Lock className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAIN OF CUSTODY AUDIT LOG MODAL */}
      {activeAuditReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveAuditReport(null)}
        >
          <div
            className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-400" />
                  <span>Chain of Custody Audit Log</span>
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Report ID: {activeAuditReport.id}
                </span>
              </div>
              <button
                onClick={() => setActiveAuditReport(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-card-subtle border border-border text-xs font-mono space-y-1">
              <span className="text-[10px] text-muted-foreground block uppercase font-bold">
                Immutable Integrity Hash
              </span>
              <p className="text-teal-400 break-all select-all">{activeAuditReport.sha256Hash}</p>
            </div>

            <div className="divide-y divide-border/60">
              {activeAuditReport.auditLog.map((log, idx) => (
                <div key={idx} className="py-2.5 text-xs font-mono space-y-0.5">
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span>{log.action}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                    <span>Actor: {log.user}</span>
                    {log.hash && <span>Signature: {log.hash.slice(0, 10)}...</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL SENTRA REPORT DOCUMENT / PDF PRINTABLE VIEW */}
      {activePdfReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActivePdfReport(null)}
        >
          <div
            className="w-full max-w-3xl bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[92vh] space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Document Action Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800 uppercase">
                  {activePdfReport.type === 'cert-in' ? 'CERT-In Complaint Form' : 'Official Report'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Document ID: {activePdfReport.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setActivePdfReport(null)}
                  className="p-1 text-slate-500 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Report Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <SentraLogo variant="full" size="lg" accentColor="#0D9488" />
                <p className="text-[11px] text-slate-500 font-mono mt-1">
                  Sentra Threat Intelligence & Attack Surface Reconstruction
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Generated at {new Date(activePdfReport.generatedAt).toUTCString()}
                </p>
              </div>

              <div className="text-right text-xs font-mono">
                <span className="font-bold text-slate-900 block uppercase">
                  CONFIDENTIAL / LAWFUL DISCLOSURE
                </span>
                <span className="text-slate-500 text-[11px]">
                  Ref: CERT-IN/INC/{activePdfReport.id.toUpperCase()}
                </span>
                <span className="text-emerald-700 font-bold block text-[11px] mt-0.5">
                  STATUS: {activePdfReport.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Document Title */}
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {activePdfReport.title}
              </h1>
              <p className="text-xs text-slate-600 font-mono mt-1">
                Target Domain: <span className="font-bold text-slate-900">{activePdfReport.targetDomain}</span>
              </p>
            </div>

            {/* Incident Summary */}
            <div className="space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                1. Executive Narrative & Impact Assessment
              </h2>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
                {activePdfReport.incidentDescription || 'Active threat reconnaissance identified unpatched vulnerabilities.'}
              </div>
            </div>

            {/* Forensic Evidence Table */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                2. Forensic Evidence & Cryptographic Hashes
              </h2>
              <div className="rounded border border-slate-200 overflow-hidden text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Artifact Name</th>
                      <th className="p-2">Size</th>
                      <th className="p-2">Timestamp</th>
                      <th className="p-2">SHA-256 Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {(activePdfReport.evidenceAttachments || []).map((ev) => (
                      <tr key={ev.id}>
                        <td className="p-2 font-bold text-slate-900">{ev.name}</td>
                        <td className="p-2 text-slate-600">{ev.size}</td>
                        <td className="p-2 text-slate-600">{new Date(ev.timestamp).toLocaleTimeString()}</td>
                        <td className="p-2 text-slate-500 break-all">{ev.sha256.slice(0, 20)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Compliance Stamp */}
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between font-mono text-xs text-teal-900">
              <div>
                <span className="font-bold block">Digital Chain-of-Custody Stamp</span>
                <span className="text-[10px] text-teal-700 break-all block">
                  SHA-256: {activePdfReport.sha256Hash}
                </span>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-teal-600 border-dashed flex items-center justify-center text-[10px] font-bold text-teal-800 rotate-[-12deg]">
                VERIFIED
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
