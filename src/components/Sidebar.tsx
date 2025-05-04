'use client'
import { useAuth } from '@/hooks/useAuth'

// Temporary menu config for demonstration
const menuConfig = {
  administrator: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/clients', label: 'Clients' },
    { path: '/events', label: 'Events' },
    { path: '/line-items', label: 'Line Items' },
    { path: '/resources', label: 'Resources' },
    { path: '/roi', label: 'ROI' },
    { path: '/admin', label: 'Admin' },
  ],
  operations_manager: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/events', label: 'Events' },
    { path: '/resources', label: 'Resources' },
    { path: '/roi', label: 'ROI' },
  ],
  sales_manager: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/clients', label: 'Clients' },
    { path: '/events', label: 'Events' },
    { path: '/line-items', label: 'Line Items' },
    { path: '/roi', label: 'ROI' },
  ],
  tech_lead: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/resources', label: 'Resources' },
    { path: '/line-items', label: 'Line Items' },
    { path: '/events', label: 'Events' },
  ],
  event_coordinator: [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/clients', label: 'Clients' },
    { path: '/events', label: 'Events' },
    { path: '/line-items', label: 'Line Items' },
    { path: '/roi', label: 'ROI' },
  ],
}

export default function Sidebar() {
  const { user, role, loading } = useAuth()
  console.log('Sidebar debug:', { user, role })
  if (loading || !user) return null

  const menu = role ? menuConfig[role as keyof typeof menuConfig] || [] : []

  return (
    <div className="min-h-screen w-64 bg-gray-800 p-4 text-white">
      <div className="mb-6 text-xl font-bold">AV Client File System</div>
      <nav>
        <ul>
          {menu.map((item, index) => (
            <li key={index} className="mb-2">
              <a
                href={item.path}
                className="block rounded p-2 hover:bg-gray-700"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
