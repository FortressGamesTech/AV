import { GeistSans } from 'geist/font/sans'
import ThemeProvider from '@/providers/ThemeProvider'
import NextTopLoader from 'nextjs-toploader'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ReactQueryProvider from '@/providers/ReactQueryProvider'
import { AuthProvider } from '@/hooks/useAuth'
import AppShell from '@/components/AppShell'
import React, { ReactElement } from 'react'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Next.js and Supabase Starter Kit',
  description: 'The fastest way to build apps with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Try to read breadcrumbLabels from the child page (if exported)
  let breadcrumbLabels = undefined
  const childrenArray = React.Children.toArray(children)
  for (const child of childrenArray) {
    if (
      React.isValidElement(child) &&
      child.type &&
      typeof child.type === 'function' &&
      'breadcrumbLabels' in child.type
    ) {
      breadcrumbLabels = (child.type as any).breadcrumbLabels
      break
    }
  }

  return (
    <html
      lang="en"
      className={GeistSans.className}
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground">
        <NextTopLoader showSpinner={false} height={2} color="#2acf80" />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ReactQueryProvider>
              <AppShell breadcrumbLabels={breadcrumbLabels}>
                {children}
                <Analytics />{' '}
                {/* ^^ remove this if you are not deploying to vercel. See more at https://vercel.com/docs/analytics  */}
              </AppShell>
              <ReactQueryDevtools initialIsOpen={false} />
            </ReactQueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
