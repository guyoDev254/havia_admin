'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import MentorshipSubNav from '@/components/MentorshipSubNav'
import { Search, CheckCircle, XCircle, Eye, UserCheck, Star, Briefcase, Users, Award, Filter, TrendingUp, Clock, Activity } from 'lucide-react'
import Link from 'next/link'

interface MentorProfile {
  id: string
  userId: string
  company?: string
  yearsOfExperience?: number
  linkedIn?: string
  mentorshipThemes: string[]
  mentorshipStyle: string[]
  weeklyAvailability?: number
  maxMentees: number
  preferredType: string
  bio?: string
  isVerified: boolean
  isActive: boolean
  currentMentees: number
  totalMentees: number
  rating?: number
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    skills?: string[]
    occupation?: string
    location?: string
    education?: string
  }
}

interface MentorStats {
  total: number
  verified: number
  pending: number
  active: number
  inactive: number
}

export default function MentorsPage() {
  const { user } = useAuth()
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [stats, setStats] = useState<MentorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    if (user) {
      fetchMentors()
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/mentors/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchMentors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/mentorship/mentors')
      setMentors(response.data)
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (mentorId: string, verify: boolean) => {
    try {
      await api.put(`/admin/mentors/${mentorId}/verify`, { isVerified: verify })
      fetchMentors()
    } catch (error) {
      console.error('Error updating verification:', error)
      alert('Failed to update verification status')
    }
  }

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      !search ||
      `${mentor.user.firstName} ${mentor.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      mentor.user.email.toLowerCase().includes(search.toLowerCase()) ||
      mentor.company?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && mentor.isVerified) ||
      (statusFilter === 'pending' && !mentor.isVerified) ||
      (statusFilter === 'active' && mentor.isActive) ||
      (statusFilter === 'inactive' && !mentor.isActive)

    return matchesSearch && matchesStatus
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
          <MentorshipSubNav breadcrumbs={[{ label: 'Mentors' }]} />
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentors</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage mentor profiles and applications
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Total Mentors</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Verified</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.verified}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">Active</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.active}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.inactive}</p>
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
                  placeholder="Search by name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="sm:w-48 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending Verification</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mentors Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                        {mentor.user.profileImage ? (
                          <img
                            src={mentor.user.profileImage}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <UserCheck className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {mentor.user.firstName} {mentor.user.lastName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{mentor.user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    {mentor.company || mentor.user.occupation ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {mentor.company || mentor.user.occupation}
                        </span>
                      </div>
                    ) : null}
                    {mentor.yearsOfExperience ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {mentor.yearsOfExperience} years experience
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {mentor.currentMentees} / {mentor.maxMentees} mentees
                      </span>
                    </div>
                    {mentor.rating ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-gray-700 dark:text-gray-300 font-semibold">
                          {mentor.rating.toFixed(1)} / 5.0
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        mentor.isVerified
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      }`}
                    >
                      {mentor.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        mentor.isActive
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {mentor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={`/mentorships/mentors/${mentor.userId}`}
                      className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                    <div className="flex items-center gap-2">
                      {!mentor.isVerified && (
                        <button
                          onClick={() => handleVerify(mentor.userId, true)}
                          className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Verify"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {mentor.isVerified && (
                        <button
                          onClick={() => handleVerify(mentor.userId, false)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Unverify"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentees</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredMentors.map((mentor) => (
                      <tr key={mentor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              {mentor.user.profileImage ? (
                                <img
                                  src={mentor.user.profileImage}
                                  alt=""
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <UserCheck className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {mentor.user.firstName} {mentor.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{mentor.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {mentor.company || mentor.user.occupation || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {mentor.yearsOfExperience ? `${mentor.yearsOfExperience} years` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {mentor.currentMentees} / {mentor.maxMentees}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {mentor.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span>{mentor.rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                mentor.isVerified
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              }`}
                            >
                              {mentor.isVerified ? 'Verified' : 'Pending'}
                            </span>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                mentor.isActive
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              {mentor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/mentorships/mentors/${mentor.userId}`}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {!mentor.isVerified && (
                              <button
                                onClick={() => handleVerify(mentor.userId, true)}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                title="Verify"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            {mentor.isVerified && (
                              <button
                                onClick={() => handleVerify(mentor.userId, false)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                title="Unverify"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredMentors.length === 0 && !loading && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <UserCheck className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No mentors found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No mentor profiles have been created yet'}
              </p>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

