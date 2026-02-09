'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import {
  FileText,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Mail,
  Calendar,
} from 'lucide-react'
import StatusUpdateModal from '@/components/StatusUpdateModal'

interface DataCampApplication {
  id: string
  fullName: string
  email: string
  cityOfResidence: string
  status: string
  createdAt: string
  motivationForDataScience?: string
  areasOfInterest?: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

function getStatusBadge(status: string) {
  const badges: Record<string, { icon: typeof Clock; color: string; bgColor: string }> = {
    PENDING: {
      icon: Clock,
      color: 'text-yellow-800 dark:text-yellow-200',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
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
    <span className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${badge.bgColor} ${badge.color}`}>
      <Icon className="h-3 w-3" />
      {status?.replace('_', ' ') || status}
    </span>
  )
}

export default function DataCampApplicationsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [applications, setApplications] = useState<DataCampApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [statusModal, setStatusModal] = useState<{
    open: boolean
    id: string | null
    status: 'APPROVED' | 'REJECTED' | null
  }>({ open: false, id: null, status: null })

  useEffect(() => {
    if (user) fetchApplications()
  }, [user, page, statusFilter])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params: Record<string, string | number> = { page, limit: 20 }
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await api.get('/admin/datacamp-donates/applications', { params })
      setApplications(res.data.applications || [])
      setTotalPages(res.data.pagination?.totalPages ?? 1)
    } catch (e) {
      console.error('Error fetching DataCamp applications:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!detailId) {
      setDetail(null)
      return
    }
    api
      .get(`/admin/datacamp-donates/applications/${detailId}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
  }, [detailId])

  const handleStatusUpdate = async (
    id: string,
    status: string,
    reason?: string,
    nextInstructions?: string,
  ) => {
    try {
      setUpdatingId(id)
      await api.put(`/admin/datacamp-donates/applications/${id}/status`, {
        status,
        ...(reason && { reason }),
        ...(nextInstructions && { nextInstructions }),
      })
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
      if (detailId === id) setDetail((d) => (d ? { ...d, status } : d))
    } catch (e) {
      console.error(e)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-8 w-8" />
                DataCamp Donates Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Applications submitted via the website form (confirmation email sent). These are separate from app-based scholarship applications.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No DataCamp Donates applications found.
                  {statusFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Applicant
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
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {applications.map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{app.fullName}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {app.email}
                                </div>
                                {app.cityOfResidence && (
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {app.cityOfResidence}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {new Date(app.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDetailId(detailId === app.id ? null : app.id)}
                                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {app.status !== 'UNDER_REVIEW' && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(app.id, 'UNDER_REVIEW')}
                                    disabled={updatingId === app.id}
                                    className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 dark:text-orange-400 disabled:opacity-50"
                                    title="Mark under review"
                                  >
                                    <Clock className="h-4 w-4" />
                                  </button>
                                )}
                                {app.status !== 'APPROVED' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStatusModal({ open: true, id: app.id, status: 'APPROVED' })
                                    }
                                    disabled={updatingId === app.id}
                                    className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 disabled:opacity-50"
                                    title="Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                {app.status !== 'REJECTED' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setStatusModal({ open: true, id: app.id, status: 'REJECTED' })
                                    }
                                    disabled={updatingId === app.id}
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 disabled:opacity-50"
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
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {detailId && detail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Application: {(detail.fullName as string) || '—'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setDetailId(null)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      ×
                    </button>
                  </div>
                  <div className="p-6 space-y-4 text-sm">
                    {Object.entries(detail).map(([key, value]) => {
                      if (value == null || value === '' || key === 'id') return null
                      if (typeof value === 'object') return null
                      return (
                        <div key={key}>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          </div>
                          <div className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                            {String(value)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    {(detail.status as string) !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() =>
                          setStatusModal({ open: true, id: detailId, status: 'APPROVED' })
                        }
                        disabled={updatingId === detailId}
                        className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {(detail.status as string) !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() =>
                          setStatusModal({ open: true, id: detailId, status: 'REJECTED' })
                        }
                        disabled={updatingId === detailId}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDetailId(null)}
                      className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            <StatusUpdateModal
              isOpen={statusModal.open}
              onClose={() => setStatusModal({ open: false, id: null, status: null })}
              applicationId={statusModal.id}
              status={statusModal.status}
              onConfirm={handleStatusUpdate}
            />
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}
