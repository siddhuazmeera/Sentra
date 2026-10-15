import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  Server,
  Network,
  Bug,
  AlertOctagon,
  Bell,
  FileText,
  Settings,
  ChevronDown,
  PlusCircle,
  X,
} from 'lucide-react'
import { useDomain } from '@/context/DomainContext'
import { mockDomains } from '@/lib/mock/data'
import { SentraLogo } from '@/components/ui/SentraLogo'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { selectedDomain, setSelectedDomain } = useDomain()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'New Scan', path: '/scan', icon: Radar },
    { label: 'Asset Inventory', path: '/assets', icon: Server, badge: '28' },
    { label: 'Relationship Graph', path: '/graph', icon: Network, badge: 'Active' },
    { label: 'CVE Feed', path: '/cves', icon: Bug, badge: '15' },
    { label: 'Breach Monitor', path: '/breaches', icon: AlertOctagon, badge: '5' },
    {
      label: 'Alerts',
      path: '/alerts',
      icon: Bell,
      badge: '4',
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    { label: 'Reports & CERT-In', path: '/reports', icon: FileText },
    { label: 'Settings', path: '/settings', icon: Settings },
  ]

  return (
    <aside className="w-64 bg-card border-r border-border h-full flex flex-col justify-between select-none">
      {/* Top Branding Section */}
      <div>
        <div className="h-14 px-4 flex items-center justify-between border-b border-border">
          <NavLink to="/" className="hover:opacity-90 transition-opacity">
            <SentraLogo variant="full" size="md" showTagline={false} />
          </NavLink>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-muted-foreground hover:text-foreground rounded"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Global Domain Selector */}
        <div className="p-3 border-b border-border/60 bg-card-subtle/40">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 px-1">
            Target Scope
          </label>
          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full appearance-none bg-card border border-border rounded-md px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/40 cursor-pointer pr-8"
              aria-label="Select target domain"
            >
              <option value="all">All Domains (3 scopes)</option>
              {mockDomains.map((d) => (
                <option key={d.domain} value={d.domain}>
                  {d.domain} {d.verified ? '✓' : '(unverified)'}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-2 space-y-0.5" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-teal-500/10 text-teal-400 font-semibold border border-teal-500/20 shadow-glow-teal'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-teal-400' : 'text-muted-foreground')} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded',
                      item.badgeColor || 'bg-muted text-muted-foreground border border-border'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-border bg-card-subtle/30 space-y-2">
        <button
          onClick={() => {
            navigate('/scan')
            if (onCloseMobile) onCloseMobile()
          }}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-md bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-semibold transition-all shadow-glow-teal"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Launch Recon</span>
        </button>

        {/* Live Status indicator */}
        <div className="px-2 py-1.5 rounded border border-border bg-card flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span className="text-muted-foreground text-[10px] font-mono">Sentra Feeds</span>
          </div>
          <span className="text-[10px] text-teal-400 font-mono">Live Intel</span>
        </div>

        {/* User Profile Card */}
        <div
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-teal-500/40 flex items-center justify-center text-[11px] font-bold text-teal-400">
            SN
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground leading-none truncate">SecOps Lead</p>
            <p className="text-[10px] text-muted-foreground font-mono leading-tight mt-0.5 truncate">
              analyst@sentra.sec
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
