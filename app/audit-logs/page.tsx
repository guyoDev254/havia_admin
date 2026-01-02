'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { History, Search, Filter, User, Shield, Calendar, FileText, ArrowUpDown, Download } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import DownloadModal from '@/components/DownloadModal'
import { ExportFormat, exportTableToCSV, exportTableToExcel, exportToPDF } from '@/lib/report-export'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId?: string
  reason?: string
  changes?: any
  metadata?: any
  createdAt: string
  admin: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

const ACTION_COLORS: Record<string, string> = {
  CREATE_USER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  UPDATE_USER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE_USER: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  CHANGE_ROLE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  SUSPEND_USER: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  ACTIVATE_USER: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  BAN_USER: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  SEND_MESSAGE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  DELETE_POST: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  HIDE_POST: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  RESOLVE_REPORT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export default function AuditLogsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    adminId: '',
    userId: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.action && { action: filters.action }),
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.adminId && { adminId: filters.adminId }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      })
      const response = await api.get(`/admin/audit-logs?${params}`)
      setLogs(response.data.logs)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAuditLogs()
    }
  }, [user, page, filters])

  const getActionColor = (action: string) => {
    return ACTION_COLORS[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }

  const formatChanges = (changes: any) => {
    if (!changes) return null
    if (typeof changes === 'object') {
      return JSON.stringify(changes, null, 2)
    }
    return String(changes)
  }

  const handleDownload = (format: ExportFormat) => {
    try {
      const headers = ['ID', 'Action', 'Entity', 'Entity ID', 'Admin', 'User', 'Reason', 'Created At']
      const data = logs.map((log) => ({
        'ID': log.id,
        'Action': log.action,
        'Entity': log.entity,
        'Entity ID': log.entityId || 'N/A',
        'Admin': `${log.admin.firstName} ${log.admin.lastName} (${log.admin.email})`,
        'User': log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'N/A',
        'Reason': log.reason || 'N/A',
        'Created At': formatDate(new Date(log.createdAt), 'PPpp'),
      }))

      const filename = `audit-logs-${formatDate(new Date(), 'yyyy-MM-dd')}`

      switch (format) {
        case 'pdf':
          const summaryData = {
            title: 'Audit Logs Summary',
            type: 'AUDIT_LOG',
            content: `Total Logs: ${logs.length}\n\nLog Details:\n${logs.map((log, i) => `${i + 1}. ${log.action} on ${log.entity} by ${log.admin.firstName} ${log.admin.lastName} at ${formatDate(new Date(log.createdAt), 'PPpp')}`).join('\n')}`,
            createdAt: new Date().toISOString(),
          }
          exportToPDF(summaryData, `${filename}.pdf`)
          break
        case 'excel':
          exportTableToExcel(data, headers, `${filename}.xlsx`, 'Audit Logs')
          break
        case 'csv':
          exportTableToCSV(data, headers, `${filename}.csv`)
          break
      }
    } catch (error: any) {
      console.error('Error exporting audit logs:', error)
      alert('Failed to export audit logs')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading audit logs...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_USERS}>
        <Layout>
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <History className="h-8 w-8" />
                    Audit Logs
                  </h1>
                  <p className="text-blue-100">
                    Track all admin actions and changes in the system
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Download className="h-5 w-5" />
                    Export
                  </button>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Filter className="h-5 w-5" />
                    Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filter Audit Logs</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Action
                    </label>
                    <input
                      type="text"
                      value={filters.action}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                      placeholder="e.g., CREATE_USER"
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Entity
                    </label>
                    <input
                      type="text"
                      value={filters.entity}
                      onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                      placeholder="e.g., USER, POST"
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin ID
                    </label>
                    <input
                      type="text"
                      value={filters.adminId}
                      onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
                      placeholder="Admin user ID"
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={filters.userId}
                      onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                      placeholder="Affected user ID"
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setFilters({
                        action: '',
                        entity: '',
                        adminId: '',
                        userId: '',
                        startDate: '',
                        endDate: '',
                      })
                      setPage(1)
                    }}
                    className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Admin
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Affected User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatDate(new Date(log.createdAt), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(new Date(log.createdAt), 'HH:mm:ss')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.admin.firstName} {log.admin.lastName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {log.admin.email}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                {log.admin.role}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(
                              log.action,
                            )}`}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">{log.entity}</div>
                          {log.entityId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ID: {log.entityId.substring(0, 8)}...
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {log.user.firstName} {log.user.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {log.user.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {log.reason && (
                              <div className="mb-1">
                                <strong>Reason:</strong> {log.reason}
                              </div>
                            )}
                            {log.changes && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline text-xs">
                                  View Changes
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40">
                                  {formatChanges(log.changes)}
                                </pre>
                              </details>
                            )}
                            {log.metadata && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline text-xs">
                                  View Metadata
                                </summary>
                                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-40">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {logs.length === 0 && (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
                </div>
              )}

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
          <DownloadModal
            isOpen={showDownloadModal}
            onClose={() => setShowDownloadModal(false)}
            onDownload={handleDownload}
            title="Export Audit Logs"
          />
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

