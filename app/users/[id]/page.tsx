'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleBadge from '@/components/RoleBadge'
import PermissionGuard from '@/components/PermissionGuard'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Ban,
  AlertTriangle,
  MessageSquare,
  FileText,
  TrendingUp,
  Users,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Send,
  Download,
  History,
  Flag,
  MessageCircle,
} from 'lucide-react'

interface UserDetails {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName: string
  bio?: string
  profileImage?: string
  location?: string
  skills?: string[]
  interests?: string[]
  education?: string
  occupation?: string
  role: string
  isActive: boolean
  isEmailVerified: boolean
  points: number
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  clubs: Array<{ id: string; name: string; category: string }>
  userBadges: Array<{
    id: string
    badge: { id: string; name: string; type: string; points: number }
    earnedAt: string
  }>
  _count?: {
    posts?: number
    comments?: number
    eventsAttended?: number
    mentorships?: number
    reportsFiled?: number
    reportsAgainst?: number
  }
  mentorshipHistory?: Array<{
    id: string
    status: string
    mentor?: { firstName: string; lastName: string }
    mentee?: { firstName: string; lastName: string }
  }>
  activeMentorships?: Array<{
    id: string
    status: string
    mentor?: { firstName: string; lastName: string }
    mentee?: { firstName: string; lastName: string }
  }>
  flags?: number
  strikes?: number
  suspensionReason?: string
  suspensionEndsAt?: string
}

