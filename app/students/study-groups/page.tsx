'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Users2, Search, Eye, Trash2, Filter, Users, Edit } from 'lucide-react'
import Link from 'next/link'
import { useSweetAlert } from '@/hooks/useSweetAlert'

interface StudyGroup {
  id: string
  name: string
  description: string
  subject: string
  level: string
  maxMembers: number
  isActive: boolean
  createdAt: string
  _count: {
    members: number
  }
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      firstName: string
      lastName: string
      profileImage?: string
    }
  }>
}

export default function StudyGroupsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { showError, showConfirm } = useSweetAlert()
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const prevFiltersRef = useRef({
    page: 1,
    levelFilter: 'all',
    debouncedSearch: '',
  })
  const isInitialMount = useRef(true)

  const fetchGroups = async (isSearchUpdate: boolean = false) => {
    try {
      if (isSearchUpdate) {
        setSearchLoading(true)
      } else {
        setLoading(true)
      }
      
      const params: any = {
        page,
        limit: 20,
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (levelFilter !== 'all') params.level = levelFilter

      const response = await api.get('/admin/study-groups', { params })
      setGroups(response.data.groups)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching study groups:', error)
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
        levelFilter,
        debouncedSearch,
      }
      fetchGroups(false)
      return
    }
    
    const prev = prevFiltersRef.current
    const onlySearchChanged = 
      prev.debouncedSearch !== debouncedSearch &&
      prev.page === page &&
      prev.levelFilter === levelFilter
    
    prevFiltersRef.current = {
      page,
      levelFilter,
      debouncedSearch,
    }
    
    fetchGroups(onlySearchChanged)
  }, [user, page, debouncedSearch, levelFilter])

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      'Delete Study Group',
      'Are you sure you want to delete this study group?',
      'Yes, delete it',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/admin/study-groups/${id}`)
      fetchGroups()
    } catch (error) {
      console.error('Error deleting study group:', error)
      showError('Failed to delete study group')
    }
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users2 className="h-8 w-8" />
                  Study Groups Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage study groups</p>
              </div>
              <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                <Link
                  href="/students/study-groups/new"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Users2 className="h-5 w-5" />
                  Create Study Group
                </Link>
              </PermissionGuard>
            </div>

            {/* Stats */}
            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Groups</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {groups.reduce((sum, g) => sum + 1, 0)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Groups</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {groups.filter(g => g.isActive).length}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Members</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {groups.reduce((sum, g) => sum + (g._count?.members || 0), 0)}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Average Size</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {groups.length > 0
                      ? Math.round(
                          groups.reduce((sum, g) => sum + (g._count?.members || 0), 0) / groups.length,
                        )
                      : 0}
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {searchLoading && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Search study groups..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    style={{ paddingRight: searchLoading ? '3rem' : '1rem' }}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={levelFilter}
                    onChange={(e) => {
                      setLevelFilter(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="TVET">TVET</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="OUT_OF_SCHOOL">Out of school</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Study Groups Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8">
                  <LoadingSpinner message="Loading study groups..." showProgress={true} size="md" fullScreen={false} />
                </div>
              ) : groups.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No study groups found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Group Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {groups.map((group) => (
                        <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {group.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {group.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {group.subject}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {group.level.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {group._count?.members || 0}/{group.maxMembers}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {group.isActive ? (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/students/study-groups/${group.id}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                                <Link
                                  href={`/students/study-groups/${group.id}/edit`}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => handleDelete(group.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                  title="Delete"
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
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

