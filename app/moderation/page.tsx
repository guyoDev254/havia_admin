'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Shield, AlertTriangle, UserX, CheckCircle, XCircle, MessageSquare, FileText, Eye, Download } from 'lucide-react'
import { format } from 'date-fns'
import DownloadModal from '@/components/DownloadModal'
import { ExportFormat, exportTableToCSV, exportTableToExcel, exportToPDF, exportToCSV, exportToExcel } from '@/lib/report-export'

interface Report {
  id: string
  type: string
  reason: string
  description?: string
  status: string
  entityType?: string
  entityId?: string
  resolvedAt?: string | null
  reportedUser?: {
    id: string
    firstName: string
    lastName: string
    email: string
    strikeCount?: number
    isPostingRestricted?: boolean
  }
  reporter?: {
    id: string
    firstName: string
    lastName: string
    email?: string
  }
  createdAt: string
}

function StatsCards({ reports, stats }: { reports: Report[]; stats?: any }) {
  const pendingCount = stats?.pending || reports.filter((r) => r.status === 'PENDING' || r.status === 'UNDER_REVIEW').length
  const resolvedToday = reports.filter(
    (r) => r.status === 'RESOLVED' && r.resolvedAt && new Date(r.resolvedAt).toDateString() === new Date().toDateString()
  ).length
  const dismissedCount = stats?.dismissed || reports.filter((r) => r.status === 'DISMISSED').length
  const totalCount = stats?.total || reports.length

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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Reports</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
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
  const { showSuccess, showError, showConfirm } = useSweetAlert()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending')
  const [stats, setStats] = useState<any>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadType, setDownloadType] = useState<'single' | 'all'>('all')

  useEffect(() => {
    if (user && hasPermission(Permission.VIEW_REPORTS)) {
      fetchReportStats()
    }
  }, [user])

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

  const fetchReportStats = async () => {
    try {
      const response = await api.get('/reports/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching report stats:', error)
    }
  }

  const handleResolve = async (reportId: string, action: 'approve' | 'reject', issueStrike: boolean = false) => {
    try {
      const report = reports.find(r => r.id === reportId)
      const reportUserName = report?.reportedUser 
        ? `${report.reportedUser.firstName} ${report.reportedUser.lastName}`
        : 'this user'

      // Confirm before approving with strike
      if (action === 'approve' && report?.reportedUser && issueStrike) {
        const confirmed = await showConfirm(
          'Issue Strike?',
          `Approve report and issue strike to ${reportUserName}? This will increase their strike count.`,
          'Yes, approve and issue strike',
          'Cancel',
          '#dc2626',
          true
        )
        if (!confirmed) return
      }

      const status = action === 'approve' ? 'RESOLVED' : 'DISMISSED'
      await api.put(`/reports/${reportId}/resolve`, {
        status,
        resolution: action === 'approve' ? 'Report approved and action taken' : 'Report dismissed',
        issueStrike: action === 'approve' ? issueStrike : false,
      })
      
      await showSuccess(
        'Report Resolved',
        action === 'approve' 
          ? 'Report has been approved and action has been taken.'
          : 'Report has been dismissed.'
      )
      fetchReports()
      setSelectedReport(null)
    } catch (error: any) {
      console.error('Error resolving report:', error)
      showError('Resolution Failed', error.response?.data?.message || 'Failed to resolve report')
    }
  }

  const handleDownload = (format: ExportFormat) => {
    try {
      if (downloadType === 'single' && selectedReport) {
        // Export single report
        const reportData = {
          title: `Moderation Report - ${selectedReport.type}`,
          type: selectedReport.type,
          content: `Report Type: ${selectedReport.type}\nEntity Type: ${selectedReport.entityType || 'N/A'}\nReason: ${selectedReport.reason}\nDescription: ${selectedReport.description || 'N/A'}\nStatus: ${selectedReport.status}\nReported User: ${selectedReport.reportedUser ? `${selectedReport.reportedUser.firstName} ${selectedReport.reportedUser.lastName} (${selectedReport.reportedUser.email})` : 'N/A'}\nReporter: ${selectedReport.reporter ? `${selectedReport.reporter.firstName} ${selectedReport.reporter.lastName}` : 'N/A'}\nCreated: ${format(new Date(selectedReport.createdAt), 'PPpp')}\nResolved: ${selectedReport.resolvedAt ? format(new Date(selectedReport.resolvedAt), 'PPpp') : 'Pending'}`,
          createdAt: selectedReport.createdAt,
        }

        switch (format) {
          case 'pdf':
            exportToPDF(reportData)
            showSuccess('Success', 'Report downloaded as PDF')
            break
          case 'excel':
            exportToExcel(reportData)
            showSuccess('Success', 'Report downloaded as Excel')
            break
          case 'csv':
            exportToCSV(reportData)
            showSuccess('Success', 'Report downloaded as CSV')
            break
        }
      } else {
        // Export all reports
        const headers = ['ID', 'Type', 'Entity Type', 'Reason', 'Status', 'Reported User', 'Reporter', 'Created At', 'Resolved At']
        const data = reports.map((report) => ({
          'ID': report.id,
          'Type': report.type,
          'Entity Type': report.entityType || 'N/A',
          'Reason': report.reason,
          'Status': report.status,
          'Reported User': report.reportedUser ? `${report.reportedUser.firstName} ${report.reportedUser.lastName} (${report.reportedUser.email})` : 'N/A',
          'Reporter': report.reporter ? `${report.reporter.firstName} ${report.reporter.lastName}` : 'N/A',
          'Created At': format(new Date(report.createdAt), 'PPpp'),
          'Resolved At': report.resolvedAt ? format(new Date(report.resolvedAt), 'PPpp') : 'Pending',
        }))

        const filename = `moderation-reports-${format(new Date(), 'yyyy-MM-dd')}`

        switch (format) {
          case 'pdf':
            // For multiple reports, create a summary PDF
            const summaryData = {
              title: 'Moderation Reports Summary',
              type: 'MODERATION_SUMMARY',
              content: `Total Reports: ${reports.length}\nPending: ${reports.filter(r => r.status === 'PENDING').length}\nResolved: ${reports.filter(r => r.status === 'RESOLVED').length}\nDismissed: ${reports.filter(r => r.status === 'DISMISSED').length}\n\nReport Details:\n${reports.map((r, i) => `${i + 1}. ${r.type} - ${r.reason} (${r.status})`).join('\n')}`,
              createdAt: new Date().toISOString(),
            }
            exportToPDF(summaryData, `${filename}.pdf`)
            showSuccess('Success', 'Reports summary downloaded as PDF')
            break
          case 'excel':
            exportTableToExcel(data, headers, `${filename}.xlsx`, 'Moderation Reports')
            showSuccess('Success', 'Reports downloaded as Excel')
            break
          case 'csv':
            exportTableToCSV(data, headers, `${filename}.csv`)
            showSuccess('Success', 'Reports downloaded as CSV')
            break
        }
      }
    } catch (error: any) {
      showError('Error', error.message || 'Failed to download reports')
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold mb-2">Moderation & Safety</h1>
                  <p className="text-red-100">
                    Review reports, flagged content, and manage community safety
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDownloadType('all')
                  setShowDownloadModal(true)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              >
                <Download className="h-5 w-5" />
                Export Reports
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards reports={reports} stats={stats} />

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

          {/* Report Detail Modal */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Report Details</h2>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Report Type</label>
                    <p className="mt-1 text-gray-900 dark:text-white font-semibold">{selectedReport.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Entity Type</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{selectedReport.entityType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{selectedReport.reason}</p>
                  </div>
                  {selectedReport.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                      <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{selectedReport.description}</p>
                    </div>
                  )}
                  {selectedReport.reportedUser && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reported User</label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {selectedReport.reportedUser.firstName} {selectedReport.reportedUser.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.reportedUser.email}</p>
                      <p className="mt-2 text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">Strikes:</span>{' '}
                        <span className="text-gray-700 dark:text-gray-300">{selectedReport.reportedUser.strikeCount || 0}/3</span>
                        {selectedReport.reportedUser.isPostingRestricted && (
                          <span className="ml-2 text-red-600 font-semibold">🚫 Posting Restricted</span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedReport.reporter && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Reported By</label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {selectedReport.reporter.firstName} {selectedReport.reporter.lastName}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <p className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedReport.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                        selectedReport.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                        selectedReport.status === 'DISMISSED' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedReport.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {format(new Date(selectedReport.createdAt), 'PPpp')}
                    </p>
                  </div>
                  {selectedReport.resolvedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved At</label>
                      <p className="mt-1 text-gray-900 dark:text-white">
                        {format(new Date(selectedReport.resolvedAt), 'PPpp')}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setDownloadType('single')
                      setShowDownloadModal(true)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Close
                  </button>
                  {(selectedReport.status === 'PENDING' || selectedReport.status === 'UNDER_REVIEW') && (
                    <>
                      <button
                        onClick={async () => {
                          if (selectedReport.reportedUser) {
                            const confirmed = await showConfirm(
                              'Approve Report?',
                              `Approve this report for ${selectedReport.reportedUser.firstName} ${selectedReport.reportedUser.lastName}?`,
                              'Yes, approve',
                              'Cancel'
                            )
                            if (confirmed) {
                              const issueStrike = await showConfirm(
                                'Issue Strike?',
                                `Do you want to issue a strike to ${selectedReport.reportedUser.firstName}?`,
                                'Yes, issue strike',
                                'No, just approve',
                                '#f59e0b',
                                false
                              )
                              handleResolve(selectedReport.id, 'approve', issueStrike)
                            }
                          } else {
                            const confirmed = await showConfirm(
                              'Approve Report?',
                              'Approve this report and take action?',
                              'Yes, approve',
                              'Cancel'
                            )
                            if (confirmed) {
                              handleResolve(selectedReport.id, 'approve', false)
                            }
                          }
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = await showConfirm(
                            'Dismiss Report?',
                            'Are you sure you want to dismiss this report?',
                            'Yes, dismiss',
                            'Cancel'
                          )
                          if (confirmed) {
                            handleResolve(selectedReport.id, 'reject', false)
                          }
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reports List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
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
                        <p className="text-gray-900 dark:text-white font-medium mb-1">{report.reason}</p>
                        {report.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{report.description}</p>
                        )}
                        {report.reportedUser && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Reported User: {report.reportedUser.firstName}{' '}
                            {report.reportedUser.lastName} ({report.reportedUser.email})
                          </p>
                        )}
                        {report.reporter && (
                          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Reported by: {report.reporter.firstName} {report.reporter.lastName}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <PermissionGuard permission={Permission.HANDLE_ABUSE}>
                          {report.reportedUser && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold mr-2">
                              {report.reportedUser.strikeCount || 0}/3 Strikes
                              {(report.reportedUser.strikeCount || 0) >= 3 && (
                                <span className="ml-1">🚫 Restricted</span>
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          {report.status === 'PENDING' || report.status === 'UNDER_REVIEW' ? (
                            <>
                              <button
                                onClick={async () => {
                                  if (report.reportedUser) {
                                    const confirmed = await showConfirm(
                                      'Approve Report?',
                                      `Approve this report for ${report.reportedUser.firstName} ${report.reportedUser.lastName}?`,
                                      'Yes, approve',
                                      'Cancel'
                                    )
                                    if (confirmed) {
                                      const issueStrike = await showConfirm(
                                        'Issue Strike?',
                                        `Do you want to issue a strike to ${report.reportedUser.firstName}?`,
                                        'Yes, issue strike',
                                        'No, just approve',
                                        '#f59e0b',
                                        false
                                      )
                                      handleResolve(report.id, 'approve', issueStrike)
                                    }
                                  } else {
                                    const confirmed = await showConfirm(
                                      'Approve Report?',
                                      'Approve this report and take action?',
                                      'Yes, approve',
                                      'Cancel'
                                    )
                                    if (confirmed) {
                                      handleResolve(report.id, 'approve', false)
                                    }
                                  }
                                }}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve Action"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={async () => {
                                  const confirmed = await showConfirm(
                                    'Dismiss Report?',
                                    'Are you sure you want to dismiss this report?',
                                    'Yes, dismiss',
                                    'Cancel'
                                  )
                                  if (confirmed) {
                                    handleResolve(report.id, 'reject', false)
                                  }
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Dismiss Report"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                              {report.status}
                            </span>
                          )}
                        </PermissionGuard>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => {
            setShowDownloadModal(false)
            if (downloadType === 'single') {
              setSelectedReport(null)
            }
          }}
          onDownload={handleDownload}
          title={downloadType === 'single' ? 'Download Report' : 'Export All Reports'}
        />
      </Layout>
    </ProtectedRoute>
  )
}

