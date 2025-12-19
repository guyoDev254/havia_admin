'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Users, UsersRound, Calendar, Award, TrendingUp, Bell, ArrowUpRight, ArrowDownRight, DollarSign, Shield, Activity, BarChart3, Clock, FileText, MessageSquare, UserPlus, GraduationCap, BookOpen, Users2, Trophy } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatDistanceToNow } from 'date-fns'

interface Statistics {
  users: { total: number; active: number; recent: number }
  clubs: { total: number }
  events: { total: number; upcoming: number; recent: number }
  mentorships: { total: number; active: number; recent: number }
  badges: { total: number }
  notifications: { total: number; unread: number }
  engagement?: { dau: number; wau: number; mau: number }
  moderation?: { totalReports: number; pendingReports: number; resolvedReports: number; recentReports: number }
  content?: { totalPosts: number; recentPosts: number; totalContent: number; activeContent: number }
  partnerships?: { total: number; active: number }
}

type ManagedClub = {
  id: string
  userId: string
  clubId: string
  role: string
  assignedAt: string
  club: {
    id: string
    name: string
    category: string
    logo?: string
    banner?: string
    status?: string
    _count?: { members: number; events: number }
  }
}

type ClubAnalytics = {
  overview?: {
    memberCount: number
    eventCount: number
    postCount: number
    programCount: number
    resourceCount: number
    engagementScore: number
    lastActivityAt?: string
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { hasPermission, isSuperAdmin } = usePermissions()
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([])
  const [managedClubsAnalytics, setManagedClubsAnalytics] = useState<Record<string, ClubAnalytics>>({})
  const [clubManagerTotals, setClubManagerTotals] = useState({
    members: 0,
    events: 0,
    programs: 0,
    resources: 0,
    posts: 0,
  })

  useEffect(() => {
    if (user) {
      if (user.role === 'CLUB_MANAGER') {
        fetchClubManagerDashboard()
      } else {
        fetchStatistics()
      }
    }
  }, [user])

  const [studentStats, setStudentStats] = useState<any>(null)
  const [trendData, setTrendData] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  const fetchClubManagerDashboard = async () => {
    try {
      setLoading(true)
      const managed = await api.get('/clubs/me/managed')
      const list: ManagedClub[] = managed.data || []
      setManagedClubs(list)

      // Fetch analytics per club (gives real counts for programs/resources/posts)
      const analyticsPairs = await Promise.all(
        list.map(async (m) => {
          try {
            const res = await api.get(`/clubs/${m.club.id}/analytics`)
            return [m.club.id, res.data as ClubAnalytics] as const
          } catch {
            return [m.club.id, {} as ClubAnalytics] as const
          }
        }),
      )

      const analyticsMap: Record<string, ClubAnalytics> = {}
      for (const [clubId, a] of analyticsPairs) analyticsMap[clubId] = a
      setManagedClubsAnalytics(analyticsMap)

      const totals = Object.values(analyticsMap).reduce(
        (acc, a) => {
          acc.members += a.overview?.memberCount || 0
          acc.events += a.overview?.eventCount || 0
          acc.programs += a.overview?.programCount || 0
          acc.resources += a.overview?.resourceCount || 0
          acc.posts += a.overview?.postCount || 0
          return acc
        },
        { members: 0, events: 0, programs: 0, resources: 0, posts: 0 },
      )
      setClubManagerTotals(totals)
    } catch (error) {
      console.error('Error fetching club manager dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const [statsResponse, studentStatsResponse, trendsResponse, activityResponse] = await Promise.all([
        api.get('/admin/statistics'),
        api.get('/admin/students/stats').catch(() => null), // Optional, may fail if no students
        api.get('/admin/trends?days=30').catch(() => null),
        api.get('/admin/activity?limit=10').catch(() => null),
      ])
      setStats(statsResponse.data)
      if (studentStatsResponse) {
        setStudentStats(studentStatsResponse.data)
      }
      if (trendsResponse) {
        setTrendData(trendsResponse.data)
      }
      if (activityResponse) {
        setRecentActivity(activityResponse.data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const allStatCards = [
    {
      name: 'Total Users',
      value: stats?.users.total || 0,
      subtitle: `${stats?.users.active || 0} active • ${stats?.users.recent || 0} new (7d)`,
      icon: Users,
      color: 'bg-blue-500',
      link: '/users',
      permission: Permission.VIEW_USERS,
    },
    {
      name: 'Clubs',
      value: stats?.clubs.total || 0,
      subtitle: 'Total clubs',
      icon: UsersRound,
      color: 'bg-green-500',
      link: '/clubs',
      permission: Permission.MANAGE_CLUBS,
    },
    {
      name: 'Events',
      value: stats?.events.total || 0,
      subtitle: `${stats?.events.upcoming || 0} upcoming • ${stats?.events.recent || 0} new (7d)`,
      icon: Calendar,
      color: 'bg-purple-500',
      link: '/events',
      permission: Permission.MANAGE_EVENTS,
    },
    {
      name: 'Mentorships',
      value: stats?.mentorships.total || 0,
      subtitle: `${stats?.mentorships.active || 0} active • ${stats?.mentorships.recent || 0} new (7d)`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      link: '/mentorships',
      permission: Permission.MANAGE_MENTORSHIP,
    },
    {
      name: 'Badges',
      value: stats?.badges.total || 0,
      subtitle: 'Total badges',
      icon: Award,
      color: 'bg-pink-500',
      link: '/badges',
      permission: Permission.MANAGE_RESOURCES,
    },
    {
      name: 'Notifications',
      value: stats?.notifications.total || 0,
      subtitle: `${stats?.notifications.unread || 0} unread`,
      icon: Bell,
      color: 'bg-indigo-500',
      link: '/notifications',
      permission: Permission.SEND_BROADCASTS,
    },
  ]

  // Filter cards based on permissions
  const statCards = allStatCards.filter((card) => {
    if (isSuperAdmin()) return true
    return hasPermission(card.permission)
  })

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
      <Layout>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                <p className="text-blue-100 text-lg">
                  Welcome back, <span className="font-semibold">{user?.firstName}</span>! 👋
                </p>
                <p className="text-blue-50 text-sm mt-1">
                  Here's what's happening with your community today.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="text-3xl font-bold">
                    {user?.role === 'CLUB_MANAGER' ? clubManagerTotals.members : stats?.users.total || 0}
                  </div>
                  <div className="text-blue-100 text-sm mt-1">
                    {user?.role === 'CLUB_MANAGER' ? 'Members in your clubs' : 'Total Members'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Club Manager Overview */}
          {user?.role === 'CLUB_MANAGER' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Managed Clubs</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{managedClubs.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Events</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clubManagerTotals.events}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Programs</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clubManagerTotals.programs}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Resources</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clubManagerTotals.resources}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{clubManagerTotals.posts}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Managed Clubs</h2>
                  <Link href="/clubs" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View all →
                  </Link>
                </div>

                {managedClubs.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400">
                    No clubs assigned yet. Ask a Super Admin/Platform Admin to assign you as a club manager.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {managedClubs.map((m) => {
                      const a = managedClubsAnalytics[m.club.id]?.overview
                      return (
                        <div
                          key={m.club.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-lg font-bold text-gray-900 dark:text-white">{m.club.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{m.club.category}</div>
                            </div>
                            <Link
                              href={`/clubs/${m.club.id}`}
                              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Open
                            </Link>
                          </div>

                          <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Members</div>
                              <div className="font-bold text-gray-900 dark:text-white">{a?.memberCount ?? m.club._count?.members ?? 0}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Events</div>
                              <div className="font-bold text-gray-900 dark:text-white">{a?.eventCount ?? m.club._count?.events ?? 0}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Programs</div>
                              <div className="font-bold text-gray-900 dark:text-white">{a?.programCount ?? 0}</div>
                            </div>
                            <div>
                              <div className="text-gray-500 dark:text-gray-400">Resources</div>
                              <div className="font-bold text-gray-900 dark:text-white">{a?.resourceCount ?? 0}</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-4">
                            <Link
                              href={`/events/create?clubId=${m.club.id}`}
                              className="text-sm px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                            >
                              Create Event
                            </Link>
                            <Link
                              href={`/clubs/${m.club.id}`}
                              className="text-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Programs/Resources
                            </Link>
                            <Link
                              href={`/clubs/${m.club.id}`}
                              className="text-sm px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Analytics
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Student Statistics */}
          {studentStats && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <GraduationCap className="h-6 w-6" />
                Student Statistics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-blue-600 dark:text-blue-400">Total Students</div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {studentStats.students?.total || 0}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-purple-600 dark:text-purple-400">High School</div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {studentStats.students?.highSchool || 0}
                  </div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <div className="text-sm text-indigo-600 dark:text-indigo-400">University</div>
                  <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100 mt-1">
                    {studentStats.students?.university || 0}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-green-600 dark:text-green-400">Graduate</div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {studentStats.students?.graduate || 0}
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Applications</div>
                  <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                    {studentStats.applications?.total || 0}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div className="text-sm text-orange-600 dark:text-orange-400">Scholarships</div>
                  </div>
                  <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                    {studentStats.scholarships?.active || 0} / {studentStats.scholarships?.total || 0}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Active / Total</div>
                </div>
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <div className="text-sm text-teal-600 dark:text-teal-400">Study Groups</div>
                  </div>
                  <div className="text-xl font-bold text-teal-900 dark:text-teal-100">
                    {studentStats.studyGroups?.active || 0} / {studentStats.studyGroups?.total || 0}
                  </div>
                  <div className="text-xs text-teal-600 dark:text-teal-400 mt-1">Active / Total</div>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    <div className="text-sm text-pink-600 dark:text-pink-400">Resources</div>
                  </div>
                  <div className="text-xl font-bold text-pink-900 dark:text-pink-100">
                    {studentStats.resources?.total || 0}
                  </div>
                  <div className="text-xs text-pink-600 dark:text-pink-400 mt-1">Total Resources</div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement Metrics */}
          {stats?.engagement && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Engagement Metrics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Daily Active Users</div>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.engagement.dau}</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Users active in last 24 hours</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Weekly Active Users</div>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.engagement.wau}</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">Users active in last 7 days</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                  <div className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">Monthly Active Users</div>
                  <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{stats.engagement.mau}</div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Users active in last 30 days</div>
                </div>
              </div>
            </div>
          )}

          {/* Moderation Stats */}
          {stats?.moderation && (
            <PermissionGuard permission={Permission.MODERATE_POSTS}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Moderation</h2>
                  </div>
                  <Link
                    href="/moderation"
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    View All →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
                    <div className="text-sm text-red-600 dark:text-red-400 mb-1">Pending Reports</div>
                    <div className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.moderation.pendingReports}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-100 dark:border-orange-800">
                    <div className="text-sm text-orange-600 dark:text-orange-400 mb-1">Total Reports</div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.moderation.totalReports}</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-100 dark:border-green-800">
                    <div className="text-sm text-green-600 dark:text-green-400 mb-1">Resolved</div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.moderation.resolvedReports}</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                    <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Recent (7d)</div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.moderation.recentReports}</div>
                  </div>
                </div>
              </div>
            </PermissionGuard>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon
              const isPositive = card.name === 'Users' || card.name === 'Events'
              return (
                <Link
                  key={card.name}
                  href={card.link}
                  className="group relative bg-white dark:bg-gray-800 overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700"
                >
                  {/* Gradient Background */}
                  <div className={`absolute top-0 right-0 w-32 h-32 ${card.color} opacity-10 rounded-bl-full`} />
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${card.color} bg-opacity-10`}>
                        <Icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        isPositive ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {isPositive ? (
                          <>
                            <ArrowUpRight className="h-4 w-4" />
                            <span>+12%</span>
                          </>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {card.name}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {card.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                        {card.subtitle}
                      </p>
                    </div>

                    {/* Hover Arrow */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className={`p-2 rounded-lg ${card.color} bg-opacity-10`}>
                        <ArrowUpRight className={`h-4 w-4 ${card.color.replace('bg-', 'text-')}`} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Trend Charts */}
          {trendData && trendData.trends && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Activity Trends (Last 30 Days)</h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData.trends}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" name="New Users" />
                  <Area type="monotone" dataKey="events" stroke="#a855f7" fillOpacity={1} fill="url(#colorEvents)" name="New Events" />
                  <Area type="monotone" dataKey="posts" stroke="#f59e0b" fillOpacity={1} fill="url(#colorPosts)" name="New Posts" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Activity Feed */}
          {recentActivity.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => {
                  const getIcon = () => {
                    switch (activity.type) {
                      case 'user_registered':
                        return <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      case 'event_created':
                        return <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      case 'post_created':
                        return <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      case 'club_created':
                        return <UsersRound className="h-5 w-5 text-green-600 dark:text-green-400" />
                      default:
                        return <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    }
                  }

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="mt-0.5">{getIcon()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        {activity.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <PermissionGuard permission={Permission.VIEW_USERS}>
                <Link
                  href="/users"
                  className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 group"
                >
                  <Users className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-700">Manage Users</span>
                </Link>
              </PermissionGuard>
              <PermissionGuard permission={[Permission.MANAGE_EVENTS, Permission.SCHEDULE_EVENTS]}>
                <Link
                  href="/events/create"
                  className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 group"
                >
                  <Calendar className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-700">Create Event</span>
                </Link>
              </PermissionGuard>
              <PermissionGuard permission={[Permission.MANAGE_CLUBS, Permission.APPROVE_CLUBS]}>
                <Link
                  href="/clubs"
                  className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-200 group"
                >
                  <UsersRound className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-700">Manage Clubs</span>
                </Link>
              </PermissionGuard>
              <PermissionGuard permission={Permission.MANAGE_MENTORSHIP}>
                <Link
                  href="/mentorships"
                  className="flex flex-col items-center p-4 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 group"
                >
                  <TrendingUp className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold text-gray-700">Mentorships</span>
                </Link>
              </PermissionGuard>
            </div>
          </div>

          {/* Role-Specific Sections */}
          <PermissionGuard permission={Permission.VIEW_FINANCIALS}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Financial Overview</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400">Financial reports and analytics (Super Admin only)</p>
            </div>
          </PermissionGuard>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

