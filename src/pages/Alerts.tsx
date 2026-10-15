import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  SlidersHorizontal,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react'
import {
  getAlerts,
  updateAlertStatus,
  getNotificationChannels,
  updateNotificationChannel,
} from '@/lib/api'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import { TableRowSkeleton } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/context/ToastContext'
import { Alert, Severity, NotificationChannel } from '@/types'
import { formatRelativeTime } from '@/lib/utils'

export const Alerts: React.FC = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'acknowledged' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')
  const [showChannelsModal, setShowChannelsModal] = useState(false)

  const { data: alerts, isLoading, isError, refetch } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts(),
  })

  const { data: channels, refetch: refetchChannels } = useQuery({
    queryKey: ['notificationChannels'],
    queryFn: () => getNotificationChannels(),
  })

  const alertMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'acknowledged' | 'resolved' }) =>
      updateAlertStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      addToast({
        title: 'Alert Status Updated',
        description: `Alert marked as ${updated.status}.`,
        type: 'success',
      })
    },
  })

  const channelMutation = useMutation({
    mutationFn: ({ channel, updates }: { channel: string; updates: Partial<NotificationChannel> }) =>
      updateNotificationChannel(channel, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationChannels'] })
      addToast({
        title: 'Notification Settings Saved',
        description: 'Alert delivery rules updated.',
        type: 'success',
      })
    },
  })

  const filteredAlerts = (alerts || []).filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Security Alerts & Event Triage</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
              {alerts?.length ?? '...'} Alerts
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time perimeter telemetry, critical exposure alarms, and third-party notification rules.
          </p>
        </div>

        <button
          onClick={() => setShowChannelsModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card hover:bg-muted text-xs font-medium text-foreground transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
          <span>Configure Notification Channels</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status filters */}
        <div className="flex items-center gap-1 bg-card-subtle p-1 rounded-lg border border-border/80 text-xs font-mono">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'new', label: 'New' },
            { id: 'acknowledged', label: 'Acknowledged' },
            { id: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === tab.id
                  ? 'bg-card text-teal-400 font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs font-mono text-foreground focus:outline-none"
            aria-label="Filter Severity"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-card">
              <TableRowSkeleton cols={4} />
            </div>
          ))
        ) : filteredAlerts.length === 0 ? (
          <EmptyState
            title="No Alerts Match Filter"
            description="All clear for the selected status and severity parameters."
          />
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-xl border border-border bg-card shadow-sm hover:border-teal-500/30 transition-colors space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="pt-0.5">
                    <SeverityBadge severity={alert.severity} size="sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {alert.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-muted-foreground flex-wrap">
                      <span>Target: <span className="text-teal-400">{alert.targetAsset || 'Global'}</span></span>
                      <span>·</span>
                      <span className="uppercase text-[10px] px-1.5 py-0.2 rounded bg-muted border border-border">
                        {alert.category}
                      </span>
                      <span>·</span>
                      <span>{formatRelativeTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {alert.status === 'new' && (
                    <button
                      onClick={() => alertMutation.mutate({ id: alert.id, status: 'acknowledged' })}
                      className="px-2.5 py-1 rounded bg-card-subtle hover:bg-muted text-xs font-mono font-medium text-foreground border border-border transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => alertMutation.mutate({ id: alert.id, status: 'resolved' })}
                      className="px-2.5 py-1 rounded bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-mono font-medium border border-teal-500/30 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {alert.status === 'resolved' && (
                    <button
                      onClick={() => alertMutation.mutate({ id: alert.id, status: 'acknowledged' })}
                      className="px-2.5 py-1 rounded bg-card hover:bg-muted text-muted-foreground text-xs font-mono border border-border"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground pl-7 leading-relaxed font-sans">
                {alert.message}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Notification Channels Modal / Drawer */}
      {showChannelsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowChannelsModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-teal-400" />
                  <span>Notification Delivery Channels</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Route real-time alerts to SIEM, messaging webhooks, and incident escalation channels.
                </p>
              </div>
              <button
                onClick={() => setShowChannelsModal(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(channels || []).map((ch) => {
                const icon = {
                  email: Mail,
                  telegram: Send,
                  slack: MessageSquare,
                  whatsapp: Smartphone,
                }[ch.channel]
                const Icon = icon || Bell

                return (
                  <div key={ch.channel} className="p-4 rounded-xl border border-border bg-card-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs uppercase text-foreground">
                            {ch.channel} Dispatch
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            {ch.destination}
                          </span>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ch.enabled}
                          onChange={(e) =>
                            channelMutation.mutate({
                              channel: ch.channel,
                              updates: { enabled: e.target.checked },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                      </label>
                    </div>

                    {/* Alert Type Toggles */}
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground font-mono block mb-1.5">
                        Forwarded Alert Categories
                      </span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {(['cve', 'exposure', 'breach', 'certificate'] as const).map((cat) => {
                          const isSelected = ch.categories.includes(cat)
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                const newCats = isSelected
                                  ? ch.categories.filter((c) => c !== cat)
                                  : [...ch.categories, cat]
                                channelMutation.mutate({
                                  channel: ch.channel,
                                  updates: { categories: newCats },
                                })
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-mono border transition-colors ${
                                isSelected
                                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-400 font-semibold'
                                  : 'bg-card border-border text-muted-foreground'
                              }`}
                            >
                              {cat.toUpperCase()}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setShowChannelsModal(false)}
                className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold text-xs transition-colors shadow-glow-teal"
              >
                Close & Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
