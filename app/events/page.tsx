'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import PermissionGuard from '@/components/PermissionGuard'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Trash2, Plus, Search, Download } from 'lucide-react'
import { format } from 'date-fns'

interface Event {
  id: string
  title: string
  description: string
  type: string
  status: string
  startDate: string
  location: string
  club?: {
    id: string
    name: string
  }
  organizer: {
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    attendees: number
  }
}

export default function EventsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const prevFiltersRef = useRef({
    page: 1,
    statusFilter: '',
    debouncedSearch: '',
  })
  const isInitialMount = useRef(true)

  const fetchEvents = async (isSearchUpdate: boolean = false) => {
    try {
      if (isSearchUpdate) {
        setSearchLoading(true)
      } else {
        setLoading(true)
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      const response = await api.get(`/admin/events?${params}`)
      let filteredEvents = response.data.events
      
      if (debouncedSearch) {
        filteredEvents = filteredEvents.filter(
          (event: Event) =>
            event.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            event.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }
      
      if (statusFilter) {
        filteredEvents = filteredEvents.filter((event: Event) => event.status === statusFilter)
      }
      
      setEvents(filteredEvents)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      if (isSearchUpdate) {
        setSearchLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!user) return
    
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevFiltersRef.current = {
        page,
        statusFilter,
        debouncedSearch,
      }
      fetchEvents(false)
      return
    }
    
    const prev = prevFiltersRef.current
    const onlySearchChanged = 
      prev.debouncedSearch !== debouncedSearch &&
      prev.page === page &&
      prev.statusFilter === statusFilter
    
    prevFiltersRef.current = {
      page,
      statusFilter,
      debouncedSearch,
    }
    
    fetchEvents(onlySearchChanged)
  }, [user, page, debouncedSearch, statusFilter])

  const handleDelete = async (eventId: string) => {
    const confirmed = await showConfirm(
      'Delete Event',
      'Are you sure you want to delete this event?',
      'Yes, delete',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/admin/events/${eventId}`)
      fetchEvents()
    } catch (error: any) {
      console.error('Error deleting event:', error)
      showError('Failed to delete event', error.response?.data?.message || 'An error occurred while deleting the event')
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      
      const url = `/admin/events/export${params.toString() ? '?' + params.toString() : ''}`
      const response = await api.get(url, { responseType: 'blob' })
      
      const blob = new Blob([response.data], { type: 'text/csv' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      showSuccess('Export Successful', 'Events data has been exported successfully')
    } catch (error: any) {
      console.error('Error exporting events:', error)
      showError('Export Failed', error.response?.data?.message || 'Failed to export events data')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading events..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl flex-1">
            <h1 className="text-3xl font-bold mb-2">Events Management</h1>
            <p className="text-purple-100">
              Manage all events and workshops
            </p>
          </div>
          <div className="ml-4 flex gap-3">
            <PermissionGuard permission={Permission.EXPORT_DATA}>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold shadow-lg transition-colors backdrop-blur-sm"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </PermissionGuard>
            <a
              href="/events/create"
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Event
            </a>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                </div>
              )}
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                style={{ paddingRight: searchLoading ? '3rem' : '1rem' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="w-full sm:w-auto border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Organizer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/events/${event.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {event.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {event.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {event.club ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {event.club.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic">Platform Event</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(event.startDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {event.organizer.firstName} {event.organizer.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-lg">
                        {event._count.attendees}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${
                          event.status === 'UPCOMING'
                            ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200'
                            : event.status === 'ONGOING'
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                            : event.status === 'COMPLETED'
                            ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                            : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(event.id)
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-gray-700">
                Page <span className="text-purple-600">{page}</span> of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
    </ProtectedRoute>
  )
}

