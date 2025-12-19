'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  status: string
  submittedAt: string
  notes?: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  scholarship: {
    id: string
    title: string
    provider: string
  }
}

export default function ApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [scholarshipFilter, setScholarshipFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user, page, search, statusFilter, scholarshipFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: 20,
      }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (scholarshipFilter !== 'all') params.scholarshipId = scholarshipFilter

      const response = await api.get('/admin/scholarships/applications', { params })
      setApplications(response.data.applications)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.put(`/admin/scholarships/applications/${id}/status`, { status })
      fetchApplications()
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; bgColor: string }> = {
      PENDING: {
        icon: Clock,
        color: 'text-yellow-800 dark:text-yellow-200',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      },
      SUBMITTED: {
        icon: FileText,
        color: 'text-blue-800 dark:text-blue-200',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
      },
      UNDER_REVIEW: {
        icon: Clock,
        color: 'text-orange-800 dark:text-orange-200',
        bgColor: 'bg-orange-100 dark:bg-orange-900',
      },
      APPROVED: {
        icon: CheckCircle,
        color: 'text-green-800 dark:text-green-200',
        bgColor: 'bg-green-100 dark:bg-green-900',
      },
      REJECTED: {
        icon: XCircle,
        color: 'text-red-800 dark:text-red-200',
        bgColor: 'bg-red-100 dark:bg-red-900',
      },
    }

    const badge = badges[status] || badges.PENDING
    const Icon = badge.icon

    return (
      <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${badge.bgColor} ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="h-8 w-8" />
                  Scholarship Applications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage scholarship applications</p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUBMITTED">Submitted</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No applications found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Scholarship
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {applications.map((application) => (
                        <tr key={application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {application.user.profileImage ? (
                                <img
                                  src={application.user.profileImage}
                                  alt={`${application.user.firstName} ${application.user.lastName}`}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {application.user.firstName} {application.user.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {application.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {application.scholarship.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {application.scholarship.provider}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(application.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {new Date(application.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/students/${application.user.id}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View Student"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              {application.status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleStatusUpdate(application.id, 'APPROVED')}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {application.status !== 'REJECTED' && (
                                <button
                                  onClick={() => handleStatusUpdate(application.id, 'REJECTED')}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
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

