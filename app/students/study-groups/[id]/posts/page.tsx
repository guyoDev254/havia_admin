'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/hooks/usePermissions'
import { ArrowLeft, Trash2, Pin, PinOff, FileText } from 'lucide-react'
import Link from 'next/link'
import { useSweetAlert } from '@/hooks/useSweetAlert'

interface Post {
  id: string
  title?: string
  content: string
  isPinned: boolean
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
}

export default function StudyGroupPostsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (user && params.id) {
      fetchPosts()
    }
  }, [user, params.id, page])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/students/study-groups/${params.id}/posts`, {
        params: { page, limit: 20 },
      })
      setPosts(response.data.posts || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching posts:', error)
      showError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    const confirmed = await showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post?',
      'Yes, delete it',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/students/study-groups/posts/${postId}`)
      showSuccess('Post deleted successfully')
      fetchPosts()
    } catch (error: any) {
      showError('Failed to delete post', error.response?.data?.message)
    }
  }

  const handleTogglePin = async (postId: string, isPinned: boolean) => {
    try {
      await api.put(`/students/study-groups/posts/${postId}`, {
        isPinned: !isPinned,
      })
      fetchPosts()
    } catch (error: any) {
      showError('Failed to update post', error.response?.data?.message)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Loading posts...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/students/study-groups/${params.id}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-8 w-8" />
                    Study Group Posts
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage posts and announcements</p>
                </div>
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {post.author.profileImage ? (
                          <img
                            src={post.author.profileImage}
                            alt={`${post.author.firstName} ${post.author.lastName}`}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {post.author.firstName[0]}{post.author.lastName[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {post.author.firstName} {post.author.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {post.author.email}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(post.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                          <button
                            onClick={() => handleTogglePin(post.id, post.isPinned)}
                            className={`p-2 rounded transition-colors ${
                              post.isPinned
                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                            }`}
                            title={post.isPinned ? 'Unpin post' : 'Pin post'}
                          >
                            {post.isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>

                    {post.isPinned && (
                      <div className="mb-2">
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Pinned
                        </span>
                      </div>
                    )}

                    {post.title && (
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{post.title}</h3>
                    )}
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{post.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

