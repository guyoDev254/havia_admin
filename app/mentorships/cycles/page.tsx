'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Plus, Calendar, Users, TrendingUp, CheckCircle, Clock, Activity, BarChart3, Filter, Search } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import Link from 'next/link'

interface MentorshipCycle {
  id: string
  name: string
  description?: string
  benefits?: string
  expectedOutcomes?: string
  requirements?: string
  targetGroup?: string
  conditions?: string
  startDate: string
  endDate: string
  status: string
  maxMentorships?: number
  createdAt: string
  _count: {
    programs: number
    mentorships: number
  }
}

interface CycleStats {
  total: number
  active: number
  upcoming: number
  completed: number
  totalMentorships: number
  totalPrograms: number
}

export default function CyclesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [cycles, setCycles] = useState<MentorshipCycle[]>([])
  const [stats, setStats] = useState<CycleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    benefits: '',
    expectedOutcomes: '',
    requirements: '',
    targetGroup: '',
    conditions: '',
    startDate: '',
    endDate: '',
    maxMentorships: '',
  })

  useEffect(() => {
    if (user) {
      fetchCycles()
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/mentorship/cycles/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchCycles = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/mentorship/cycles')
      setCycles(response.data)
    } catch (error) {
      console.error('Error fetching cycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCycles = cycles.filter((cycle) => {
    const matchesSearch =
      !search ||
      cycle.name.toLowerCase().includes(search.toLowerCase()) ||
      cycle.description?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      cycle.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/mentorship/cycles', {
        ...formData,
        maxMentorships: formData.maxMentorships ? parseInt(formData.maxMentorships) : undefined,
      })
      setShowCreateModal(false)
      setFormData({
        name: '',
        description: '',
        benefits: '',
        expectedOutcomes: '',
        requirements: '',
        targetGroup: '',
        conditions: '',
        startDate: '',
        endDate: '',
        maxMentorships: '',
      })
      fetchCycles()
    } catch (error) {
      console.error('Error creating cycle:', error)
      alert('Failed to create cycle')
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentorship Cycles</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage 8-week mentorship cycles and programs
              </p>
            </div>
            {hasPermission(Permission.MANAGE_MENTORSHIP) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Cycle
              </button>
            )}
          </div>

          {/* Stats Dashboard */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Total Cycles</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Active</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium mb-1">Upcoming</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.upcoming}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">Completed</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.completed}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800 shadow">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1">Total Mentorships</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.totalMentorships}</p>
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
                  placeholder="Search cycles by name or description..."
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
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cycles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCycles.map((cycle) => (
              <Link
                key={cycle.id}
                href={`/mentorships/cycles/${cycle.id}`}
                className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow border border-transparent dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{cycle.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{cycle.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      cycle.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                        : cycle.status === 'UPCOMING'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {cycle.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDate(new Date(cycle.startDate), 'MMM dd')} -{' '}
                      {formatDate(new Date(cycle.endDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>
                      {cycle._count.mentorships} mentorships • {cycle._count.programs} programs
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {filteredCycles.length === 0 && !loading && (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
              <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No cycles found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No mentorship cycles have been created yet'}
              </p>
              {hasPermission(Permission.MANAGE_MENTORSHIP) && !search && statusFilter === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create First Cycle
                </button>
              )}
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-800">
                <div className="p-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Cycle</h2>
                </div>
                <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cycle Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                      placeholder="e.g., Q1 2024 Mentorship Cycle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Target Group (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.targetGroup}
                      onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                      placeholder="e.g., TVET + University (Beginner)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Benefits (Optional)
                    </label>
                    <textarea
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                      rows={3}
                      placeholder="What participants gain (skills, network, outcomes)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expected Outcomes (Optional)
                    </label>
                    <textarea
                      value={formData.expectedOutcomes}
                      onChange={(e) => setFormData({ ...formData, expectedOutcomes: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                      rows={3}
                      placeholder="Measurable results at the end of the cycle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Requirements (Optional)
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                      rows={3}
                      placeholder="Prerequisites, time commitment, tools needed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Conditions / Code of Conduct (Optional)
                    </label>
                    <textarea
                      value={formData.conditions}
                      onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                      rows={3}
                      placeholder="Attendance expectations, behavior rules, drop policy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Mentorships (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxMentorships}
                      onChange={(e) => setFormData({ ...formData, maxMentorships: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2 sticky bottom-0 bg-white dark:bg-gray-900 pt-3 pb-1 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

