'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Search, Eye, User } from 'lucide-react'
import Link from 'next/link'

interface MenteeProfile {
  id: string
  userId: string
  age?: number
  fieldOfInterest?: string
  experienceLevel?: string
  careerGoals?: string
  challenges?: string
  learningPreference: string[]
  availability?: {
    days: string[]
    timeBlocks: string[]
  }
  commitmentAgreed: boolean
  isActive: boolean
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    skills?: string[]
    interests?: string[]
  }
}

export default function MenteesPage() {
  const { user } = useAuth()
  const [mentees, setMentees] = useState<MenteeProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')

  useEffect(() => {
    if (user) {
      fetchMentees()
    }
  }, [user])

  const fetchMentees = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/mentees')
      setMentees(response.data)
    } catch (error) {
      console.error('Error fetching mentees:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMentees = mentees.filter((mentee) => {
    const matchesSearch =
      !search ||
      `${mentee.user.firstName} ${mentee.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      mentee.user.email.toLowerCase().includes(search.toLowerCase()) ||
      mentee.fieldOfInterest?.toLowerCase().includes(search.toLowerCase())

    const matchesLevel =
      levelFilter === 'all' || mentee.experienceLevel === levelFilter

    return matchesSearch && matchesLevel
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
            <h1 className="text-3xl font-bold text-gray-900">Mentees</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage mentee profiles and applications
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or field of interest..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Field of Interest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Learning Preference
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
                  {filteredMentees.map((mentee) => (
                    <tr key={mentee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {mentee.user.profileImage ? (
                              <img
                                src={mentee.user.profileImage}
                                alt=""
                                className="h-10 w-10 rounded-full"
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {mentee.user.firstName} {mentee.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{mentee.user.email}</div>
                            {mentee.age && (
                              <div className="text-xs text-gray-400">Age: {mentee.age}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mentee.fieldOfInterest || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            mentee.experienceLevel === 'Beginner'
                              ? 'bg-blue-100 text-blue-800'
                              : mentee.experienceLevel === 'Intermediate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {mentee.experienceLevel || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {mentee.learningPreference?.join(', ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            mentee.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {mentee.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {mentee.commitmentAgreed && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Committed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={`/mentorships/mentees/${mentee.userId}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMentees.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No mentees found</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

