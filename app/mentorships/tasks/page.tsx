'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import MentorshipSubNav from '@/components/MentorshipSubNav'
import { 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar,
  FileText,
  TrendingUp,
  Download,
  Edit,
  Eye,
  MoreVertical,
  X,
  ChevronDown
} from 'lucide-react'
import { format, isPast, differenceInDays } from 'date-fns'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description?: string
  week: number
  type: string
  status: string
  dueDate?: string
  completedAt?: string
  mentorFeedback?: string
  createdAt: string
  mentorship: {
    id: string
    mentor: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    mentee: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    cycle?: {
      id: string
      name: string
    }
  }
  program?: {
    id: string
    week: number
  }
}

interface TaskStats {
  overview: {
    total: number
    completed: number
    inProgress: number
    pending: number
    overdue: number
    tasksDueThisWeek: number
    completionRate: number
  }
  weekStats: Array<{
    week: number
    total: number
    completed: number
    completionRate: number
  }>
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [search, setSearch] = useState('')
  const [cycleId, setCycleId] = useState<string>('')
  const [mentorshipId, setMentorshipId] = useState<string>('')
  const [week, setWeek] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [overdue, setOverdue] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Cycles for filter
  const [cycles, setCycles] = useState<Array<{ id: string; name: string }>>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkAction, setBulkAction] = useState<'status' | 'dueDate' | 'week'>('status')
  const [bulkStatus, setBulkStatus] = useState<string>('COMPLETED')
  const [bulkDueDate, setBulkDueDate] = useState<string>('')
  const [bulkWeek, setBulkWeek] = useState<string>('')
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchStats()
      fetchCycles()
    }
  }, [user, page, cycleId, mentorshipId, week, status, overdue])

  const fetchCycles = async () => {
    try {
      const response = await api.get('/admin/mentorship/cycles')
      setCycles(response.data || [])
    } catch (error) {
      console.error('Error fetching cycles:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get(`/admin/mentorship/tasks/stats${cycleId ? `?cycleId=${cycleId}` : ''}`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(cycleId && { cycleId }),
        ...(mentorshipId && { mentorshipId }),
        ...(week && { week }),
        ...(status && { status }),
        ...(overdue && { overdue: 'true' }),
        ...(search && { search }),
      })
      const response = await api.get(`/admin/mentorship/tasks?${params}`)
      setTasks(response.data.tasks || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const isTaskOverdue = (task: Task) => {
    if (task.status === 'COMPLETED' || !task.dueDate) return false
    return isPast(new Date(task.dueDate)) && !task.dueDate.includes('T00:00:00')
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const handleBulkUpdate = async () => {
    if (selectedTasks.size === 0) {
      alert('Please select at least one task')
      return
    }

    try {
      setBulkLoading(true)
      const updates: any = {}

      if (bulkAction === 'status') {
        updates.status = bulkStatus
      } else if (bulkAction === 'dueDate') {
        if (!bulkDueDate) {
          alert('Please select a due date')
          return
        }
        updates.dueDate = bulkDueDate
      } else if (bulkAction === 'week') {
        if (!bulkWeek) {
          alert('Please select a week')
          return
        }
        updates.week = parseInt(bulkWeek)
      }

      await api.post('/admin/mentorship/tasks/bulk', {
        taskIds: Array.from(selectedTasks),
        updates,
      })

      alert(`Successfully updated ${selectedTasks.size} task(s)`)
      setSelectedTasks(new Set())
      setShowBulkModal(false)
      fetchTasks()
      fetchStats()
    } catch (error: any) {
      console.error('Error updating tasks:', error)
      alert(error.response?.data?.message || 'Failed to update tasks')
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)))
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(cycleId && { cycleId }),
        ...(mentorshipId && { mentorshipId }),
        ...(week && { week }),
        ...(status && { status }),
        ...(overdue && { overdue: 'true' }),
      })
      const response = await api.get(`/admin/mentorship/tasks?${params}&limit=1000`)
      const tasks = response.data.tasks || []
      
      // Convert to CSV
      const headers = ['Title', 'Week', 'Type', 'Status', 'Due Date', 'Completed At', 'Mentor', 'Mentee', 'Cycle']
      const rows = tasks.map((task: Task) => [
        task.title,
        task.week,
        task.type,
        task.status,
        task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        task.completedAt ? format(new Date(task.completedAt), 'yyyy-MM-dd') : '',
        `${task.mentorship.mentor.firstName} ${task.mentorship.mentor.lastName}`,
        `${task.mentorship.mentee.firstName} ${task.mentorship.mentee.lastName}`,
        task.mentorship.cycle?.name || '',
      ])
      
      const allRows: (string | number)[][] = [headers, ...rows]
      const csv = allRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`
      a.click()
    } catch (error) {
      console.error('Error exporting tasks:', error)
      alert('Failed to export tasks')
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      `${task.mentorship.mentor.firstName} ${task.mentorship.mentor.lastName}`.toLowerCase().includes(searchLower) ||
      `${task.mentorship.mentee.firstName} ${task.mentorship.mentee.lastName}`.toLowerCase().includes(searchLower)
    )
  })

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <MentorshipSubNav breadcrumbs={[{ label: 'Tasks' }]} />
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Monitoring</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Monitor and manage all mentorship tasks across cycles
              </p>
            </div>
            <div className="flex gap-2">
              {selectedTasks.size > 0 && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Bulk Actions ({selectedTasks.size})
                </button>
              )}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                    Total
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overview.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tasks</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                    Completed
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overview.completed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {stats.overview.completionRate.toFixed(1)}% completion rate
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full">
                    Overdue
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overview.overdue}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tasks past due</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                    Due Soon
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overview.tasksDueThisWeek}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Due this week</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {(cycleId || week || status || overdue) && (
                <button
                  onClick={() => {
                    setCycleId('')
                    setWeek('')
                    setStatus('')
                    setOverdue(false)
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cycle
                  </label>
                  <select
                    value={cycleId}
                    onChange={(e) => setCycleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Cycles</option>
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Week
                  </label>
                  <select
                    value={week}
                    onChange={(e) => setWeek(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Weeks</option>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w.toString()}>
                        Week {w}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={overdue}
                      onChange={(e) => setOverdue(e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Overdue Only
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500 dark:text-gray-400">Loading tasks...</div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Week
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Mentorship
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTasks.map((task) => {
                      const overdue = isTaskOverdue(task)
                      return (
                        <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTasks.has(task.id)}
                              onChange={() => toggleTaskSelection(task.id)}
                              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                  {task.description}
                                </p>
                              )}
                              <span className="inline-block mt-1 text-xs text-gray-400 dark:text-gray-500">
                                {task.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 dark:text-white">Week {task.week}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="text-gray-900 dark:text-white">
                                {task.mentorship.mentor.firstName} {task.mentorship.mentor.lastName}
                              </p>
                              <p className="text-gray-500 dark:text-gray-400 text-xs">
                                → {task.mentorship.mentee.firstName} {task.mentorship.mentee.lastName}
                              </p>
                              {task.mentorship.cycle && (
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                                  {task.mentorship.cycle.name}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {task.dueDate ? (
                              <div>
                                <p className={`text-sm ${overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                                  {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                </p>
                                {overdue && (
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {differenceInDays(new Date(), new Date(task.dueDate))} days overdue
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">No due date</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleViewTask(task)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Task Detail Modal */}
        {showTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Task Details</h2>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedTask.title}
                  </h3>
                  {selectedTask.description && (
                    <p className="text-gray-600 dark:text-gray-300">{selectedTask.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Week</p>
                    <p className="text-gray-900 dark:text-white">Week {selectedTask.week}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</p>
                    <p className="text-gray-900 dark:text-white capitalize">{selectedTask.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  {selectedTask.dueDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Due Date</p>
                      <p className={`${isTaskOverdue(selectedTask) ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-900 dark:text-white'}`}>
                        {format(new Date(selectedTask.dueDate), 'MMM dd, yyyy')}
                        {isTaskOverdue(selectedTask) && (
                          <span className="ml-2 text-xs">
                            ({differenceInDays(new Date(), new Date(selectedTask.dueDate))} days overdue)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedTask.completedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Completed At</p>
                      <p className="text-gray-900 dark:text-white">
                        {format(new Date(selectedTask.completedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Mentorship</p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">Mentor:</span> {selectedTask.mentorship.mentor.firstName} {selectedTask.mentorship.mentor.lastName}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white mt-1">
                      <span className="font-medium">Mentee:</span> {selectedTask.mentorship.mentee.firstName} {selectedTask.mentorship.mentee.lastName}
                    </p>
                    {selectedTask.mentorship.cycle && (
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        <span className="font-medium">Cycle:</span> {selectedTask.mentorship.cycle.name}
                      </p>
                    )}
                  </div>
                </div>

                {selectedTask.mentorFeedback && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Mentor Feedback</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className="text-sm text-gray-900 dark:text-white">{selectedTask.mentorFeedback}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/mentorships/${selectedTask.mentorship.id}`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    View Mentorship
                  </Link>
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bulk Update ({selectedTasks.size} tasks)
                </h2>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action
                  </label>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value as 'status' | 'dueDate' | 'week')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="status">Update Status</option>
                    <option value="dueDate">Update Due Date</option>
                    <option value="week">Update Week</option>
                  </select>
                </div>

                {bulkAction === 'status' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                )}

                {bulkAction === 'dueDate' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={bulkDueDate}
                      onChange={(e) => setBulkDueDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                {bulkAction === 'week' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Week
                    </label>
                    <select
                      value={bulkWeek}
                      onChange={(e) => setBulkWeek(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select Week</option>
                      {Array.from({ length: 8 }, (_, i) => i + 1).map((w) => (
                        <option key={w} value={w.toString()}>
                          Week {w}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleBulkUpdate}
                    disabled={bulkLoading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bulkLoading ? 'Updating...' : 'Update Tasks'}
                  </button>
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}
