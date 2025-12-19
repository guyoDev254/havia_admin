'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Edit2, Save, X, Award } from 'lucide-react'

interface BadgeDetail {
  id: string
  name: string
  description?: string
  icon?: string
  image?: string
  type: string
  points: number
  createdAt: string
  updatedAt: string
  _count: {
    userBadges: number
  }
}

export default function BadgeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const badgeId = params.id as string

  const [badgeDetail, setBadgeDetail] = useState<BadgeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ACHIEVEMENT',
    points: 0,
  })

  useEffect(() => {
    if (user && badgeId) {
      fetchBadgeDetail()
    }
  }, [user, badgeId])

  const fetchBadgeDetail = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/badges/${badgeId}`)
      setBadgeDetail(response.data)
      setFormData({
        name: response.data.name || '',
        description: response.data.description || '',
        type: response.data.type || 'ACHIEVEMENT',
        points: response.data.points || 0,
      })
    } catch (error) {
      console.error('Error fetching badge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.put(`/admin/badges/${badgeId}`, formData)
      setEditing(false)
      fetchBadgeDetail()
    } catch (error) {
      console.error('Error updating badge:', error)
      alert('Failed to update badge')
    }
  }

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

  if (!badgeDetail) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <p className="text-gray-500">Badge not found</p>
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
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{badgeDetail.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">{badgeDetail.type}</p>
                </div>
              </div>
            </div>
            {user?.role === 'ADMIN' && (
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
                        fetchBadgeDetail()
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Badge Image */}
              {badgeDetail.image && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <img
                    src={badgeDetail.image}
                    alt={badgeDetail.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={6}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {badgeDetail.description || 'No description'}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {badgeDetail._count.userBadges}
                    </p>
                    <p className="text-sm text-gray-500">Users Earned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary-600">{badgeDetail.points}</p>
                    <p className="text-sm text-gray-500">Points Value</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Settings */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900">{badgeDetail.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    {editing ? (
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="ACHIEVEMENT">Achievement</option>
                        <option value="PARTICIPATION">Participation</option>
                        <option value="LEARNING">Learning</option>
                        <option value="MENTORSHIP">Mentorship</option>
                        <option value="LEADERSHIP">Leadership</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{badgeDetail.type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                    {editing ? (
                      <input
                        type="number"
                        value={formData.points}
                        onChange={(e) =>
                          setFormData({ ...formData, points: parseInt(e.target.value) || 0 })
                        }
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    ) : (
                      <p className="text-gray-900">{badgeDetail.points}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Badge Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Badge Information</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created</span>
                    <span className="text-gray-900">
                      {new Date(badgeDetail.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated</span>
                    <span className="text-gray-900">
                      {new Date(badgeDetail.updatedAt).toLocaleDateString()}
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

