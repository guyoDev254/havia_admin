'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { DollarSign, Plus, ArrowLeft, Filter, Search, TrendingUp, Calendar, User, Receipt } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface FinancialContribution {
  id: string
  amount: number
  currency: string
  type: 'DONATION' | 'MEMBERSHIP_FEE' | 'EVENT_FEE' | 'PROJECT_FUNDING' | 'OTHER'
  description?: string
  fundraisingId?: string
  createdAt: string
  contributor?: {
    id: string
    firstName: string
    lastName: string
    email?: string
  }
}

interface Summary {
  totalContributions: number
  totalAmount: number
  contributionsByType: Record<string, number>
  recentContributions: FinancialContribution[]
}

export default function ClubFinancialPage() {
  const params = useParams()
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const clubId = params.id as string

  const [contributions, setContributions] = useState<FinancialContribution[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (clubId) {
      fetchClub()
      fetchContributions()
      fetchSummary()
    }
  }, [clubId, typeFilter])

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
      if (typeFilter !== 'all') {
        // Note: API might need type filter support
      }
      const response = await api.get(`/clubs/${clubId}/financial-contributions?${params}`)
      setContributions(response.data || [])
    } catch (error) {
      console.error('Error fetching financial contributions:', error)
      showError('Error', 'Failed to load financial contributions')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/financial-contributions/summary`)
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const filteredContributions = contributions.filter((contribution) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        contribution.description?.toLowerCase().includes(query) ||
        `${contribution.contributor?.firstName} ${contribution.contributor?.lastName}`.toLowerCase().includes(query)
      )
    }
    if (typeFilter !== 'all' && contribution.type !== typeFilter) {
      return false
    }
    return true
  })

  const getTypeLabel = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (loading && !club) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading financial contributions..." showProgress={true} fullScreen={false} />
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Contributions</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{club?.name} • Track financial contributions and usage</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
              <Plus className="h-4 w-4" />
              New Contribution
            </button>
          </div>

          {summary && (
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h2 className="text-xl font-bold mb-4">Financial Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-pink-100 mb-1">Total Contributions</div>
                  <div className="text-3xl font-bold">{summary.totalContributions}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-pink-100 mb-1">Total Amount</div>
                  <div className="text-3xl font-bold">KES {summary.totalAmount.toLocaleString()}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-pink-100 mb-1">Average Contribution</div>
                  <div className="text-3xl font-bold">KES {summary.totalContributions > 0 ? Math.round(summary.totalAmount / summary.totalContributions).toLocaleString() : '0'}</div>
                </div>
              </div>
            </div>
          )}

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
                  <option value="DONATION">Donation</option>
                  <option value="MEMBERSHIP_FEE">Membership Fee</option>
                  <option value="EVENT_FEE">Event Fee</option>
                  <option value="PROJECT_FUNDING">Project Funding</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          {filteredContributions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No financial contributions yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Start tracking financial contributions from members and supporters.</p>
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">Record First Contribution</button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contributor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredContributions.map((contribution) => (
                      <tr key={contribution.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{format(new Date(contribution.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {contribution.contributor ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900 dark:text-white">{contribution.contributor.firstName} {contribution.contributor.lastName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 dark:text-gray-400">Anonymous</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded">{getTypeLabel(contribution.type)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">{contribution.currency} {contribution.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{contribution.description || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        {showCreateModal && <CreateFinancialModal clubId={clubId} onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); fetchContributions(); fetchSummary(); }} />}
      </Layout>
    </ProtectedRoute>
  )
}

function CreateFinancialModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const { showSuccess, showError } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [fundraising, setFundraising] = useState<any[]>([])
  const [formData, setFormData] = useState({ amount: '', currency: 'KES', type: 'DONATION' as 'DONATION' | 'MEMBERSHIP_FEE' | 'EVENT_FEE' | 'PROJECT_FUNDING' | 'OTHER', description: '', fundraisingId: '' })

  useEffect(() => {
    fetchFundraising()
  }, [clubId])

  const fetchFundraising = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/fundraising`)
      setFundraising(response.data || [])
    } catch (error) {
      console.error('Error fetching fundraising:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount) { showError('Validation Error', 'Amount is required'); return }
    try {
      setLoading(true)
      const payload: any = { amount: parseFloat(formData.amount), currency: formData.currency, type: formData.type }
      if (formData.description) payload.description = formData.description
      if (formData.fundraisingId) payload.fundraisingId = formData.fundraisingId
      await api.post(`/clubs/${clubId}/financial-contributions`, payload)
      showSuccess('Success', 'Financial contribution recorded successfully!')
      onSuccess()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to record contribution')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Record Financial Contribution</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"><span className="text-2xl">&times;</span></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount *</label>
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0.00" required />
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contribution Type *</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
              <option value="DONATION">Donation</option>
              <option value="MEMBERSHIP_FEE">Membership Fee</option>
              <option value="EVENT_FEE">Event Fee</option>
              <option value="PROJECT_FUNDING">Project Funding</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          {fundraising.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fundraising Campaign (Optional)</label>
              <select value={formData.fundraisingId} onChange={(e) => setFormData({ ...formData, fundraisingId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">None</option>
                {fundraising.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Additional notes..." />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50">{loading ? 'Recording...' : 'Record Contribution'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

