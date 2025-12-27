'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import { BarChart3, Download, TrendingUp, Users, GraduationCap, School, BookOpen } from 'lucide-react'

export default function StudentAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/students/stats')
      setStats(res.data)
    } catch (e) {
      console.error('Failed to load student stats', e)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Analytics</h1>
                <p className="text-gray-600 dark:text-gray-400">MVP snapshot of student engagement inventory</p>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  try {
                    const response = await api.get('/admin/students/export', { responseType: 'blob' })
                    const url = window.URL.createObjectURL(new Blob([response.data]))
                    const link = document.createElement('a')
                    link.href = url
                    link.setAttribute('download', `students-export-${new Date().toISOString().split('T')[0]}.csv`)
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                  } catch (error) {
                    console.error('Error exporting students:', error)
                    alert('Failed to export students')
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Students
              </button>
            </div>

            {loading ? (
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            ) : !stats ? (
              <div className="text-gray-500 dark:text-gray-400">No data.</div>
            ) : (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-8 w-8 opacity-80" />
                      <TrendingUp className="h-5 w-5 opacity-80" />
                    </div>
                    <div className="text-sm opacity-90">Total Students</div>
                    <div className="text-3xl font-bold mt-1">{stats.students?.total || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <School className="h-8 w-8 opacity-80" />
                      <TrendingUp className="h-5 w-5 opacity-80" />
                    </div>
                    <div className="text-sm opacity-90">Active Scholarships</div>
                    <div className="text-3xl font-bold mt-1">{stats.scholarships?.active || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <BookOpen className="h-8 w-8 opacity-80" />
                      <TrendingUp className="h-5 w-5 opacity-80" />
                    </div>
                    <div className="text-sm opacity-90">Active Study Groups</div>
                    <div className="text-3xl font-bold mt-1">{stats.studyGroups?.active || 0}</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <GraduationCap className="h-8 w-8 opacity-80" />
                      <TrendingUp className="h-5 w-5 opacity-80" />
                    </div>
                    <div className="text-sm opacity-90">Total Applications</div>
                    <div className="text-3xl font-bold mt-1">{stats.applications?.total || 0}</div>
                  </div>
                </div>

                {/* Education Level Breakdown */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Students by Education Level</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Secondary</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.students?.secondary || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.students?.total
                          ? ((stats.students.secondary / stats.students.total) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">TVET</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.students?.tvet || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.students?.total
                          ? ((stats.students.tvet / stats.students.total) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">University</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.students?.university || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.students?.total
                          ? ((stats.students.university / stats.students.total) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Out of School</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {stats.students?.outOfSchool || 0}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.students?.total
                          ? ((stats.students.outOfSchool / stats.students.total) * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Scholarships</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.scholarships?.total || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats.scholarships?.active || 0} active
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Study Groups</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.studyGroups?.total || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats.studyGroups?.active || 0} active
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Resources</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {stats.resources?.total || 0}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}


