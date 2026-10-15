import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  Radar,
  Lock,
  Unlock,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Server,
  ArrowRight,
  Globe,
  Radio,
  FileSearch,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import { useDomain } from '@/context/DomainContext'
import {
  startScan,
  verifyDomainOwnership,
  getDomainVerificationDetails,
} from '@/lib/api'
import { ScanJob, ScanSourceStatus } from '@/types'

export const NewScan: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { setSelectedDomain } = useDomain()

  // Form State
  const [domain, setDomain] = useState('acme-defense.io')
  const [domainError, setDomainError] = useState<string | null>(null)
  const [scanType, setScanType] = useState<'passive' | 'deep'>('passive')

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [verificationData, setVerificationData] = useState<{
    recordType: string
    name: string
    value: string
  }>({
    recordType: 'TXT',
    name: '_sentra-verify.acme-defense.io',
    value: 'sentra-verification=YWNtZS1kZWZlbnNlLmlv',
  })

  // Scan Execution State
  const [currentScan, setCurrentScan] = useState<ScanJob | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanLogs, setScanLogs] = useState<string[]>([])

  // Domain format validation
  const validateDomain = (value: string): boolean => {
    let clean = value.trim().toLowerCase()
    // strip protocol
    clean = clean.replace(/^(https?:\/\/)/, '')
    // strip paths/ports
    clean = clean.split('/')[0].split(':')[0]

    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
    if (!clean) {
      setDomainError('Domain name is required.')
      return false
    }
    if (!domainRegex.test(clean)) {
      setDomainError('Please enter a valid FQDN domain name (e.g. corp.example.com).')
      return false
    }
    setDomainError(null)
    return true
  }

  // Update verification info when domain changes
  useEffect(() => {
    let clean = domain.trim().toLowerCase().replace(/^(https?:\/\/)/, '').split('/')[0].split(':')[0]
    if (clean && !domainError) {
      getDomainVerificationDetails(clean).then((info) => {
        setIsVerified(info.verified)
        setVerificationData({
          recordType: info.recordType,
          name: info.name,
          value: info.value,
        })
        if (!info.verified && scanType === 'deep') {
          setScanType('passive')
        }
      })
    }
  }, [domain])

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setDomain(val)
    validateDomain(val)
  }

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    addToast({
      title: 'Copied to Clipboard',
      description: `${fieldName} copied.`,
      type: 'info',
    })
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleVerifyDns = async () => {
    if (!validateDomain(domain)) return

    setIsVerifying(true)
    try {
      const res = await verifyDomainOwnership(domain.trim())
      setIsVerified(res.verified)
      addToast({
        title: 'Ownership Confirmed',
        description: res.message,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Verification Failed',
        description: err.message || 'TXT record not yet propagated.',
        type: 'error',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleStartScan = async () => {
    if (!validateDomain(domain)) return

    if (scanType === 'deep' && !isVerified) {
      addToast({
        title: 'Deep Scan Restricted',
        description: 'Verify domain ownership via DNS TXT record before running active deep scans.',
        type: 'warning',
      })
      return
    }

    setIsScanning(true)
    setScanLogs([])

    try {
      const job = await startScan(domain.trim(), scanType)
      setCurrentScan(job)
      addToast({
        title: 'Scan Initialized',
        description: `Running ${scanType} attack surface discovery on ${domain}`,
        type: 'info',
      })

      // Simulate step-by-step progress pipeline
      simulateScanPipeline(job)
    } catch (err: any) {
      setIsScanning(false)
      addToast({
        title: 'Scan Failed',
        description: err.message || 'Unable to launch scan job.',
        type: 'error',
      })
    }
  }

  // Simulated scan lifecycle with live progress
  const simulateScanPipeline = (initialJob: ScanJob) => {
    let current = { ...initialJob }

    const appendLog = (msg: string) => {
      setScanLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
    }

    appendLog(`Initializing ${scanType.toUpperCase()} scanner pipeline for ${domain}...`)

    // Stage 1: crt.sh
    setTimeout(() => {
      appendLog('Querying Certificate Transparency logs from crt.sh...')
      current = {
        ...current,
        sources: {
          ...current.sources,
          crtsh: { status: 'running', message: 'Parsing 1,420 SAN records...' },
        },
      }
      setCurrentScan(current)
    }, 600)

    // Stage 2: crt.sh done, Shodan running
    setTimeout(() => {
      appendLog('crt.sh finished. Extracted 14 unique active subdomains.')
      current = {
        ...current,
        sources: {
          ...current.sources,
          crtsh: { status: 'done', count: 14, message: '14 subdomains extracted' },
          shodan: { status: 'running', message: 'Querying open ports & banners...' },
        },
        summary: { ...current.summary!, discoveredSubdomains: 14 },
      }
      setCurrentScan(current)
    }, 1600)

    // Stage 3: Shodan done, VirusTotal & HIBP running
    setTimeout(() => {
      appendLog('Shodan query resolved. Identified 18 open listening ports.')
      current = {
        ...current,
        sources: {
          ...current.sources,
          shodan: { status: 'done', count: 18, message: '18 open ports fingerprinted' },
          virustotal: { status: 'running', message: 'Checking IP reputation & blacklists...' },
          hibp: { status: 'running', message: 'Checking HaveIBeenPwned breach feeds...' },
        },
        summary: { ...current.summary!, openPorts: 18 },
      }
      setCurrentScan(current)
    }, 2800)

    // Stage 4: VirusTotal & HIBP done, NVD running
    setTimeout(() => {
      appendLog('VirusTotal completed: 2 IP addresses flagged with suspicious reputation.')
      appendLog('HIBP check completed: 2 corporate accounts breached in known dumps.')
      current = {
        ...current,
        sources: {
          ...current.sources,
          virustotal: { status: 'done', count: 2, message: '2 flagged reputations' },
          hibp: { status: 'done', count: 2, message: '2 identity breach matches' },
          nvd: { status: 'running', message: 'Matching software banners against NVD CVEs...' },
        },
      }
      setCurrentScan(current)
    }, 4200)

    // Stage 5: All done
    setTimeout(() => {
      appendLog('NVD correlation complete. 3 high/critical CVEs mapped to active services.')
      appendLog('Attack surface reconstruction finished. Inventory updated.')
      current = {
        ...current,
        status: 'completed',
        completedAt: new Date().toISOString(),
        sources: {
          ...current.sources,
          nvd: { status: 'done', count: 3, message: '3 CVEs correlated' },
        },
        summary: {
          discoveredSubdomains: 14,
          discoveredIPs: 8,
          openPorts: 18,
          criticalCVEs: 3,
        },
      }
      setCurrentScan(current)
      setIsScanning(false)
      addToast({
        title: 'Scan Finished Successfully',
        description: 'Recon data aggregated and added to inventory.',
        type: 'success',
      })
    }, 5600)
  }

  const renderSourceBadge = (status: ScanSourceStatus) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" /> Running
          </span>
        )
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
            <Clock className="w-3 h-3" /> Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-3 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>New Attack Surface Recon Scan</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
            Target Scanner
          </span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Aggregate subdomains, listening ports, IP reputations, identity breaches, and matching CVEs.
        </p>
      </div>

      {/* Prominent Legal & Authorization Notice */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-200 flex items-start gap-3 shadow-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-amber-300">
            Important Compliance Notice
          </p>
          <p className="mt-0.5 text-amber-200/90">
            Only scan domains you own or have explicit written permission to test. Unauthorized port scanning or penetrative probing may violate the Computer Fraud and Abuse Act (CFAA), CERT-In regulatory mandates, and other applicable cybersecurity laws.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Target, Verification & Scan Config (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Domain Input Card */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Target Domain
              </label>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>Presets:</span>
                {['acme-defense.io', 'cloudfin-systems.net', 'nexus-infra.org'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setDomain(preset)
                      validateDomain(preset)
                    }}
                    className="text-teal-400 hover:underline font-mono ml-1"
                  >
                    {preset.split('.')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="relative">
                <Globe className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={domain}
                  onChange={handleDomainChange}
                  placeholder="e.g. acme-defense.io"
                  disabled={isScanning}
                  className={`w-full bg-card border rounded-lg pl-9 pr-24 py-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-2 transition-all ${
                    domainError
                      ? 'border-red-500 focus:ring-red-500/30'
                      : 'border-border focus:ring-teal-500/40 focus:border-teal-500'
                  }`}
                  aria-label="Domain Name"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <ShieldAlert className="w-3 h-3" /> Unverified
                    </span>
                  )}
                </div>
              </div>
              {domainError && (
                <p className="text-[11px] text-red-400 mt-1.5 font-mono">{domainError}</p>
              )}
            </div>

            {/* DNS TXT Record Verification Panel */}
            <div className="p-4 rounded-lg border border-border/80 bg-card-subtle/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>Domain Ownership Verification</span>
                    {isVerified ? (
                      <span className="text-[10px] font-mono text-emerald-400 font-normal">
                        (Active Ownership Proof)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400 font-normal">
                        (Required for Deep Scan)
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Add this DNS TXT record to prove domain administrative control.
                  </p>
                </div>

                <button
                  onClick={handleVerifyDns}
                  disabled={isVerifying || isScanning}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-card hover:bg-muted border border-border text-xs font-medium text-foreground transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-teal-400' : ''}`} />
                  <span>{isVerifying ? 'Checking DNS...' : 'Verify DNS'}</span>
                </button>
              </div>

              {/* TXT Record Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-card border border-border">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>HOST / NAME</span>
                    <button
                      onClick={() => handleCopy(verificationData.name, 'Host')}
                      className="hover:text-teal-400"
                      title="Copy host"
                    >
                      {copiedField === 'Host' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-foreground text-[11px] truncate select-all">{verificationData.name}</div>
                </div>

                <div className="p-2.5 rounded bg-card border border-border">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>TYPE & VALUE</span>
                    <button
                      onClick={() => handleCopy(verificationData.value, 'Value')}
                      className="hover:text-teal-400"
                      title="Copy value"
                    >
                      {copiedField === 'Value' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="text-foreground text-[11px] truncate select-all">{verificationData.value}</div>
                </div>
              </div>
            </div>

            {/* Scan Mode Options */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                Scan Profile
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Passive Recon (Default) */}
                <div
                  onClick={() => !isScanning && setScanType('passive')}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all select-none ${
                    scanType === 'passive'
                      ? 'border-teal-500 bg-teal-500/10 text-foreground ring-1 ring-teal-500/40'
                      : 'border-border bg-card hover:bg-muted/40 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5 text-teal-400" /> Passive OSINT (Default)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-400">
                      Safe
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Zero packets sent to target. Uses Certificate Transparency logs, Shodan indexes, and threat databases.
                  </p>
                </div>

                {/* Deep Active Scan (Locked unless verified) */}
                <div
                  onClick={() => {
                    if (isScanning) return
                    if (!isVerified) {
                      addToast({
                        title: 'Verification Required',
                        description: 'Please verify DNS TXT ownership before unlocking active deep scan mode.',
                        type: 'warning',
                      })
                      return
                    }
                    setScanType('deep')
                  }}
                  className={`p-3.5 rounded-lg border transition-all select-none ${
                    !isVerified
                      ? 'border-border/60 bg-muted/30 text-muted-foreground cursor-not-allowed opacity-75'
                      : scanType === 'deep'
                      ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/40 cursor-pointer'
                      : 'border-border bg-card hover:bg-muted/40 text-muted-foreground cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      {isVerified ? (
                        <Radar className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span>Deep Active Probing</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isVerified
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isVerified ? 'Active Probing' : 'Locked'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Active TCP SYN port probes, banner grabbing, TLS cipher audits. Locked until ownership is verified.
                  </p>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                onClick={handleStartScan}
                disabled={isScanning || !domain.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all shadow-glow-teal"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Aggregating Recon Feeds in Background...</span>
                  </>
                ) : (
                  <>
                    <Radar className="w-4 h-4" />
                    <span>Launch Attack Surface Recon</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scan Sources Progress & Live Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Per-Source Status Card */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <span>Data Source Pipeline</span>
                {isScanning && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                )}
              </h2>
              <span className="text-[10px] font-mono text-muted-foreground">
                5 Feed Engines
              </span>
            </div>

            <div className="space-y-3">
              {/* crt.sh */}
              <div className="p-3 rounded-lg border border-border/80 bg-card-subtle/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">crt.sh</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Certificate Transparency</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {currentScan?.sources.crtsh.message || 'Passive public SSL/TLS SAN logs'}
                  </p>
                </div>
                {renderSourceBadge(currentScan?.sources.crtsh.status || 'pending')}
              </div>

              {/* Shodan */}
              <div className="p-3 rounded-lg border border-border/80 bg-card-subtle/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">Shodan</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Internet Telemetry</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {currentScan?.sources.shodan.message || 'Exposed listening services & host banners'}
                  </p>
                </div>
                {renderSourceBadge(currentScan?.sources.shodan.status || 'pending')}
              </div>

              {/* VirusTotal */}
              <div className="p-3 rounded-lg border border-border/80 bg-card-subtle/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">VirusTotal</span>
                    <span className="text-[10px] text-muted-foreground font-mono">IP Reputation</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {currentScan?.sources.virustotal.message || 'Threat engine verdicts & blocklists'}
                  </p>
                </div>
                {renderSourceBadge(currentScan?.sources.virustotal.status || 'pending')}
              </div>

              {/* HaveIBeenPwned */}
              <div className="p-3 rounded-lg border border-border/80 bg-card-subtle/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">HIBP</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Breach Monitor</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {currentScan?.sources.hibp.message || 'Identity breach dump correlation'}
                  </p>
                </div>
                {renderSourceBadge(currentScan?.sources.hibp.status || 'pending')}
              </div>

              {/* NVD */}
              <div className="p-3 rounded-lg border border-border/80 bg-card-subtle/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">NVD / CISA KEV</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Vulnerability Feed</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {currentScan?.sources.nvd.message || 'Automated CVE matching & EPSS scores'}
                  </p>
                </div>
                {renderSourceBadge(currentScan?.sources.nvd.status || 'pending')}
              </div>
            </div>

            {/* Scan Summary Completion Card */}
            {currentScan?.status === 'completed' && (
              <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-foreground space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Discovery Completed
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Domain: {currentScan.domain}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-card/60 border border-border">
                    <span className="text-muted-foreground text-[10px] block">Subdomains</span>
                    <span className="text-sm font-bold text-foreground">
                      {currentScan.summary?.discoveredSubdomains || 14}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card/60 border border-border">
                    <span className="text-muted-foreground text-[10px] block">Open Ports</span>
                    <span className="text-sm font-bold text-teal-400">
                      {currentScan.summary?.openPorts || 18}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card/60 border border-border">
                    <span className="text-muted-foreground text-[10px] block">IP Endpoints</span>
                    <span className="text-sm font-bold text-foreground">
                      {currentScan.summary?.discoveredIPs || 8}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card/60 border border-border">
                    <span className="text-muted-foreground text-[10px] block">Critical CVEs</span>
                    <span className="text-sm font-bold text-red-500">
                      {currentScan.summary?.criticalCVEs || 3}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDomain(currentScan.domain)
                    navigate(`/assets?domain=${currentScan.domain}`)
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors"
                >
                  <span>Explore in Asset Inventory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Live Scanner Log Ticker */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-teal-400" /> Scanner Audit Trail
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {scanLogs.length} events
              </span>
            </div>

            <div className="h-36 overflow-y-auto bg-background/90 rounded p-2.5 font-mono text-[11px] text-muted-foreground border border-border space-y-1">
              {scanLogs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground/60 text-xs">
                  Ready. Configure domain and click "Launch Attack Surface Recon".
                </div>
              ) : (
                scanLogs.map((log, i) => (
                  <div key={i} className="leading-tight text-foreground/80 break-words">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
