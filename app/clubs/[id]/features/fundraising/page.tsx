'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { DollarSign, Plus, ArrowLeft, Filter, Search, Target, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Fundraising {
  id: string
  title: string
  description: string
  goalAmount: number
  currentAmount: number
  currency: string
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  startDate: string
  endDate?: string
  createdAt: string
}

export default function ClubFundraisingPage() {
  const params = useParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const clubId = params.id as string

  const [fundraising, setFundraising] = useState<Fundraising[]>([])
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (clubId) {
      fetchClub()
      fetchFundraising()
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

  const fetchFundraising = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const response = await api.get(`/clubs/${clubId}/fundraising?${params}`)
      setFundraising(response.data || [])
    } catch (error) {
      console.error('Error fetching fundraising:', error)
      showError('Error', 'Failed to load fundraising campaigns')
    } finally {
      setLoading(false)
    }
  }

  const filteredFundraising = fundraising.filter((campaign) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        campaign.title.toLowerCase().includes(query) ||
        campaign.description.toLowerCase().includes(query)
      )
    }
    return true
  })

  const stats = {
    total: fundraising.length,
    active: fundraising.filter((f) => f.status === 'ACTIVE').length,
    completed: fundraising.filter((f) => f.status === 'COMPLETED').length,
    totalRaised: fundraising.reduce((sum, f) => sum + f.currentAmount, 0),
    totalGoal: fundraising.reduce((sum, f) => sum + f.goalAmount, 0),
  }

  if (loading && !club) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading fundraising campaigns..." showProgress={true} fullScreen={false} />
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fundraising</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club?.name} • Create and manage fundraising campaigns</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="h-4 w-4" />
              New Campaign
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Campaigns</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Active</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.active}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.completed}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Total Raised</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">KES {stats.totalRaised.toLocaleString()}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">of {stats.totalGoal.toLocaleString()} goal</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {filteredFundraising.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No fundraising campaigns yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first fundraising campaign to start raising funds for your club.</p>
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">Create First Campaign</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredFundraising.map((campaign) => {
                const progress = (campaign.currentAmount / campaign.goalAmount) * 100
                return (
                  <div key={campaign.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${campaign.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : campaign.status === 'COMPLETED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>{campaign.status}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{campaign.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{campaign.description}</p>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progress</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{campaign.currency} {campaign.currentAmount.toLocaleString()}</span>
                        <span className="text-gray-600 dark:text-gray-400">Goal: {campaign.currency} {campaign.goalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Started {format(new Date(campaign.startDate), 'MMM d, yyyy')}</span>
                      </div>
                      {campaign.endDate && (
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>Ends {format(new Date(campaign.endDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {showCreateModal && <CreateFundraisingModal clubId={clubId} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchFundraising(); }} />}
      </Layout>
    </ProtectedRoute>
  )
}

function CreateFundraisingModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const { showSuccess, showError } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '', goalAmount: '', currency: 'KES', startDate: new Date().toISOString().split('T')[0], endDate: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.goalAmount) { showError('Validation Error', 'Title and goal amount are required'); return }
    try {
      setLoading(true)
      const payload: any = { title: formData.title, description: formData.description, goalAmount: parseFloat(formData.goalAmount), currency: formData.currency, startDate: formData.startDate }
      if (formData.endDate) payload.endDate = formData.endDate
      await api.post(`/clubs/${clubId}/fundraising`, payload)
      showSuccess('Success', 'Fundraising campaign created successfully!')
      onSuccess()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create Fundraising Campaign</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><span className="text-2xl">&times;</span></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter campaign title..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Describe your fundraising campaign..." required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal Amount *</label>
              <input type="number" step="0.01" value={formData.goalAmount} onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0.00" required />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date *</label>
              <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date (Optional)</label>
              <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} min={formData.startDate} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">{loading ? 'Creating...' : 'Create Campaign'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

