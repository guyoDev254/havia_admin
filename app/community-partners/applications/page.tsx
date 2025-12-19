'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { FileText, CheckCircle, XCircle, Clock, Eye, User } from 'lucide-react'
import Link from 'next/link'

interface Application {
  id: string
  name: string
  description?: string
  focusArea: string
  location?: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  status: string
  applicationNotes?: string
  applicant: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
}

export default function PartnerApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED')

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
      })
      const response = await api.get(`/community-partners/applications?${params}`)
      setApplications(response.data.applications)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user, page, statusFilter])

  const handleReview = async (applicationId: string) => {
    try {
      await api.put(`/community-partners/applications/${applicationId}/review`, {
        status: reviewStatus,
        applicationNotes: reviewNotes,
      })
      alert(`Application ${reviewStatus.toLowerCase()} successfully!`)
      setSelectedApp(null)
      setReviewNotes('')
      fetchApplications()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to review application')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      UNDER_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return badges[status as keyof typeof badges] || badges.PENDING
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.APPROVE_CLUBS}>
        <Layout>
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <FileText className="h-8 w-8" />
                    Partner Applications
                  </h1>
                  <p className="text-blue-100">
                    Review and approve community partner applications
                  </p>
                </div>
                <Link
                  href="/community-partners"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  View Partners
                </Link>
              </div>
            </div>

            {/* Status Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-2">
                {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Applications List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No applications found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {statusFilter === 'PENDING'
                    ? 'No pending applications at the moment'
                    : `No ${statusFilter.toLowerCase()} applications`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {app.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {app.applicant.firstName} {app.applicant.lastName}
                          </span>
                          <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          app.status,
                        )}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Focus Area
                        </label>
                        <p className="text-gray-900 dark:text-white">{app.focusArea}</p>
                      </div>
                      {app.location && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Location
                          </label>
                          <p className="text-gray-900 dark:text-white">{app.location}</p>
                        </div>
                      )}
                      {app.contactEmail && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contact Email
                          </label>
                          <p className="text-gray-900 dark:text-white">{app.contactEmail}</p>
                        </div>
                      )}
                      {app.website && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Website
                          </label>
                          <a
                            href={app.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {app.website}
                          </a>
                        </div>
                      )}
                    </div>

                    {app.description && (
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Description
                        </label>
                        <p className="text-gray-900 dark:text-white mt-1">{app.description}</p>
                      </div>
                    )}

                    {app.status === 'PENDING' && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setSelectedApp(app)
                            setReviewStatus('APPROVED')
                            setReviewNotes('')
                          }}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedApp(app)
                            setReviewStatus('REJECTED')
                            setReviewNotes('')
                          }}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Review Modal */}
            {selectedApp && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Review Application: {selectedApp.name}
                  </h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add notes about your decision..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReview(selectedApp.id)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        reviewStatus === 'APPROVED'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {reviewStatus === 'APPROVED' ? 'Approve' : 'Reject'} Application
                    </button>
                    <button
                      onClick={() => {
                        setSelectedApp(null)
                        setReviewNotes('')
                      }}
                      className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
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
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

