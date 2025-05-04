'use client'
import Sidebar from '@/components/Sidebar'
import Breadcrumb from '@/components/Breadcrumb'
import { useAuth } from '@/hooks/useAuth'
import { BreadcrumbProvider } from './BreadcrumbContext'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    // Not authenticated: show only the children, centered
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        {children}
      </div>
    )
  }

  // Authenticated: show sidebar layout
  return (
    <BreadcrumbProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-1 flex-col items-center">
          <Breadcrumb />
          <main className="flex w-full flex-1 flex-col items-center">
            {children}
          </main>
        </div>
      </div>
    </BreadcrumbProvider>
  )
}
