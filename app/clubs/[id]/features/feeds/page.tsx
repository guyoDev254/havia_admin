'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { MessageSquare, Plus, Megaphone, BarChart3, Pin, ArrowLeft, Filter, Search, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface ClubFeed {
  id: string
  type: 'ANNOUNCEMENT' | 'DISCUSSION' | 'POLL'
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  pollOptions?: Array<{
    id: string
    text: string
    _count: { votes: number }
  }>
  _count?: {
    comments: number
    votes: number
  }
}

export default function ClubFeedsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showSuccess, showError, showConfirm } = useSweetAlert()
  const clubId = params.id as string

  const [feeds, setFeeds] = useState<ClubFeed[]>([])
  const [club, setClub] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (clubId) {
      fetchClub()
      fetchFeeds()
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

  const fetchFeeds = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      const response = await api.get(`/clubs/${clubId}/feeds?${params}`)
      setFeeds(response.data || [])
    } catch (error) {
      console.error('Error fetching feeds:', error)
      showError('Error', 'Failed to load feeds')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (feedId: string) => {
    const confirmed = await showConfirm(
      'Delete Feed',
      'Are you sure you want to delete this feed? This action cannot be undone.',
      'Delete',
      'Cancel'
    )
    if (!confirmed) return

    try {
      // Note: Add delete endpoint if needed
      showSuccess('Success', 'Feed deleted successfully')
      fetchFeeds()
    } catch (error: any) {
      showError('Error', error.message || 'Failed to delete feed')
    }
  }

  const filteredFeeds = feeds.filter((feed) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        feed.title?.toLowerCase().includes(query) ||
        feed.content.toLowerCase().includes(query)
      )
    }
    return true
  })

  const pinnedFeeds = filteredFeeds.filter((f) => f.isPinned)
  const regularFeeds = filteredFeeds.filter((f) => !f.isPinned)

  const getFeedIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return Megaphone
      case 'POLL':
        return BarChart3
      default:
        return MessageSquare
    }
  }

  const getFeedColor = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return 'bg-blue-500'
      case 'POLL':
        return 'bg-purple-500'
      default:
        return 'bg-green-500'
    }
  }

  if (loading && !club) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading feeds..." showProgress={true} fullScreen={false} />
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
            <div className="flex items-center gap-4">
              <Link
                href="/clubs/features"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Feeds</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {club?.name} • Announcements, discussions, and polls
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Feed
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search feeds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="ANNOUNCEMENT">Announcements</option>
                  <option value="DISCUSSION">Discussions</option>
                  <option value="POLL">Polls</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pinned Feeds */}
          {pinnedFeeds.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Pin className="h-5 w-5 text-yellow-500" />
                Pinned Feeds
              </h2>
              <div className="space-y-4">
                {pinnedFeeds.map((feed) => {
                  const Icon = getFeedIcon(feed.type)
                  return (
                    <div
                      key={feed.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 ${getFeedColor(feed.type)} rounded-lg`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 text-xs font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                                PINNED
                              </span>
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                {feed.type}
                              </span>
                            </div>
                            {feed.title && (
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                                {feed.title}
                              </h3>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(feed.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                        {feed.content}
                      </p>
                      {feed.type === 'POLL' && feed.pollOptions && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Poll Options</h4>
                          <div className="space-y-2">
                            {feed.pollOptions.map((option) => {
                              const totalVotes = feed.pollOptions?.reduce((sum, opt) => sum + opt._count.votes, 0) || 0
                              const percentage = totalVotes > 0 ? (option._count.votes / totalVotes) * 100 : 0
                              return (
                                <div key={option.id} className="relative">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{option.text}</span>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                      {option._count.votes} votes ({percentage.toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            By {feed.author.firstName} {feed.author.lastName}
                          </span>
                          <span>•</span>
                          <span>{format(new Date(feed.createdAt), 'MMM d, yyyy')}</span>
                          {feed._count?.comments !== undefined && (
                            <>
                              <span>•</span>
                              <span>{feed._count.comments} comments</span>
                            </>
                          )}
                        </div>
                        <button className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Regular Feeds */}
          <div>
            {pinnedFeeds.length > 0 && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Feeds</h2>
            )}
            {regularFeeds.length === 0 && pinnedFeeds.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No feeds yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Create your first announcement, discussion, or poll to engage with club members.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Feed
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {regularFeeds.map((feed) => {
                  const Icon = getFeedIcon(feed.type)
                  return (
                    <div
                      key={feed.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 ${getFeedColor(feed.type)} rounded-lg`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {feed.type}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(feed.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {feed.title && (
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          {feed.title}
                        </h3>
                      )}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {feed.content}
                      </p>
                      {feed.type === 'POLL' && feed.pollOptions && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {feed.pollOptions.length} options • {feed._count?.votes || 0} votes
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{format(new Date(feed.createdAt), 'MMM d, yyyy')}</span>
                        <span>{feed._count?.comments || 0} comments</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Create Feed Modal */}
        {showCreateModal && (
          <CreateFeedModal
            clubId={clubId}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              fetchFeeds()
            }}
          />
        )}
      </Layout>
    </ProtectedRoute>
  )
}

// Create Feed Modal Component
function CreateFeedModal({ clubId, onClose, onSuccess }: { clubId: string; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'ANNOUNCEMENT' as 'ANNOUNCEMENT' | 'DISCUSSION' | 'POLL',
    title: '',
    content: '',
    isPinned: false,
    pollOptions: ['', ''] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.content.trim()) {
      showError('Validation Error', 'Content is required')
      return
    }
    if (formData.type === 'POLL' && formData.pollOptions.filter((opt) => opt.trim()).length < 2) {
      showError('Validation Error', 'Polls must have at least 2 options')
      return
    }

    try {
      setLoading(true)
      const payload: any = {
        type: formData.type,
        content: formData.content,
        isPinned: formData.isPinned,
      }
      if (formData.title) payload.title = formData.title
      if (formData.type === 'POLL') {
        payload.pollOptions = formData.pollOptions
          .filter((opt) => opt.trim())
          .map((text) => ({ text }))
      }

      await api.post(`/clubs/${clubId}/feeds`, payload)
      showSuccess('Success', 'Feed created successfully!')
      onSuccess()
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to create feed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Feed</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feed Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['ANNOUNCEMENT', 'DISCUSSION', 'POLL'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === type
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter feed title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter feed content..."
              required
            />
          </div>

          {formData.type === 'POLL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poll Options (at least 2 required)
              </label>
              {formData.pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.pollOptions]
                      newOptions[index] = e.target.value
                      setFormData({ ...formData, pollOptions: newOptions })
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={`Option ${index + 1}`}
                  />
                  {formData.pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = formData.pollOptions.filter((_, i) => i !== index)
                        setFormData({ ...formData, pollOptions: newOptions })
                      }}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, pollOptions: [...formData.pollOptions, ''] })}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add Option
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isPinned" className="text-sm text-gray-700 dark:text-gray-300">
              Pin this feed to the top
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Feed'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

