'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import MentorshipSubNav from '@/components/MentorshipSubNav'
import { Search, Eye, Users, Clock, Calendar, TrendingUp, CheckCircle, XCircle, Activity, BarChart3, Filter, Plus, ArrowRight, FileText, UserCheck, GraduationCap, Settings } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import Link from 'next/link'

interface Mentorship {
  id: string
  status: string
  goals?: string
  sessionsCompleted: number
  nextSessionDate?: string
  createdAt: string
  mentor: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  mentee: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
}

interface MentorshipStats {
  total: number
  active: number
  pending: number
  completed: number
  cancelled: number
  totalSessions: number
  avgEngagement: number
  recent: number
}

export default function MentorshipsPage() {
  const { user } = useAuth()
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [stats, setStats] = useState<MentorshipStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [cycleId, setCycleId] = useState<string>('')
  const [cycles, setCycles] = useState<Array<{ id: string; name: string }>>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (user) {
      fetchCycles()
      fetchMentorships()
      fetchStats()
    }
  }, [user, page, statusFilter, cycleId])

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
      const params = new URLSearchParams()
      if (cycleId) params.append('cycleId', cycleId)
      const response = await api.get(`/admin/mentorships/stats?${params}`)
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchMentorships = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(cycleId && { cycleId }),
      })
      const response = await api.get(`/admin/mentorships?${params}`)
      let filteredMentorships = response.data.mentorships

      if (search) {
        filteredMentorships = filteredMentorships.filter(
          (mentorship: Mentorship) =>
            `${mentorship.mentor.firstName} ${mentorship.mentor.lastName}`
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            `${mentorship.mentee.firstName} ${mentorship.mentee.lastName}`
              .toLowerCase()
              .includes(search.toLowerCase())
        )
      }

      setMentorships(filteredMentorships)
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching mentorships:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading mentorships...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <MentorshipSubNav />

          {/* Header — Overview is the control center */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentorship</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start here. Follow the pipeline below or jump to any section.
            </p>
          </div>

          {/* Pipeline: each step is a link */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Pipeline — do in order</p>
            <div className="flex flex-wrap items-center gap-2 sm:gap-0">
              <Link href="/mentorships/cycles" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium">
                <Calendar className="h-4 w-4" /> 1. Cycles
              </Link>
              <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block" />
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                <FileText className="h-4 w-4" /> 2. Applications
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block" />
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                <Users className="h-4 w-4" /> 3. Assign
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block" />
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                <UserCheck className="h-4 w-4" /> 4. Attendance
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0 hidden sm:block" />
              <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm">
                <GraduationCap className="h-4 w-4" /> 5. Alumni
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Open a <Link href="/mentorships/cycles" className="text-primary-600 dark:text-primary-400 hover:underline">cycle</Link> → inside it: Applications tab, then Members (assign) or Matches (run matching) → Attendance → Alumni.
            </p>
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/mentorships/cycles" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group">
              <Calendar className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Cycles</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create and manage cohort cycles</p>
            </Link>
            <Link href="/mentorships/mentors" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group">
              <Users className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Mentors</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Verify and manage mentors</p>
            </Link>
            <Link href="/mentorships/mentees" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group">
              <GraduationCap className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Mentees</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Review mentee profiles</p>
            </Link>
            <Link href="/mentorships/automation" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all group">
              <Settings className="h-8 w-8 text-primary-600 dark:text-primary-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Automation</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Matching, launch, analytics</p>
            </Link>
          </div>

          {/* Stats Dashboard */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-200 dark:bg-blue-900 px-2 py-1 rounded-full">
                    Total
                  </span>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">All Mentorships</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-900 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">Active Programs</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
                  {stats.total > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      {((stats.active / stats.total) * 100).toFixed(0)}% of total
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-200 dark:bg-yellow-900 px-2 py-1 rounded-full">
                    Pending
                  </span>
                </div>
                <div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-900 px-2 py-1 rounded-full">
                    Completed
                  </span>
                </div>
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.completed}</p>
                  {stats.totalSessions > 0 && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      {stats.totalSessions} total sessions
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Secondary Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Engagement</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {stats.avgEngagement ? `${stats.avgEngagement.toFixed(0)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recent (7 days)</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.recent}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow">
                <div className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cancelled</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Filters */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by mentor or mentee name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={cycleId}
                  onChange={(e) => {
                    setCycleId(e.target.value)
                    setPage(1)
                  }}
                  className="sm:w-48 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Cycles</option>
                  {cycles.map((cycle) => (
                    <option key={cycle.id} value={cycle.id}>
                      {cycle.name}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="sm:w-48 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section title */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">All mentorships</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {viewMode === 'grid' ? 'List' : 'Grid'}
              </button>
              <Link href="/mentorships/cycles" className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                <Plus className="h-4 w-4" /> New cycle
              </Link>
            </div>
          </div>

          {/* Enhanced Mentorships Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentorships.map((mentorship) => (
              <Link
                key={mentorship.id}
                href={`/mentorships/${mentorship.id}`}
                className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:scale-[1.02] block"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          mentorship.status === 'ACTIVE'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : mentorship.status === 'PENDING'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : mentorship.status === 'COMPLETED'
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {mentorship.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mentor & Mentee */}
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mentor</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {mentorship.mentor.firstName} {mentorship.mentor.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {mentorship.mentor.email}
                    </p>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-700" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mentee</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {mentorship.mentee.firstName} {mentorship.mentee.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {mentorship.mentee.email}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {mentorship.sessionsCompleted || 0}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">Next</p>
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {mentorship.nextSessionDate
                        ? formatDate(new Date(mentorship.nextSessionDate), 'MMM dd')
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(new Date(mentorship.createdAt), 'MMM dd, yyyy')}
                    </p>
                    <Eye className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sessions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Next Session</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {mentorships.map((mentorship) => (
                      <tr key={mentorship.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {mentorship.mentor.firstName} {mentorship.mentor.lastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{mentorship.mentor.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {mentorship.mentee.firstName} {mentorship.mentee.lastName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{mentorship.mentee.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                              mentorship.status === 'ACTIVE'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : mentorship.status === 'PENDING'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : mentorship.status === 'COMPLETED'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {mentorship.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-sm text-gray-900 dark:text-white">{mentorship.sessionsCompleted || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {mentorship.nextSessionDate
                            ? formatDate(new Date(mentorship.nextSessionDate), 'MMM dd, yyyy')
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(new Date(mentorship.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/mentorships/${mentorship.id}`}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {mentorships.length === 0 && !loading && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No mentorships found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {search || statusFilter
                  ? 'Try adjusting your search or filter criteria'
                  : 'No mentorship programs have been created yet'}
              </p>
              {!search && !statusFilter && (
                <Link
                  href="/mentorships/cycles"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Mentorship Cycle
                </Link>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

