import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings as SettingsIcon,
  User,
  KeyRound,
  Database,
  Users,
  Sun,
  Moon,
  PlusCircle,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  RefreshCw,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react'
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getDataSources,
  updateDataSourceKey,
  getTeamMembers,
  inviteTeamMember,
} from '@/lib/api'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { ApiKey, DataSourceConfig, TeamMember } from '@/types'

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'profile' | 'apikeys' | 'datasources' | 'team' | 'theme'>('apikeys')

  // API Key generation modal state
  const [showGenerateKeyModal, setShowGenerateKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyRole, setNewKeyRole] = useState<'Admin' | 'Analyst' | 'Viewer'>('Analyst')
  const [createdKey, setCreatedKey] = useState<ApiKey | null>(null) // Show once
  const [copiedKey, setCopiedKey] = useState(false)

  // Data Sources local state
  const [editingDataSourceId, setEditingDataSourceId] = useState<string | null>(null)
  const [customKeyInput, setCustomKeyInput] = useState('')
  const [showKeyText, setShowKeyText] = useState(false)

  // Team invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Analyst' | 'Viewer'>('Analyst')

  // Queries
  const { data: apiKeys } = useQuery({ queryKey: ['apiKeys'], queryFn: getApiKeys })
  const { data: dataSources } = useQuery({ queryKey: ['dataSources'], queryFn: getDataSources })
  const { data: teamMembers } = useQuery({ queryKey: ['teamMembers'], queryFn: getTeamMembers })

  // Mutations
  const generateKeyMutation = useMutation({
    mutationFn: (params: any) => createApiKey(params),
    onSuccess: (newKey) => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
      setShowGenerateKeyModal(false)
      setCreatedKey(newKey)
      setNewKeyName('')
      addToast({
        title: 'API Key Created',
        description: 'New token generated with sn_live_ prefix.',
        type: 'success',
      })
    },
  })

  const revokeKeyMutation = useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
      addToast({
        title: 'API Key Revoked',
        description: 'Token has been permanently invalidated.',
        type: 'success',
      })
    },
  })

  const updateSourceMutation = useMutation({
    mutationFn: ({ id, key }: { id: string; key: string }) => updateDataSourceKey(id, key),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      setEditingDataSourceId(null)
      setCustomKeyInput('')
      addToast({
        title: 'Data Source Updated',
        description: `${updated.name} API key verified.`,
        type: 'success',
      })
    },
  })

  const inviteMemberMutation = useMutation({
    mutationFn: (params: any) => inviteTeamMember(params),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] })
      setShowInviteModal(false)
      setInviteName('')
      setInviteEmail('')
      addToast({
        title: 'Invitation Sent',
        description: `Invite sent to ${member.email}.`,
        type: 'success',
      })
    },
  })

  const handleCopyNewKey = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    addToast({
      title: 'API Key Copied',
      description: 'Store this key in your secure password manager.',
      type: 'info',
    })
    setTimeout(() => setCopiedKey(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <span>Settings & Configuration</span>
          <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
            Console Controls
          </span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage API keys (prefixed with sn), external threat data feeds, team access roles, and platform appearance.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 text-xs font-medium" aria-label="Settings Tabs">
          {[
            { id: 'apikeys', label: 'API Keys (sn_live_...)', icon: KeyRound },
            { id: 'datasources', label: 'Connected Threat Feeds', icon: Database },
            { id: 'team', label: 'Team Members & Roles', icon: Users },
            { id: 'profile', label: 'User Profile', icon: User },
            { id: 'theme', label: 'Appearance & Theme', icon: Sun },
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

      {/* TAB 1: API KEYS (PREFIX: sn_live_ / sn_test_) */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Programmatic API Access</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  Prefix: sn_live_
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xl">
                API keys authorize automated reconnaissance pipelines, CI/CD security gates, and SIEM forwarders. Keys use the mandatory <code className="text-teal-400 font-mono">sn_live_</code> or <code className="text-teal-400 font-mono">sn_test_</code> prefix.
              </p>
            </div>

            <button
              onClick={() => setShowGenerateKeyModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors shadow-glow-teal shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Generate New API Key</span>
            </button>
          </div>

          {/* API Keys Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse dense-table">
              <thead>
                <tr className="border-b border-border bg-card-subtle text-muted-foreground">
                  <th className="px-4 py-3 text-xs uppercase font-semibold">Key Identifier</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold">Token Pattern</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold">Role Scope</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold">Created</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold">Last Used</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-xs">
                {(apiKeys || []).map((key) => (
                  <tr key={key.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground font-sans">
                      {key.name}
                    </td>
                    <td className="px-4 py-3 text-teal-400 font-bold">
                      {key.keyMasked}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-muted border border-border text-foreground font-semibold">
                        {key.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {key.lastUsed}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => revokeKeyMutation.mutate(key.id)}
                        className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Revoke Token"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONNECTED DATA SOURCES (ENTER-YOUR-OWN-API-KEY) */}
      {activeTab === 'datasources' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <h2 className="text-sm font-bold text-foreground">
              Bring Your Own API Keys (BYOK)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect your commercial reconnaissance accounts to lift query rate limits and query deep private telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(dataSources || []).map((ds) => {
              const isEditing = editingDataSourceId === ds.id

              return (
                <div
                  key={ds.id}
                  className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                        {ds.name}
                      </h3>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {ds.service.toUpperCase()} API Integration
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        ds.connected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}
                    >
                      {ds.connected ? 'Connected ✓' : 'Unconfigured'}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="relative">
                        <input
                          type={showKeyText ? 'text' : 'password'}
                          value={customKeyInput}
                          onChange={(e) => setCustomKeyInput(e.target.value)}
                          placeholder="Paste your API key here..."
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 pr-8 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeyText(!showKeyText)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingDataSourceId(null)}
                          className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSourceMutation.mutate({ id: ds.id, key: customKeyInput })}
                          className="px-3 py-1 rounded bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs"
                        >
                          Verify & Save Key
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-mono">
                      <span className="text-muted-foreground text-[11px]">
                        {ds.apiKey ? `${ds.apiKey.slice(0, 8)}••••••••` : 'No API key set'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingDataSourceId(ds.id)
                          setCustomKeyInput(ds.apiKey || '')
                        }}
                        className="text-teal-400 hover:underline font-medium text-[11px]"
                      >
                        {ds.connected ? 'Update Key' : 'Configure Key'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TEAM MEMBERS & ROLES */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Team Access Control & Roles
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign granular permissions: Admin (Full configuration), Analyst (Scans & Triage), Viewer (Read-only reports).
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors shadow-glow-teal shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Invite Member</span>
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse dense-table">
              <thead>
                <tr className="border-b border-border bg-card-subtle text-muted-foreground">
                  <th className="px-4 py-3 text-xs uppercase font-semibold">User</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold">Role</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold">MFA Status</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold">Last Active</th>
                  <th className="px-4 py-3 text-xs uppercase font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono text-xs">
                {(teamMembers || []).map((m) => (
                  <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-sans">
                      <span className="font-semibold text-foreground block">{m.name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{m.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.twoFactorEnabled ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" /> FIDO2 Active
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Not Enforced
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.lastActive}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-muted border border-border text-foreground">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROFILE */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 max-w-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-teal-500/10 border-2 border-teal-500/40 flex items-center justify-center font-bold text-lg text-teal-400">
              SN
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">SecOps Lead Analyst</h2>
              <p className="text-xs text-muted-foreground font-mono">analyst@sentra.sec</p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 mt-1">
                Admin Privilege Level 15
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border space-y-3 text-xs font-mono">
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase">Assigned Scope</span>
              <span className="text-foreground">Global Perimeter (3 Target Domains)</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block uppercase">Security Compliance Standard</span>
              <span className="text-foreground">CERT-In 6-Hour Statutory Reporting</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: THEME & DISPLAY */}
      {activeTab === 'theme' && (
        <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4 max-w-xl animate-in fade-in duration-150">
          <h2 className="text-sm font-bold text-foreground">
            Display Mode & Console Preferences
          </h2>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card-subtle">
            <div>
              <span className="font-semibold text-xs text-foreground block">
                Active Color Theme: {theme === 'dark' ? 'Dark Security Operations (#0B0F14)' : 'Light Mode'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                Teal (#14B8A6) primary accents with high-density data contrast.
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      )}

      {/* GENERATE API KEY MODAL */}
      {showGenerateKeyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowGenerateKeyModal(false)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-400" />
                <span>Create Sentra API Key</span>
              </h3>
              <button
                onClick={() => setShowGenerateKeyModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Key Name / Purpose
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. GitHub Actions Recon Scanner"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Assigned Role
                </label>
                <select
                  value={newKeyRole}
                  onChange={(e) => setNewKeyRole(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                >
                  <option value="Admin">Admin (Full Read / Write / Scans)</option>
                  <option value="Analyst">Analyst (Read / Triage / Reports)</option>
                  <option value="Viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="p-3 rounded-lg border border-teal-500/30 bg-teal-950/20 text-[11px] text-muted-foreground leading-relaxed">
                Token will be assigned prefix <code className="text-teal-400 font-mono font-bold">sn_live_</code>.
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGenerateKeyModal(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newKeyName.trim()}
                onClick={() =>
                  generateKeyMutation.mutate({
                    name: newKeyName,
                    role: newKeyRole,
                    scopes: ['assets:read', 'scans:trigger'],
                  })
                }
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-semibold text-xs shadow-glow-teal"
              >
                Generate Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "SHOW ONCE" NEW API KEY CREATION DIALOG */}
      {createdKey && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setCreatedKey(null)}
        >
          <div
            className="w-full max-w-lg bg-card border border-teal-500/40 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>API Key Successfully Generated</span>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-200 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                Please copy and store this API key now. For your security, this full token will never be displayed again.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between gap-2 font-mono text-xs">
              <span className="text-teal-400 font-bold select-all break-all">
                {createdKey.fullKey}
              </span>
              <button
                onClick={() => handleCopyNewKey(createdKey.fullKey!)}
                className="px-3 py-1.5 rounded bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs shrink-0 flex items-center gap-1 shadow-glow-teal"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setCreatedKey(null)}
                className="px-4 py-2 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold"
              >
                I have securely saved this key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE TEAM MEMBER MODAL */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span>Invite Team Analyst</span>
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="j.hayes@enterprise.sec"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40"
                >
                  <option value="Admin">Admin</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!inviteEmail.trim() || !inviteName.trim()}
                onClick={() =>
                  inviteMemberMutation.mutate({
                    name: inviteName,
                    email: inviteEmail,
                    role: inviteRole,
                  })
                }
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-semibold text-xs shadow-glow-teal"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
