'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Shield, Users, Calendar, BookOpen, FileText, BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ManagedClub {
  id: string
  userId: string
  clubId: string
  role: string
  assignedAt: string
  club: {
    id: string
    name: string
    category: string
    logo?: string
    banner?: string
    description?: string
    _count?: {
      members: number
      events: number
    }
  }
}

export default function ManagedClubsPage() {
  const { user } = useAuth()
  const [managedClubs, setManagedClubs] = useState<ManagedClub[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchManagedClubs()
    }
  }, [user])

  const fetchManagedClubs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/clubs/me/managed')
      setManagedClubs(response.data || [])
    } catch (error) {
      console.error('Error fetching managed clubs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading your managed clubs..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Managed Clubs</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage and access all clubs you're responsible for
              </p>
            </div>
          </div>

          {managedClubs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-12 text-center">
              <div className="inline-flex p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Shield className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No clubs assigned yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask a Super Admin or Platform Admin to assign you as a club manager.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managedClubs.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {m.club.logo ? (
                          <img
                            src={m.club.logo}
                            alt={m.club.name}
                            className="h-12 w-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {m.club.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {m.club.name}
                          </h3>
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md">
                            {m.club.category}
                          </span>
                        </div>
                      </div>
                      {m.club.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {m.club.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Members</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {m.club._count?.members || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-purple-500" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">Events</span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {m.club._count?.events || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={`/clubs/${m.club.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Manage Club
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/clubs/${m.club.id}?tab=analytics`}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

