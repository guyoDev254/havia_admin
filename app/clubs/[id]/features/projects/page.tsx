'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { Target, Plus, ArrowLeft, Filter, Search, CheckCircle, Clock, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Project {
  id: string
  title: string
  description: string
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  progress: number
  budget?: number
  currency?: string
  startDate?: string
  endDate?: string
  createdAt: string
  milestones?: Array<{
    id: string
    title: string
    isCompleted: boolean
    dueDate?: string
  }>
}

export default function ClubProjectsPage() {
  const params = useParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const clubId = params.id as string

  const [projects, setProjects] = useState<Project[]>([])
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (clubId) {
      fetchClub()
      fetchProjects()
    }
  }, [clubId, statusFilter])

  const fetchClub = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClub(response.data)
    } catch (error) {
      console.error('Error fetching club:', error)
    }
  }

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const response = await api.get(`/clubs/${clubId}/projects?${params}`)
      setProjects(response.data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      showError('Error', 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      )
    }
    return true
  })

  const stats = {
    total: projects.length,
    planning: projects.filter((p) => p.status === 'PLANNING').length,
    inProgress: projects.filter((p) => p.status === 'IN_PROGRESS').length,
    completed: projects.filter((p) => p.status === 'COMPLETED').length,
    avgProgress: projects.length > 0 ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      case 'PLANNING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
      case 'ON_HOLD':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  if (loading && !club) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading projects..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/clubs/features" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club?.name} • Track projects and milestones</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Projects</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Planning</div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.planning}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">In Progress</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.inProgress}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Avg Progress</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.avgProgress}%</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Status</option>
                  <option value="PLANNING">Planning</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first project to start tracking progress and milestones.</p>
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Create First Project</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>{project.status.replace('_', ' ')}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{project.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{project.description}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                  {project.milestones && project.milestones.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Milestones ({project.milestones.filter((m) => m.isCompleted).length}/{project.milestones.length})</div>
                      <div className="space-y-1">
                        {project.milestones.slice(0, 3).map((milestone) => (
                          <div key={milestone.id} className="flex items-center gap-2 text-sm">
                            {milestone.isCompleted ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-gray-400" />}
                            <span className={milestone.isCompleted ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}>{milestone.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {project.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>{project.currency || 'KES'} {project.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {project.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Started {format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {showCreateModal && <CreateProjectModal clubId={clubId} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchProjects(); }} />}
      </Layout>
    </ProtectedRoute>
  )
}

function CreateProjectModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const { showSuccess, showError } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', status: 'PLANNING' as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED', budget: '', currency: 'KES', startDate: '', endDate: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) { showError('Validation Error', 'Title and description are required'); return }
    try {
      setLoading(true)
      const payload: any = { title: formData.title, description: formData.description, status: formData.status }
      if (formData.budget) { payload.budget = parseFloat(formData.budget); payload.currency = formData.currency }
      if (formData.startDate) payload.startDate = formData.startDate
      if (formData.endDate) payload.endDate = formData.endDate
      await api.post(`/clubs/${clubId}/projects`, payload)
      showSuccess('Success', 'Project created successfully!')
      onSuccess()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create Project</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><span className="text-2xl">&times;</span></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter project title..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Describe your project..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget</label>
              <input type="number" step="0.01" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
              <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} min={formData.startDate} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50">{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

