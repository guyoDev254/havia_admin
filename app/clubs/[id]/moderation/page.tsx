'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  ArrowLeft,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  User,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ClubPost {
  id: string
  content: string
  images?: string[]
  isDeleted: boolean
  isHidden: boolean
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    profileImage?: string
  }
  _count: {
    reactions: number
    comments: number
  }
}

export default function ClubModerationPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const clubId = params.id as string

  const [posts, setPosts] = useState<ClubPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'deleted'>('active')
  const [clubName, setClubName] = useState('')

  useEffect(() => {
    if (user && clubId) {
      fetchPosts()
      fetchClubName()
    }
  }, [user, clubId, statusFilter])

  const fetchClubName = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClubName(response.data.name)
    } catch (error) {
      console.error('Error fetching club name:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/clubs/${clubId}/posts`, {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      })
      setPosts(response.data.posts || [])
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      showError('Failed to Load Posts', error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleHidePost = async (postId: string) => {
    const confirmed = await showConfirm(
      'Hide Post',
      'Are you sure you want to hide this post from club members?',
      'Yes, hide',
      'Cancel'
    )
    if (!confirmed) return

    try {
      await api.put(`/clubs/${clubId}/posts/${postId}/hide`)
      showSuccess('Post Hidden', 'The post has been hidden successfully')
      fetchPosts()
    } catch (error: any) {
      showError('Failed to Hide Post', error.response?.data?.message || 'An error occurred')
    }
  }

  const handleUnhidePost = async (postId: string) => {
    try {
      await api.put(`/clubs/${clubId}/posts/${postId}/unhide`)
      showSuccess('Post Unhidden', 'The post has been unhidden successfully')
      fetchPosts()
    } catch (error: any) {
      showError('Failed to Unhide Post', error.response?.data?.message || 'An error occurred')
    }
  }

  const handleDeletePost = async (postId: string) => {
    const confirmed = await showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      'Yes, delete',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/clubs/${clubId}/posts/${postId}`)
      showSuccess('Post Deleted', 'The post has been deleted successfully')
      fetchPosts()
    } catch (error: any) {
      showError('Failed to Delete Post', error.response?.data?.message || 'An error occurred')
    }
  }

  const filteredPosts = posts.filter((post) => {
    if (!search) return true
    return (
      post.content.toLowerCase().includes(search.toLowerCase()) ||
      `${post.author.firstName} ${post.author.lastName}`.toLowerCase().includes(search.toLowerCase())
    )
  })

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading posts..." showProgress={true} fullScreen={false} />
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
                href={`/clubs/${clubId}`}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{clubName}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Posts</option>
                <option value="active">Active Only</option>
                <option value="hidden">Hidden</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                      post.isHidden || post.isDeleted ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {post.author.profileImage ? (
                        <img
                          src={post.author.profileImage}
                          alt={`${post.author.firstName} ${post.author.lastName}`}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {post.author.firstName[0]}{post.author.lastName[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {post.author.firstName} {post.author.lastName}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                          {post.isHidden && (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded">
                              Hidden
                            </span>
                          )}
                          {post.isDeleted && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded">
                              Deleted
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{post.content}</p>
                        {post.images && post.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {post.images.slice(0, 4).map((image, idx) => (
                              <img
                                key={idx}
                                src={image}
                                alt={`Post image ${idx + 1}`}
                                className="rounded-lg max-h-48 object-cover"
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{post._count.reactions} reactions</span>
                          <span>{post._count.comments} comments</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!post.isHidden && !post.isDeleted && (
                          <button
                            onClick={() => handleHidePost(post.id)}
                            className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg"
                            title="Hide Post"
                          >
                            <EyeOff className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </button>
                        )}
                        {post.isHidden && !post.isDeleted && (
                          <button
                            onClick={() => handleUnhidePost(post.id)}
                            className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                            title="Unhide Post"
                          >
                            <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </button>
                        )}
                        {!post.isDeleted && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Delete Post"
                          >
                            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

