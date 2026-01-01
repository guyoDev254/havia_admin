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
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MessageSquare,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Activity,
} from 'lucide-react'
import Link from 'next/link'

interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'success' | 'info'
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  priority: 'high' | 'medium' | 'low'
}

interface MemberInsight {
  memberId: string
  memberName: string
  insight: string
  recommendation: string
  engagementScore: number
}

export default function ClubInsightsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showError } = useSweetAlert()
  const clubId = params.id as string

  const [insights, setInsights] = useState<Insight[]>([])
  const [memberInsights, setMemberInsights] = useState<MemberInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [clubName, setClubName] = useState('')

  useEffect(() => {
    if (user && clubId) {
      fetchInsights()
      fetchClubName()
    }
  }, [user, clubId])

  const fetchClubName = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClubName(response.data.name)
    } catch (error) {
      console.error('Error fetching club name:', error)
    }
  }

  const fetchInsights = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics to generate insights
      const analyticsResponse = await api.get(`/clubs/${clubId}/analytics`).catch(() => ({ data: {} }))
      const analytics = analyticsResponse.data

      // Generate insights based on analytics
      const generatedInsights: Insight[] = []

      // Member engagement insights
      if (analytics.activeMembers && analytics.memberCount) {
        const activePercentage = (analytics.activeMembers / analytics.memberCount) * 100
        if (activePercentage < 30) {
          generatedInsights.push({
            id: 'low-engagement',
            type: 'warning',
            title: 'Low Member Engagement',
            description: `Only ${Math.round(activePercentage)}% of members are active. Consider organizing events or sending announcements to re-engage members.`,
            action: {
              label: 'Create Event',
              href: `/events/create?clubId=${clubId}`,
            },
            priority: 'high',
          })
        } else if (activePercentage > 70) {
          generatedInsights.push({
            id: 'high-engagement',
            type: 'success',
            title: 'Excellent Engagement',
            description: `${Math.round(activePercentage)}% of members are active. Great job maintaining engagement!`,
            priority: 'low',
          })
        }
      }

      // Event insights
      if (analytics.upcomingEvents === 0) {
        generatedInsights.push({
          id: 'no-upcoming-events',
          type: 'opportunity',
          title: 'No Upcoming Events',
          description: 'Schedule events to keep members engaged and attract new members.',
          action: {
            label: 'Create Event',
            href: `/events/create?clubId=${clubId}`,
          },
          priority: 'high',
        })
      }

      // Member growth insights
      if (analytics.newMembersThisMonth && analytics.newMembersThisMonth < 3) {
        generatedInsights.push({
          id: 'slow-growth',
          type: 'info',
          title: 'Slow Member Growth',
          description: `Only ${analytics.newMembersThisMonth} new member(s) this month. Consider promoting your club or organizing recruitment events.`,
          priority: 'medium',
        })
      }

      // Engagement score insights
      if (analytics.engagementScore && analytics.engagementScore < 50) {
        generatedInsights.push({
          id: 'low-engagement-score',
          type: 'warning',
          title: 'Low Engagement Score',
          description: `Your club's engagement score is ${analytics.engagementScore}. Focus on creating more interactive content and events.`,
          priority: 'high',
        })
      }

      // Fetch member-specific insights
      const membersResponse = await api.get(`/clubs/${clubId}/members`).catch(() => ({ data: { members: [] } }))
      const memberInsightsData: MemberInsight[] = []

      // Generate insights for top and bottom performers
      if (analytics.topMembers) {
        analytics.topMembers.slice(0, 3).forEach((member: any) => {
          memberInsightsData.push({
            memberId: member.id,
            memberName: `${member.firstName} ${member.lastName}`,
            insight: 'Highly engaged member',
            recommendation: 'Consider promoting to a leadership role or asking them to mentor new members.',
            engagementScore: member.engagementScore,
          })
        })
      }

      setInsights(generatedInsights)
      setMemberInsights(memberInsightsData)
    } catch (error: any) {
      console.error('Error fetching insights:', error)
      showError('Failed to Load Insights', error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <BarChart3 className="h-5 w-5 text-blue-500" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Analyzing insights..." showProgress={true} fullScreen={false} />
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Insights & Recommendations</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{clubName}</p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Key Insights
            </h2>
            {insights.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p>No insights at this time. Your club is doing well!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights
                  .sort((a, b) => {
                    const priorityOrder = { high: 3, medium: 2, low: 1 }
                    return priorityOrder[b.priority] - priorityOrder[a.priority]
                  })
                  .map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h3>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                insight.priority === 'high'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : insight.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              }`}
                            >
                              {insight.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{insight.description}</p>
                          {insight.action && (
                            <Link
                              href={insight.action.href}
                              className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                              {insight.action.label} →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Member Recommendations */}
          {memberInsights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Member Recommendations
              </h2>
              <div className="space-y-4">
                {memberInsights.map((insight) => (
                  <div
                    key={insight.memberId}
                    className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{insight.memberName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.insight}</p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                          💡 {insight.recommendation}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {insight.engagementScore}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Insights</p>
                  <p className="text-3xl font-bold mt-1">{insights.length}</p>
                </div>
                <BarChart3 className="h-12 w-12 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">High Priority</p>
                  <p className="text-3xl font-bold mt-1">
                    {insights.filter((i) => i.priority === 'high').length}
                  </p>
                </div>
                <AlertCircle className="h-12 w-12 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Member Insights</p>
                  <p className="text-3xl font-bold mt-1">{memberInsights.length}</p>
                </div>
                <Users className="h-12 w-12 opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

