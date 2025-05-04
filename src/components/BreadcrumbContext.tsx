'use client'
import React, { createContext, useContext, useState } from 'react'

type BreadcrumbLabels = Record<string, string>
type BreadcrumbContextType = {
  breadcrumbLabels: BreadcrumbLabels
  setBreadcrumbLabels: (labels: BreadcrumbLabels) => void
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined,
)

export function useBreadcrumbContext() {
  const ctx = useContext(BreadcrumbContext)
  if (!ctx)
    throw new Error(
      'useBreadcrumbContext must be used within BreadcrumbProvider',
    )
  return ctx
}

export function BreadcrumbProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [breadcrumbLabels, setBreadcrumbLabels] = useState<BreadcrumbLabels>({})
  return (
    <BreadcrumbContext.Provider
      value={{ breadcrumbLabels, setBreadcrumbLabels }}
    >
      {children}
    </BreadcrumbContext.Provider>
  )
}
