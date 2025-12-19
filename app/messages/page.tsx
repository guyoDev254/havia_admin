'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { MessageSquare, Search, User, Trash2, Eye, Filter } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  content: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    role: string
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    role: string
  }
}

interface MessageStats {
  total: number
  unread: number
  today: number
  thisWeek: number
}

export default function MessagesPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [messages, setMessages] = useState<Message[]>([])
  const [stats, setStats] = useState<MessageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [senderFilter, setSenderFilter] = useState('')
  const [receiverFilter, setReceiverFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    if (user && hasPermission(Permission.MODERATE_CHATS)) {
      fetchMessages()
      fetchStats()
    }
  }, [user, page, search, senderFilter, receiverFilter])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (search) params.append('search', search)
      if (senderFilter) params.append('senderId', senderFilter)
      if (receiverFilter) params.append('receiverId', receiverFilter)

      const response = await api.get(`/admin/messages?${params}`)
      setMessages(response.data.messages || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/messages/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching message stats:', error)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return
    }

    try {
      await api.delete(`/admin/messages/${messageId}`)
      fetchMessages()
      fetchStats()
      setSelectedMessage(null)
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
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
      <PermissionGuard permission={Permission.MODERATE_CHATS}>
        <Layout>
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                  Messages
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  View and moderate user messages
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Messages</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Unread</div>
                  <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
                  <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by user name or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by sender ID..."
                    value={senderFilter}
                    onChange={(e) => {
                      setSenderFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by receiver ID..."
                    value={receiverFilter}
                    onChange={(e) => {
                      setReceiverFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Messages Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No messages found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          From
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Message
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
                      {messages.map((message) => (
                        <tr key={message.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/users/${message.sender.id}`}
                              className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {message.sender.profileImage ? (
                                <img
                                  src={message.sender.profileImage}
                                  alt={message.sender.firstName}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {message.sender.firstName} {message.sender.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {message.sender.email}
                                </div>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${getRoleBadgeColor(message.sender.role)}`}>
                                  {message.sender.role}
                                </span>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/users/${message.receiver.id}`}
                              className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {message.receiver.profileImage ? (
                                <img
                                  src={message.receiver.profileImage}
                                  alt={message.receiver.firstName}
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {message.receiver.firstName} {message.receiver.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {message.receiver.email}
                                </div>
                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${getRoleBadgeColor(message.receiver.role)}`}>
                                  {message.receiver.role}
                                </span>
                              </div>
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                              {message.content}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {message.isRead ? (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Read
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Unread
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/messages/${message.sender.id === user?.id ? message.receiver.id : message.sender.id}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View conversation"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => setSelectedMessage(message)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(message.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete message"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
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

            {/* Message Detail Modal */}
            {selectedMessage && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Message Details</h2>
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Link
                            href={`/users/${selectedMessage.sender.id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {selectedMessage.sender.firstName} {selectedMessage.sender.lastName} ({selectedMessage.sender.email})
                          </Link>
                          <span className={`px-2 py-1 text-xs rounded ${getRoleBadgeColor(selectedMessage.sender.role)}`}>
                            {selectedMessage.sender.role}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                        <div className="mt-1 flex items-center gap-2">
                          <Link
                            href={`/users/${selectedMessage.receiver.id}`}
                            className="text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {selectedMessage.receiver.firstName} {selectedMessage.receiver.lastName} ({selectedMessage.receiver.email})
                          </Link>
                          <span className={`px-2 py-0.5 text-xs rounded ${getRoleBadgeColor(selectedMessage.receiver.role)}`}>
                            {selectedMessage.receiver.role}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                        <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedMessage.content}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                          <div className="mt-1">
                            {selectedMessage.isRead ? (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Read
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {new Date(selectedMessage.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setSelectedMessage(null)}
                          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => handleDelete(selectedMessage.id)}
                          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Delete Message
                        </button>
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

