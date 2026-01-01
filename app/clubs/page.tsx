'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { useDebounce } from '@/hooks/useDebounce'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Trash2, Plus, Search, CheckCircle, XCircle, Clock, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

interface Club {
  id: string
  name: string
  description: string
  category: string
  logo?: string
  image?: string
  isActive: boolean
  isPublic: boolean
  createdAt: string
  _count: {
    members: number
    events: number
  }
}

export default function ClubsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { showSuccess, showError, showConfirm } = useSweetAlert()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const prevFiltersRef = useRef({
    page: 1,
    statusFilter: '',
    debouncedSearch: '',
  })
  const isInitialMount = useRef(true)

  const fetchClubs = async (isSearchUpdate: boolean = false) => {
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
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      const response = await api.get(`/admin/clubs?${params}`)
      let filteredClubs = response.data.clubs
      
      if (debouncedSearch) {
        filteredClubs = filteredClubs.filter(
          (club: Club) =>
            club.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            club.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      }
      
      setClubs(filteredClubs)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching clubs:', error)
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
      fetchClubs(false)
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
    
    fetchClubs(onlySearchChanged)
  }, [user, page, statusFilter, debouncedSearch])

  const handleApprove = async (clubId: string) => {
    try {
      await api.put(`/admin/clubs/${clubId}`, { isActive: true })
      await showSuccess('Club Approved', 'The club has been approved successfully!')
      fetchClubs()
    } catch (error: any) {
      console.error('Error approving club:', error)
      showError('Approval Failed', error.response?.data?.message || 'Failed to approve club')
    }
  }

  const handleReject = async (clubId: string) => {
    const confirmed = await showConfirm(
      'Deactivate Club?',
      'Are you sure you want to deactivate this club?',
      'Yes, deactivate',
      'Cancel'
    )
    if (!confirmed) return

    try {
      await api.put(`/admin/clubs/${clubId}`, { isActive: false })
      await showSuccess('Club Deactivated', 'The club has been deactivated successfully!')
      fetchClubs()
    } catch (error: any) {
      console.error('Error deactivating club:', error)
      showError('Deactivation Failed', error.response?.data?.message || 'Failed to deactivate club')
    }
  }

  const handleDelete = async (clubId: string) => {
    const confirmed = await showConfirm(
      'Delete Club?',
      'Are you sure you want to delete this club? This action cannot be undone.',
      'Yes, delete',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/admin/clubs/${clubId}`)
      await showSuccess('Club Deleted', 'The club has been deleted successfully!')
      fetchClubs()
    } catch (error: any) {
      console.error('Error deleting club:', error)
      showError('Deletion Failed', error.response?.data?.message || 'Failed to delete club')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading clubs..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clubs</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage all community clubs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PermissionGuard permission={Permission.APPROVE_CLUBS}>
              <Link
                href="/clubs/applications"
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Clock className="h-4 w-4" />
                Applications
              </Link>
            </PermissionGuard>
            <PermissionGuard permission={[Permission.MANAGE_CLUBS, Permission.APPROVE_CLUBS]}>
              <Link
                href="/clubs/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Club
              </Link>
            </PermissionGuard>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
              <input
                type="text"
                placeholder="Search clubs by name or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                style={{ paddingRight: searchLoading ? '3rem' : '1rem' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACTIVE">Active</option>
                <option value="PILOT">Pilot</option>
                <option value="FROZEN">Frozen</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clubs Grid */}
        {clubs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Users className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No clubs found</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {search || statusFilter
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first club'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="bg-white dark:bg-gray-800 shadow rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 group cursor-pointer"
                onClick={() => window.location.href = `/clubs/${club.id}`}
              >
                {/* Club Header with Image/Banner */}
                <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
                  {club.banner || club.image ? (
                    <img
                      src={club.banner || club.image}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-sm ${
                        club.isActive
                          ? 'bg-green-500/90 text-white'
                          : 'bg-red-500/90 text-white'
                      }`}
                    >
                      {club.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Club Content */}
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-4">
                    {club.logo ? (
                      <img
                        src={club.logo}
                        alt={club.name}
                        className="h-16 w-16 rounded-xl object-cover border-2 border-white dark:border-gray-700 shadow-md -mt-8"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-white dark:border-gray-700 shadow-md -mt-8">
                        {club.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {club.name}
                      </h3>
                      <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
                        {club.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {club.description || 'No description available'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {club._count.members}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {club._count.events}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">events</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/clubs/${club.id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details →
                    </Link>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <PermissionGuard permission={Permission.APPROVE_CLUBS}>
                        {!club.isActive ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(club.id)
                            }}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Approve Club"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(club.id)
                            }}
                            className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Deactivate Club"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        )}
                      </PermissionGuard>
                      <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(club.id)
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Club"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span>
              </span>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

