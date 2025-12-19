'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Search, CheckCircle, XCircle, Eye, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface MentorProfile {
  id: string
  userId: string
  company?: string
  yearsOfExperience?: number
  linkedIn?: string
  mentorshipThemes: string[]
  mentorshipStyle: string[]
  weeklyAvailability?: number
  maxMentees: number
  preferredType: string
  bio?: string
  isVerified: boolean
  isActive: boolean
  currentMentees: number
  totalMentees: number
  rating?: number
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    skills?: string[]
    occupation?: string
    location?: string
    education?: string
  }
}

export default function MentorsPage() {
  const { user } = useAuth()
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (user) {
      fetchMentors()
    }
  }, [user])

  const fetchMentors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/mentorship/mentors')
      setMentors(response.data)
    } catch (error) {
      console.error('Error fetching mentors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (mentorId: string, verify: boolean) => {
    try {
      await api.put(`/admin/mentors/${mentorId}/verify`, { isVerified: verify })
      fetchMentors()
    } catch (error) {
      console.error('Error updating verification:', error)
      alert('Failed to update verification status')
    }
  }

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      !search ||
      `${mentor.user.firstName} ${mentor.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      mentor.user.email.toLowerCase().includes(search.toLowerCase()) ||
      mentor.company?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && mentor.isVerified) ||
      (statusFilter === 'pending' && !mentor.isVerified) ||
      (statusFilter === 'active' && mentor.isActive) ||
      (statusFilter === 'inactive' && !mentor.isActive)

    return matchesSearch && matchesStatus
  })

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mentors</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage mentor profiles and applications
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending Verification</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentees
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMentors.map((mentor) => (
                    <tr key={mentor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {mentor.user.profileImage ? (
                              <img
                                src={mentor.user.profileImage}
                                alt=""
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <UserCheck className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {mentor.user.firstName} {mentor.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{mentor.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mentor.company || mentor.user.occupation || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mentor.yearsOfExperience ? `${mentor.yearsOfExperience} years` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mentor.currentMentees} / {mentor.maxMentees}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mentor.rating ? mentor.rating.toFixed(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              mentor.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {mentor.isVerified ? 'Verified' : 'Pending'}
                          </span>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              mentor.isActive
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {mentor.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/mentorships/mentors/${mentor.userId}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {!mentor.isVerified && (
                            <button
                              onClick={() => handleVerify(mentor.userId, true)}
                              className="text-green-600 hover:text-green-900"
                              title="Verify"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {mentor.isVerified && (
                            <button
                              onClick={() => handleVerify(mentor.userId, false)}
                              className="text-red-600 hover:text-red-900"
                              title="Unverify"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMentors.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No mentors found</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

