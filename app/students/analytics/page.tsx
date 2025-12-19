'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import { BarChart3 } from 'lucide-react'

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

            {loading ? (
              <div className="text-gray-500 dark:text-gray-400">Loading...</div>
            ) : !stats ? (
              <div className="text-gray-500 dark:text-gray-400">No data.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total students</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.students?.total || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Secondary</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.students?.secondary || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">TVET</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.students?.tvet || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">University</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.students?.university || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Out of school</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.students?.outOfSchool || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Scholarships</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.scholarships?.active || 0} active
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Study groups</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.studyGroups?.active || 0} active
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.applications?.total || 0}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}


