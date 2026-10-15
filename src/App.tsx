import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/context/ThemeContext'
import { DomainProvider } from '@/context/DomainContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { NewScan } from '@/pages/NewScan'
import { AssetInventory } from '@/pages/AssetInventory'
import { AssetDetail } from '@/pages/AssetDetail'
import { AssetGraph } from '@/pages/AssetGraph'
import { CVEFeed } from '@/pages/CVEFeed'
import { BreachMonitor } from '@/pages/BreachMonitor'
import { Alerts } from '@/pages/Alerts'
import { Reports } from '@/pages/Reports'
import { Settings } from '@/pages/Settings'
import { Login } from '@/pages/Login'

// Create TanStack Query client with standard caching policies
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DomainProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Standalone Login / Signup route */}
                <Route path="/login" element={<Login />} />

                {/* Authenticated Platform AppShell */}
                <Route path="/" element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="scan" element={<NewScan />} />
                  <Route path="assets" element={<AssetInventory />} />
                  <Route path="assets/:id" element={<AssetDetail />} />
                  <Route path="graph" element={<AssetGraph />} />
                  <Route path="cves" element={<CVEFeed />} />
                  <Route path="breaches" element={<BreachMonitor />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </DomainProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
