'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import RoleBadge from '@/components/RoleBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Search, Trash2, UserX, UserCheck, Shield, Download } from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  points: number
  createdAt: string
  _count: {
    clubs: number
    badges: number
  }
}

const ALL_ROLES = [
  'MEMBER',
  'MENTOR',
  'MENTEE',
  'CLUB_MANAGER',
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'COMMUNITY_MANAGER',
  'MENTORSHIP_ADMIN',
  'CONTENT_MANAGER',
  'PARTNERSHIP_MANAGER',
  'DATA_ADMIN',
  'SUPPORT_ADMIN',
  'ADMIN',
  'MODERATOR',
]

export default function UsersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission, isSuperAdmin } = usePermissions()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const prevFiltersRef = useRef({
    page: 1,
    selectedRole: '',
    selectedStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
    debouncedSearch: '',
  })
  const isInitialMount = useRef(true)

  const fetchUsers = async (isSearchUpdate: boolean = false) => {
    try {
      // Only show full loading screen on initial load or non-search changes
      // For search updates, show a subtle loading indicator instead
      if (isSearchUpdate) {
        setSearchLoading(true)
      } else {
        setLoading(true)
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedRole && { role: selectedRole }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      })
      const response = await api.get(`/admin/users?${params}`)
      setUsers(response.data.users)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching users:', error)
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
        selectedRole,
        selectedStatus,
        sortBy,
        sortOrder,
        debouncedSearch,
      }
      fetchUsers(false)
      return
    }
    
    // Check if only search changed (and other filters stayed the same)
    const prev = prevFiltersRef.current
    const onlySearchChanged = 
      prev.debouncedSearch !== debouncedSearch &&
      prev.page === page &&
      prev.selectedRole === selectedRole &&
      prev.selectedStatus === selectedStatus &&
      prev.sortBy === sortBy &&
      prev.sortOrder === sortOrder
    
    // Update refs
    prevFiltersRef.current = {
      page,
      selectedRole,
      selectedStatus,
      sortBy,
      sortOrder,
      debouncedSearch,
    }
    
    fetchUsers(onlySearchChanged)
  }, [user, page, debouncedSearch, selectedRole, selectedStatus, sortBy, sortOrder])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole })
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating role:', error)
      showError('Failed to Update Role', error.response?.data?.message || 'An error occurred while updating the user role')
    }
  }

  const handleSuspend = async (userId: string) => {
    const confirmed = await showConfirm(
      'Suspend User',
      'Are you sure you want to suspend this user?',
      'Yes, suspend',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.post(`/admin/users/${userId}/suspend`, { reason: 'Suspended by admin' })
      showSuccess('User Suspended', 'The user has been suspended successfully')
      fetchUsers()
    } catch (error: any) {
      console.error('Error suspending user:', error)
      showError('Failed to Suspend User', error.response?.data?.message || 'An error occurred while suspending the user')
    }
  }

  const handleActivate = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/activate`)
      showSuccess('User Activated', 'The user has been activated successfully')
      fetchUsers()
    } catch (error: any) {
      console.error('Error activating user:', error)
      showError('Failed to Activate User', error.response?.data?.message || 'An error occurred while activating the user')
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (selectedRole) params.append('role', selectedRole)
      
      const url = `/admin/users/export/all${params.toString() ? '?' + params.toString() : ''}`
      const response = await api.get(url, { responseType: 'blob' })
      
      const blob = new Blob([response.data], { type: 'text/csv' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      showSuccess('Export Successful', 'Users data has been exported successfully')
    } catch (error: any) {
      console.error('Error exporting users:', error)
      showError('Export Failed', error.response?.data?.message || 'Failed to export users data')
    }
  }

  const handleDelete = async (userId: string) => {
    const confirmed = await showConfirm(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      'Yes, delete',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/admin/users/${userId}`)
      showSuccess('User Deleted', 'The user has been deleted successfully')
      fetchUsers()
    } catch (error: any) {
      console.error('Error deleting user:', error)
      showError('Failed to Delete User', error.response?.data?.message || 'An error occurred while deleting the user')
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (selectedRole) params.append('role', selectedRole)
      
      const url = `/admin/users/export/all${params.toString() ? '?' + params.toString() : ''}`
      const response = await api.get(url, { responseType: 'blob' })
      
      const blob = new Blob([response.data], { type: 'text/csv' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
      
      showSuccess('Export Successful', 'Users data has been exported successfully')
    } catch (error: any) {
      console.error('Error exporting users:', error)
      showError('Export Failed', error.response?.data?.message || 'Failed to export users data')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading users..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Users Management</h1>
              <p className="text-blue-100">
                Manage all users in the system
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PermissionGuard permission={Permission.EXPORT_DATA}>
                <button
                  onClick={handleExport}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm flex items-center gap-2 font-medium text-white"
                >
                  <Download className="h-5 w-5" />
                  Export CSV
                </button>
              </PermissionGuard>
              <PermissionGuard permission={Permission.VIEW_USERS}>
                <button
                  onClick={() => router.push('/users/new')}
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  + Create User
                </button>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                style={{ paddingRight: searchLoading ? '3rem' : '1rem' }}
              />
            </div>
            <div className="flex gap-4 flex-wrap">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Roles</option>
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="createdAt">Sort by: Join Date</option>
                <option value="points">Sort by: Points</option>
                <option value="firstName">Sort by: Name</option>
              </select>
              <button
                onClick={() => {
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  setPage(1)
                }}
                className="px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Clubs
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-colors"
                    onClick={() => router.push(`/users/${user.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 mr-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold shadow-md">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PermissionGuard permission={Permission.ASSIGN_ROLES}>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                        >
                          {ALL_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </PermissionGuard>
                      <PermissionGuard permission={Permission.ASSIGN_ROLES} fallback={<RoleBadge role={user.role} size="sm" />}>
                        <RoleBadge role={user.role} size="sm" />
                      </PermissionGuard>
                    </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full shadow-sm ${
                                user.isActive
                                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                  : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {user.isActive ? '✓ Active' : '✗ Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.points}</span>
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                pts
                              </span>
                            </div>
                          </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                        {user._count.clubs}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <PermissionGuard permission={Permission.SUSPEND_USERS}>
                          {user.isActive ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSuspend(user.id)
                              }}
                              className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Suspend User"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleActivate(user.id)
                              }}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Activate User"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                        </PermissionGuard>
                        {isSuperAdmin() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(user.id)
                            }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 flex justify-between items-center">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-700"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Page <span className="text-blue-600 dark:text-blue-400">{page}</span> of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-700"
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

