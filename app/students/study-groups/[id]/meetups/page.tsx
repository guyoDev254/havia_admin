'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/hooks/usePermissions'
import { ArrowLeft, Trash2, Calendar, Users, MapPin, Video, X } from 'lucide-react'
import Link from 'next/link'
import { useSweetAlert } from '@/hooks/useSweetAlert'

interface Meetup {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  isOnline: boolean
  onlineLink?: string
  maxAttendees?: number
  isCancelled: boolean
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
  _count: {
    attendees: number
  }
}

export default function StudyGroupMeetupsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [includePast, setIncludePast] = useState(false)

  useEffect(() => {
    if (user && params.id) {
      fetchMeetups()
    }
  }, [user, params.id, includePast])

  const fetchMeetups = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/students/study-groups/${params.id}/meetups`, {
        params: { includePast },
      })
      setMeetups(response.data || [])
    } catch (error) {
      console.error('Error fetching meetups:', error)
      showError('Failed to load meetups')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (meetupId: string) => {
    const confirmed = await showConfirm(
      'Cancel Meetup',
      'Are you sure you want to cancel this meetup?',
      'Yes, cancel it',
      'Keep it',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.post(`/admin/study-groups/meetups/${meetupId}/cancel`)
      showSuccess('Meetup cancelled successfully')
      fetchMeetups()
    } catch (error: any) {
      showError('Failed to cancel meetup', error.response?.data?.message)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Loading meetups...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_ANALYTICS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/students/study-groups/${params.id}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="h-8 w-8" />
                    Study Group Meetups
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Manage scheduled meetups</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIncludePast(false)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    !includePast
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setIncludePast(true)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    includePast
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Past
                </button>
              </div>
            </div>

            {meetups.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {includePast ? 'No past meetups' : 'No upcoming meetups'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetups.map((meetup) => {
                  const isPast = new Date(meetup.startDate) < new Date()
                  const isFull = meetup.maxAttendees && meetup._count.attendees >= meetup.maxAttendees

                  return (
                    <div
                      key={meetup.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${
                        meetup.isCancelled ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{meetup.title}</h3>
                            {meetup.isCancelled && (
                              <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                Cancelled
                              </span>
                            )}
                            {isPast && !meetup.isCancelled && (
                              <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                                Past
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Created by {meetup.createdBy.firstName} {meetup.createdBy.lastName}
                          </div>
                        </div>
                        <PermissionGuard permission={Permission.MANAGE_CLUBS}>
                          {!meetup.isCancelled && !isPast && (
                            <button
                              onClick={() => handleCancel(meetup.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Cancel meetup"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </PermissionGuard>
                      </div>

                      {meetup.description && (
                        <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                          {meetup.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(meetup.startDate).toLocaleString()}
                            {meetup.endDate && ` - ${new Date(meetup.endDate).toLocaleString()}`}
                          </span>
                        </div>
                        {meetup.location && !meetup.isOnline && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span>{meetup.location}</span>
                          </div>
                        )}
                        {meetup.isOnline && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Video className="h-4 w-4" />
                            <span>
                              Online
                              {meetup.onlineLink && (
                                <a
                                  href={meetup.onlineLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:underline"
                                >
                                  {meetup.onlineLink}
                                </a>
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>
                            {meetup._count.attendees}
                            {meetup.maxAttendees ? ` / ${meetup.maxAttendees}` : ''} attending
                            {isFull && ' (Full)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

