'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { FileText, Plus, ArrowLeft, Filter, Search, Download, Eye, Calendar, BarChart3, Users, DollarSign, Target } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import DownloadModal from '@/components/DownloadModal'
import { ExportFormat, exportToPDF, exportToExcel, exportToCSV } from '@/lib/report-export'

interface Report {
  id: string
  type: 'ACTIVITY_SUMMARY' | 'FINANCIAL_SUMMARY' | 'PROJECT_UPDATE' | 'MEMBERSHIP_REPORT' | 'CUSTOM'
  title: string
  content: string
  periodStart?: string
  periodEnd?: string
  isPublic: boolean
  createdAt: string
}

export default function ClubReportsPage() {
  const params = useParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const clubId = params.id as string

  const [reports, setReports] = useState<Report[]>([])
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  useEffect(() => {
    if (clubId) {
      fetchClub()
      fetchReports()
    }
  }, [clubId, typeFilter])

  const fetchClub = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClub(response.data)
    } catch (error) {
      console.error('Error fetching club:', error)
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      const response = await api.get(`/clubs/${clubId}/reports?${params}`)
      setReports(response.data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      showError('Error', 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (type: string, periodStart?: string, periodEnd?: string) => {
    try {
      const params = new URLSearchParams()
      params.append('type', type)
      if (periodStart) params.append('startDate', periodStart)
      if (periodEnd) params.append('endDate', periodEnd)
      const response = await api.get(`/clubs/${clubId}/reports/generate?${params}`)
      showSuccess('Success', 'Report generated successfully!')
      fetchReports()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to generate report')
    }
  }

  const filteredReports = reports.filter((report) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        report.title.toLowerCase().includes(query) ||
        report.content.toLowerCase().includes(query)
      )
    }
    return true
  })

  const reportTypes = [
    { name: 'Activity Summary', type: 'ACTIVITY_SUMMARY', description: 'Overview of club activities and engagement', icon: BarChart3, color: 'bg-blue-500' },
    { name: 'Financial Summary', type: 'FINANCIAL_SUMMARY', description: 'Financial contributions and usage summary', icon: DollarSign, color: 'bg-green-500' },
    { name: 'Project Update', type: 'PROJECT_UPDATE', description: 'Project progress and milestones', icon: Target, color: 'bg-orange-500' },
    { name: 'Membership Report', type: 'MEMBERSHIP_REPORT', description: 'Member statistics and growth', icon: Users, color: 'bg-purple-500' },
    { name: 'Custom Report', type: 'CUSTOM', description: 'Create a custom report', icon: FileText, color: 'bg-teal-500' },
  ]

  const getTypeIcon = (type: string) => {
    const reportType = reportTypes.find((rt) => rt.type === type)
    return reportType?.icon || FileText
  }

  const getTypeColor = (type: string) => {
    const reportType = reportTypes.find((rt) => rt.type === type)
    return reportType?.color || 'bg-gray-500'
  }

  const handleDownloadClick = (report: Report) => {
    setSelectedReport(report)
    setShowDownloadModal(true)
  }

  const handleDownload = (format: ExportFormat) => {
    if (!selectedReport) return

    const reportData = {
      title: selectedReport.title,
      type: selectedReport.type,
      content: selectedReport.content,
      periodStart: selectedReport.periodStart,
      periodEnd: selectedReport.periodEnd,
      createdAt: selectedReport.createdAt,
      clubName: club?.name,
    }

    try {
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
    } catch (error: any) {
      showError('Error', error.message || 'Failed to download report')
    }
  }

  if (loading && !club) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading reports..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/clubs/features" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club?.name} • Generate reports for funders and stakeholders</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              <Plus className="h-4 w-4" />
              Generate Report
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Generate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((reportType) => {
                const Icon = reportType.icon
                return (
                  <button key={reportType.type} onClick={() => handleGenerateReport(reportType.type)} className="group p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all text-left">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 ${reportType.color} rounded-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 mb-1">{reportType.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{reportType.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Types</option>
                  <option value="ACTIVITY_SUMMARY">Activity Summary</option>
                  <option value="FINANCIAL_SUMMARY">Financial Summary</option>
                  <option value="PROJECT_UPDATE">Project Update</option>
                  <option value="MEMBERSHIP_REPORT">Membership Report</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reports generated yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Generate your first report for funders and stakeholders.</p>
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">Generate First Report</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredReports.map((report) => {
                const Icon = getTypeIcon(report.type)
                return (
                  <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${getTypeColor(report.type)} rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">{report.type.replace('_', ' ')}</span>
                            {report.isPublic && <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">Public</span>}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{report.title}</h3>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">{report.content}</p>
                    {(report.periodStart || report.periodEnd) && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{report.periodStart && format(new Date(report.periodStart), 'MMM d, yyyy')}{report.periodStart && report.periodEnd && ' - '}{report.periodEnd && format(new Date(report.periodEnd), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(report.createdAt), 'MMM d, yyyy')}</div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            // View report details - you can implement a modal here
                            showSuccess('View Report', report.content.substring(0, 200) + '...')
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="View Report"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDownloadClick(report)}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Download Report"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {showCreateModal && <CreateReportModal clubId={clubId} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchReports(); }} />}
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => {
            setShowDownloadModal(false)
            setSelectedReport(null)
          }}
          onDownload={handleDownload}
          title="Download Report"
        />
      </Layout>
    </ProtectedRoute>
  )
}

function CreateReportModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const { showSuccess, showError } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ type: 'ACTIVITY_SUMMARY' as 'ACTIVITY_SUMMARY' | 'FINANCIAL_SUMMARY' | 'PROJECT_UPDATE' | 'MEMBERSHIP_REPORT' | 'CUSTOM', title: '', content: '', periodStart: '', periodEnd: '', isPublic: false })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) { showError('Validation Error', 'Title and content are required'); return }
    try {
      setLoading(true)
      const payload: any = { type: formData.type, title: formData.title, content: formData.content, isPublic: formData.isPublic }
      if (formData.periodStart) payload.periodStart = formData.periodStart
      if (formData.periodEnd) payload.periodEnd = formData.periodEnd
      await api.post(`/clubs/${clubId}/reports`, payload)
      showSuccess('Success', 'Report created successfully!')
      onSuccess()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to create report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Report</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><span className="text-2xl">&times;</span></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Type *</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
              <option value="ACTIVITY_SUMMARY">Activity Summary</option>
              <option value="FINANCIAL_SUMMARY">Financial Summary</option>
              <option value="PROJECT_UPDATE">Project Update</option>
              <option value="MEMBERSHIP_REPORT">Membership Report</option>
              <option value="CUSTOM">Custom Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter report title..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content *</label>
            <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter report content..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period Start</label>
              <input type="date" value={formData.periodStart} onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period End</label>
              <input type="date" value={formData.periodEnd} onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })} min={formData.periodStart} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">Make this report public to club members</label>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50">{loading ? 'Generating...' : 'Generate Report'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

