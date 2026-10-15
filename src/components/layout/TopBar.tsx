import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { useDomain } from '@/context/DomainContext'
import { mockAlerts } from '@/lib/mock/data'
import { SeverityBadge } from '../ui/SeverityBadge'
import { formatRelativeTime } from '@/lib/utils'

interface TopBarProps {
  onOpenMobileMenu: () => void
  onOpenCommandPalette: () => void
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
}) => {
  const { theme, toggleTheme } = useTheme()
  const { selectedDomain } = useDomain()
  const [showNotifications, setShowNotifications] = useState(false)
  const navigate = useNavigate()

  const unreadAlerts = mockAlerts.filter((a) => a.status === 'new')

  return (
    <header className="h-14 border-b border-border bg-card/75 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Mobile menu toggle & Global search button */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar (Trigger for Command Palette) */}
        <button
          onClick={onOpenCommandPalette}
          className="w-full max-w-md flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-background/80 hover:bg-muted/60 text-muted-foreground transition-all text-xs group"
          aria-label="Open global search (Ctrl+K or Cmd+K)"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-400 group-hover:text-teal-300" />
            <span className="font-mono text-muted-foreground group-hover:text-foreground">
              Search domains, IPs, CVEs...
            </span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted border border-border text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right side: Domain status, Theme toggle, Notification Bell */}
      <div className="flex items-center gap-2.5">
        {/* Scope Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card-subtle text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-muted-foreground">Scope:</span>
          <span className="font-semibold text-foreground">
            {selectedDomain === 'all' ? 'All Monitored Targets' : selectedDomain}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell className="w-4 h-4 text-foreground" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-border flex items-center justify-between bg-card-subtle">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Active Threat Alerts</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                    {unreadAlerts.length} new
                  </span>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                {mockAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setShowNotifications(false)
                      navigate('/alerts')
                    }}
                    className="p-3 hover:bg-muted/40 transition-colors text-xs cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground leading-snug">{alert.title}</p>
                      <SeverityBadge severity={alert.severity} size="sm" showIcon={false} />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {alert.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{alert.targetAsset || 'Global Perimeter'}</span>
                      <span>{formatRelativeTime(alert.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-border bg-card-subtle text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false)
                    navigate('/alerts')
                  }}
                  className="text-[11px] text-teal-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>Open Alert Triage Manager</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
