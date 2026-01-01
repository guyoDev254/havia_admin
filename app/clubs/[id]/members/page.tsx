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
  Users,
  Search,
  Mail,
  Download,
  UserPlus,
  UserMinus,
  Shield,
  Award,
  Calendar,
  MessageSquare,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Member {
  id: string
  userId: string
  role: string
  joinedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    isActive: boolean
  }
  engagement?: {
    eventsAttended: number
    postsCreated: number
    lastActiveAt?: string
    engagementScore: number
  }
}

export default function ClubMembersPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const clubId = params.id as string

  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [engagementFilter, setEngagementFilter] = useState<string>('all')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  useEffect(() => {
    if (user && clubId) {
      fetchMembers()
    }
  }, [user, clubId])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/clubs/${clubId}/members`)
      setMembers(response.data.members || [])
    } catch (error: any) {
      console.error('Error fetching members:', error)
      showError('Failed to Load Members', error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    const confirmed = await showConfirm(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this club?`,
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
      showError('Failed to Remove Member', error.response?.data?.message || 'An error occurred')
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await api.put(`/clubs/${clubId}/members/${memberId}/role`, { role: newRole })
      showSuccess('Role Updated', 'Member role has been updated successfully')
      fetchMembers()
    } catch (error: any) {
      showError('Failed to Update Role', error.response?.data?.message || 'An error occurred')
    }
  }

  const handleBulkMessage = async () => {
    if (selectedMembers.size === 0) {
      showError('No Selection', 'Please select members to message')
      return
    }

    const message = window.prompt('Enter message to send to selected members:')
    if (!message) return

    try {
      await api.post(`/clubs/${clubId}/members/bulk-message`, {
        memberIds: Array.from(selectedMembers),
        message,
      })
      showSuccess('Messages Sent', `Messages sent to ${selectedMembers.size} members`)
      setSelectedMembers(new Set())
      setShowBulkActions(false)
    } catch (error: any) {
      showError('Failed to Send Messages', error.response?.data?.message || 'An error occurred')
    }
  }

  const handleExportMembers = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}/members/export`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `club-members-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      showSuccess('Export Complete', 'Member data has been exported successfully')
    } catch (error: any) {
      showError('Export Failed', error.response?.data?.message || 'An error occurred')
    }
  }

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      member.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      member.user.email.toLowerCase().includes(search.toLowerCase())

    const matchesRole = roleFilter === 'all' || member.role === roleFilter

    const matchesEngagement =
      engagementFilter === 'all' ||
      (engagementFilter === 'active' && member.engagement?.engagementScore && member.engagement.engagementScore > 50) ||
      (engagementFilter === 'inactive' && (!member.engagement?.engagementScore || member.engagement.engagementScore <= 50)) ||
      (engagementFilter === 'new' && new Date(member.joinedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

    return matchesSearch && matchesRole && matchesEngagement
  })

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading members..." showProgress={true} fullScreen={false} />
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Members</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{members.length} total members</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportMembers}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="LEAD">Leads</option>
                <option value="CO_LEAD">Co-Leads</option>
                <option value="MEMBER">Members</option>
              </select>
              <select
                value={engagementFilter}
                onChange={(e) => setEngagementFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Members</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="new">New (30 days)</option>
              </select>
              {selectedMembers.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedMembers.size} selected
                  </span>
                  <button
                    onClick={() => {
                      setSelectedMembers(new Set())
                      setShowBulkActions(false)
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {selectedMembers.size > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleBulkMessage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Mail className="h-4 w-4" />
                  Message Selected
                </button>
              </div>
            )}
          </div>

          {/* Members List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedMembers.size === filteredMembers.length && filteredMembers.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers(new Set(filteredMembers.map((m) => m.id)))
                          } else {
                            setSelectedMembers(new Set())
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedMembers.has(member.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedMembers)
                            if (e.target.checked) {
                              newSelected.add(member.id)
                            } else {
                              newSelected.delete(member.id)
                            }
                            setSelectedMembers(newSelected)
                            setShowBulkActions(newSelected.size > 0)
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.user.profileImage ? (
                            <img
                              src={member.user.profileImage}
                              alt={`${member.user.firstName} ${member.user.lastName}`}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {member.user.firstName[0]}{member.user.lastName[0]}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {member.user.firstName} {member.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="MEMBER">Member</option>
                          <option value="CO_LEAD">Co-Lead</option>
                          <option value="LEAD">Lead</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {member.engagement ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Score: {member.engagement.engagementScore}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {member.engagement.eventsAttended} events • {member.engagement.postsCreated} posts
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No data</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/users/${member.user.id}`}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            title="View Profile"
                          >
                            <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </Link>
                          <button
                            onClick={() =>
                              handleRemoveMember(member.id, `${member.user.firstName} ${member.user.lastName}`)
                            }
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Remove Member"
                          >
                            <UserMinus className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredMembers.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No members found</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

