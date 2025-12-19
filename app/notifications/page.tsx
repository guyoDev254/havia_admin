'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Search, Plus, Bell } from 'lucide-react'
import { format } from 'date-fns'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link?: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSystemModal, setShowSystemModal] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    message: '',
    type: 'OTHER',
    link: '',
  })
  const [systemFormData, setSystemFormData] = useState({
    title: '',
    message: '',
    type: 'SYSTEM_ANNOUNCEMENT',
    link: '',
  })

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user, page, typeFilter, unreadOnly])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(typeFilter && { type: typeFilter }),
        ...(unreadOnly && { unreadOnly: 'true' }),
      })
      const response = await api.get(`/admin/notifications?${params}`)
      let filteredNotifications = response.data.notifications

      if (search) {
        filteredNotifications = filteredNotifications.filter(
          (notification: Notification) =>
            notification.title.toLowerCase().includes(search.toLowerCase()) ||
            notification.message.toLowerCase().includes(search.toLowerCase()) ||
            `${notification.user.firstName} ${notification.user.lastName}`
              .toLowerCase()
              .includes(search.toLowerCase())
        )
      }

      setNotifications(filteredNotifications)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/notifications', formData)
      setShowCreateModal(false)
      setFormData({
        userId: '',
        title: '',
        message: '',
        type: 'OTHER',
        link: '',
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error creating notification:', error)
      alert('Failed to create notification')
    }
  }

  const handleSendSystemNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/admin/notifications/system', systemFormData)
      setShowSystemModal(false)
      setSystemFormData({
        title: '',
        message: '',
        type: 'SYSTEM_ANNOUNCEMENT',
        link: '',
      })
      alert('System notification sent to all users!')
      fetchNotifications()
    } catch (error) {
      console.error('Error sending system notification:', error)
      alert('Failed to send system notification')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EVENT_REMINDER':
        return '📅'
      case 'CLUB_UPDATE':
        return '👥'
      case 'MENTORSHIP_REQUEST':
        return '🤝'
      case 'BADGE_EARNED':
        return '🏆'
      case 'SYSTEM_ANNOUNCEMENT':
        return '📢'
      default:
        return '🔔'
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage all system notifications
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSystemModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Bell className="h-4 w-4" />
                  Send System Notification
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Notification
                </button>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value)
                    setPage(1)
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">All Types</option>
                  <option value="EVENT_REMINDER">Event Reminder</option>
                  <option value="CLUB_UPDATE">Club Update</option>
                  <option value="MENTORSHIP_REQUEST">Mentorship Request</option>
                  <option value="BADGE_EARNED">Badge Earned</option>
                  <option value="SYSTEM_ANNOUNCEMENT">System Announcement</option>
                  <option value="OTHER">Other</option>
                </select>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => {
                      setUnreadOnly(e.target.checked)
                      setPage(1)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Unread Only</span>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                        <div className="text-xs text-gray-500 mt-1">{notification.type}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {notification.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {notification.user.firstName} {notification.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{notification.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            notification.isRead
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {notification.isRead ? 'Read' : 'Unread'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(notification.createdAt), 'MMM dd, yyyy • h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Create Notification</h2>
              <form onSubmit={handleCreateNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="User ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="OTHER">Other</option>
                    <option value="EVENT_REMINDER">Event Reminder</option>
                    <option value="CLUB_UPDATE">Club Update</option>
                    <option value="MENTORSHIP_REQUEST">Mentorship Request</option>
                    <option value="BADGE_EARNED">Badge Earned</option>
                    <option value="SYSTEM_ANNOUNCEMENT">System Announcement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Optional link"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* System Notification Modal */}
        {showSystemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Send System Notification</h2>
              <p className="text-sm text-gray-500 mb-4">
                This will send a notification to all active users.
              </p>
              <form onSubmit={handleSendSystemNotification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={systemFormData.title}
                    onChange={(e) =>
                      setSystemFormData({ ...systemFormData, title: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    value={systemFormData.message}
                    onChange={(e) =>
                      setSystemFormData({ ...systemFormData, message: e.target.value })
                    }
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
                  <input
                    type="text"
                    value={systemFormData.link}
                    onChange={(e) =>
                      setSystemFormData({ ...systemFormData, link: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Optional link"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Send to All Users
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSystemModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}

