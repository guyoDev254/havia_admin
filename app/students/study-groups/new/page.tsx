'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/hooks/usePermissions'
import { Users2, ArrowLeft, Save, Search, User } from 'lucide-react'
import Link from 'next/link'

interface UserOption {
  id: string
  firstName: string
  lastName: string
  email: string
}

export default function NewStudyGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    level: 'UNIVERSITY' as 'SECONDARY' | 'TVET' | 'UNIVERSITY' | 'OUT_OF_SCHOOL',
    maxMembers: '10',
    isActive: true,
    createdBy: '', // Will be set to a user ID if admin wants to create on behalf of someone
  })

  useEffect(() => {
    if (!userSearch || userSearch.length < 2) {
      setUserOptions([])
      return
    }

    const debounce = setTimeout(async () => {
      try {
        const response = await api.get('/admin/users', {
          params: {
            search: userSearch,
            limit: 10,
            page: 1,
          },
        })
        setUserOptions(
          response.data.users.map((u: any) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
          })),
        )
      } catch (error) {
        console.error('Error searching users:', error)
      }
    }, 300)

    return () => clearTimeout(debounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSearch])

  const handleSelectUser = (selected: UserOption) => {
    setSelectedUser(selected)
    setFormData({ ...formData, createdBy: selected.id })
    setUserSearch(`${selected.firstName} ${selected.lastName} (${selected.email})`)
    setShowUserDropdown(false)
    setUserOptions([])
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Group name is required')
      return
    }
    if (!formData.description.trim()) {
      alert('Description is required')
      return
    }
    if (!formData.subject.trim()) {
      alert('Subject is required')
      return
    }
    if (!formData.createdBy.trim()) {
      alert('Please select a user to be the group creator/leader')
      return
    }

    try {
      setSaving(true)
      // Admin creates study group via admin endpoint
      const payload = {
        ...formData,
        maxMembers: parseInt(formData.maxMembers) || 10,
        createdBy: formData.createdBy,
      }
      const response = await api.post('/admin/study-groups', payload)
      alert('Study group created successfully')
      router.push(`/students/study-groups/${response.data.id}`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create study group')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.MANAGE_CLUBS}>
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
                    Create New Study Group
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new study group</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Creating...' : 'Create Study Group'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Advanced Mathematics Study Group"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Mathematics, Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Education Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="SECONDARY">Secondary</option>
                    <option value="TVET">TVET</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="OUT_OF_SCHOOL">Out of School</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Members
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Creator/Leader *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value)
                        setShowUserDropdown(true)
                        if (!e.target.value) {
                          setSelectedUser(null)
                          setFormData({ ...formData, createdBy: '' })
                        }
                      }}
                      onFocus={() => setShowUserDropdown(userOptions.length > 0)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Search for user by name or email..."
                    />
                    {showUserDropdown && userOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {userOptions.map((userOption) => (
                          <button
                            key={userOption.id}
                            type="button"
                            onClick={() => handleSelectUser(userOption)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                          >
                            <User className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {userOption.firstName} {userOption.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{userOption.email}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedUser && (
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Selected: {selectedUser.firstName} {selectedUser.lastName} will be the group leader
                    </p>
                  )}
                  {!selectedUser && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Search and select a user who will become the group leader
                    </p>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Description</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={14}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe the study group's purpose and goals..."
                  />
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

