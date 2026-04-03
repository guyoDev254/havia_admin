'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import MentorshipSubNav from '@/components/MentorshipSubNav'
import { Search, Eye, User, BookOpen, Target, Filter, Users, Activity, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface MenteeProfile {
  id: string
  userId: string
  age?: number
  fieldOfInterest?: string
  experienceLevel?: string
  careerGoals?: string
  challenges?: string
  learningPreference: string[]
  availability?: {
    days: string[]
    timeBlocks: string[]
  }
  commitmentAgreed: boolean
  isActive: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    skills?: string[]
    interests?: string[]
  }
}

interface MenteeStats {
  total: number
  active: number
  inactive: number
  beginner: number
  intermediate: number
  advanced: number
}

export default function MenteesPage() {
  const { user } = useAuth()
  const [mentees, setMentees] = useState<MenteeProfile[]>([])
  const [stats, setStats] = useState<MenteeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (user) {
      fetchMentees()
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/mentees/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchMentees = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/mentees')
      setMentees(response.data)
    } catch (error) {
      console.error('Error fetching mentees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMentees = mentees.filter((mentee) => {
    const matchesSearch =
      !search ||
      `${mentee.user.firstName} ${mentee.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      mentee.user.email.toLowerCase().includes(search.toLowerCase()) ||
      mentee.fieldOfInterest?.toLowerCase().includes(search.toLowerCase())

    const matchesLevel =
      levelFilter === 'all' || mentee.experienceLevel === levelFilter

    return matchesSearch && matchesLevel
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
        <div className="space-y-6">
          <MentorshipSubNav breadcrumbs={[{ label: 'Mentees' }]} />
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentees</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage mentee profiles and applications
              </p>
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </button>
          </div>

          {/* Stats Dashboard */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Total Mentees</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Active</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inactive}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Beginner</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.beginner}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Target className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mb-1">Intermediate</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.intermediate}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">Advanced</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.advanced}</p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or field of interest..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="sm:w-48 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mentees Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentees.map((mentee) => (
                <div
                  key={mentee.id}
                  className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-lg">
                        {mentee.user.profileImage ? (
                          <img
                            src={mentee.user.profileImage}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {mentee.user.firstName} {mentee.user.lastName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{mentee.user.email}</p>
                        {mentee.age && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Age: {mentee.age}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {mentee.fieldOfInterest && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">{mentee.fieldOfInterest}</span>
                      </div>
                    )}
                    {mentee.experienceLevel && (
                      <div>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            mentee.experienceLevel === 'Beginner'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : mentee.experienceLevel === 'Intermediate'
                              ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          }`}
                        >
                          {mentee.experienceLevel}
                        </span>
                      </div>
                    )}
                    {mentee.learningPreference && mentee.learningPreference.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {mentee.learningPreference.slice(0, 3).map((pref, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                          >
                            {pref}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        mentee.isActive
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {mentee.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {mentee.commitmentAgreed && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        Committed
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={`/mentorships/mentees/${mentee.userId}`}
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Field of Interest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Experience Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Learning Preference</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMentees.map((mentee) => (
                      <tr key={mentee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              {mentee.user.profileImage ? (
                                <img
                                  src={mentee.user.profileImage}
                                  alt=""
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {mentee.user.firstName} {mentee.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{mentee.user.email}</div>
                              {mentee.age && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">Age: {mentee.age}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {mentee.fieldOfInterest || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              mentee.experienceLevel === 'Beginner'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : mentee.experienceLevel === 'Intermediate'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            }`}
                          >
                            {mentee.experienceLevel || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {mentee.learningPreference?.join(', ') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                mentee.isActive
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {mentee.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {mentee.commitmentAgreed && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Committed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/mentorships/mentees/${mentee.userId}`}
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

          {filteredMentees.length === 0 && !loading && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No mentees found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {search || levelFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No mentee profiles have been created yet'}
              </p>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

