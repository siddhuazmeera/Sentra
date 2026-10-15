import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  KeyRound,
  Shield,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Terminal,
} from 'lucide-react'
import { SentraLogo } from '@/components/ui/SentraLogo'
import { useToast } from '@/context/ToastContext'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('analyst@sentra.sec')
  const [password, setPassword] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [useApiKey, setUseApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
      addToast({
        title: isSignUp ? 'Account Created' : 'Authentication Successful',
        description: 'Welcome to Sentra Threat Intelligence Console.',
        type: 'success',
      })
      navigate('/')
    }, 600)
  }

  const handleDemoLogin = (roleEmail: string, roleName: string) => {
    setEmail(roleEmail)
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      addToast({
        title: `Logged in as ${roleName}`,
        description: `Active session established with ${roleName} privileges.`,
        type: 'success',
      })
      navigate('/')
    }, 400)
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0F14] text-foreground flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background subtle tactical grid & radial glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1E283815_1px,transparent_1px),linear-gradient(to_bottom,#1E283815_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <SentraLogo variant="full" size="md" showTagline={false} />
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>SOC Gateway Active</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="p-6 sm:p-8 rounded-2xl border border-[#1E2838] bg-[#101620]/90 backdrop-blur-xl shadow-2xl shadow-black/80 space-y-6">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isSignUp ? 'Create your Sentra account' : 'Sign in to Sentra'}
            </h1>
            <p className="text-xs text-muted-foreground font-sans">
              See your risk before attackers do
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!useApiKey ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground block">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="analyst@enterprise.sec"
                      className="w-full bg-[#0B0F14] border border-[#1E2838] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground block">
                      Password
                    </label>
                    <a href="#forgot" className="text-[11px] text-teal-400 hover:underline">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-[#0B0F14] border border-[#1E2838] rounded-lg pl-9 pr-9 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-1.5 animate-in fade-in duration-150">
                <label className="text-xs font-medium text-foreground block">
                  Sentra API Key (<code className="font-mono text-teal-400">sn_live_...</code>)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    required
                    placeholder="sn_live_948f2c810b412e89..."
                    className="w-full bg-[#0B0F14] border border-[#1E2838] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Enter your assigned programmatic security token.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-all shadow-glow-teal mt-2"
            >
              <span>{isLoading ? 'Authenticating...' : isSignUp ? 'Create Workspace' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle API Key Mode */}
          <div className="pt-2 border-t border-[#1E2838] flex items-center justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => setUseApiKey(!useApiKey)}
              className="text-teal-400 hover:underline flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{useApiKey ? 'Sign in with Email & Password' : 'Sign in with API Key (sn_...)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isSignUp ? 'Have an account?' : 'Need access?'}
            </button>
          </div>

          {/* API Key Programmatic Note Box */}
          <div className="p-3 rounded-lg border border-[#1E2838] bg-[#0B0F14]/70 text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-teal-400" />
              <span>Programmatic REST & CI/CD Access</span>
            </div>
            <p className="leading-relaxed">
              Automated pipelines and SIEM forwarders should use tokens prefixed with{' '}
              <code className="text-teal-400 font-mono">sn_live_xxxxxxxx</code> managed under Settings &gt; API Keys.
            </p>
          </div>

          {/* Quick Demo Personas */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block text-center">
              Quick Test Evaluation Personas
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alex.rivera@sentra.sec', 'Admin')}
                className="px-2 py-1.5 rounded-md border border-[#1E2838] bg-[#151E2B] hover:border-teal-500/50 text-[11px] font-mono text-foreground text-center transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('analyst@sentra.sec', 'Lead Analyst')}
                className="px-2 py-1.5 rounded-md border border-teal-500/30 bg-teal-500/10 hover:border-teal-500/60 text-[11px] font-mono text-teal-400 text-center transition-colors font-semibold"
              >
                Analyst
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('d.vance@sentra.sec', 'Viewer')}
                className="px-2 py-1.5 rounded-md border border-[#1E2838] bg-[#151E2B] hover:border-teal-500/50 text-[11px] font-mono text-foreground text-center transition-colors"
              >
                Viewer
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-muted-foreground font-mono">
        <p>Sentra Attack Surface Intelligence Platform · CERT-In & CISA KEV Synchronized</p>
      </footer>
    </div>
  )
}
