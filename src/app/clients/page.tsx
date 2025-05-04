'use client'

import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@/utils/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { saveAs } from 'file-saver'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

export default function ClientsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, user, router])

  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')

  // Sort state
  const [sortBy, setSortBy] = useState('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Pagination state
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [showArchived, setShowArchived] = useState(false)
  const [actionClientId, setActionClientId] = useState<string | null>(null)
  const [actionType, setActionType] = useState<
    'archive' | 'delete' | 'unarchive' | null
  >(null)
  const [actionLoading, setActionLoading] = useState(false)
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const isAllSelected =
    clients.length > 0 && clients.every((c) => selectedIds.includes(c.id))
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(clients.map((c) => c.id))
    }
  }

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    )
  }

  const clearSelection = () => setSelectedIds([])

  const handleBulkArchive = async () => {
    setActionLoading(true)
    const supabase = createBrowserClient()
    await supabase
      .from('clients')
      .update({ archived: true })
      .in('id', selectedIds)
    setClients((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id) ? { ...c, archived: true } : c,
      ),
    )
    // Audit log
    try {
      await Promise.all(
        selectedIds.map((id) =>
          supabase.from('client_audit_log').insert({
            client_id: id,
            action: 'archived',
            user_id: user?.id || null,
            details: { bulk: true },
          }),
        ),
      )
    } catch (err) {
      console.error('Audit log error:', err)
    }
    clearSelection()
    setActionLoading(false)
  }

  const handleBulkUnarchive = async () => {
    setActionLoading(true)
    const supabase = createBrowserClient()
    await supabase
      .from('clients')
      .update({ archived: false })
      .in('id', selectedIds)
    setClients((prev) =>
      prev.map((c) =>
        selectedIds.includes(c.id) ? { ...c, archived: false } : c,
      ),
    )
    // Audit log
    try {
      await Promise.all(
        selectedIds.map((id) =>
          supabase.from('client_audit_log').insert({
            client_id: id,
            action: 'unarchived',
            user_id: user?.id || null,
            details: { bulk: true },
          }),
        ),
      )
    } catch (err) {
      console.error('Audit log error:', err)
    }
    clearSelection()
    setActionLoading(false)
  }

  const handleBulkDelete = async () => {
    setActionLoading(true)
    const supabase = createBrowserClient()
    await supabase.from('clients').delete().in('id', selectedIds)
    setClients((prev) => prev.filter((c) => !selectedIds.includes(c.id)))
    // Audit log
    try {
      await Promise.all(
        selectedIds.map((id) =>
          supabase.from('client_audit_log').insert({
            client_id: id,
            action: 'deleted',
            user_id: user?.id || null,
            details: { bulk: true },
          }),
        ),
      )
    } catch (err) {
      console.error('Audit log error:', err)
    }
    clearSelection()
    setActionLoading(false)
  }

  useEffect(() => {
    if (!user) return
    const fetchClients = async () => {
      setLoading(true)
      setError(null)
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, company_name, email, client_type, active_status')
      console.log('Fetched clients:', data)
      if (error) {
        setError(error.message)
        console.error('Supabase fetch error:', error)
      } else if (data) {
        setClients(data)
      }
      setLoading(false)
    }
    fetchClients()
  }, [user])

  // Filtering logic
  const filteredClients = clients.filter((client) => {
    if (!showArchived && client.archived) return false
    const matchesName = client.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = type ? client.client_type === type : true
    const matchesStatus = status
      ? status === 'active'
        ? client.active_status
        : !client.active_status
      : true
    return matchesName && matchesType && matchesStatus
  })

  // Sorting logic
  const sortedClients = [...filteredClients].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]
    // For booleans (active_status), sort true before false
    if (sortBy === 'active_status') {
      aValue = aValue ? 1 : 0
      bValue = bValue ? 1 : 0
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    if (aValue < bValue) return sortDir === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  const sortIndicator = (column: string) =>
    sortBy === column ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  const totalPages = Math.ceil(sortedClients.length / ITEMS_PER_PAGE) || 1
  const paginatedClients = sortedClients.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  )

  const handlePrev = () => setPage((p) => Math.max(1, p - 1))
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1))

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setPage(1)
  }, [search, type, status, sortBy, sortDir])

  // Archive client
  const handleArchive = async (clientId: string) => {
    setActionLoading(true)
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('clients')
      .update({ archived: true })
      .eq('id', clientId)
    if (!error) {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, archived: true } : c)),
      )
      // Audit log
      try {
        await supabase.from('client_audit_log').insert({
          client_id: clientId,
          action: 'archived',
          user_id: user?.id || null,
          details: null,
        })
      } catch (err) {
        console.error('Audit log error:', err)
      }
    }
    setActionLoading(false)
    setActionClientId(null)
    setActionType(null)
  }

  // Unarchive client
  const handleUnarchive = async (clientId: string) => {
    setActionLoading(true)
    const supabase = createBrowserClient()
    const { error } = await supabase
      .from('clients')
      .update({ archived: false })
      .eq('id', clientId)
    if (!error) {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, archived: false } : c)),
      )
      // Audit log
      try {
        await supabase.from('client_audit_log').insert({
          client_id: clientId,
          action: 'unarchived',
          user_id: user?.id || null,
          details: null,
        })
      } catch (err) {
        console.error('Audit log error:', err)
      }
    }
    setActionLoading(false)
    setActionClientId(null)
    setActionType(null)
  }

  // Delete client
  const handleDelete = async (clientId: string) => {
    setActionLoading(true)
    const supabase = createBrowserClient()
    const { error } = await supabase.from('clients').delete().eq('id', clientId)
    if (!error) {
      setClients((prev) => prev.filter((c) => c.id !== clientId))
      // Audit log
      try {
        await supabase.from('client_audit_log').insert({
          client_id: clientId,
          action: 'deleted',
          user_id: user?.id || null,
          details: null,
        })
      } catch (err) {
        console.error('Audit log error:', err)
      }
    }
    setActionLoading(false)
    setActionClientId(null)
    setActionType(null)
  }

  // Dropdown toggle
  const toggleDropdown = (clientId: string) => {
    setActionClientId(actionClientId === clientId ? null : clientId)
    setActionType(null)
  }

  // Utility for status badge
  const StatusBadge = ({
    active,
    archived,
  }: {
    active: boolean
    archived?: boolean
  }) =>
    archived ? (
      <span
        className="ml-1 inline-block rounded bg-gray-400 px-2 py-0.5 text-xs font-semibold text-white"
        title="Archived"
      >
        Archived
      </span>
    ) : active ? (
      <span
        className="ml-1 inline-block rounded bg-green-600 px-2 py-0.5 text-xs font-semibold text-white"
        title="Active"
      >
        Active
      </span>
    ) : (
      <span
        className="ml-1 inline-block rounded bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-white"
        title="Inactive"
      >
        Inactive
      </span>
    )

  // Add this function for client creation with audit logging
  const handleCreate = async (newClient: any) => {
    const supabase = createBrowserClient()
    // Insert the new client
    const { data, error } = await supabase
      .from('clients')
      .insert([newClient])
      .select()
      .maybeSingle()
    if (error) {
      // Handle error (show toast, etc.)
      console.error('Failed to create client:', error)
      return
    }
    // Add to local state
    setClients((prev) => [data, ...prev])
    // Audit log
    try {
      await supabase.from('client_audit_log').insert({
        client_id: data.id,
        action: 'created',
        user_id: user?.id || null,
        details: data,
      })
    } catch (err) {
      console.error('Audit log error:', err)
    }
  }

  const [createOpen, setCreateOpen] = useState(false)

  const clientDefaultValues = {
    name: '',
    company_name: '',
    email: '',
    client_type: 'external',
    active_status: true,
    contact_person: '',
    phone: '',
    address: '',
  }

  function CreateClientDialog({
    open,
    setOpen,
  }: {
    open: boolean
    setOpen: (v: boolean) => void
  }) {
    const {
      register,
      handleSubmit,
      reset,
      formState: { errors, isSubmitting },
    } = useForm({ defaultValues: clientDefaultValues })

    const onSubmit = async (values: any) => {
      await handleCreate(values)
      setOpen(false)
      reset(clientDefaultValues)
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <span className="text-xs text-red-500">
                  {errors.name.message as string}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="company_name">Company *</Label>
              <Input
                id="company_name"
                {...register('company_name', {
                  required: 'Company is required',
                })}
              />
              {errors.company_name && (
                <span className="text-xs text-red-500">
                  {errors.company_name.message as string}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && (
                <span className="text-xs text-red-500">
                  {errors.email.message as string}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="client_type">Type *</Label>
              <select
                id="client_type"
                {...register('client_type', { required: 'Type is required' })}
                className="w-full rounded border border-gray-300 p-2"
              >
                <option value="external">External</option>
                <option value="internal">Internal</option>
              </select>
              {errors.client_type && (
                <span className="text-xs text-red-500">
                  {errors.client_type.message as string}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="active_status">Status *</Label>
              <select
                id="active_status"
                {...register('active_status', {
                  required: 'Status is required',
                })}
                className="w-full rounded border border-gray-300 p-2"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              {errors.active_status && (
                <span className="text-xs text-red-500">
                  {errors.active_status.message as string}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="contact_person">Contact Person *</Label>
              <Input
                id="contact_person"
                {...register('contact_person', {
                  required: 'Contact person is required',
                })}
              />
              {errors.contact_person && (
                <span className="text-xs text-red-500">
                  {errors.contact_person.message as string}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                {...register('phone', { required: 'Phone is required' })}
              />
              {errors.phone && (
                <span className="text-xs text-red-500">
                  {errors.phone.message as string}
                </span>
              )}
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                {...register('address', { required: 'Address is required' })}
              />
              {errors.address && (
                <span className="text-xs text-red-500">
                  {errors.address.message as string}
                </span>
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-700 text-white hover:bg-green-800"
              >
                {isSubmitting ? 'Creating...' : 'Create Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  function toCSV(rows: any[], columns: string[]) {
    const header = columns.join(',')
    const escape = (val: any) =>
      typeof val === 'string'
        ? '"' + val.replace(/"/g, '""') + '"'
        : (val ?? '')
    const body = rows
      .map((row) => columns.map((col) => escape(row[col])).join(','))
      .join('\n')
    return header + '\n' + body
  }

  const handleExportCSV = () => {
    const columns = [
      'name',
      'company_name',
      'email',
      'client_type',
      'active_status',
      'contact_person',
      'phone',
      'address',
    ]
    const csv = toCSV(sortedClients, columns)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const date = new Date().toISOString().slice(0, 10)
    saveAs(blob, `clients-${date}.csv`)
  }

  if (authLoading || !user) return null

  return (
    <div className="p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleExportCSV}
            className="bg-gray-700 text-white hover:bg-gray-800"
          >
            Export CSV
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-blue-700 text-white hover:bg-blue-800"
          >
            + New Client
          </Button>
        </div>
      </div>
      <CreateClientDialog open={createOpen} setOpen={setCreateOpen} />
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-gray-300 p-2"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded border border-gray-300 p-2"
        >
          <option value="">All Types</option>
          <option value="external">External</option>
          <option value="internal">Internal</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-gray-300 p-2"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show Archived
        </label>
      </div>
      {loading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-12 w-full animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      ) : (
        <>
          {/* Table for md+ screens */}
          <div className="mb-4 hidden w-full overflow-x-auto rounded-lg shadow md:block">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="sticky top-0 z-10 bg-background">
                <tr>
                  <th className="min-w-[40px] px-2 py-2"></th>
                  <th
                    className="min-w-[140px] cursor-pointer whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
                    onClick={() => handleSort('name')}
                  >
                    Name{sortIndicator('name')}
                  </th>
                  <th
                    className="min-w-[140px] cursor-pointer whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
                    onClick={() => handleSort('company_name')}
                  >
                    Company{sortIndicator('company_name')}
                  </th>
                  <th
                    className="min-w-[180px] cursor-pointer whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
                    onClick={() => handleSort('email')}
                  >
                    Email{sortIndicator('email')}
                  </th>
                  <th
                    className="min-w-[100px] cursor-pointer whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
                    onClick={() => handleSort('client_type')}
                  >
                    Type{sortIndicator('client_type')}
                  </th>
                  <th
                    className="min-w-[100px] cursor-pointer whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
                    onClick={() => handleSort('active_status')}
                  >
                    Status{sortIndicator('active_status')}
                  </th>
                  <th className="min-w-[100px] whitespace-nowrap px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client, idx) => (
                  <tr
                    key={client.id}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-muted' : ''} hover:bg-accent ${client.archived ? 'opacity-70' : ''}`}
                  >
                    <td className="min-w-[40px] whitespace-nowrap px-2 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(client.id)}
                        onChange={() => handleSelectRow(client.id)}
                        title={
                          selectedIds.includes(client.id)
                            ? 'Deselect'
                            : 'Select'
                        }
                        aria-label="Select client"
                      />
                    </td>
                    <td className="flex min-w-[140px] items-center gap-2 whitespace-nowrap px-4 py-2">
                      {client.name}
                      {client.archived && (
                        <StatusBadge active={false} archived={true} />
                      )}
                    </td>
                    <td className="min-w-[140px] whitespace-nowrap px-4 py-2">
                      {client.company_name}
                    </td>
                    <td className="min-w-[180px] whitespace-nowrap px-4 py-2">
                      {client.email}
                    </td>
                    <td className="min-w-[100px] whitespace-nowrap px-4 py-2 capitalize">
                      {client.client_type}
                    </td>
                    <td className="min-w-[100px] whitespace-nowrap px-4 py-2">
                      <StatusBadge
                        active={client.active_status}
                        archived={client.archived}
                      />
                    </td>
                    <td className="flex min-w-[100px] items-center gap-2 whitespace-nowrap px-4 py-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="mr-2 text-blue-600 hover:underline"
                        title="View client details"
                      >
                        View
                      </Link>
                      {/* ShadCN DropdownMenu for actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="More actions"
                          >
                            <span aria-hidden>⋮</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!client.archived ? (
                            <DropdownMenuItem
                              onClick={() => {
                                setActionClientId(client.id)
                                setActionType('archive')
                              }}
                            >
                              Archive
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setActionClientId(client.id)
                                setActionType('unarchive')
                              }}
                            >
                              Unarchive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setActionClientId(client.id)
                              setActionType('delete')
                            }}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Card view for sm screens */}
          <div className="space-y-4 md:hidden">
            {paginatedClients.map((client) => (
              <div
                key={client.id}
                className={`flex flex-col gap-2 rounded-lg bg-muted p-4 shadow ${client.archived ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">{client.name}</div>
                  <StatusBadge
                    active={client.active_status}
                    archived={client.archived}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {client.company_name}
                </div>
                <div className="text-sm">{client.email}</div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="rounded bg-accent px-2 py-0.5 capitalize">
                    {client.client_type}
                  </span>
                  {client.archived && (
                    <span className="rounded bg-gray-400 px-2 py-0.5 text-white">
                      Archived
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="More actions"
                      >
                        <span aria-hidden>⋮</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!client.archived ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setActionClientId(client.id)
                            setActionType('archive')
                          }}
                        >
                          Archive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => {
                            setActionClientId(client.id)
                            setActionType('unarchive')
                          }}
                        >
                          Unarchive
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          setActionClientId(client.id)
                          setActionType('delete')
                        }}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={page === 1}
          className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50 dark:bg-gray-700"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={page === totalPages}
          className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50 dark:bg-gray-700"
        >
          Next
        </button>
      </div>
      {selectedIds.length > 0 && (
        <div className="animate-fade-in fixed bottom-0 left-0 z-40 flex w-full items-center gap-4 border-t border-gray-700 bg-gray-900 p-4 text-white shadow-lg">
          <span className="font-semibold">{selectedIds.length} selected</span>
          <button
            className="rounded bg-yellow-500 px-3 py-1 transition-colors hover:bg-yellow-600"
            onClick={handleBulkArchive}
            disabled={actionLoading}
            title="Archive selected"
          >
            Archive
          </button>
          <button
            className="rounded bg-green-600 px-3 py-1 transition-colors hover:bg-green-700"
            onClick={handleBulkUnarchive}
            disabled={actionLoading}
            title="Unarchive selected"
          >
            Unarchive
          </button>
          <button
            className="rounded bg-red-600 px-3 py-1 transition-colors hover:bg-red-700"
            onClick={handleBulkDelete}
            disabled={actionLoading}
            title="Delete selected"
          >
            Delete
          </button>
          <button
            className="ml-auto underline hover:text-gray-300"
            onClick={clearSelection}
            disabled={actionLoading}
            title="Clear selection"
          >
            Clear
          </button>
        </div>
      )}
      {actionClientId && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-sm rounded bg-white p-6 shadow dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-bold">
              Confirm{' '}
              {actionType === 'archive'
                ? 'Archive'
                : actionType === 'unarchive'
                  ? 'Unarchive'
                  : 'Delete'}{' '}
              Client
            </h2>
            <p className="mb-4">
              Are you sure you want to {actionType} this client?
              {actionType === 'delete' && (
                <span className="font-semibold text-red-600">
                  {' '}
                  This cannot be undone.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="rounded bg-gray-200 px-4 py-2 dark:bg-gray-700"
                onClick={() => {
                  setActionClientId(null)
                  setActionType(null)
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className={`rounded px-4 py-2 ${actionType === 'archive' ? 'bg-yellow-500 text-white' : actionType === 'unarchive' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                onClick={() =>
                  actionType === 'archive'
                    ? handleArchive(actionClientId)
                    : actionType === 'unarchive'
                      ? handleUnarchive(actionClientId)
                      : handleDelete(actionClientId)
                }
                disabled={actionLoading}
              >
                {actionLoading
                  ? 'Processing...'
                  : actionType === 'archive'
                    ? 'Archive'
                    : actionType === 'unarchive'
                      ? 'Unarchive'
                      : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
