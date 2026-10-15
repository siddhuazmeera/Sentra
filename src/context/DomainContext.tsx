import React, { createContext, useContext, useState } from 'react'

interface DomainContextType {
  selectedDomain: string // 'all' or domain name
  setSelectedDomain: (domain: string) => void
}

const DomainContext = createContext<DomainContextType | undefined>(undefined)

export const DomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('all')

  return (
    <DomainContext.Provider value={{ selectedDomain, setSelectedDomain }}>
      {children}
    </DomainContext.Provider>
  )
}

export const useDomain = () => {
  const context = useContext(DomainContext)
  if (!context) {
    throw new Error('useDomain must be used within a DomainProvider')
  }
  return context
}
