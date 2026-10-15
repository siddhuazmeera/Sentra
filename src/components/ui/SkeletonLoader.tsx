import React from 'react'
import { cn } from '@/lib/utils'

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => {
  return (
    <div
      style={style}
      className={cn(
        'animate-pulse rounded bg-slate-200/70 dark:bg-slate-800/60',
        className
      )}
    />
  )
}

export const CardSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-4 h-3 w-3/4" />
    </div>
  )
}

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 6 }) => {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = 'h-64' }) => {
  return (
    <div className={cn('p-5 rounded-lg border border-border bg-card flex flex-col', height)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${20 + ((i * 19) % 75)}%` }}
          />
        ))}
      </div>
    </div>
  )
}
