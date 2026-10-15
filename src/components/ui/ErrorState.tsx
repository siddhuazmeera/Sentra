import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data Synchronization Failed',
  message = 'An error occurred while communicating with the threat intelligence layer.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-lg border border-red-500/20 bg-red-950/10 text-card-foreground my-4',
        className
      )}
    >
      <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>
      <h3 className="text-sm font-semibold text-red-500 tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  )
}
