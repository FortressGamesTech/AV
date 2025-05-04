'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import ClientUploadForm from '@/components/ClientUploadForm'
import ClientUploadList from '@/components/ClientUploadList'

export default function ClientUploadsPage() {
  const params = useParams()
  const clientId = params?.id as string
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => setRefreshKey((k) => k + 1)

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Client Uploads</h1>
      <ClientUploadForm clientId={clientId} onUpload={handleRefresh} />
      <ClientUploadList
        clientId={clientId}
        refreshKey={refreshKey}
        onChange={handleRefresh}
      />
    </div>
  )
}
