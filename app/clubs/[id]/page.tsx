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
import PermissionGuard from '@/components/PermissionGuard'
import Link from 'next/link'
import { ArrowLeft, Edit2, Save, X, Users, Calendar, UserPlus, Trash2, MoreVertical, Shield, UserMinus, Upload, Image as ImageIcon, CheckCircle, XCircle, Archive, Snowflake, Play, Plus, Settings, UserCheck, BookOpen, FileText, BarChart3 } from 'lucide-react'

interface ClubDetail {
  id: string
  name: string
  description: string
  image?: string
  logo?: string
  banner?: string
  category: string
  isPublic: boolean
  isActive: boolean
  status?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  userRole?: string // Current user's role in the club (LEAD, CO_LEAD, MEMBER, etc.)
  isMember?: boolean // Whether current user is a member
  _count: {
    members: number
    events: number
  }
  members?: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }>
}

export default function ClubDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { showError, showSuccess, showWarning, showConfirm } = useSweetAlert()
  const clubId = params.id as string

  const [clubDetail, setClubDetail] = useState<ClubDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [managers, setManagers] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [showAssignManager, setShowAssignManager] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [newRole, setNewRole] = useState('MEMBER')
  const [assignUserId, setAssignUserId] = useState('')
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [clubMembers, setClubMembers] = useState<any[]>([])
  const [selectedUserManagedClub, setSelectedUserManagedClub] = useState<string | null>(null)
  const [checkingUser, setCheckingUser] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'TECH',
    isPublic: true,
    isActive: true,
    logo: '',
    banner: '',
  })
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'events' | 'programs' | 'resources' | 'analytics' | 'settings' | 'managers'>('overview')
  const [programs, setPrograms] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(false)
  const [loadingResources, setLoadingResources] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [isManager, setIsManager] = useState(false)
  const [isLead, setIsLead] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [canManage, setCanManage] = useState(false) // Super Admin or club lead/manager/creator

  const checkUserPermissions = async () => {
    try {
      // Check if user is manager
      const managerResponse = await api.get(`/clubs/${clubId}/is-manager`).catch(() => ({ data: { isManager: false } }))
      const userIsManager = managerResponse.data?.isManager || false
      setIsManager(userIsManager)

      // Check club detail for user role
      const clubResponse = await api.get(`/clubs/${clubId}`)
      const userRole = clubResponse.data?.userRole
      const userIsLead = userRole === 'LEAD' || userRole === 'CO_LEAD'
      setIsLead(userIsLead)
      const userIsCreator = clubResponse.data?.createdBy === user?.id
      setIsCreator(userIsCreator)

      // Super Admin can always manage, or if user is creator/lead/manager
      const isSuperAdmin = hasPermission(Permission.APPROVE_CLUBS) || user?.role === 'SUPER_ADMIN'
      setCanManage(isSuperAdmin || userIsManager || userIsLead || userIsCreator)
    } catch (error) {
      console.error('Error checking permissions:', error)
      // Default: if super admin, allow management
      const isSuperAdmin = hasPermission(Permission.APPROVE_CLUBS) || user?.role === 'SUPER_ADMIN'
      setCanManage(isSuperAdmin)
    }
  }

  useEffect(() => {
    if (user && clubId) {
      fetchClubDetail()
      fetchManagers()
      fetchMembers()
      fetchUsers()
      checkUserPermissions()
    }
  }, [user, clubId])

  useEffect(() => {
    if (activeTab === 'programs' && clubId) {
      fetchPrograms()
    } else if (activeTab === 'resources' && clubId) {
      fetchResources()
    } else if (activeTab === 'analytics' && clubId) {
      fetchAnalytics()
    } else if (activeTab === 'events' && clubId) {
      fetchEvents()
    }
  }, [activeTab, clubId])

  const fetchClubDetail = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/clubs/${clubId}`)
      setClubDetail(response.data)
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        category: response.data.category || 'TECH',
        isPublic: response.data.isPublic ?? true,
        isActive: response.data.isActive ?? true,
        logo: response.data.logo || '',
        banner: response.data.banner || '',
      })
    } catch (error) {
      console.error('Error fetching club:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/managers`)
      setManagers(response.data)
    } catch (error) {
      console.error('Error fetching managers:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/members`)
      // API returns { members: [], pagination: {} }
      const membersList = response.data.members || response.data || []
      setMembers(Array.isArray(membersList) ? membersList : [])
      setClubMembers(Array.isArray(membersList) ? membersList : [])
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
      setClubMembers([])
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users?limit=100')
      setAllUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true)
      const response = await api.get(`/clubs/${clubId}/programs`)
      setPrograms(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching programs:', error)
      setPrograms([])
    } finally {
      setLoadingPrograms(false)
    }
  }

  const fetchResources = async () => {
    try {
      setLoadingResources(true)
      const response = await api.get(`/clubs/${clubId}/resources`)
      setResources(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Error fetching resources:', error)
      setResources([])
    } finally {
      setLoadingResources(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true)
      const response = await api.get(`/clubs/${clubId}/analytics`)
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setAnalytics(null)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true)
      // Fetch events filtered by club ID from admin events endpoint
      const response = await api.get(`/admin/events?limit=100`)
      const allEvents = response.data.events || []
      // Filter events for this club
      const clubEvents = allEvents.filter((event: any) => event.club?.id === clubId)
      setEvents(clubEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.put(`/admin/clubs/${clubId}`, formData)
      showSuccess('Club Updated', 'The club has been updated successfully!')
      setEditing(false)
      fetchClubDetail()
    } catch (error: any) {
      console.error('Error updating club:', error)
      showError('Failed to Update Club', error.response?.data?.message || 'An error occurred while updating the club')
    }
  }

  const checkUserManagedClub = async (userId: string) => {
    if (!userId) {
      setSelectedUserManagedClub(null)
      return
    }

    try {
      setCheckingUser(true)
      // Check if user is already managing another club
      const response = await api.get(`/clubs/managed-by/${userId}`).catch(() => ({ data: [] }))
      const managedClubs = response.data || []
      const otherClub = managedClubs.find((c: any) => c.clubId !== clubId && c.isActive)
      
      if (otherClub) {
        setSelectedUserManagedClub(otherClub.club?.name || otherClub.clubName || 'Another club')
      } else {
        setSelectedUserManagedClub(null)
      }
    } catch (error) {
      setSelectedUserManagedClub(null)
    } finally {
      setCheckingUser(false)
    }
  }

  const handleAssignManager = async () => {
    if (!assignUserId) {
      showWarning('Validation Error', 'Please select a user')
      return
    }

    // Inform if user is already managing other clubs (but allow it)
    if (selectedUserManagedClub) {
      const confirmed = await showConfirm(
        'User Already Managing Other Clubs',
        `This user is currently managing "${selectedUserManagedClub}". They can manage multiple clubs. Do you want to assign them to this club as well?`,
        'Yes, assign',
        'Cancel'
      )
      if (!confirmed) return
    }

    try {
      await api.post(`/clubs/${clubId}/managers`, { userId: assignUserId })
      showSuccess('Manager Assigned', 'The manager has been assigned successfully')
      setShowAssignManager(false)
      setAssignUserId('')
      setSelectedUserManagedClub(null)
      fetchManagers()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred while assigning the manager'
      
      // Check if error is about user already managing another club
      if (errorMessage.includes('already managing another club')) {
        showError(
          'Cannot Assign Manager',
          errorMessage + '. Please remove them from their current club first or select a different user.'
        )
      } else {
        showError('Failed to Assign Manager', errorMessage)
      }
    }
  }

  const handleRemoveManager = async (userId: string) => {
    const confirmed = await showConfirm(
      'Remove Manager',
      'Are you sure you want to remove this manager?',
      'Yes, remove',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/clubs/${clubId}/managers/${userId}`)
      showSuccess('Manager Removed', 'The manager has been removed successfully')
      fetchManagers()
      fetchMembers() // Refresh members list
    } catch (error: any) {
      showError('Failed to Remove Manager', error.response?.data?.message || 'An error occurred while removing the manager')
    }
  }

  const handleUpdateMemberRole = async () => {
    if (!selectedMember || !newRole) return

    try {
      await api.put(`/clubs/${clubId}/members/${selectedMember.id}/role`, { role: newRole })
      showSuccess('Role Updated', 'Member role has been updated successfully')
      setShowRoleModal(false)
      setSelectedMember(null)
      fetchMembers()
    } catch (error: any) {
      showError('Failed to Update Role', error.response?.data?.message || 'An error occurred while updating the member role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    const confirmed = await showConfirm(
      'Remove Member',
      'Are you sure you want to remove this member from the club?',
      'Yes, remove',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/clubs/${clubId}/members/${memberId}`)
      showSuccess('Member Removed', 'The member has been removed successfully')
      fetchMembers()
    } catch (error: any) {
      showError('Failed to Remove Member', error.response?.data?.message || 'An error occurred while removing the member')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/upload/club-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const logoUrl = response.data.url
      setFormData((prev) => ({ ...prev, logo: logoUrl }))
      
      // Update club immediately
      await api.put(`/admin/clubs/${clubId}`, { logo: logoUrl })
      showSuccess('Logo Uploaded', 'The logo has been uploaded successfully')
      fetchClubDetail()
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      showError('Failed to Upload Logo', error.response?.data?.message || 'An error occurred while uploading the logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingBanner(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/upload/club-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const bannerUrl = response.data.url
      setFormData((prev) => ({ ...prev, banner: bannerUrl }))
      
      // Update club immediately
      await api.put(`/admin/clubs/${clubId}`, { banner: bannerUrl })
      showSuccess('Banner Uploaded', 'The banner has been uploaded successfully')
      fetchClubDetail()
    } catch (error: any) {
      console.error('Error uploading banner:', error)
      showError('Failed to Upload Banner', error.response?.data?.message || 'An error occurred while uploading the banner')
    } finally {
      setUploadingBanner(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading club details..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!clubDetail) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <p className="text-gray-500">Club not found</p>
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{clubDetail.name}</h1>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{clubDetail.category}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {canManage && (
                  <>
                    {editing ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false)
                            fetchClubDetail()
                          }}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        {(isManager || isLead || isCreator) && (
                          <Link
                            href={`/clubs/${clubId}/manager`}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
                          >
                            <BarChart3 className="h-4 w-4" />
                            Manager Dashboard
                          </Link>
                        )}
                        {(canManage || hasPermission(Permission.SCHEDULE_EVENTS)) && (
                          <button
                            onClick={() => router.push(`/events/create?clubId=${clubId}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Create Event
                          </button>
                        )}
                        <button
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Club
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Manager Quick Actions Bar */}
            {(isManager || isLead || isCreator) && !editing && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Manager Quick Actions</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Quick access to common tasks</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/events/create?clubId=${clubId}`}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Event
                    </Link>
                    <Link
                      href={`/clubs/${clubId}?tab=members`}
                      onClick={() => setActiveTab('members')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Users className="h-4 w-4" />
                      Members
                    </Link>
                    <Link
                      href={`/clubs/${clubId}?tab=analytics`}
                      onClick={() => setActiveTab('analytics')}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Club Banner */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                {clubDetail.banner || clubDetail.image ? (
                  <div className="relative">
                    <img
                      src={clubDetail.banner || clubDetail.image}
                      alt={clubDetail.name}
                      className="w-full h-64 object-cover"
                    />
                    {editing && (
                      <div className="absolute top-2 right-2">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-md text-sm">
                          <Upload className="h-4 w-4" />
                          {uploadingBanner ? 'Uploading...' : 'Change Banner'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            className="hidden"
                            disabled={uploadingBanner}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    {editing ? (
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md">
                        <ImageIcon className="h-5 w-5" />
                        {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                          disabled={uploadingBanner}
                        />
                      </label>
                    ) : (
                      <ImageIcon className="h-16 w-16 text-white/50" />
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Description</h2>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={6}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{clubDetail.description}</p>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => setActiveTab('members')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'members'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Members
                        </button>
                        <button
                          onClick={() => setActiveTab('events')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'events'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Events
                        </button>
                        <button
                          onClick={() => setActiveTab('programs')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'programs'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Programs
                        </button>
                        <button
                          onClick={() => setActiveTab('resources')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'resources'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Resources
                        </button>
                        <button
                          onClick={() => setActiveTab('analytics')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'analytics'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Analytics
                        </button>
                        <button
                          onClick={() => setActiveTab('managers')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'managers'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Managers
                        </button>
                        <button
                          onClick={() => setActiveTab('settings')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === 'settings'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Settings
                        </button>
                      </>
                    )}
                  </nav>
                </div>
              </div>

              {/* Tab Content: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Members</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {clubDetail._count.members}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      {canManage && (
                        <Link
                          href={`/clubs/${clubId}?tab=members`}
                          onClick={() => setActiveTab('members')}
                          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline inline-block"
                        >
                          View all →
                        </Link>
                      )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Events</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {clubDetail._count.events}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                          <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                      {canManage && (
                        <Link
                          href={`/clubs/${clubId}?tab=events`}
                          onClick={() => setActiveTab('events')}
                          className="mt-3 text-sm text-purple-600 dark:text-purple-400 hover:underline inline-block"
                        >
                          View all →
                        </Link>
                      )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Programs</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {programs.length}
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                          <BookOpen className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                      {canManage && (
                        <Link
                          href={`/clubs/${clubId}?tab=programs`}
                          onClick={() => setActiveTab('programs')}
                          className="mt-3 text-sm text-green-600 dark:text-green-400 hover:underline inline-block"
                        >
                          View all →
                        </Link>
                      )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Resources</p>
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {resources.length}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                          <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                      {canManage && (
                        <Link
                          href={`/clubs/${clubId}?tab=resources`}
                          onClick={() => setActiveTab('resources')}
                          className="mt-3 text-sm text-orange-600 dark:text-orange-400 hover:underline inline-block"
                        >
                          View all →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Club Information Card */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Club Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <p className="text-base text-gray-900 dark:text-white font-medium">{clubDetail.category}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Visibility</label>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          clubDetail.isPublic
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {clubDetail.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          clubDetail.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {clubDetail.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created</label>
                        <p className="text-base text-gray-900 dark:text-white">
                          {new Date(clubDetail.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Members */}
              {activeTab === 'members' && canManage && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          Club Members
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {members.length} {members.length === 1 ? 'member' : 'members'} total
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/clubs/${clubId}/members/invite`)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <UserPlus className="h-4 w-4" />
                        Invite Member
                      </button>
                    </div>

                    {members.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members yet</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Start building your club by inviting members
                        </p>
                        <button
                          onClick={() => router.push(`/clubs/${clubId}/members/invite`)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <UserPlus className="h-4 w-4" />
                          Invite First Member
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              {member.profileImage ? (
                                <img
                                  src={member.profileImage}
                                  alt={`${member.firstName} ${member.lastName}`}
                                  className="h-12 w-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {member.firstName?.[0] || ''}
                                  {member.lastName?.[0] || ''}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {member.firstName} {member.lastName}
                                </div>
                                {member.email && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {member.email}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                                  member.role === 'LEAD'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                    : member.role === 'CO_LEAD'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : member.role === 'ADMIN'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {member.role || 'MEMBER'}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedMember(member)
                                    setNewRole(member.role || 'MEMBER')
                                    setShowRoleModal(true)
                                  }}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                  title="Change Role"
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                                {member.role !== 'LEAD' && (
                                  <button
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Remove Member"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {member.joinedAt && (
                              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: Events */}
              {activeTab === 'events' && canManage && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Events ({events.length})
                    </h2>
                    <button
                      onClick={() => router.push(`/events/create?clubId=${clubId}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create Event
                    </button>
                  </div>
                  {loadingEvents ? (
                    <div className="text-center py-8">
                      <LoadingSpinner message="Loading events..." showProgress={true} size="sm" fullScreen={false} />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Create your first event for this club
                      </p>
                      <button
                        onClick={() => router.push(`/events/create?clubId=${clubId}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <Plus className="h-4 w-4" />
                        Create First Event
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((event: any) => (
                        <div
                          key={event.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/events/${event.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {event.title}
                              </h3>
                              {event.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(event.startDate).toLocaleDateString()}
                                </span>
                                {event.location && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {event.location}
                                  </span>
                                )}
                                {event._count?.attendees !== undefined && (
                                  <span>
                                    {event._count.attendees} {event._count.attendees === 1 ? 'attendee' : 'attendees'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  event.status === 'UPCOMING'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                    : event.status === 'ONGOING'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : event.status === 'COMPLETED'
                                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {event.status}
                              </span>
                              {event.isPaid && event.price && (
                                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                  {event.currency || 'KES'} {event.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Programs */}
              {activeTab === 'programs' && canManage && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Programs ({programs.length})
                    </h2>
                    <button
                      onClick={() => router.push(`/clubs/${clubId}/programs/create`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Create Program
                    </button>
                  </div>
                  {loadingPrograms ? (
                    <div className="text-center py-8">
                      <LoadingSpinner message="Loading programs..." showProgress={true} size="sm" fullScreen={false} />
                    </div>
                  ) : programs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No programs yet</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {programs.map((program: any) => (
                        <div
                          key={program.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/clubs/${clubId}/programs/${program.id}`)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {program.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                program.status === 'ACTIVE' || program.status === 'ONGOING'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : program.status === 'UPCOMING'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {program.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {program.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>{program._count?.participants || 0} participants</span>
                            {program.isPaid && (
                              <span className="font-semibold text-green-600 dark:text-green-400">
                                {program.currency || 'KES'} {program.price}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Resources */}
              {activeTab === 'resources' && canManage && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Resources ({resources.length})
                    </h2>
                    <button
                      onClick={() => router.push(`/clubs/${clubId}/resources/create`)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Resource
                    </button>
                  </div>
                  {loadingResources ? (
                    <div className="text-center py-8">
                      <LoadingSpinner message="Loading resources..." showProgress={true} size="sm" fullScreen={false} />
                    </div>
                  ) : resources.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No resources yet</div>
                  ) : (
                    <div className="space-y-3">
                      {resources
                        .sort((a: any, b: any) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                        .map((resource: any) => (
                          <div
                            key={resource.id}
                            className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                              resource.isPinned
                                ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {resource.title}
                                  </h3>
                                  {resource.isPinned && (
                                    <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                                      Pinned
                                    </span>
                                  )}
                                </div>
                                {resource.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {resource.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="capitalize">{resource.type?.toLowerCase()}</span>
                                  {resource.category && <span>{resource.category}</span>}
                                  <span>{resource.viewCount || 0} views</span>
                                  {resource.downloadCount > 0 && (
                                    <span>{resource.downloadCount} downloads</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    View
                                  </a>
                                )}
                                {resource.fileUrl && (
                                  <a
                                    href={resource.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Download
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Analytics */}
              {activeTab === 'analytics' && canManage && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Club Analytics</h2>
                  {loadingAnalytics ? (
                    <div className="text-center py-8">
                      <LoadingSpinner message="Loading analytics..." showProgress={true} size="sm" fullScreen={false} />
                    </div>
                  ) : analytics ? (
                    <div className="space-y-6">
                      {/* Overview Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {analytics.overview?.memberCount || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {analytics.overview?.eventCount || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {analytics.overview?.programCount || 0}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Programs</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                            {analytics.overview?.engagementScore?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Engagement</p>
                        </div>
                      </div>

                      {/* Growth Metrics */}
                      {analytics.growth && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Growth Metrics</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {analytics.growth.newMembersLast30Days || 0}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">New Members (30 days)</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {analytics.growth.memberGrowthRate?.toFixed(1) || '0.0'}%
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Engagement Breakdown */}
                      {analytics.engagement && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Engagement Breakdown</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Posts</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {analytics.engagement.breakdown?.posts || 0} pts
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Events</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {analytics.engagement.breakdown?.events || 0} pts
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Members</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {analytics.engagement.breakdown?.members || 0} pts
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Programs</span>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {analytics.engagement.breakdown?.programs || 0} pts
                              </span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 flex justify-between">
                              <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400">
                                {analytics.engagement.totalEngagementPoints || 0} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recent Activity */}
                      {analytics.recentActivity && analytics.recentActivity.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Recent Activity</h3>
                          <div className="space-y-2">
                            {analytics.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                              <div key={index} className="flex items-start gap-3 text-sm">
                                <div className="flex-1">
                                  <p className="text-gray-900 dark:text-white line-clamp-2">
                                    {activity.content}
                                  </p>
                                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                                    {new Date(activity.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No analytics data available</div>
                  )}
                </div>
              )}

            </div>
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Club Logo */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Club Logo</h2>
                <div className="flex flex-col items-center">
                  {clubDetail.logo || clubDetail.image ? (
                    <div className="relative">
                      <img
                        src={clubDetail.logo || clubDetail.image}
                        alt={clubDetail.name}
                        className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                      {editing && (
                        <label className="absolute bottom-0 right-0 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg">
                          <Upload className="h-4 w-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      {editing ? (
                        <label className="cursor-pointer text-white text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                          <span className="text-xs block">Upload Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                        </label>
                      ) : (
                        <ImageIcon className="h-12 w-12 text-white/50" />
                      )}
                    </div>
                  )}
                  {uploadingLogo && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                  )}
                </div>
              </div>

              {/* Status Management */}
              <PermissionGuard permission={Permission.APPROVE_CLUBS}>
                {clubDetail.status && (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Status Management</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Status</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{clubDetail.status}</p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          clubDetail.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : clubDetail.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : clubDetail.status === 'PILOT'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            : clubDetail.status === 'FROZEN'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {clubDetail.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {clubDetail.status === 'PENDING' && (
                        <>
                          <button
                            onClick={async () => {
                              const confirmed = await showConfirm(
                                'Approve Club',
                                'Approve this club application?',
                                'Yes, approve',
                                'Cancel'
                              )
                              if (confirmed) {
                                try {
                                  await api.post(`/clubs/${clubId}/approve`, { probationDays: 60 })
                                  showSuccess('Club Approved', 'The club has been approved successfully')
                                  fetchClubDetail()
                                } catch (error: any) {
                                  showError('Failed to Approve', error.response?.data?.message || 'An error occurred while approving the club')
                                }
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              const confirmed = await showConfirm(
                                'Reject Club',
                                'Are you sure you want to reject this club?',
                                'Yes, reject',
                                'Cancel',
                                '#dc2626',
                                true
                              )
                              if (!confirmed) return
                              
                              const reasonInput = window.prompt('Enter rejection reason:')
                              if (reasonInput) {
                                try {
                                  await api.post(`/clubs/${clubId}/reject`, { reason: reasonInput })
                                  showSuccess('Club Rejected', 'The club has been rejected')
                                  fetchClubDetail()
                                } catch (error: any) {
                                  showError('Failed to Reject', error.response?.data?.message || 'An error occurred while rejecting the club')
                                }
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </>
                      )}
                      {clubDetail.status === 'PILOT' && (
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirm(
                              'Activate Club',
                              'Activate this pilot club to active status?',
                              'Yes, activate',
                              'Cancel'
                            )
                            if (confirmed) {
                              try {
                                await api.post(`/clubs/${clubId}/activate`)
                                showSuccess('Club Activated', 'The club has been activated successfully')
                                fetchClubDetail()
                              } catch (error: any) {
                                showError('Failed to Activate', error.response?.data?.message || 'An error occurred while activating the club')
                              }
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm col-span-2"
                        >
                          <Play className="h-4 w-4" />
                          Activate to Active
                        </button>
                      )}
                      {clubDetail.status !== 'FROZEN' && clubDetail.status !== 'ARCHIVED' && (
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirm(
                              'Freeze Club',
                              'Freeze this club? It will temporarily stop accepting new members.',
                              'Yes, freeze',
                              'Cancel',
                              '#dc2626',
                              true
                            )
                            if (confirmed) {
                              try {
                                await api.post(`/clubs/${clubId}/freeze`)
                                showSuccess('Club Frozen', 'The club has been frozen successfully')
                                fetchClubDetail()
                              } catch (error: any) {
                                showError('Failed to Freeze', error.response?.data?.message || 'An error occurred while freezing the club')
                              }
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          <Snowflake className="h-4 w-4" />
                          Freeze
                        </button>
                      )}
                      {clubDetail.status !== 'ARCHIVED' && (
                        <button
                          onClick={async () => {
                            const reasonInput = window.prompt('Enter archive reason (optional):')
                            const confirmed = await showConfirm(
                              'Archive Club',
                              'Archive this club? This action can be reversed later.',
                              'Yes, archive',
                              'Cancel',
                              '#dc2626',
                              true
                            )
                            if (confirmed) {
                              try {
                                await api.post(`/clubs/${clubId}/archive`, { reason: reasonInput || undefined })
                                showSuccess('Club Archived', 'The club has been archived successfully')
                                fetchClubDetail()
                              } catch (error: any) {
                                showError('Failed to Archive', error.response?.data?.message || 'An error occurred while archiving the club')
                              }
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </PermissionGuard>

              {/* Settings */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    {editing ? (
                      <select
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="TECH">Tech</option>
                        <option value="BUSINESS">Business</option>
                        <option value="CREATIVE">Creative</option>
                        <option value="HEALTH">Health</option>
                        <option value="EDUCATION">Education</option>
                        <option value="LEADERSHIP">Leadership</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">{clubDetail.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
                    {editing ? (
                      <select
                        value={formData.isPublic ? 'PUBLIC' : 'PRIVATE'}
                        onChange={(e) =>
                          setFormData({ ...formData, isPublic: e.target.value === 'PUBLIC' })
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="PUBLIC">Public</option>
                        <option value="PRIVATE">Private</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          clubDetail.isPublic
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {clubDetail.isPublic ? 'Public' : 'Private'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    {editing ? (
                      <select
                        value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })
                        }
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          clubDetail.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {clubDetail.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Managers */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Managers</h2>
                  <button
                    onClick={() => setShowAssignManager(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    <UserPlus className="h-4 w-4" />
                    Assign
                  </button>
                </div>
                {managers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No managers assigned</p>
                ) : (
                  <div className="space-y-3">
                    {managers.map((manager) => (
                      <div
                        key={manager.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {manager.user.profileImage ? (
                            <img
                              src={manager.user.profileImage}
                              alt={`${manager.user.firstName} ${manager.user.lastName}`}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                              {manager.user.firstName[0]}
                              {manager.user.lastName[0]}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {manager.user.firstName} {manager.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{manager.user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveManager(manager.userId)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Club Info */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Club Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Created</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(clubDetail.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(clubDetail.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assign Manager Modal */}
          {showAssignManager && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Assign Club Manager</h3>
                
                {/* Info Alert */}
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Managers can manage multiple clubs. If the selected user is already managing other clubs, they will be assigned to this club as well.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select User
                  </label>
                  <select
                    value={assignUserId}
                    onChange={(e) => {
                      setAssignUserId(e.target.value)
                      checkUserManagedClub(e.target.value)
                    }}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={checkingUser}
                  >
                    <option value="">Select a club member...</option>
                    {clubMembers
                      .filter(
                        (m) => !managers.some((mg) => mg.userId === m.id) && m.role !== 'ADMIN',
                      )
                      .map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.firstName} {member.lastName} ({member.email || 'No email'})
                          {member.role ? ` - ${member.role}` : ''}
                        </option>
                      ))}
                  </select>
                  {checkingUser && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Checking user's current assignments...
                    </p>
                  )}
                  {selectedUserManagedClub && !checkingUser && (
                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Info:</strong> This user is currently managing <strong>"{selectedUserManagedClub}"</strong>. 
                        They can manage multiple clubs, so they can be assigned to this club as well.
                      </p>
                    </div>
                  )}
                  {clubMembers.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      No club members available. Users must join the club first.
                    </p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAssignManager(false)
                      setAssignUserId('')
                      setSelectedUserManagedClub(null)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignManager}
                    disabled={!assignUserId || checkingUser}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Update Role Modal */}
          {showRoleModal && selectedMember && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Update Member Role
                </h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Update role for <strong className="text-gray-900 dark:text-white">
                      {selectedMember.firstName} {selectedMember.lastName}
                    </strong>
                  </p>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="CO_LEAD">Co-Lead</option>
                    {selectedMember.role === 'LEAD' && (
                      <option value="LEAD">Lead (Cannot change)</option>
                    )}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowRoleModal(false)
                      setSelectedMember(null)
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMemberRole}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                  >
                    Update Role
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

