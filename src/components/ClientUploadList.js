'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ClientUploadList({
  clientId,
  refreshKey = 0,
  onChange = undefined,
}) {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUploads = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('client_uploads')
        .select('*, users:uploaded_by(name)')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false })
      if (!error) setUploads(data)
      setLoading(false)
    }
    fetchUploads()
  }, [clientId, refreshKey])

  // Generate public URL for each file
  const getFileUrl = (filePath) =>
    supabase.storage.from('client-uploads').getPublicUrl(filePath).data
      .publicUrl

  const handleDelete = async (upload) => {
    if (
      !window.confirm(
        `Delete file "${upload.file_name}"? This cannot be undone.`,
      )
    )
      return
    setDeletingId(upload.id)
    setError('')
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('client-uploads')
      .remove([upload.file_path])
    if (storageError) {
      setError(storageError.message)
      setDeletingId(null)
      return
    }
    // Delete from table
    const { error: dbError } = await supabase
      .from('client_uploads')
      .delete()
      .eq('id', upload.id)
    if (dbError) {
      setError(dbError.message)
      setDeletingId(null)
      return
    }
    setUploads((prev) => prev.filter((u) => u.id !== upload.id))
    setDeletingId(null)
    if (onChange) onChange()
  }

  if (loading) return <div>Loading uploads...</div>
  if (!uploads.length) return <div>No uploads yet.</div>

  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table className="min-w-full border border-gray-700 text-sm">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-2 text-left">File Name</th>
            <th className="p-2 text-left">Uploaded By</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Size</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((upload) => (
            <tr key={upload.id} className="border-t border-gray-700">
              <td className="p-2">
                <a
                  href={getFileUrl(upload.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  {upload.file_name}
                </a>
              </td>
              <td className="p-2">
                {upload.users?.name
                  ? upload.users.name
                  : upload.uploader_name || upload.uploaded_by || '—'}
              </td>
              <td className="p-2">
                {upload.uploaded_at
                  ? new Date(upload.uploaded_at).toLocaleString()
                  : '—'}
              </td>
              <td className="p-2">
                {upload.size ? (upload.size / 1024).toFixed(1) + ' KB' : '—'}
              </td>
              <td className="p-2">
                <a
                  href={getFileUrl(upload.file_path)}
                  download
                  className="mr-2 text-green-500"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(upload)}
                  disabled={deletingId === upload.id}
                  className="text-red-500"
                >
                  {deletingId === upload.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
