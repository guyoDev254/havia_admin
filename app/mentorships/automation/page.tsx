'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { 
  Rocket, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Send,
  Play,
  BarChart3,
  Target
} from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Cycle {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
}

interface Progress {
  activeMentorships: number
  completedMentorships: number
  completionRate: number
  tasks: {
    total: number
    completed: number
    completionRate: number
  }
  avgEngagement: number
  avgSatisfaction: number
}

interface Analytics {
  overview: {
    totalMentorships: number
    activeMentorships: number
    completedMentorships: number
    cancelledMentorships: number
    completionRate: number
  }
  participants: {
    totalMentors: number
    totalMentees: number
    totalParticipants: number
  }
  matching: {
    totalMatches: number
    approvedMatches: number
    approvalRate: number
  }
}

export default function MentorshipAutomationPage() {
  const { user } = useAuth()
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<string>('')
  const [progress, setProgress] = useState<Progress | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Announcement form
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL' as 'ALL' | 'MENTORS' | 'MENTEES' | 'ACTIVE_MENTORSHIPS',
    sendImmediately: true,
  })

  // Matching form
  const [showMatchingModal, setShowMatchingModal] = useState(false)
  const [matchingData, setMatchingData] = useState({
    minScore: 70,
    autoApprove: false,
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, selectedCycle])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cyclesRes, progressRes, analyticsRes] = await Promise.all([
        api.get('/admin/mentorship/cycles'),
        api.get(`/admin/mentorship/progress${selectedCycle ? `?cycleId=${selectedCycle}` : ''}`),
        api.get(`/admin/mentorship/analytics${selectedCycle ? `?cycleId=${selectedCycle}` : ''}`),
      ])
      setCycles(cyclesRes.data)
      setProgress(progressRes.data)
      setAnalytics(analyticsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLaunchCycle = async (cycleId: string) => {
    try {
      setActionLoading(`launch-${cycleId}`)
      const response = await api.post(`/admin/mentorship/cycles/${cycleId}/launch`)
      alert(`Cycle launched! Notified ${response.data.mentorsNotified} mentors and ${response.data.menteesNotified} mentees.`)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to launch cycle')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!announcementData.title.trim() || !announcementData.message.trim()) {
      alert('Please fill in both title and message')
      return
    }
    try {
      setActionLoading('announcement')
      const response = await api.post('/admin/mentorship/announcements', {
        ...announcementData,
        cycleId: selectedCycle || undefined,
      })
      alert(`Announcement sent to ${response.data.recipientsCount || 0} recipients (${announcementData.targetAudience})!`)
      setShowAnnouncementModal(false)
      setAnnouncementData({
        title: '',
        message: '',
        targetAudience: 'ALL',
        sendImmediately: true,
      })
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send announcement')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRunMatching = async () => {
    if (!selectedCycle) {
      alert('Please select a cycle first')
      return
    }
    try {
      setActionLoading('matching')
      const response = await api.post(
        `/admin/mentorship/cycles/${selectedCycle}/match?minScore=${matchingData.minScore}&autoApprove=${matchingData.autoApprove}`
      )
      const matchesCount = response.data.matchesCreated || response.data.totalMatches || 0
      if (matchesCount > 0) {
        alert(`Matching complete! Created ${matchesCount} ${matchesCount === 1 ? 'match' : 'matches'}.${matchingData.autoApprove ? ' All matches have been auto-approved and mentorships started!' : ' Please review and approve matches.'}`)
      } else {
        alert('Matching complete! No new matches were created. Try lowering the minimum score threshold.')
      }
      setShowMatchingModal(false)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to run matching')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendOnboarding = async (targetRole: 'MENTOR' | 'MENTEE') => {
    try {
      setActionLoading(`onboarding-${targetRole}`)
      const response = await api.post('/admin/mentorship/onboarding/send', {
        targetRole,
        cycleId: selectedCycle || undefined,
      })
      alert(`Onboarding notifications sent to ${response.data.notificationsSent} ${targetRole.toLowerCase()}s!`)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send onboarding notifications')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.MANAGE_MENTORSHIP}>
        <Layout>
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mentorship Automation
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Automate the entire mentorship process from announcements to tracking
              </p>
            </div>

            {/* Cycle Selector */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Filter by Cycle (Optional)
              </label>
              <select
                value={selectedCycle}
                onChange={(e) => setSelectedCycle(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Cycles</option>
                {cycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} ({cycle.status})
                  </option>
                ))}
              </select>
              {selectedCycle && (
                <button
                  onClick={() => setSelectedCycle('')}
                  className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all text-left border border-blue-200 dark:border-blue-800 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Send Announcement</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      Notify mentors and mentees
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (!selectedCycle) {
                    alert('Please select a cycle first')
                    return
                  }
                  setShowMatchingModal(true)
                }}
                className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all text-left border border-green-200 dark:border-green-800 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Run Matching</h3>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Automatically match mentors & mentees
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSendOnboarding('MENTOR')}
                disabled={actionLoading === 'onboarding-MENTOR'}
                className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed border border-purple-200 dark:border-purple-800 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-lg">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">Onboard Mentors</h3>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                      {actionLoading === 'onboarding-MENTOR' ? 'Sending...' : 'Send onboarding to mentors'}
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleSendOnboarding('MENTEE')}
                disabled={actionLoading === 'onboarding-MENTEE'}
                className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 shadow-lg rounded-xl p-6 hover:shadow-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed border border-orange-200 dark:border-orange-800 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-600 dark:bg-orange-500 rounded-lg">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900 dark:text-orange-100">Onboard Mentees</h3>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                      {actionLoading === 'onboarding-MENTEE' ? 'Sending...' : 'Send onboarding to mentees'}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Cycle Launch Section */}
            {cycles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Play className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Launch Cycles
                  </h2>
                </div>
                <div className="space-y-3">
                  {cycles
                    .filter((c) => c.status !== 'ACTIVE' && c.status !== 'COMPLETED')
                    .map((cycle) => (
                      <div
                        key={cycle.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {cycle.name}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              cycle.status === 'UPCOMING' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : cycle.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {cycle.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(cycle.startDate), 'MMM dd, yyyy')} -{' '}
                            {format(new Date(cycle.endDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleLaunchCycle(cycle.id)}
                          disabled={actionLoading === `launch-${cycle.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                        >
                          <Play className="h-4 w-4" />
                          {actionLoading === `launch-${cycle.id}` ? 'Launching...' : 'Launch'}
                        </button>
                      </div>
                    ))}
                  {cycles.filter((c) => c.status !== 'ACTIVE' && c.status !== 'COMPLETED').length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No cycles available to launch. All cycles are either active or completed.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Progress Tracking */}
            {progress && (
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Progress Tracking
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-green-900 dark:text-green-200">
                        Active Mentorships
                      </h3>
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                      {progress.activeMentorships}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        Completion Rate
                      </h3>
                      <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                      {progress.completionRate.toFixed(1)}%
                    </p>
                    <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, progress.completionRate)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                        Task Completion
                      </h3>
                      <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                      {progress.tasks.completionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                      {progress.tasks.completed} / {progress.tasks.total} tasks
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-5 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">
                        Avg Engagement
                      </h3>
                      <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                      {progress.avgEngagement.toFixed(1)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-lg p-5 border border-teal-200 dark:border-teal-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-teal-900 dark:text-teal-200">
                        Avg Satisfaction
                      </h3>
                      <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <p className="text-3xl font-bold text-teal-900 dark:text-teal-100">
                      {progress.avgSatisfaction.toFixed(1)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-lg p-5 border border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-cyan-900 dark:text-cyan-200">
                        Completed
                      </h3>
                      <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <p className="text-3xl font-bold text-cyan-900 dark:text-cyan-100">
                      {progress.completedMentorships}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics */}
            {analytics && (
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Analytics Overview
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">
                      Mentorships
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Total:</span>
                        <span className="font-bold text-blue-900 dark:text-blue-100">{analytics.overview.totalMentorships}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Active:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{analytics.overview.activeMentorships}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Completed:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{analytics.overview.completedMentorships}</span>
                      </div>
                      <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-700 dark:text-blue-300">Completion Rate:</span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">{analytics.overview.completionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-3">
                      Participants
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700 dark:text-purple-300">Mentors:</span>
                        <span className="font-bold text-purple-900 dark:text-purple-100">{analytics.participants.totalMentors}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-700 dark:text-purple-300">Mentees:</span>
                        <span className="font-bold text-purple-900 dark:text-purple-100">{analytics.participants.totalMentees}</span>
                      </div>
                      <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700 dark:text-purple-300">Total:</span>
                          <span className="font-bold text-purple-900 dark:text-purple-100">{analytics.participants.totalParticipants}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-200 mb-3">
                      Matching
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700 dark:text-green-300">Total Matches:</span>
                        <span className="font-bold text-green-900 dark:text-green-100">{analytics.matching.totalMatches}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700 dark:text-green-300">Approved:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{analytics.matching.approvedMatches}</span>
                      </div>
                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700 dark:text-green-300">Approval Rate:</span>
                          <span className="font-bold text-green-900 dark:text-green-100">{analytics.matching.approvalRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  {/* Mentorship Status Pie Chart */}
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Mentorship Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Active', value: analytics.overview.activeMentorships, color: '#16a34a' },
                            { name: 'Completed', value: analytics.overview.completedMentorships, color: '#2563eb' },
                            { name: 'Cancelled', value: analytics.overview.cancelledMentorships || 0, color: '#dc2626' },
                            { name: 'Pending', value: analytics.overview.totalMentorships - analytics.overview.activeMentorships - analytics.overview.completedMentorships - (analytics.overview.cancelledMentorships || 0), color: '#f59e0b' },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Active', value: analytics.overview.activeMentorships, color: '#16a34a' },
                            { name: 'Completed', value: analytics.overview.completedMentorships, color: '#2563eb' },
                            { name: 'Cancelled', value: analytics.overview.cancelledMentorships || 0, color: '#dc2626' },
                            { name: 'Pending', value: analytics.overview.totalMentorships - analytics.overview.activeMentorships - analytics.overview.completedMentorships - (analytics.overview.cancelledMentorships || 0), color: '#f59e0b' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Participants Comparison */}
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Participants Overview
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { name: 'Mentors', value: analytics.participants.totalMentors },
                          { name: 'Mentees', value: analytics.participants.totalMentees },
                          { name: 'Total', value: analytics.participants.totalParticipants },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                        <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                        <YAxis className="text-gray-600 dark:text-gray-400" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Matching Performance */}
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Matching Performance
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={[
                          { name: 'Total Matches', value: analytics.matching.totalMatches },
                          { name: 'Approved', value: analytics.matching.approvedMatches },
                          { name: 'Pending', value: analytics.matching.totalMatches - analytics.matching.approvedMatches },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                        <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" />
                        <YAxis className="text-gray-600 dark:text-gray-400" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#16a34a"
                          fill="#16a34a"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Announcement Modal */}
            {showAnnouncementModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Send Announcement
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={announcementData.title}
                        onChange={(e) =>
                          setAnnouncementData({ ...announcementData, title: e.target.value })
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Announcement title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Message
                      </label>
                      <textarea
                        value={announcementData.message}
                        onChange={(e) =>
                          setAnnouncementData({ ...announcementData, message: e.target.value })
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={4}
                        placeholder="Announcement message"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Audience
                      </label>
                      <select
                        value={announcementData.targetAudience}
                        onChange={(e) =>
                          setAnnouncementData({
                            ...announcementData,
                            targetAudience: e.target.value as any,
                          })
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="ALL">All Participants</option>
                        <option value="MENTORS">Mentors Only</option>
                        <option value="MENTEES">Mentees Only</option>
                        <option value="ACTIVE_MENTORSHIPS">Active Mentorships</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={announcementData.sendImmediately}
                        onChange={(e) =>
                          setAnnouncementData({
                            ...announcementData,
                            sendImmediately: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Send immediately
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSendAnnouncement}
                        disabled={actionLoading === 'announcement'}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                      >
                        {actionLoading === 'announcement' ? 'Sending...' : 'Send'}
                      </button>
                      <button
                        onClick={() => setShowAnnouncementModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Matching Modal */}
            {showMatchingModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Run Automated Matching
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum Match Score (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={matchingData.minScore}
                        onChange={(e) =>
                          setMatchingData({
                            ...matchingData,
                            minScore: parseInt(e.target.value),
                          })
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={matchingData.autoApprove}
                        onChange={(e) =>
                          setMatchingData({
                            ...matchingData,
                            autoApprove: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Auto-approve matches (creates mentorships immediately)
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRunMatching}
                        disabled={actionLoading === 'matching'}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                      >
                        {actionLoading === 'matching' ? 'Running...' : 'Run Matching'}
                      </button>
                      <button
                        onClick={() => setShowMatchingModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
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

