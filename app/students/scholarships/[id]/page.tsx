'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  Trophy,
  ArrowLeft,
  Edit,
  Calendar,
  ExternalLink,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Mail,
} from 'lucide-react'
import Link from 'next/link'
import StatusUpdateModal from '@/components/StatusUpdateModal'

interface Scholarship {
  id: string
  title: string
  description: string
  provider: string
  amount?: string
  eligibility: string[]
  requirements: string[]
  deadline: string
  applicationUrl?: string
  category?: string
  level?: string
  isActive: boolean
  visibility?: string
  _count?: { applications: number }
}

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

interface DataCampApp {
  id: string
  fullName: string
  email: string
  cityOfResidence?: string
  status: string
  createdAt: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUBMITTED', label: 'Submitted' },
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
    <span className={`px-2 py-1 text-xs rounded inline-flex items-center gap-1 ${badge.bgColor} ${badge.color}`}>
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </span>
  )
}

export default function ScholarshipViewPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user } = useAuth()
  const [scholarship, setScholarship] = useState<Scholarship | null>(null)
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [appPage, setAppPage] = useState(1)
  const [appTotalPages, setAppTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [dataCampApps, setDataCampApps] = useState<DataCampApp[]>([])
  const [dataCampLoading, setDataCampLoading] = useState(false)
  const [statusModal, setStatusModal] = useState<{
    open: boolean
    id: string | null
    status: 'APPROVED' | 'REJECTED' | null
    type: 'scholarship' | 'datacamp' | null
  }>({ open: false, id: null, status: null, type: null })
  const isDataCampScholarship = scholarship?.title?.toLowerCase().includes('datacamp') ?? false

  useEffect(() => {
    if (!id || !user) return
    const fetchScholarship = async () => {
      try {
        const res = await api.get(`/admin/scholarships/${id}`)
        setScholarship(res.data)
      } catch (e) {
        console.error(e)
        alert('Scholarship not found')
        router.push('/students/scholarships')
      } finally {
        setLoading(false)
      }
    }
    fetchScholarship()
  }, [id, user, router])

  useEffect(() => {
    if (!id || !user) return
    const fetchApplications = async () => {
      try {
        setApplicationsLoading(true)
        const params: Record<string, string | number> = {
          page: appPage,
          limit: 10,
          scholarshipId: id,
        }
        if (statusFilter !== 'all') params.status = statusFilter
        const res = await api.get('/admin/scholarships/applications', { params })
        setApplications(res.data.applications)
        setAppTotalPages(res.data.pagination?.totalPages ?? 1)
      } catch (e) {
        console.error('Error fetching applications:', e)
      } finally {
        setApplicationsLoading(false)
      }
    }
    fetchApplications()
  }, [id, user, appPage, statusFilter])

  useEffect(() => {
    if (!user || !isDataCampScholarship) return
    const fetchDataCamp = async () => {
      try {
        setDataCampLoading(true)
        const res = await api.get('/admin/datacamp-donates/applications', { params: { limit: 20 } })
        setDataCampApps(res.data.applications || [])
      } catch (e) {
        console.error('Error fetching DataCamp applications:', e)
      } finally {
        setDataCampLoading(false)
      }
    }
    fetchDataCamp()
  }, [user, isDataCampScholarship])

  const handleStatusUpdate = async (
    applicationId: string,
    status: string,
    reason?: string,
    nextInstructions?: string,
  ) => {
    try {
      setUpdatingId(applicationId)
      await api.put(`/admin/scholarships/applications/${applicationId}/status`, {
        status,
        ...(reason && { reason }),
        ...(nextInstructions && { nextInstructions }),
      })
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      )
    } catch (e) {
      console.error(e)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDataCampStatusUpdate = async (
    applicationId: string,
    status: string,
    reason?: string,
    nextInstructions?: string,
  ) => {
    try {
      setUpdatingId(applicationId)
      await api.put(`/admin/datacamp-donates/applications/${applicationId}/status`, {
        status,
        ...(reason && { reason }),
        ...(nextInstructions && { nextInstructions }),
      })
      setDataCampApps((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      )
    } catch (e) {
      console.error(e)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusModalConfirm = async (
    applicationId: string,
    status: string,
    reason?: string,
    nextInstructions?: string,
  ) => {
    if (statusModal.type === 'scholarship') {
      await handleStatusUpdate(applicationId, status, reason, nextInstructions)
    } else if (statusModal.type === 'datacamp') {
      await handleDataCampStatusUpdate(applicationId, status, reason, nextInstructions)
    }
    setStatusModal({ open: false, id: null, status: null, type: null })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">Loading...</div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!scholarship) {
    return null
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link
                href="/students/scholarships"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Trophy className="h-7 w-7" />
                  {scholarship.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-0.5">{scholarship.provider}</p>
              </div>
            </div>
            <Link
              href={`/students/scholarships/${id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              {scholarship.isActive ? (
                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Active
                </span>
              ) : (
                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  Inactive
                </span>
              )}
              <span className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                {(scholarship.visibility ?? 'both') === 'both' ? 'Web & Mobile' : 'Web only'}
              </span>
              {scholarship.category && (
                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {scholarship.category}
                </span>
              )}
              {scholarship.level && (
                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {scholarship.level.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h2>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{scholarship.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scholarship.amount && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Amount</h2>
                  <p className="text-gray-900 dark:text-white">{scholarship.amount}</p>
                </div>
              )}
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Deadline</h2>
                <p className="text-gray-900 dark:text-white flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(scholarship.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            {scholarship.applicationUrl && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Application URL</h2>
                <a
                  href={scholarship.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  {scholarship.applicationUrl}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {scholarship.eligibility && scholarship.eligibility.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Eligibility</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-900 dark:text-white">
                  {scholarship.eligibility.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {scholarship.requirements && scholarship.requirements.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Requirements</h2>
                <ul className="list-disc list-inside space-y-1 text-gray-900 dark:text-white">
                  {scholarship.requirements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Applications for this scholarship */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Applications
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setAppPage(1)
                  }}
                  className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {applicationsLoading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No applications found.
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
                          Notes
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {app.user.profileImage ? (
                                <img
                                  src={app.user.profileImage}
                                  alt=""
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {app.user.firstName} {app.user.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {app.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(app.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 max-w-[200px]">
                            {app.notes ? (
                              <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" title={app.notes}>
                                {app.notes}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/students/${app.user.id}`}
                                className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                                title="View student"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              {app.status !== 'UNDER_REVIEW' && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(app.id, 'UNDER_REVIEW')}
                                  disabled={updatingId === app.id}
                                  className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/30 disabled:opacity-50"
                                  title="Mark under review"
                                >
                                  <Clock className="h-4 w-4" />
                                </button>
                              )}
                              {app.status !== 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStatusModal({ open: true, id: app.id, status: 'APPROVED', type: 'scholarship' })
                                  }
                                  disabled={updatingId === app.id}
                                  className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30 disabled:opacity-50"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {app.status !== 'REJECTED' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStatusModal({ open: true, id: app.id, status: 'REJECTED', type: 'scholarship' })
                                  }
                                  disabled={updatingId === app.id}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
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

                {appTotalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setAppPage((p) => Math.max(1, p - 1))}
                      disabled={appPage === 1}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Page {appPage} of {appTotalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppPage((p) => Math.min(appTotalPages, p + 1))}
                      disabled={appPage === appTotalPages}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <Link
                href={`/students/applications?scholarshipId=${id}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View all applications for this scholarship →
              </Link>
            </div>
          </div>

          {isDataCampScholarship && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Web form applications (DataCamp Donates)
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Applications submitted via the website form — confirmation email was sent to these applicants.
                  </p>
                </div>
                <Link
                  href="/students/datacamp-applications"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                >
                  View all DataCamp applications →
                </Link>
              </div>
              {dataCampLoading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
              ) : dataCampApps.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No web form applications yet.
                </div>
              ) : (
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
                      {dataCampApps.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{app.fullName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {app.email}
                              </div>
                              {app.cityOfResidence && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{app.cityOfResidence}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {app.status !== 'UNDER_REVIEW' && (
                                <button
                                  type="button"
                                  onClick={() => handleDataCampStatusUpdate(app.id, 'UNDER_REVIEW')}
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
                                    setStatusModal({ open: true, id: app.id, status: 'APPROVED', type: 'datacamp' })
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
                                    setStatusModal({ open: true, id: app.id, status: 'REJECTED', type: 'datacamp' })
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
              )}
            </div>
          )}
        <StatusUpdateModal
          isOpen={statusModal.open}
          onClose={() => setStatusModal({ open: false, id: null, status: null, type: null })}
          applicationId={statusModal.id}
          status={statusModal.status}
          onConfirm={handleStatusModalConfirm}
        />
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
