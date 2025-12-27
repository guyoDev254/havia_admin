'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/hooks/usePermissions'
import { Users2, ArrowLeft, Edit, Trash2, UserX, Mail, School, Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

interface StudyGroup {
  id: string
  name: string
  description: string
  subject: string
  level: string
  maxMembers: number
  isActive: boolean
  createdAt: string
  createdBy: string
  _count: {
    members: number
  }
  members: Array<{
    id: string
    role: string
    joinedAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      profileImage?: string
      educationLevel?: string
      schoolName?: string
    }
  }>
}

export default function StudyGroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [group, setGroup] = useState<StudyGroup | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && params.id) {
      fetchGroup()
    }
  }, [user, params.id])

  const fetchGroup = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/study-groups/${params.id}`)
      setGroup(response.data)
    } catch (error) {
      console.error('Error fetching study group:', error)
      alert('Failed to load study group')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${group?.name}"? This action cannot be undone.`)) return

    try {
      await api.delete(`/admin/study-groups/${params.id}`)
      alert('Study group deleted successfully')
      router.push('/students/study-groups')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete study group')
    }
  }

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from this study group?`)) return

    try {
      await api.post(`/admin/study-groups/${params.id}/members/${userId}/remove`)
      alert('Member removed successfully')
      fetchGroup()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove member')
    }
  }

  const handleToggleStatus = async () => {
    try {
      await api.put(`/admin/study-groups/${params.id}`, {
        isActive: !group?.isActive,
      })
      fetchGroup()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Loading study group...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!group) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Study group not found</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  const leader = group.members.find((m) => m.role === 'LEADER')
  const regularMembers = group.members.filter((m) => m.role !== 'LEADER')

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/students/study-groups"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users2 className="h-8 w-8" />
                    {group.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Study Group Details</p>
                </div>
              </div>
              <div className="flex gap-2">
                <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                  <Link
                    href={`/students/study-groups/${params.id}/edit`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </PermissionGuard>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Group Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Group Information</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Name</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Subject</div>
                      <div className="text-gray-900 dark:text-white">{group.subject}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</div>
                      <div className="text-gray-900 dark:text-white">{group.description}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Education Level</div>
                        <div className="text-gray-900 dark:text-white">{group.level.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Max Members</div>
                        <div className="text-gray-900 dark:text-white">{group.maxMembers}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
                        <span
                          className={`px-3 py-1 text-sm rounded ${
                            group.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {group.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                        <button
                          onClick={handleToggleStatus}
                          className={`px-4 py-2 text-sm rounded transition-colors ${
                            group.isActive
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {group.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </PermissionGuard>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Created</div>
                      <div className="text-gray-900 dark:text-white flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(group.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Members ({group._count.members}/{group.maxMembers})
                    </h2>
                  </div>

                  {leader && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Leader</div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {leader.user.profileImage ? (
                              <img
                                src={leader.user.profileImage}
                                alt={`${leader.user.firstName} ${leader.user.lastName}`}
                                className="h-12 w-12 rounded-full"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {leader.user.firstName[0]}{leader.user.lastName[0]}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {leader.user.firstName} {leader.user.lastName}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {leader.user.email}
                              </div>
                              {leader.user.schoolName && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                  <School className="h-3 w-3" />
                                  {leader.user.schoolName}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="px-2 py-1 text-xs rounded bg-blue-600 text-white">Leader</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {regularMembers.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Members</div>
                      <div className="space-y-3">
                        {regularMembers.map((member) => (
                          <div
                            key={member.id}
                            className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {member.user.profileImage ? (
                                  <img
                                    src={member.user.profileImage}
                                    alt={`${member.user.firstName} ${member.user.lastName}`}
                                    className="h-10 w-10 rounded-full"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                                    {member.user.firstName[0]}{member.user.lastName[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {member.user.firstName} {member.user.lastName}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {member.user.email}
                                  </div>
                                  {member.user.schoolName && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                      {member.user.schoolName}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                                <button
                                  onClick={() =>
                                    handleRemoveMember(
                                      member.user.id,
                                      `${member.user.firstName} ${member.user.lastName}`,
                                    )
                                  }
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                  title="Remove member"
                                >
                                  <UserX className="h-4 w-4" />
                                </button>
                              </PermissionGuard>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.members.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No members yet</div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Members</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {group._count.members}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Capacity</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {((group._count.members / group.maxMembers) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/students/study-groups/${params.id}/posts`}
                      className="block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                    >
                      View Posts
                    </Link>
                    <Link
                      href={`/students/study-groups/${params.id}/meetups`}
                      className="block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center"
                    >
                      View Meetups
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

