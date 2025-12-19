'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Shield, AlertTriangle, UserX, CheckCircle, XCircle, MessageSquare, FileText } from 'lucide-react'
import { format } from 'date-fns'

interface Report {
  id: string
  type: string
  reason: string
  status: string
  resolvedAt?: string | null
  reportedUser?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  reporter?: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

function StatsCards({ reports }: { reports: Report[] }) {
  const pendingCount = reports.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length
  const resolvedToday = reports.filter(
    (r) => r.status === 'RESOLVED' && r.resolvedAt && new Date(r.resolvedAt).toDateString() === new Date().toDateString()
  ).length
  const dismissedCount = reports.filter((r) => r.status === 'DISMISSED').length
  const escalatedCount = reports.filter((r) => r.status === 'ESCALATED').length

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Reports</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
          </div>
          <AlertTriangle className="h-8 w-8 text-orange-500" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Resolved Today</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{resolvedToday}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dismissed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{dismissedCount}</p>
          </div>
          <XCircle className="h-8 w-8 text-gray-500" />
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Escalated</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{escalatedCount}</p>
          </div>
          <FileText className="h-8 w-8 text-yellow-500" />
        </div>
      </div>
    </div>
  )
}

export default function ModerationPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending')

  useEffect(() => {
    if (user && hasPermission(Permission.VIEW_REPORTS)) {
      fetchReports()
    }
  }, [user, filter])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const statusParam = filter === 'all' ? undefined : filter.toUpperCase()
      const response = await api.get('/reports', {
        params: {
          status: statusParam,
          limit: 50,
        },
      })
      setReports(response.data.reports || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const status = action === 'approve' ? 'RESOLVED' : 'DISMISSED'
      await api.put(`/reports/${reportId}/resolve`, {
        status,
        resolution: action === 'approve' ? 'Report approved and action taken' : 'Report dismissed',
      })
      fetchReports()
    } catch (error) {
      console.error('Error resolving report:', error)
      alert('Failed to resolve report')
    }
  }

  if (!hasPermission(Permission.VIEW_REPORTS)) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="text-red-700">You don't have permission to access moderation tools.</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold mb-2">Moderation & Safety</h1>
                <p className="text-red-100">
                  Review reports, flagged content, and manage community safety
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Reports</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Resolved Today</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Suspended Users</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <UserX className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Flagged Content</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <FileText className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Reports
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'resolved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading reports...</div>
            ) : reports.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No reports found</p>
                <p className="text-sm text-gray-500 mt-2">
                  All clear! No pending moderation tasks.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            {report.type}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(report.createdAt), 'MMM dd, yyyy • h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium mb-1">{report.reason}</p>
                        {report.reportedUser && (
                          <p className="text-sm text-gray-600">
                            Reported User: {report.reportedUser.firstName}{' '}
                            {report.reportedUser.lastName} ({report.reportedUser.email})
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <PermissionGuard permission={Permission.HANDLE_ABUSE}>
                          <button
                            onClick={() => handleResolve(report.id, 'approve')}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Action"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleResolve(report.id, 'reject')}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Report"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

