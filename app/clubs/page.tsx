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
import { Trash2, Plus, Search, CheckCircle, XCircle, Clock } from 'lucide-react'
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

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
              <input
                type="text"
                placeholder="Search clubs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                style={{ paddingRight: searchLoading ? '3rem' : '1rem' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Events
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {clubs.map((club) => (
                  <tr
                    key={club.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => window.location.href = `/clubs/${club.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {club.logo || club.image ? (
                          <img
                            src={club.logo || club.image}
                            alt={club.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {club.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {club.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {club.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {club.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {club._count.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {club._count.events}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          club.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {club.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission={Permission.APPROVE_CLUBS}>
                          {!club.isActive ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApprove(club.id)
                              }}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve Club"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReject(club.id)
                              }}
                              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Deactivate Club"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </PermissionGuard>
                        <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(club.id)
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Club"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
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

