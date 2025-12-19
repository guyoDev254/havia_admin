'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Plus, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'
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

export default function CyclesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [cycles, setCycles] = useState<MentorshipCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
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
    }
  }, [user])

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentorship Cycles</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage 8-week mentorship cycles
              </p>
            </div>
            {hasPermission(Permission.MANAGE_MENTORSHIP) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Create Cycle
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cycles.map((cycle) => (
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
                      {format(new Date(cycle.startDate), 'MMM dd')} -{' '}
                      {format(new Date(cycle.endDate), 'MMM dd, yyyy')}
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

