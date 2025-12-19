'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Trash2, Search, Users, Building2 } from 'lucide-react'
import Link from 'next/link'

interface ClubManager {
  id: string
  userId: string
  clubId: string
  assignedAt: string
  isActive: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    role: string
  }
  club: {
    id: string
    name: string
  }
}

export default function ClubManagersPage() {
  const { user } = useAuth()
  const [managers, setManagers] = useState<ClubManager[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClub, setSelectedClub] = useState<string>('')
  const [clubs, setClubs] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchManagers()
      fetchClubs()
    }
  }, [user, selectedClub])

  const fetchClubs = async () => {
    try {
      const response = await api.get('/clubs')
      setClubs(response.data)
    } catch (error) {
      console.error('Error fetching clubs:', error)
    }
  }

  const fetchManagers = async () => {
    try {
      setLoading(true)
      let url = '/admin/club-managers'
      if (selectedClub) {
        url = `/clubs/${selectedClub}/managers`
      }
      const response = await api.get(url)
      setManagers(response.data)
    } catch (error) {
      console.error('Error fetching managers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveManager = async (clubId: string, userId: string) => {
    if (!confirm('Are you sure you want to remove this manager?')) return

    try {
      await api.delete(`/clubs/${clubId}/managers/${userId}`)
      fetchManagers()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove manager')
    }
  }

  const filteredManagers = managers.filter((manager) => {
    const matchesSearch =
      manager.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      manager.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      manager.user.email.toLowerCase().includes(search.toLowerCase()) ||
      manager.club.name.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Managers</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage club managers across all clubs
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or club..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Clubs</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No managers found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {search || selectedClub
                  ? 'Try adjusting your search or filter'
                  : 'No club managers have been assigned yet'}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Club
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assigned At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredManagers.map((manager) => (
                      <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {manager.user.profileImage ? (
                              <img
                                src={manager.user.profileImage}
                                alt={`${manager.user.firstName} ${manager.user.lastName}`}
                                className="h-10 w-10 rounded-full mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium mr-3">
                                {manager.user.firstName[0]}
                                {manager.user.lastName[0]}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {manager.user.firstName} {manager.user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {manager.user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/clubs/${manager.club.id}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                          >
                            <Building2 className="w-4 h-4 mr-1" />
                            {manager.club.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(manager.assignedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              manager.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {manager.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveManager(manager.clubId, manager.userId)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

