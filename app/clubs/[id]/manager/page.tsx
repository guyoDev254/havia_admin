'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  Users,
  MessageSquare,
  BarChart3,
  Download,
  Bell,
  UserPlus,
  TrendingUp,
  Calendar,
  FileText,
  Award,
  Send,
  Mail,
  Activity,
  Target,
  Zap,
  Users2,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Settings,
  UserMinus,
  Shield,
} from 'lucide-react'
import Link from 'next/link'

interface ClubManagerDashboard {
  club: {
    id: string
    name: string
    description: string
    logo?: string
    banner?: string
    category: string
    _count: {
      members: number
      events: number
    }
  }
  analytics: {
    memberCount: number
    activeMembers: number
    newMembersThisMonth: number
    eventCount: number
    upcomingEvents: number
    postCount: number
    engagementScore: number
    averageAttendance: number
    topMembers: Array<{
      id: string
      firstName: string
      lastName: string
      engagementScore: number
      eventsAttended: number
    }>
    memberGrowth: Array<{ date: string; count: number }>
    engagementTrend: Array<{ date: string; score: number }>
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    createdAt: string
    user?: {
      firstName: string
      lastName: string
    }
  }>
  pendingActions: Array<{
    id: string
    type: string
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
  }>
}

export default function ClubManagerDashboard() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const clubId = params.id as string

  const [dashboard, setDashboard] = useState<ClubManagerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageForm, setMessageForm] = useState({
    subject: '',
    message: '',
    targetAudience: 'all', // all, active, inactive, new
  })

  useEffect(() => {
    if (user && clubId) {
      fetchDashboard()
    }
  }, [user, clubId])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      // Fetch club details
      const clubResponse = await api.get(`/clubs/${clubId}`)
      
      // Fetch analytics
      const analyticsResponse = await api.get(`/clubs/${clubId}/analytics`).catch(() => ({ data: {} }))
      
      // Fetch recent activity
      const activityResponse = await api.get(`/clubs/${clubId}/activity?limit=10`).catch(() => ({ data: [] }))
      
      // Fetch pending actions (applications, reports, etc.)
      const pendingResponse = await api.get(`/clubs/${clubId}/pending-actions`).catch(() => ({ data: [] }))

      setDashboard({
        club: clubResponse.data,
        analytics: {
          memberCount: clubResponse.data._count?.members || 0,
          activeMembers: analyticsResponse.data?.activeMembers || 0,
          newMembersThisMonth: analyticsResponse.data?.newMembersThisMonth || 0,
          eventCount: clubResponse.data._count?.events || 0,
          upcomingEvents: analyticsResponse.data?.upcomingEvents || 0,
          postCount: analyticsResponse.data?.postCount || 0,
          engagementScore: analyticsResponse.data?.engagementScore || 0,
          averageAttendance: analyticsResponse.data?.averageAttendance || 0,
          topMembers: analyticsResponse.data?.topMembers || [],
          memberGrowth: analyticsResponse.data?.memberGrowth || [],
          engagementTrend: analyticsResponse.data?.engagementTrend || [],
        },
        recentActivity: activityResponse.data || [],
        pendingActions: pendingResponse.data || [],
      })
    } catch (error: any) {
      console.error('Error fetching dashboard:', error)
      showError('Failed to Load Dashboard', error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!messageForm.subject.trim() || !messageForm.message.trim()) {
      showError('Validation Error', 'Please fill in both subject and message')
      return
    }

    const confirmed = await showConfirm(
      'Send Announcement',
      `Send this announcement to ${messageForm.targetAudience === 'all' ? 'all' : messageForm.targetAudience} members?`,
      'Yes, send',
      'Cancel'
    )
    if (!confirmed) return

    try {
      setSendingMessage(true)
      await api.post(`/clubs/${clubId}/announcements`, {
        subject: messageForm.subject,
        message: messageForm.message,
        targetAudience: messageForm.targetAudience,
      })
      showSuccess('Announcement Sent', 'Your announcement has been sent successfully')
      setMessageForm({ subject: '', message: '', targetAudience: 'all' })
    } catch (error: any) {
      showError('Failed to Send', error.response?.data?.message || 'An error occurred while sending the announcement')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleExportMembers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/members/export`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `club-members-${dashboard?.club.name}-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showSuccess('Export Complete', 'Member data has been exported successfully')
    } catch (error: any) {
      showError('Export Failed', error.response?.data?.message || 'An error occurred while exporting')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading club manager dashboard..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!dashboard) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load dashboard</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/clubs/${clubId}`}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{dashboard.club.name} - Manager Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your club effectively</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportMembers}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Members
              </button>
              <Link
                href={`/clubs/${clubId}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Club Settings
              </Link>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Members</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.analytics.memberCount}</p>
                  <p className="text-blue-100 text-xs mt-2">
                    {dashboard.analytics.newMembersThisMonth} new this month
                  </p>
                </div>
                <Users className="h-12 w-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Members</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.analytics.activeMembers}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    {Math.round((dashboard.analytics.activeMembers / dashboard.analytics.memberCount) * 100) || 0}% active
                  </p>
                </div>
                <Activity className="h-12 w-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Engagement Score</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.analytics.engagementScore}</p>
                  <p className="text-green-100 text-xs mt-2">
                    {dashboard.analytics.averageAttendance} avg attendance
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 opacity-80" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Upcoming Events</p>
                  <p className="text-3xl font-bold mt-1">{dashboard.analytics.upcomingEvents}</p>
                  <p className="text-orange-100 text-xs mt-2">
                    {dashboard.analytics.eventCount} total events
                  </p>
                </div>
                <Calendar className="h-12 w-12 opacity-80" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href={`/events/create?clubId=${clubId}`}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Create Event</span>
              </Link>
              <Link
                href={`/clubs/${clubId}/programs/create`}
                className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Target className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">New Program</span>
              </Link>
              <Link
                href={`/clubs/${clubId}/resources/create`}
                className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Add Resource</span>
              </Link>
              <button
                onClick={() => {
                  const modal = document.getElementById('announcement-modal')
                  if (modal) (modal as any).showModal()
                }}
                className="flex flex-col items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <Bell className="h-8 w-8 text-orange-600 dark:text-orange-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Send Announcement</span>
              </button>
            </div>
          </div>

          {/* Additional Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Additional Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href={`/clubs/${clubId}/members`}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Manage Members</span>
              </Link>
              <Link
                href={`/clubs/${clubId}/insights`}
                className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
              >
                <Target className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Insights</span>
              </Link>
              <Link
                href={`/clubs/${clubId}/moderation`}
                className="flex flex-col items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <Shield className="h-8 w-8 text-red-600 dark:text-red-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Moderation</span>
              </Link>
              <Link
                href={`/clubs/${clubId}/onboarding`}
                className="flex flex-col items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <UserPlus className="h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Onboarding</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pending Actions
              </h2>
              {dashboard.pendingActions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                  <p>No pending actions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.pendingActions.map((action) => (
                    <div
                      key={action.id}
                      className={`p-4 rounded-lg border ${
                        action.priority === 'high'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : action.priority === 'medium'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.description}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            action.priority === 'high'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : action.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {action.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top Engaged Members
              </h2>
              {dashboard.analytics.topMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No member data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.analytics.topMembers.slice(0, 5).map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {member.eventsAttended} events attended
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{member.engagementScore}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">score</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </h2>
            {dashboard.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="mt-1">
                      {activity.type === 'member_joined' && <UserPlus className="h-5 w-5 text-green-500" />}
                      {activity.type === 'event_created' && <Calendar className="h-5 w-5 text-blue-500" />}
                      {activity.type === 'post_created' && <FileText className="h-5 w-5 text-purple-500" />}
                      {activity.type === 'member_left' && <UserMinus className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
                      {activity.user && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          by {activity.user.firstName} {activity.user.lastName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Announcement Modal */}
        <dialog id="announcement-modal" className="modal">
          <div className="modal-box bg-white dark:bg-gray-800">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Send Club Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Announcement subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Your announcement message"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Audience
                </label>
                <select
                  value={messageForm.targetAudience}
                  onChange={(e) => setMessageForm({ ...messageForm, targetAudience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All Members</option>
                  <option value="active">Active Members Only</option>
                  <option value="inactive">Inactive Members</option>
                  <option value="new">New Members (Last 30 days)</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    const modal = document.getElementById('announcement-modal')
                    if (modal) (modal as any).close()
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  disabled={sendingMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {sendingMessage ? 'Sending...' : 'Send Announcement'}
                </button>
              </div>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </Layout>
    </ProtectedRoute>
  )
}

