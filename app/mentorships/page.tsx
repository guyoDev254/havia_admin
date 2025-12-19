'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Search, Eye, Users, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'

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

export default function MentorshipsPage() {
  const { user } = useAuth()
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (user) {
      fetchMentorships()
    }
  }, [user, page, statusFilter])

  const fetchMentorships = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
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
      setTotalPages(response.data.pagination.totalPages)
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mentorships</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all mentorship sessions
            </p>
          </div>

          {/* Enhanced Filters */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
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

          {/* Enhanced Mentorships Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentorships.map((mentorship) => (
              <div
                key={mentorship.id}
                onClick={() => (window.location.href = `/mentorships/${mentorship.id}`)}
                className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl rounded-xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
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
                        ? format(new Date(mentorship.nextSessionDate), 'MMM dd')
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(mentorship.createdAt), 'MMM dd, yyyy')}
                    </p>
                    <Eye className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {mentorships.length === 0 && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No mentorships found</p>
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

