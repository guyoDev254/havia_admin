'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FolderKanban, MessageSquare, DollarSign, Target, ClipboardList, Users, Calendar, FileText, BarChart3, ArrowRight, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'

interface ManagedClub {
  id: string
  clubId: string
  club: {
    id: string
    name: string
    category: string
    logo?: string
    _count?: {
      members: number
      events: number
    }
  }
}

interface ClubStats {
  feeds: number
  contributions: number
  fundraising: number
  projects: number
  attendance: number
  financial: number
  reports: number
}

export default function ClubFeaturesPage() {
  const { user } = useAuth()
  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([])
  const [clubStats, setClubStats] = useState<Record<string, ClubStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchManagedClubs()
    }
  }, [user])

  const fetchManagedClubs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/clubs/me/managed')
      const clubs = response.data || []
      setManagedClubs(clubs)

      // Fetch stats for each club
      const statsMap: Record<string, ClubStats> = {}
      for (const m of clubs) {
        try {
          const [feedsRes, contributionsRes, fundraisingRes, projectsRes, attendanceRes, financialRes, reportsRes] = await Promise.all([
            api.get(`/clubs/${m.club.id}/feeds`).catch(() => ({ data: [] })),
            api.get(`/clubs/${m.club.id}/contributions`).catch(() => ({ data: [] })),
            api.get(`/clubs/${m.club.id}/fundraising`).catch(() => ({ data: [] })),
            api.get(`/clubs/${m.club.id}/projects`).catch(() => ({ data: [] })),
            api.get(`/clubs/${m.club.id}/attendance`).catch(() => ({ data: [] })),
            api.get(`/clubs/${m.club.id}/financial-contributions`).catch(() => ({ data: [] })),
            api.get(`/clubs/${m.club.id}/reports`).catch(() => ({ data: [] })),
          ])
          statsMap[m.club.id] = {
            feeds: feedsRes.data?.length || 0,
            contributions: contributionsRes.data?.length || 0,
            fundraising: fundraisingRes.data?.length || 0,
            projects: projectsRes.data?.length || 0,
            attendance: attendanceRes.data?.length || 0,
            financial: financialRes.data?.length || 0,
            reports: reportsRes.data?.length || 0,
          }
        } catch (error) {
          statsMap[m.club.id] = {
            feeds: 0,
            contributions: 0,
            fundraising: 0,
            projects: 0,
            attendance: 0,
            financial: 0,
            reports: 0,
          }
        }
      }
      setClubStats(statsMap)
    } catch (error) {
      console.error('Error fetching managed clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading club features..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  const features = [
    {
      name: 'Club Feeds',
      description: 'Announcements, discussions, and polls',
      icon: MessageSquare,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      href: (clubId: string) => `/clubs/${clubId}/features/feeds`,
      statKey: 'feeds' as keyof ClubStats,
    },
    {
      name: 'Contributions',
      description: 'Volunteer, donate, or provide support',
      icon: Users,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-50 dark:hover:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      href: (clubId: string) => `/clubs/${clubId}/features/contributions`,
      statKey: 'contributions' as keyof ClubStats,
    },
    {
      name: 'Fundraising',
      description: 'Create and manage fundraising campaigns',
      icon: DollarSign,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
      href: (clubId: string) => `/clubs/${clubId}/features/fundraising`,
      statKey: 'fundraising' as keyof ClubStats,
    },
    {
      name: 'Projects',
      description: 'Track projects and milestones',
      icon: Target,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
      href: (clubId: string) => `/clubs/${clubId}/features/projects`,
      statKey: 'projects' as keyof ClubStats,
    },
    {
      name: 'Attendance',
      description: 'Record and track member attendance',
      icon: ClipboardList,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
      href: (clubId: string) => `/clubs/${clubId}/features/attendance`,
      statKey: 'attendance' as keyof ClubStats,
    },
    {
      name: 'Financial Contributions',
      description: 'Track financial contributions and usage',
      icon: DollarSign,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
      href: (clubId: string) => `/clubs/${clubId}/features/financial`,
      statKey: 'financial' as keyof ClubStats,
    },
    {
      name: 'Reports',
      description: 'Generate reports for funders and stakeholders',
      icon: FileText,
      color: 'bg-teal-500',
      hoverColor: 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
      borderColor: 'border-teal-200 dark:border-teal-800',
      href: (clubId: string) => `/clubs/${clubId}/features/reports`,
      statKey: 'reports' as keyof ClubStats,
    },
  ]

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Club Features</h1>
                <p className="text-blue-100 text-lg">
                  Manage all features for your clubs: feeds, contributions, fundraising, projects, and more
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="text-3xl font-bold">{managedClubs.length}</div>
                  <div className="text-blue-100 text-sm mt-1">
                    {managedClubs.length === 1 ? 'Club Managed' : 'Clubs Managed'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {managedClubs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-12 text-center">
              <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <FolderKanban className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No clubs assigned yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You need to be assigned as a club manager to access club features.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {managedClubs.map((m) => {
                const stats = clubStats[m.club.id] || {
                  feeds: 0,
                  contributions: 0,
                  fundraising: 0,
                  projects: 0,
                  attendance: 0,
                  financial: 0,
                  reports: 0,
                }
                const totalFeatures = Object.values(stats).reduce((sum, val) => sum + val, 0)

                return (
                  <div
                    key={m.id}
                    className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    {/* Club Header */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        {m.club.logo ? (
                          <img
                            src={m.club.logo}
                            alt={m.club.name}
                            className="h-16 w-16 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-2 border-gray-200 dark:border-gray-700">
                            {m.club.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{m.club.name}</h2>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
                              {m.club.category}
                            </span>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Activity className="h-4 w-4" />
                              <span>{totalFeatures} total items</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/clubs/${m.club.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                      >
                        View Club Details →
                      </Link>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Feeds</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.feeds}</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Contributions</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.contributions}</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Fundraising</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.fundraising}</div>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Projects</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.projects}</div>
                      </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {features.map((feature) => {
                        const Icon = feature.icon
                        const count = stats[feature.statKey] || 0
                        return (
                          <Link
                            key={feature.name}
                            href={feature.href(m.club.id)}
                            className={`group p-5 border-2 ${feature.borderColor} rounded-xl ${feature.hoverColor} hover:shadow-lg transition-all relative overflow-hidden`}
                          >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-100 to-transparent dark:from-gray-700 dark:to-transparent opacity-50 rounded-bl-full" />
                            <div className="relative">
                              <div className="flex items-start justify-between mb-3">
                                <div className={`p-3 ${feature.color} rounded-xl shadow-lg`}>
                                  <Icon className="h-6 w-6 text-white" />
                                </div>
                                {count > 0 && (
                                  <span className="px-2 py-1 text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                    {count}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2 text-lg">
                                {feature.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {feature.description}
                              </p>
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                                <span>Manage</span>
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

