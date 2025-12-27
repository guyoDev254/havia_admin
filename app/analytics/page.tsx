'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { BarChart3, TrendingUp, Users, Calendar, Award, Download, FileText } from 'lucide-react'

interface Analytics {
  users: {
    total: number
    active: number
    new: number
    growth: number
  }
  engagement: {
    dailyActive: number
    weeklyActive: number
    monthlyActive: number
  }
  content: {
    clubs: number
    events: number
    mentorships: number
  }
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && hasPermission(Permission.VIEW_ANALYTICS)) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/statistics')
      setAnalytics({
        users: {
          total: response.data.users?.total || 0,
          active: response.data.users?.active || 0,
          new: response.data.users?.recent || 0,
          growth: 12.5, // Placeholder
        },
        engagement: {
          dailyActive: 0,
          weeklyActive: 0,
          monthlyActive: 0,
        },
        content: {
          clubs: response.data.clubs?.total || 0,
          events: response.data.events?.total || 0,
          mentorships: response.data.mentorships?.total || 0,
        },
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!hasPermission(Permission.EXPORT_DATA)) {
      alert('You do not have permission to export data')
      return
    }
    // Implement export functionality
    alert('Export functionality coming soon')
  }

  if (!hasPermission(Permission.VIEW_ANALYTICS)) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="text-red-700">You don't have permission to view analytics.</p>
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
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <BarChart3 className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                  <p className="text-blue-100">
                    Comprehensive insights into platform performance
                  </p>
                </div>
              </div>
              <PermissionGuard permission={Permission.EXPORT_DATA}>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-blue-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.users.total.toLocaleString() || 0}
              </p>
              <p className="text-xs text-green-600 mt-2">
                +{analytics?.users.growth || 0}% growth
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 text-purple-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.content.events.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Active events</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-green-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Clubs</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.content.clubs.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Active clubs</p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-orange-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Mentorships</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.content.mentorships.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-500 mt-2">Active programs</p>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Daily Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.engagement.dailyActive || 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Weekly Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.engagement.weeklyActive || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Monthly Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.engagement.monthlyActive || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Reports Section */}
          <PermissionGuard permission={Permission.GENERATE_REPORTS}>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Generate Reports</h2>
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get('/admin/analytics/export', { responseType: 'blob' })
                      const url = window.URL.createObjectURL(new Blob([response.data]))
                      const link = document.createElement('a')
                      link.href = url
                      link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`)
                      document.body.appendChild(link)
                      link.click()
                      link.remove()
                    } catch (error) {
                      console.error('Error exporting analytics:', error)
                      alert('Failed to export analytics')
                    }
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Analytics Export</p>
                      <p className="text-sm text-gray-600">Export all analytics data as CSV</p>
                    </div>
                    <Download className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get('/admin/users/export/all', { responseType: 'blob' })
                      const url = window.URL.createObjectURL(new Blob([response.data]))
                      const link = document.createElement('a')
                      link.href = url
                      link.setAttribute('download', `users-export-${new Date().toISOString().split('T')[0]}.csv`)
                      document.body.appendChild(link)
                      link.click()
                      link.remove()
                    } catch (error) {
                      console.error('Error exporting users:', error)
                      alert('Failed to export users')
                    }
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">User Export</p>
                      <p className="text-sm text-gray-600">Export all users data as CSV</p>
                    </div>
                    <Download className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                  <p className="font-semibold text-gray-900 mb-1">Content Report</p>
                  <p className="text-sm text-gray-600">Clubs, events, and mentorship data</p>
                </button>
              </div>
            </div>
          </PermissionGuard>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

