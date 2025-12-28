'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useDebounce } from '@/hooks/useDebounce'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { FileText, Search, User, Trash2, Eye, Filter, EyeOff, RotateCcw, AlertTriangle, UsersRound, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Post {
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
    email: string
    profileImage?: string
    role: string
  }
  club?: {
    id: string
    name: string
    category: string
  }
  parentPost?: {
    id: string
    content: string
    author: {
      firstName: string
      lastName: string
    }
  }
  _count: {
    reactions: number
    comments: number
    replies: number
  }
}

interface PostStats {
  total: number
  deleted: number
  hidden: number
  today: number
  thisWeek: number
  active: number
}

export default function PostsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const [posts, setPosts] = useState<Post[]>([])
  const [stats, setStats] = useState<PostStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [userIdFilter, setUserIdFilter] = useState('')
  const [clubIdFilter, setClubIdFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deleted' | 'hidden'>('active')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const prevFiltersRef = useRef({
    page: 1,
    userIdFilter: '',
    clubIdFilter: '',
    statusFilter: 'active' as 'all' | 'active' | 'deleted' | 'hidden',
    debouncedSearch: '',
  })
  const isInitialMount = useRef(true)

  const fetchPosts = async (isSearchUpdate: boolean = false) => {
    try {
      if (isSearchUpdate) {
        setSearchLoading(true)
      } else {
        setLoading(true)
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (debouncedSearch) params.append('search', debouncedSearch)
      if (userIdFilter) params.append('userId', userIdFilter)
      if (clubIdFilter) params.append('clubId', clubIdFilter)
      
      // Only add status filters if not 'all'
      if (statusFilter === 'deleted') {
        params.append('isDeleted', 'true')
      } else if (statusFilter === 'hidden') {
        params.append('isHidden', 'true')
      } else if (statusFilter === 'active') {
        params.append('isDeleted', 'false')
        params.append('isHidden', 'false')
      }
      // If statusFilter is 'all', don't add any status filters - show everything

      const response = await api.get(`/admin/posts?${params}`)
      console.log('Posts response:', response.data) // Debug log
      setPosts(response.data.posts || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error('Error fetching posts:', error)
      if (error.response) {
        console.error('Error response:', error.response.data)
      }
      showError('Error Loading Posts', error.response?.data?.message || error.message)
    } finally {
      if (isSearchUpdate) {
        setSearchLoading(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!user || !hasPermission(Permission.MODERATE_POSTS)) return
    
    if (isInitialMount.current) {
      isInitialMount.current = false
      prevFiltersRef.current = {
        page,
        userIdFilter,
        clubIdFilter,
        statusFilter,
        debouncedSearch,
      }
      fetchPosts(false)
      fetchStats()
      return
    }
    
    const prev = prevFiltersRef.current
    const onlySearchChanged = 
      prev.debouncedSearch !== debouncedSearch &&
      prev.page === page &&
      prev.userIdFilter === userIdFilter &&
      prev.clubIdFilter === clubIdFilter &&
      prev.statusFilter === statusFilter
    
    prevFiltersRef.current = {
      page,
      userIdFilter,
      clubIdFilter,
      statusFilter,
      debouncedSearch,
    }
    
    fetchPosts(onlySearchChanged)
    // Only fetch stats when filters change, not on search
    if (!onlySearchChanged) {
      fetchStats()
    }
  }, [user, page, debouncedSearch, userIdFilter, clubIdFilter, statusFilter])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/posts/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching post stats:', error)
    }
  }

  const handleDelete = async (postId: string) => {
    const confirmed = await showConfirm(
      'Delete Post',
      'Are you sure you want to delete this post? This will hide it from users.',
      'Yes, delete',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/admin/posts/${postId}`)
      showSuccess('Post Deleted', 'The post has been deleted successfully')
      fetchPosts()
      fetchStats()
      setSelectedPost(null)
    } catch (error: any) {
      console.error('Error deleting post:', error)
      showError('Failed to Delete Post', error.response?.data?.message || 'An error occurred while deleting the post')
    }
  }

  const handleHide = async (postId: string) => {
    try {
      await api.put(`/admin/posts/${postId}/hide`)
      showSuccess('Post Hidden', 'The post has been hidden successfully')
      fetchPosts()
      fetchStats()
      if (selectedPost?.id === postId) {
        setSelectedPost({ ...selectedPost, isHidden: true })
      }
    } catch (error: any) {
      console.error('Error hiding post:', error)
      showError('Failed to Hide Post', error.response?.data?.message || 'An error occurred while hiding the post')
    }
  }

  const handleUnhide = async (postId: string) => {
    try {
      await api.put(`/admin/posts/${postId}/unhide`)
      showSuccess('Post Unhidden', 'The post has been unhidden successfully')
      fetchPosts()
      fetchStats()
      if (selectedPost?.id === postId) {
        setSelectedPost({ ...selectedPost, isHidden: false })
      }
    } catch (error: any) {
      console.error('Error unhiding post:', error)
      showError('Failed to Unhide Post', error.response?.data?.message || 'An error occurred while unhiding the post')
    }
  }

  const handleRestore = async (postId: string) => {
    try {
      await api.put(`/admin/posts/${postId}/restore`)
      showSuccess('Post Restored', 'The post has been restored successfully')
      fetchPosts()
      fetchStats()
      if (selectedPost?.id === postId) {
        setSelectedPost({ ...selectedPost, isDeleted: false })
      }
    } catch (error: any) {
      console.error('Error restoring post:', error)
      showError('Failed to Restore Post', error.response?.data?.message || 'An error occurred while restoring the post')
    }
  }

  const handlePermanentDelete = async (postId: string) => {
    const confirmed = await showConfirm(
      'Permanent Delete',
      'Are you sure you want to PERMANENTLY delete this post? This action cannot be undone!',
      'Yes, delete permanently',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/admin/posts/${postId}/permanent`)
      showSuccess('Post Deleted', 'The post has been permanently deleted')
      fetchPosts()
      fetchStats()
      setSelectedPost(null)
    } catch (error: any) {
      console.error('Error permanently deleting post:', error)
      showError('Failed to Delete Post', error.response?.data?.message || 'An error occurred while deleting the post')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      PLATFORM_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      MODERATOR: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[role] || colors.MEMBER
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.MODERATE_POSTS}>
        <Layout>
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  Posts Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View and moderate user posts
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Deleted</div>
                  <div className="text-2xl font-bold text-red-600">{stats.deleted}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Hidden</div>
                  <div className="text-2xl font-bold text-orange-600">{stats.hidden}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
                  <div className="text-2xl font-bold text-purple-600">{stats.thisWeek}</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {searchLoading && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Search post content..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    style={{ paddingRight: searchLoading ? '3rem' : '1rem' }}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Posts (Including Deleted/Hidden)</option>
                    <option value="active">Active Only</option>
                    <option value="deleted">Deleted Only</option>
                    <option value="hidden">Hidden Only</option>
                  </select>
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by user ID..."
                    value={userIdFilter}
                    onChange={(e) => {
                      setUserIdFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <UsersRound className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by club ID..."
                    value={clubIdFilter}
                    onChange={(e) => {
                      setClubIdFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Posts Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8">
                  <LoadingSpinner message="Loading posts..." showProgress={true} size="md" fullScreen={false} />
                </div>
              ) : posts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No posts found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Author
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Content
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Club
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Engagement
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {posts.map((post) => (
                        <tr 
                          key={post.id} 
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${post.isDeleted || post.isHidden ? 'opacity-60' : ''}`}
                          onClick={() => setSelectedPost(post)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <Link
                              href={`/users/${post.author.id}`}
                              className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {post.author.profileImage ? (
                                <img
                                  src={post.author.profileImage}
                                  alt={post.author.firstName}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {post.author.firstName} {post.author.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {post.author.email}
                                </div>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${getRoleBadgeColor(post.author.role)}`}>
                                  {post.author.role}
                                </span>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-md">
                              {post.parentPost && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 italic">
                                  Reply to: {post.parentPost.content.substring(0, 50)}...
                                </div>
                              )}
                              <div className="line-clamp-2">{post.content}</div>
                              {post.images && post.images.length > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  📷 {post.images.length} image(s)
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            {post.club ? (
                              <Link
                                href={`/clubs/${post.club.id}`}
                                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                              >
                                {post.club.name}
                              </Link>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">General</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  {post._count.replies + post._count.comments}
                                </span>
                                <span>❤️ {post._count.reactions}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              {post.isDeleted && (
                                <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Deleted
                                </span>
                              )}
                              {post.isHidden && (
                                <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  Hidden
                                </span>
                              )}
                              {!post.isDeleted && !post.isHidden && (
                                <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Active
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedPost(post)
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {!post.isHidden && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleHide(post.id)
                                  }}
                                  className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                                  title="Hide post"
                                >
                                  <EyeOff className="h-4 w-4" />
                                </button>
                              )}
                              {post.isHidden && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUnhide(post.id)
                                  }}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Unhide post"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              {!post.isDeleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(post.id)
                                  }}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete post"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              {post.isDeleted && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRestore(post.id)
                                    }}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                    title="Restore post"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePermanentDelete(post.id)
                                    }}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                    title="Permanently delete"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Post Detail Modal */}
            {selectedPost && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post Details</h2>
                      <button
                        onClick={() => setSelectedPost(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Author</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Link
                            href={`/users/${selectedPost.author.id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {selectedPost.author.firstName} {selectedPost.author.lastName} ({selectedPost.author.email})
                          </Link>
                          <span className={`px-2 py-1 text-xs rounded ${getRoleBadgeColor(selectedPost.author.role)}`}>
                            {selectedPost.author.role}
                          </span>
                        </div>
                      </div>
                      {selectedPost.club && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Club</label>
                          <div className="mt-1">
                            <Link
                              href={`/clubs/${selectedPost.club.id}`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {selectedPost.club.name}
                            </Link>
                          </div>
                        </div>
                      )}
                      {selectedPost.parentPost && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Reply To</label>
                          <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                            {selectedPost.parentPost.content}
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              - {selectedPost.parentPost.author.firstName} {selectedPost.parentPost.author.lastName}
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                        <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedPost.content}
                        </div>
                      </div>
                      {selectedPost.images && selectedPost.images.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Images</label>
                          <div className="mt-1 grid grid-cols-2 gap-2">
                            {selectedPost.images.map((image, idx) => (
                              <img key={idx} src={image} alt={`Post image ${idx + 1}`} className="rounded-lg" />
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Engagement</label>
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>Reactions: {selectedPost._count.reactions}</div>
                            <div>Comments: {selectedPost._count.comments}</div>
                            <div>Replies: {selectedPost._count.replies}</div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                          <div className="mt-1">
                            {selectedPost.isDeleted && (
                              <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Deleted
                              </span>
                            )}
                            {selectedPost.isHidden && (
                              <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Hidden
                              </span>
                            )}
                            {!selectedPost.isDeleted && !selectedPost.isHidden && (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Created: {new Date(selectedPost.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setSelectedPost(null)}
                          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Close
                        </button>
                        {!selectedPost.isHidden && (
                          <button
                            onClick={() => handleHide(selectedPost.id)}
                            className="px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                          >
                            Hide Post
                          </button>
                        )}
                        {selectedPost.isHidden && (
                          <button
                            onClick={() => handleUnhide(selectedPost.id)}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Unhide Post
                          </button>
                        )}
                        {!selectedPost.isDeleted && (
                          <button
                            onClick={() => handleDelete(selectedPost.id)}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            Delete Post
                          </button>
                        )}
                        {selectedPost.isDeleted && (
                          <>
                            <button
                              onClick={() => handleRestore(selectedPost.id)}
                              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(selectedPost.id)}
                              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                              Permanent Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