function UserAuditLogs({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/admin/users/${userId}/audit-logs?page=${page}&limit=20`)
        setLogs(response.data.logs || [])
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [userId, page])

  if (loading) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner message="Loading audit logs..." showProgress={true} size="sm" fullScreen={false} />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No audit logs found for this user</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Admin
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {log.admin?.firstName} {log.admin?.lastName}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                    {log.action?.replace(/_/g, ' ') || 'Unknown Action'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {log.reason && <div>Reason: {log.reason}</div>}
                  {log.changes && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-blue-600 dark:text-blue-400 text-xs">
                        View Changes
                      </summary>
                      <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { hasPermission, isSuperAdmin } = usePermissions()
  const { showError, showSuccess, showWarning, showConfirm } = useSweetAlert()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'mentorship' | 'moderation' | 'audit'>('overview')
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendDuration, setSuspendDuration] = useState('7')
  const [messageText, setMessageText] = useState('')
  const [newRole, setNewRole] = useState('')

  const ALL_ROLES = [
    'MEMBER',
    'MENTOR',
    'MENTEE',
    'CLUB_MANAGER',
    'SUPER_ADMIN',
    'PLATFORM_ADMIN',
    'COMMUNITY_MANAGER',
    'MENTORSHIP_ADMIN',
    'CONTENT_MANAGER',
    'PARTNERSHIP_MANAGER',
    'DATA_ADMIN',
    'SUPPORT_ADMIN',
    'ADMIN',
    'MODERATOR',
  ]

  useEffect(() => {
    if (params.id) {
      fetchUserDetails()
    }
  }, [params.id])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/users/${params.id}`)
      const userData = response.data
      
      // Ensure all array fields have default values
      setUser({
        ...userData,
        clubs: userData.clubs || [],
        userBadges: userData.userBadges || [],
        skills: userData.skills || [],
        interests: userData.interests || [],
        activeMentorships: userData.activeMentorships || [],
        mentorshipHistory: userData.mentorshipHistory || [],
        _count: userData._count || {
          posts: 0,
          comments: 0,
          eventsAttended: 0,
          mentorships: 0,
          reportsFiled: 0,
          reportsAgainst: 0,
        }
      })
    } catch (error: any) {
      console.error('Error fetching user details:', error)
      showError('Failed to Load User Details', error.response?.data?.message || 'An error occurred while loading user details')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async () => {
    if (!newRole) return
    try {
      await api.put(`/admin/users/${params.id}/role`, { role: newRole })
      setShowRoleModal(false)
      fetchUserDetails()
    } catch (error: any) {
      console.error('Error updating role:', error)
      showError('Failed to Update Role', error.response?.data?.message || 'An error occurred while updating the user role')
    }
  }

  const handleSuspend = async () => {
    if (!suspendReason) {
      showWarning('Validation Error', 'Please provide a reason for suspension')
      return
    }
    try {
      await api.post(`/admin/users/${params.id}/suspend`, {
        reason: suspendReason,
        duration: parseInt(suspendDuration),
      })
      setShowSuspendModal(false)
      setSuspendReason('')
      fetchUserDetails()
    } catch (error: any) {
      console.error('Error suspending user:', error)
      showError('Failed to Suspend User', error.response?.data?.message || 'An error occurred while suspending the user')
    }
  }

  const handleActivate = async () => {
    try {
      await api.post(`/admin/users/${params.id}/activate`)
      showSuccess('User Activated', 'The user has been activated successfully')
      fetchUserDetails()
    } catch (error: any) {
      console.error('Error activating user:', error)
      showError('Failed to Activate User', error.response?.data?.message || 'An error occurred while activating the user')
    }
  }

  const handleBan = async () => {
    const confirmed = await showConfirm(
      'Ban User',
      'Are you sure you want to permanently ban this user? This action cannot be undone.',
      'Yes, ban permanently',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return
    
    try {
      await api.post(`/admin/users/${params.id}/ban`, { reason: 'Permanently banned by admin' })
      showSuccess('User Banned', 'The user has been permanently banned')
      fetchUserDetails()
    } catch (error: any) {
      console.error('Error banning user:', error)
      showError('Failed to Ban User', error.response?.data?.message || 'An error occurred while banning the user')
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) return
    try {
      await api.post(`/admin/users/${params.id}/message`, { message: messageText })
      setShowMessageModal(false)
      setMessageText('')
      showSuccess('Message Sent', 'Your message has been sent successfully')
    } catch (error: any) {
      console.error('Error sending message:', error)
      showError('Failed to Send Message', error.response?.data?.message || 'An error occurred while sending the message')
    }
  }

  const handleExportData = async () => {
    try {
      const response = await api.get(`/admin/users/${params.id}/export`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `user-${user?.email}-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showSuccess('Data Exported', 'User data has been exported successfully')
    } catch (error: any) {
      console.error('Error exporting data:', error)
      showError('Failed to Export Data', error.response?.data?.message || 'An error occurred while exporting user data')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading user details...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!user) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">User not found</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/users')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <div className="flex gap-2">
              <PermissionGuard permission={Permission.EXPORT_DATA}>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Status Banner */}
          {!user.isActive && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-200">Account Suspended</p>
                  {user.suspensionReason && (
                    <p className="text-sm text-red-700 dark:text-red-300">Reason: {user.suspensionReason}</p>
                  )}
                  {user.suspensionEndsAt && (
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Suspension ends: {new Date(user.suspensionEndsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <PermissionGuard permission={Permission.ASSIGN_ROLES}>
                <button
                  onClick={() => {
                    setNewRole(user.role)
                    setShowRoleModal(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Change Role
                </button>
              </PermissionGuard>
              <PermissionGuard permission={Permission.SUSPEND_USERS}>
                {user.isActive ? (
                  <button
                    onClick={() => setShowSuspendModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                  >
                    <UserX className="h-4 w-4" />
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={handleActivate}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <UserCheck className="h-4 w-4" />
                    Activate
                  </button>
                )}
              </PermissionGuard>
              {isSuperAdmin() && (
                <button
                  onClick={handleBan}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Ban className="h-4 w-4" />
                  Ban Permanently
                </button>
              )}
              <PermissionGuard permission={Permission.SEND_BROADCASTS}>
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                {[
                  { id: 'overview', label: 'Overview', icon: UserCheck },
                  { id: 'activity', label: 'Activity', icon: TrendingUp },
                  { id: 'mentorship', label: 'Mentorship', icon: Users },
                  { id: 'moderation', label: 'Moderation', icon: Shield },
                  { id: 'audit', label: 'Audit Log', icon: History },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
                          {user.isEmailVerified ? (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Not Verified
                            </span>
                          )}
                        </div>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                            <p className="font-medium text-gray-900 dark:text-white">{user.phone}</p>
                          </div>
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                            <p className="font-medium text-gray-900 dark:text-white">{user.location}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Joined</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {user.lastLoginAt && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Last Active</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {new Date(user.lastLoginAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role & Status */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Role & Status</h3>
                    <div className="flex items-center gap-4">
                      <RoleBadge role={user.role} />
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
                        {user.points} Points
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Bio</h3>
                      <p className="text-gray-700 dark:text-gray-300">{user.bio}</p>
                    </div>
                  )}

                  {/* Skills & Interests */}
                  {(user.skills?.length || user.interests?.length) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Skills & Interests</h3>
                      <div className="space-y-4">
                        {user.skills && user.skills.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {user.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {user.interests && user.interests.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests</p>
                            <div className="flex flex-wrap gap-2">
                              {user.interests.map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-sm"
                                >
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Clubs */}
                  {user.clubs?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Clubs</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {user.clubs.map((club) => (
                          <div
                            key={club.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <p className="font-medium text-gray-900 dark:text-white">{club.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{club.category}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  {user.userBadges?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Badges</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {user.userBadges.map((userBadge) => (
                          <div
                            key={userBadge.id}
                            className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                              <p className="font-medium text-gray-900 dark:text-white">{userBadge.badge.name}</p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Earned: {new Date(userBadge.earnedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Posts</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user._count?.posts || 0}</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Comments</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user._count?.comments || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user._count?.eventsAttended || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mentorships</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user._count?.mentorships || 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Detailed activity history coming soon...
                  </p>
                </div>
              )}

              {/* Mentorship Tab */}
              {activeTab === 'mentorship' && (
                <div className="space-y-4">
                  {user.activeMentorships && user.activeMentorships.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Active Mentorships</h3>
                      <div className="space-y-3">
                        {user.activeMentorships.map((mentorship) => (
                          <div
                            key={mentorship.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.role === 'MENTOR'
                                ? `Mentee: ${mentorship.mentee?.firstName} ${mentorship.mentee?.lastName}`
                                : `Mentor: ${mentorship.mentor?.firstName} ${mentorship.mentor?.lastName}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status: {mentorship.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No active mentorships</p>
                  )}
                </div>
              )}

              {/* Moderation Tab */}
              {activeTab === 'moderation' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Flags</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.flags || 0}</p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Strikes</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user.strikes || 0}</p>
                    </div>
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Reports Against</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{user._count?.reportsAgainst || 0}</p>
                    </div>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    Moderation tools coming soon...
                  </p>
                </div>
              )}

              {/* Audit Log Tab */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <UserAuditLogs userId={user.id} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Role Change Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Change User Role</h3>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suspend Modal */}
        {showSuspendModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Suspend User</h3>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Reason for suspension..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
              <select
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="1">1 day</option>
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspend}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Send Message</h3>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Message to user..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}