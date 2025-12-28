'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { ArrowLeft, UserPlus, Mail, User, Phone, Shield } from 'lucide-react'

const ALL_ROLES = [
  'MEMBER',
  'STUDENT',
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

const STUDENT_TYPES = ['HIGH_SCHOOL', 'UNIVERSITY', 'GRADUATE']

export default function CreateUserPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const { showError, showSuccess } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'MEMBER',
    studentType: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      }

      if (formData.phone) {
        payload.phone = formData.phone
      }

      if (formData.role === 'STUDENT' && formData.studentType) {
        payload.studentType = formData.studentType
      }

      await api.post('/admin/users', payload)
      await showSuccess('User Created', 'User created successfully! Password and verification email have been sent.')
      router.push('/users')
    } catch (error: any) {
      console.error('Error creating user:', error)
      showError('Failed to Create User', error.response?.data?.message || 'An error occurred while creating the user')
    } finally {
      setLoading(false)
    }
  }

  // Filter roles based on admin permissions
  const availableRoles = isSuperAdmin()
    ? ALL_ROLES
    : ALL_ROLES.filter((role) => ['MEMBER', 'STUDENT'].includes(role))

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_USERS}>
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New User</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  A password will be auto-generated and sent to the user's email
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="user@example.com"
                  />
                </div>

                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="h-4 w-4 inline mr-2" />
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="h-4 w-4 inline mr-2" />
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="+254712345678"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Shield className="h-4 w-4 inline mr-2" />
                    Role *
                    {!isSuperAdmin() && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        (Only MEMBER and STUDENT available)
                      </span>
                    )}
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        role: e.target.value,
                        studentType: e.target.value === 'STUDENT' ? formData.studentType : '',
                      })
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Type (if role is STUDENT) */}
                {formData.role === 'STUDENT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Student Type *
                    </label>
                    <select
                      required
                      value={formData.studentType}
                      onChange={(e) => setFormData({ ...formData, studentType: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select student type</option>
                      {STUDENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> A secure password will be auto-generated and sent to the user's email address along with a verification link. The user will be required to verify their email and change their password on first login.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push('/users')}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

