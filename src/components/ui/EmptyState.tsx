import React from 'react'
import { FolderSearch, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderSearch,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border bg-card/40 my-4',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-muted/60 dark:bg-slate-800/80 border border-border flex items-center justify-center mb-3 text-muted-foreground">
        <Icon className="w-6 h-6 text-teal-500/80" />
      </div>
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-1.5 text-xs font-medium rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
