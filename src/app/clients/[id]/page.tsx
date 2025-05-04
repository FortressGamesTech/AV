'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@/utils/supabase'
import { useBreadcrumbContext } from '@/components/BreadcrumbContext'
import ClientUploadForm from '@/components/ClientUploadForm'
import ClientUploadList from '@/components/ClientUploadList'
import { useAuth } from '@/hooks/useAuth'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Info,
  Clock,
  UploadCloud,
  StickyNote,
  ListChecks,
  PlusCircle,
  Pencil,
  Archive,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id as string
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { setBreadcrumbLabels } = useBreadcrumbContext()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [docRefresh, setDocRefresh] = useState(0)
  const { user } = useAuth()
  const [notes, setNotes] = useState<any[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [noteContent, setNoteContent] = useState('')
  const [noteError, setNoteError] = useState<string | null>(null)
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) return
    const fetchClient = async () => {
      setLoading(true)
      setError(null)
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      if (error) {
        setError('Client not found')
      } else {
        setClient(data)
        setForm(data)
        setBreadcrumbLabels({ [clientId]: data.name })
      }
      setLoading(false)
    }
    fetchClient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, setBreadcrumbLabels])

  useEffect(() => {
    if (!clientId) return
    const fetchNotes = async () => {
      setNotesLoading(true)
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('client_notes')
        .select('id, content, created_at, user_id, users:users(name)')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (!error && data) setNotes(data)
      setNotesLoading(false)
    }
    fetchNotes()
  }, [clientId])

  useEffect(() => {
    if (!clientId) return
    const fetchEvents = async () => {
      setEventsLoading(true)
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, type, event_dates, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (!error && data) setEvents(data)
      setEventsLoading(false)
    }
    fetchEvents()
  }, [clientId])

  useEffect(() => {
    if (!clientId) return
    const fetchAuditLog = async () => {
      setAuditLoading(true)
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('client_audit_log')
        .select('id, action, user_id, users:users(name), details, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      if (!error && data) setAuditLog(data)
      setAuditLoading(false)
    }
    fetchAuditLog()
  }, [clientId])

  const handleEdit = () => {
    setEditing(true)
    setForm(client)
    setSaveError(null)
    setSaveSuccess(null)
  }

  const handleCancel = () => {
    setEditing(false)
    setSaveError(null)
    setSaveSuccess(null)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)
    const supabase = createBrowserClient()
    console.log('Updating client:', clientId, form)
    const { id, ...updateData } = form
    const minimalUpdate = { company_name: updateData.company_name }
    console.log('Minimal update payload:', minimalUpdate)
    const { error, data } = await supabase
      .from('clients')
      .update(minimalUpdate)
      .eq('id', clientId)
      .select()
      .maybeSingle()
    setSaving(false)
    if (error) {
      setSaveError(error.message || 'Failed to save changes.')
    } else if (!data) {
      setSaveError('No client found to update.')
    } else {
      setClient(data)
      setEditing(false)
      setSaveSuccess('Client updated successfully.')
      setBreadcrumbLabels({ [clientId]: data.name })
      // --- Audit log logic ---
      try {
        const changedFields = Object.keys(minimalUpdate)
          .filter((key) => client[key] !== minimalUpdate[key])
          .reduce(
            (acc, key) => ({
              ...acc,
              [key]: { from: client[key], to: minimalUpdate[key] },
            }),
            {},
          )
        if (Object.keys(changedFields).length > 0) {
          await supabase.from('client_audit_log').insert({
            client_id: clientId,
            action: 'updated',
            user_id: user?.id || null,
            details: changedFields,
          })
        }
      } catch (err) {
        // Optionally log error
        console.error('Failed to log audit entry:', err)
      }
    }
  }

  const handleDocUpload = () => setDocRefresh((r) => r + 1)

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return
    setNoteSubmitting(true)
    setNoteError(null)
    const supabase = createBrowserClient()
    const { error, data } = await supabase
      .from('client_notes')
      .insert({
        client_id: clientId,
        user_id: user?.id || null,
        content: noteContent,
      })
      .select()
      .maybeSingle()
    setNoteSubmitting(false)
    if (error) {
      setNoteError(error.message)
    } else if (data) {
      setNotes((prev) => [data, ...prev])
      setNoteContent('')
    }
  }

  if (loading) return <div className="p-8">Loading client...</div>
  if (error) return <div className="p-8 text-red-500">{error}</div>
  if (!client) return null

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Client Details</h1>
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6 flex overflow-x-auto whitespace-nowrap border-b">
          <TabsTrigger
            value="info"
            className="flex items-center gap-2 px-4 py-2"
          >
            <Info className="h-4 w-4" /> Info
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex items-center gap-2 px-4 py-2"
          >
            <Clock className="h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger
            value="uploads"
            className="flex items-center gap-2 px-4 py-2"
          >
            <UploadCloud className="h-4 w-4" /> Uploads
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="flex items-center gap-2 px-4 py-2"
          >
            <StickyNote className="h-4 w-4" /> Notes
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="flex items-center gap-2 px-4 py-2"
          >
            <ListChecks className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          {editing ? (
            <form
              onSubmit={handleSave}
              className="space-y-4 rounded bg-gray-900 p-6 shadow"
            >
              <div>
                <label className="mb-1 block font-semibold">Name</label>
                <input
                  name="name"
                  value={form.name || ''}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Company</label>
                <input
                  name="company_name"
                  value={form.company_name || ''}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Email</label>
                <input
                  name="email"
                  value={form.email || ''}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                  type="email"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Type</label>
                <select
                  name="client_type"
                  value={form.client_type || ''}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                >
                  <option value="external">External</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Status</label>
                <select
                  name="active_status"
                  value={String(form.active_status)}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-semibold">
                  Contact Person
                </label>
                <input
                  name="contact_person"
                  value={form.contact_person || ''}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Phone</label>
                <input
                  name="phone"
                  value={form.phone || ''}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Address</label>
                <input
                  name="address"
                  value={form.address || ''}
                  onChange={handleChange}
                  className="w-full rounded border border-gray-700 bg-gray-800 p-2"
                />
              </div>
              {saveError && <div className="text-red-500">{saveError}</div>}
              {saveSuccess && (
                <div className="text-green-500">{saveSuccess}</div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-green-700 px-4 py-2 text-white"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="rounded bg-gray-700 px-4 py-2 text-white"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <strong>Name:</strong> {client.name}
              </div>
              <div>
                <strong>Company:</strong> {client.company_name}
              </div>
              <div>
                <strong>Email:</strong> {client.email}
              </div>
              <div>
                <strong>Type:</strong> {client.client_type}
              </div>
              <div>
                <strong>Status:</strong>{' '}
                {client.active_status ? 'Active' : 'Inactive'}
              </div>
              <div>
                <strong>Contact Person:</strong> {client.contact_person}
              </div>
              <div>
                <strong>Phone:</strong> {client.phone}
              </div>
              <div>
                <strong>Address:</strong> {client.address}
              </div>
              <button
                className="mt-4 rounded bg-blue-700 px-4 py-2 text-white"
                onClick={handleEdit}
              >
                Edit
              </button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history">
          <div className="rounded bg-gray-900 p-6 shadow">
            <h2 className="mb-2 text-xl font-semibold">Recent Events</h2>
            {eventsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-gray-400">
                No events found for this client.
              </div>
            ) : (
              <ul className="space-y-4">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-col rounded bg-gray-800 p-4 shadow md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="text-lg font-semibold text-white">
                        {event.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {event.type} &bull; {event.status}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-300 md:mt-0 md:text-right">
                      {Array.isArray(event.event_dates) &&
                      event.event_dates.length > 0
                        ? event.event_dates.map((d: any) => d.date).join(', ')
                        : new Date(event.created_at).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
        <TabsContent value="uploads">
          <div className="rounded bg-gray-900 p-6 shadow">
            <h2 className="mb-2 text-xl font-semibold">Uploads</h2>
            <ClientUploadForm clientId={client.id} onUpload={handleDocUpload} />
            <ClientUploadList clientId={client.id} key={docRefresh} />
          </div>
        </TabsContent>
        <TabsContent value="notes">
          <div className="rounded bg-gray-900 p-6 shadow">
            <h2 className="mb-2 text-xl font-semibold">Notes</h2>
            <form onSubmit={handleAddNote} className="mb-4 flex gap-2">
              <input
                type="text"
                className="flex-1 rounded border border-gray-700 bg-gray-800 p-2 text-white"
                placeholder="Add a note..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                disabled={noteSubmitting}
                maxLength={500}
              />
              <button
                type="submit"
                className="rounded bg-blue-700 px-4 py-2 text-white"
                disabled={noteSubmitting || !noteContent.trim()}
              >
                {noteSubmitting ? 'Adding...' : 'Add Note'}
              </button>
            </form>
            {noteError && <div className="mb-2 text-red-500">{noteError}</div>}
            {notesLoading ? (
              <div>Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-gray-400">No notes yet.</div>
            ) : (
              <ul className="space-y-2">
                {notes.map((note) => (
                  <li
                    key={note.id}
                    className="flex flex-col rounded bg-gray-900 p-3 shadow"
                  >
                    <div className="mb-1 text-sm text-gray-300">
                      {note.content}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleString()}
                      {note.users?.name && (
                        <span>&nbsp;by {note.users.name}</span>
                      )}
                      {!note.users?.name && note.user_id && (
                        <span>&nbsp;by {note.user_id}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
        <TabsContent value="audit">
          <div className="rounded bg-gray-900 p-6 shadow">
            <h2 className="mb-2 text-xl font-semibold">Audit Log</h2>
            {auditLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded" />
                ))}
              </div>
            ) : auditLog.length === 0 ? (
              <div className="text-gray-400">
                No audit log entries for this client yet.
              </div>
            ) : (
              <ul className="space-y-3">
                {auditLog.map((log) => {
                  let actionLabel = ''
                  let ActionIcon = PlusCircle
                  switch (log.action) {
                    case 'created':
                      actionLabel = 'Client Created'
                      ActionIcon = PlusCircle
                      break
                    case 'updated':
                      actionLabel = 'Client Updated'
                      ActionIcon = Pencil
                      break
                    case 'archived':
                      actionLabel = 'Client Archived'
                      ActionIcon = Archive
                      break
                    case 'unarchived':
                      actionLabel = 'Client Unarchived'
                      ActionIcon = Archive
                      break
                    case 'deleted':
                      actionLabel = 'Client Deleted'
                      ActionIcon = Trash2
                      break
                    default:
                      actionLabel = log.action
                      ActionIcon = PlusCircle
                  }
                  const expanded = expandedLogId === log.id
                  return (
                    <>
                      <li
                        key={log.id}
                        className="flex flex-row items-center justify-between rounded bg-gray-800 p-3 shadow"
                      >
                        <div className="flex items-center gap-2">
                          <ActionIcon className="h-5 w-5 text-blue-400" />
                          <span className="font-semibold capitalize text-white">
                            {actionLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleDateString()} by{' '}
                          {log.users?.name || log.user_id || 'Unknown'}
                          {log.details && (
                            <button
                              className="ml-2 flex items-center gap-1 text-xs text-blue-400 hover:underline focus:outline-none"
                              onClick={() =>
                                setExpandedLogId(expanded ? null : log.id)
                              }
                              aria-expanded={expanded}
                              title={expanded ? 'Hide details' : 'Show details'}
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </li>
                      {log.details && expanded && (
                        <li className="-mt-3 mb-2 rounded-b bg-gray-900 p-4 shadow">
                          <pre className="overflow-x-auto rounded p-2 text-xs">
                            {typeof log.details === 'object'
                              ? JSON.stringify(log.details, null, 2)
                              : log.details}
                          </pre>
                        </li>
                      )}
                    </>
                  )
                })}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
