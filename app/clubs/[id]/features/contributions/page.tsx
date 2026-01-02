'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { Users, Plus, ArrowLeft, Filter, Search, CheckCircle2, DollarSign, Clock, HeartHandshake } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface Contribution {
  id: string
  type: 'VOLUNTEER' | 'DONATION' | 'SUPPORT'
  title: string
  description?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  amount?: number
  currency?: string
  hours?: number
  createdAt: string
  contributor?: {
    id: string
    firstName: string
    lastName: string
    email?: string
  }
}

export default function ClubContributionsPage() {
  const params = useParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const clubId = params.id as string

  const [contributions, setContributions] = useState<Contribution[]>([])
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (clubId) {
      fetchClub()
      fetchContributions()
    }
  }, [clubId, typeFilter, statusFilter])

  const fetchClub = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClub(response.data)
    } catch (error) {
      console.error('Error fetching club:', error)
    }
  }

  const fetchContributions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const response = await api.get(`/clubs/${clubId}/contributions?${params}`)
      setContributions(response.data || [])
    } catch (error) {
      console.error('Error fetching contributions:', error)
      showError('Error', 'Failed to load contributions')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (contributionId: string) => {
    try {
      await api.post(`/clubs/${clubId}/contributions/${contributionId}/approve`)
      showSuccess('Success', 'Contribution approved successfully')
      fetchContributions()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to approve contribution')
    }
  }

  const filteredContributions = contributions.filter((contribution) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        contribution.title?.toLowerCase().includes(query) ||
        contribution.description?.toLowerCase().includes(query) ||
        `${contribution.contributor?.firstName} ${contribution.contributor?.lastName}`.toLowerCase().includes(query)
      )
    }
    return true
  })

  const stats = {
    total: contributions.length,
    pending: contributions.filter((c) => c.status === 'PENDING').length,
    approved: contributions.filter((c) => c.status === 'APPROVED').length,
    totalAmount: contributions
      .filter((c) => c.status === 'APPROVED' && c.amount)
      .reduce((sum, c) => sum + (c.amount || 0), 0),
    totalHours: contributions
      .filter((c) => c.status === 'APPROVED' && c.hours)
      .reduce((sum, c) => sum + (c.hours || 0), 0),
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DONATION':
        return DollarSign
      case 'VOLUNTEER':
        return Users
      default:
        return HeartHandshake
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DONATION':
        return 'bg-green-500'
      case 'VOLUNTEER':
        return 'bg-blue-500'
      default:
        return 'bg-purple-500'
    }
  }

  if (loading && !club) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading contributions..." showProgress={true} fullScreen={false} />
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contributions</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club?.name} • Volunteer, donate, or provide support</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Plus className="h-4 w-4" />
              New Contribution
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-sm text-yellow-600 dark:text-yellow-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl shadow p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Approved</div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.approved}</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl shadow p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Amount</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">KES {stats.totalAmount.toLocaleString()}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl shadow p-4 border border-purple-200 dark:border-purple-800">
              <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Total Hours</div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalHours}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Search contributions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Types</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="DONATION">Donation</option>
                  <option value="SUPPORT">Support</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {filteredContributions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
              <HeartHandshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No contributions yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start receiving contributions from members and supporters.</p>
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Create First Contribution</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredContributions.map((contribution) => {
                const Icon = getTypeIcon(contribution.type)
                return (
                  <div key={contribution.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 ${getTypeColor(contribution.type)} rounded-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">{contribution.type}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${contribution.status === 'APPROVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : contribution.status === 'PENDING' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>{contribution.status}</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{contribution.title}</h3>
                        </div>
                      </div>
                    </div>
                    {contribution.description && <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{contribution.description}</p>}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      {contribution.amount && (
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">{contribution.currency || 'KES'} {contribution.amount.toLocaleString()}</span>
                        </div>
                      )}
                      {contribution.hours && (
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{contribution.hours} hours</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {contribution.contributor ? <span>By {contribution.contributor.firstName} {contribution.contributor.lastName}</span> : <span>Anonymous</span>}
                        <span className="mx-2">•</span>
                        <span>{format(new Date(contribution.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      {contribution.status === 'PENDING' && (
                        <button onClick={() => handleApprove(contribution.id)} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        {showCreateModal && <CreateContributionModal clubId={clubId} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchContributions(); }} />}
      </Layout>
    </ProtectedRoute>
  )
}

function CreateContributionModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const { showSuccess, showError } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ type: 'VOLUNTEER' as 'VOLUNTEER' | 'DONATION' | 'SUPPORT', title: '', description: '', amount: '', currency: 'KES', hours: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) { showError('Validation Error', 'Title is required'); return }
    try {
      setLoading(true)
      const payload: any = { type: formData.type, title: formData.title, description: formData.description || undefined }
      if (formData.type === 'DONATION' && formData.amount) { payload.amount = parseFloat(formData.amount); payload.currency = formData.currency }
      if (formData.type === 'VOLUNTEER' && formData.hours) { payload.hours = parseFloat(formData.hours) }
      await api.post(`/clubs/${clubId}/contributions`, payload)
      showSuccess('Success', 'Contribution created successfully!')
      onSuccess()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to create contribution')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create Contribution</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><span className="text-2xl">&times;</span></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contribution Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['VOLUNTEER', 'DONATION', 'SUPPORT'] as const).map((type) => (
                <button key={type} type="button" onClick={() => setFormData({ ...formData, type })} className={`px-4 py-2 rounded-lg border-2 transition-colors ${formData.type === type ? 'border-green-600 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'}`}>{type}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter contribution title..." required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Enter description..." />
          </div>
          {formData.type === 'DONATION' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0.00" />
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
          )}
          {formData.type === 'VOLUNTEER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hours</label>
              <input type="number" step="0.5" value={formData.hours} onChange={(e) => setFormData({ ...formData, hours: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0" />
            </div>
          )}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">{loading ? 'Creating...' : 'Create Contribution'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
