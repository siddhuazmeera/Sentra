import React from 'react'
import { cn } from '@/lib/utils'

interface RiskGaugeProps {
  score: number // 0-100
  size?: number
  className?: string
  subtitle?: string
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  size = 190,
  className,
  subtitle = 'Aggregated Asset Exposure',
}) => {
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeWidth = 14
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  // We'll show a 240 degree gauge arc (from -210 deg to 30 deg)
  const arcLength = circumference * (240 / 360)
  const strokeDashoffset = arcLength - (arcLength * clampedScore) / 100

  // Determine color and status
  let color = '#3b82f6'
  let glowColor = 'rgba(59, 130, 246, 0.3)'
  let riskLabel = 'LOW RISK'
  let labelClass = 'text-blue-500 bg-blue-500/10 border-blue-500/20'

  if (clampedScore >= 80) {
    color = '#ef4444'
    glowColor = 'rgba(239, 68, 68, 0.45)'
    riskLabel = 'CRITICAL RISK'
    labelClass = 'text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
  } else if (clampedScore >= 60) {
    color = '#f97316'
    glowColor = 'rgba(249, 115, 22, 0.4)'
    riskLabel = 'HIGH RISK'
    labelClass = 'text-orange-500 bg-orange-500/10 border-orange-500/20 shadow-[0_0_12px_rgba(249,115,22,0.2)]'
  } else if (clampedScore >= 40) {
    color = '#eab308'
    glowColor = 'rgba(234, 179, 8, 0.3)'
    riskLabel = 'MEDIUM RISK'
    labelClass = 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center relative select-none', className)}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-[210deg] overflow-visible"
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            className="text-muted/40 dark:text-slate-800"
          />
          {/* Active progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${glowColor})`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-4xl font-bold tracking-tight text-foreground">
            {clampedScore}
            <span className="text-sm font-normal text-muted-foreground ml-0.5">/100</span>
          </span>
          <span
            className={cn(
              'mt-1 px-2.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase border',
              labelClass
            )}
          >
            {riskLabel}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2 tracking-wide font-medium">{subtitle}</p>
    </div>
  )
}
