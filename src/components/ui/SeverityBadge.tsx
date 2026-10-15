import React from 'react'
import { Severity } from '@/types'
import { cn } from '@/lib/utils'

interface SeverityBadgeProps {
  severity: Severity
  className?: string
  size?: 'sm' | 'md'
  showIcon?: boolean
}

const severityConfig: Record<
  Severity,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  critical: {
    label: 'Critical',
    bg: 'bg-red-500/10 dark:bg-red-950/40',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/25 dark:border-red-800/50',
    dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  },
  high: {
    label: 'High',
    bg: 'bg-orange-500/10 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/25 dark:border-orange-800/50',
    dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-amber-500/10 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/25 dark:border-amber-800/50',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    bg: 'bg-blue-500/10 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/25 dark:border-blue-800/50',
    dot: 'bg-blue-400',
  },
  info: {
    label: 'Info',
    bg: 'bg-slate-500/10 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20 dark:border-slate-700/50',
    dot: 'bg-slate-400',
  },
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className,
  size = 'sm',
  showIcon = true,
}) => {
  const config = severityConfig[severity] || severityConfig.info

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded border uppercase tracking-wider',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      {showIcon && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />}
      <span>{config.label}</span>
    </span>
  )
}
