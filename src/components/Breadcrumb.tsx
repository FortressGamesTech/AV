'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useBreadcrumbContext } from './BreadcrumbContext'

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  let path = ''
  const { breadcrumbLabels } = useBreadcrumbContext()
  return (
    <nav
      className="mb-4 flex items-center text-sm text-muted-foreground"
      aria-label="Breadcrumb"
    >
      <Link href="/" className="hover:underline">
        Home
      </Link>
      {segments.map((segment, idx) => {
        path += '/' + segment
        const isLast = idx === segments.length - 1
        const label = breadcrumbLabels[segment] || segment.replace(/-/g, ' ')
        return (
          <span key={path} className="flex items-center">
            <span className="mx-2">/</span>
            {isLast ? (
              <span className="font-semibold text-foreground">{label}</span>
            ) : (
              <Link href={path} className="hover:underline">
                {label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
