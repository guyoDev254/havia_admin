'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Edit2, Save, X, Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'

interface EventDetail {
  id: string
  title: string
  description: string
  image?: string
  type: string
  status: string
  startDate: string
  endDate?: string
  location?: string
  isOnline: boolean
  onlineLink?: string
  maxAttendees?: number
  organizer: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  club?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
  _count: {
    attendees: number
  }
}

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const eventId = params.id as string

  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'WORKSHOP',
    status: 'UPCOMING',
    startDate: '',
    endDate: '',
    location: '',
    isOnline: false,
    onlineLink: '',
    maxAttendees: 0,
  })

  useEffect(() => {
    if (user && eventId) {
      fetchEventDetail()
    }
  }, [user, eventId])

  const fetchEventDetail = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/events/${eventId}`)
      setEventDetail(response.data)
      setFormData({
        title: response.data.title || '',
        description: response.data.description || '',
        type: response.data.type || 'WORKSHOP',
        status: response.data.status || 'UPCOMING',
        startDate: response.data.startDate
          ? new Date(response.data.startDate).toISOString().slice(0, 16)
          : '',
        endDate: response.data.endDate
          ? new Date(response.data.endDate).toISOString().slice(0, 16)
          : '',
        location: response.data.location || '',
        isOnline: response.data.isOnline ?? false,
        onlineLink: response.data.onlineLink || '',
        maxAttendees: response.data.maxAttendees || 0,
      })
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.put(`/admin/events/${eventId}`, {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      })
      setEditing(false)
      fetchEventDetail()
    } catch (error) {
      console.error('Error updating event:', error)
      alert('Failed to update event')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!eventDetail) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Event not found</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{eventDetail.title}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{eventDetail.type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      fetchEventDetail()
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Image */}
              {eventDetail.image && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                  <img
                    src={eventDetail.image}
                    alt={eventDetail.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

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
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{eventDetail.description}</p>
                )}
              </div>

              {/* Event Details */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Event Details</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Date & Time
                      </label>
                      {editing ? (
                        <input
                          type="datetime-local"
                          value={formData.startDate}
                          onChange={(e) =>
                            setFormData({ ...formData, startDate: e.target.value })
                          }
                          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white">
                          {format(new Date(eventDetail.startDate), 'EEEE, MMMM dd, yyyy • h:mm a')}
                        </p>
                      )}
                    </div>
                  </div>

                  {eventDetail.endDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          End Date & Time
                        </label>
                        {editing ? (
                          <input
                            type="datetime-local"
                            value={formData.endDate}
                            onChange={(e) =>
                              setFormData({ ...formData, endDate: e.target.value })
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">
                            {format(new Date(eventDetail.endDate), 'EEEE, MMMM dd, yyyy • h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!eventDetail.isOnline && eventDetail.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location
                        </label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({ ...formData, location: e.target.value })
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white">{eventDetail.location}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {eventDetail.isOnline && eventDetail.onlineLink && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Online Link
                        </label>
                        {editing ? (
                          <input
                            type="url"
                            value={formData.onlineLink}
                            onChange={(e) =>
                              setFormData({ ...formData, onlineLink: e.target.value })
                            }
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <a
                            href={eventDetail.onlineLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            {eventDetail.onlineLink}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Attendees
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {eventDetail._count.attendees}
                        {eventDetail.maxAttendees
                          ? ` / ${eventDetail.maxAttendees}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Settings */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                    {editing ? (
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="WORKSHOP">Workshop</option>
                        <option value="MEETUP">Meetup</option>
                        <option value="CONFERENCE">Conference</option>
                        <option value="WEBINAR">Webinar</option>
                        <option value="CHALLENGE">Challenge</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 dark:text-white">{eventDetail.type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    {editing ? (
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          eventDetail.status === 'UPCOMING'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                            : eventDetail.status === 'ONGOING'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : eventDetail.status === 'COMPLETED'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {eventDetail.status}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                    {editing ? (
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isOnline}
                            onChange={(e) =>
                              setFormData({ ...formData, isOnline: e.target.checked })
                            }
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-900 dark:text-white">Online</span>
                        </label>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          eventDetail.isOnline
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {eventDetail.isOnline ? 'Online' : 'In-Person'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Organizer Info */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Organizer</h2>
                <div className="space-y-2">
                  <p className="text-gray-900 dark:text-white">
                    {eventDetail.organizer.firstName} {eventDetail.organizer.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{eventDetail.organizer.email}</p>
                </div>
              </div>

              {/* Club Info */}
              {eventDetail.club && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Club</h2>
                  <p className="text-gray-900 dark:text-white">{eventDetail.club.name}</p>
                </div>
              )}

              {/* Event Info */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Event Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Created</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(eventDetail.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                    <span className="text-gray-900 dark:text-white">
                      {new Date(eventDetail.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

