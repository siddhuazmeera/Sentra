import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  Mail,
  RotateCcw,
  ExternalLink,
  Lock,
} from 'lucide-react'
import { getBreaches, updateBreachStatus } from '@/lib/api'
import { useToast } from '@/context/ToastContext'
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BreachRecord } from '@/types'

export const BreachMonitor: React.FC = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToast()

  const { data: breaches, isLoading, isError, refetch } = useQuery({
    queryKey: ['breaches'],
    queryFn: () => getBreaches(),
  })

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'resolved' }) =>
      updateBreachStatus(id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['breaches'] })
      addToast({
        title: updated.status === 'resolved' ? 'Breach Marked Resolved' : 'Breach Reopened',
        description: `Incident for ${updated.domainOrEmail} updated.`,
        type: 'success',
      })
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    )
  }

  const activeBreaches = (breaches || []).filter((b) => b.status === 'active')
  const resolvedBreaches = (breaches || []).filter((b) => b.status === 'resolved')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Identity & Dark Web Breach Monitor</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-teal-500/10 text-teal-400 border border-teal-500/30">
              HIBP & Stealer Logs
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Continuous surveillance of corporate domains and employee credentials across paste sites, stealer dumps, and underground forums.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Active Incidents
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-red-500 mt-1 block">
            {activeBreaches.length}
          </span>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Requiring password or session invalidation
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Mitigated & Resolved
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400 mt-1 block">
            {resolvedBreaches.length}
          </span>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Zero-knowledge tokens & credentials cycled
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Total Compromised Accounts
          </span>
          <span className="text-2xl font-bold font-mono tracking-tight text-orange-400 mt-1 block">
            252 identities
          </span>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Passwords never exposed in cleartext
          </span>
        </div>
      </div>

      {/* Breach Incident Cards */}
      <div className="space-y-4">
        {(breaches || []).map((breach) => {
          const isResolved = breach.status === 'resolved'

          return (
            <div
              key={breach.id}
              className={`p-5 rounded-xl border transition-all ${
                isResolved
                  ? 'border-border/60 bg-card/60 opacity-80'
                  : 'border-border bg-card hover:border-red-500/40 shadow-sm'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-teal-400">
                      {breach.domainOrEmail}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        isResolved
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isResolved ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </>
                      ) : (
                        <>
                          <AlertOctagon className="w-3 h-3" /> Action Required
                        </>
                      )}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Disclosed: {new Date(breach.breachDate).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-foreground font-sans">
                    {breach.breachName}
                  </h3>
                </div>

                <button
                  onClick={() =>
                    mutation.mutate({
                      id: breach.id,
                      status: isResolved ? 'active' : 'resolved',
                    })
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shrink-0 ${
                    isResolved
                      ? 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                      : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isResolved ? 'Reopen Incident' : 'Mark as Resolved'}
                </button>
              </div>

              {/* Data types exposed */}
              <div className="pt-3 border-t border-border/70 mt-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                  Data Attributes Exposed:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {breach.dataExposed.map((dt, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-card-subtle border border-border text-foreground flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-muted-foreground" />
                      <span>{dt}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Action Steps */}
              <div className="pt-3 border-t border-border/70 mt-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono">
                  Mandatory Containment Steps:
                </span>
                <ul className="space-y-1 text-xs font-mono text-muted-foreground">
                  {breach.recommendedActions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-teal-400 font-bold">›</span>
                      <span className="text-foreground/90">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
