'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ClientUploadForm({ clientId, onUpload = undefined }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClientComponentClient()

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    setError('')
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file.')
      return
    }
    setUploading(true)
    setError('')

    // Generate a unique file path
    const filePath = `${clientId}/${Date.now()}_${file.name}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('client-uploads')
      .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    // Insert metadata into client_uploads table
    const { error: dbError } = await supabase.from('client_uploads').insert([
      {
        client_id: clientId,
        file_name: file.name,
        file_path: filePath,
        mime_type: file.type,
        size: file.size,
      },
    ])

    if (dbError) {
      setError(dbError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    setFile(null)
    if (onUpload) onUpload() // Refresh document list
  }

  return (
    <form onSubmit={handleUpload} style={{ marginBottom: 16 }}>
      <input type="file" onChange={handleFileChange} />
      <button type="submit" disabled={uploading} style={{ marginLeft: 8 }}>
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </form>
  )
}
