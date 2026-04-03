'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import MentorshipSubNav from '@/components/MentorshipSubNav'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

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

const COLORS = ['#16a34a', '#0284c7', '#6b7280', '#dc2626']

export default function TaskAnalyticsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [cycleId, setCycleId] = useState<string>('')
  const [cycles, setCycles] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchCycles()
    }
  }, [user, cycleId])

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
      setLoading(true)
      const response = await api.get(`/admin/mentorship/tasks/stats${cycleId ? `?cycleId=${cycleId}` : ''}`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusData = stats ? [
    { name: 'Completed', value: stats.overview.completed, color: '#16a34a' },
    { name: 'In Progress', value: stats.overview.inProgress, color: '#0284c7' },
    { name: 'Pending', value: stats.overview.pending, color: '#6b7280' },
    { name: 'Overdue', value: stats.overview.overdue, color: '#dc2626' },
  ] : []

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <MentorshipSubNav breadcrumbs={[{ label: 'Tasks', href: '/mentorships/tasks' }, { label: 'Analytics' }]} />
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Analytics</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comprehensive task performance metrics and trends
              </p>
            </div>
            <select
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Cycles</option>
              {cycles.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
          </div>

          {stats && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-full">
                      Completion Rate
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.overview.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {stats.overview.completed} of {stats.overview.total} tasks
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-2 py-1 rounded-full">
                      Overdue
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.overview.overdue}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {stats.overview.total > 0 
                      ? ((stats.overview.overdue / stats.overview.total) * 100).toFixed(1)
                      : 0}% of total tasks
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                      Due This Week
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.overview.tasksDueThisWeek}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tasks due soon</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                      In Progress
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.overview.inProgress}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active tasks</p>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Task Status Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Week-by-Week Completion Rate */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Completion Rate by Week
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.weekStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completionRate" fill="#16a34a" name="Completion Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tasks by Week */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tasks by Week
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.weekStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#0284c7" name="Total Tasks" />
                      <Bar dataKey="completed" fill="#16a34a" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Week Stats Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Weekly Breakdown
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Week
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Completed
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {stats.weekStats.map((week) => (
                          <tr key={week.week}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                              Week {week.week}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {week.total}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                              {week.completed}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${week.completionRate}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-900 dark:text-white w-12 text-right">
                                  {week.completionRate.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
