'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { ClipboardList, Plus, ArrowLeft, Filter, Search, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Attendance {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  notes?: string
  user?: {
    id: string
    firstName: string
    lastName: string
  }
  eventId?: string
  projectId?: string
}

export default function ClubAttendancePage() {
  const params = useParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const clubId = params.id as string

  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (clubId) {
      fetchClub()
      fetchAttendance()
    }
  }, [clubId, statusFilter, dateFilter])

  const fetchClub = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClub(response.data)
    } catch (error) {
      console.error('Error fetching club:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateFilter) {
        params.append('startDate', dateFilter)
        params.append('endDate', dateFilter)
      }
      const response = await api.get(`/clubs/${clubId}/attendance?${params}`)
      setAttendance(response.data || [])
    } catch (error) {
      console.error('Error fetching attendance:', error)
      showError('Error', 'Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const filteredAttendance = attendance.filter((record) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        record.user?.firstName.toLowerCase().includes(query) ||
        record.user?.lastName.toLowerCase().includes(query) ||
        record.notes?.toLowerCase().includes(query)
      )
    }
    if (statusFilter !== 'all' && record.status !== statusFilter) {
      return false
    }
    return true
  })

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'PRESENT').length,
    absent: attendance.filter((a) => a.status === 'ABSENT').length,
    late: attendance.filter((a) => a.status === 'LATE').length,
    excused: attendance.filter((a) => a.status === 'EXCUSED').length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return CheckCircle
      case 'ABSENT':
        return XCircle
      case 'LATE':
        return Clock
      default:
        return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'ABSENT':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
      case 'LATE':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  if (loading && !club) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading attendance records..." showProgress={true} fullScreen={false} />
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attendance</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club?.name} • Record and track member attendance</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="h-4 w-4" />
              Record Attendance
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Records</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Present</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.present}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl shadow p-4 border border-red-200 dark:border-red-800">
              <div className="text-sm text-red-600 dark:text-red-400 mb-1">Absent</div>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.absent}</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Late</div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.late}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Excused</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.excused}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Status</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>
            </div>
          </div>

          {filteredAttendance.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No attendance records yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start recording attendance for events and activities.</p>
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Record First Attendance</button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAttendance.map((record) => {
                      const StatusIcon = getStatusIcon(record.status)
                      return (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-white">{format(new Date(record.date), 'MMM d, yyyy')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.user ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-white">{record.user.firstName} {record.user.lastName}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">Anonymous</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(record.status)}`}>
                              <StatusIcon className="h-3 w-3" />
                              {record.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{record.notes || '-'}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        {showCreateModal && <CreateAttendanceModal clubId={clubId} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchAttendance(); }} />}
      </Layout>
    </ProtectedRoute>
  )
}

function CreateAttendanceModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const { showSuccess, showError } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [formData, setFormData] = useState({ userId: '', date: new Date().toISOString().split('T')[0], status: 'PRESENT' as 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', notes: '', eventId: '', projectId: '' })

  useEffect(() => {
    fetchMembers()
  }, [clubId])

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/members`)
      setMembers(response.data.members || [])
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.userId) { showError('Validation Error', 'Please select a member'); return }
    try {
      setLoading(true)
      const payload: any = { userId: formData.userId, date: formData.date, status: formData.status }
      if (formData.notes) payload.notes = formData.notes
      if (formData.eventId) payload.eventId = formData.eventId
      if (formData.projectId) payload.projectId = formData.projectId
      await api.post(`/clubs/${clubId}/attendance`, payload)
      showSuccess('Success', 'Attendance recorded successfully!')
      onSuccess()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to record attendance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Record Attendance</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><span className="text-2xl">&times;</span></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member *</label>
            <select value={formData.userId} onChange={(e) => setFormData({ ...formData, userId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
              <option value="">Select a member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.userId || member.id}>{member.user?.firstName} {member.user?.lastName} ({member.user?.email || 'No email'})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Additional notes..." />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">{loading ? 'Recording...' : 'Record Attendance'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

