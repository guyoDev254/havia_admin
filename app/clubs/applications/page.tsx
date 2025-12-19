'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { CheckCircle, XCircle, Clock, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

interface ClubApplication {
  id: string
  name: string
  description: string
  category: string
  logo?: string
  banner?: string
  status: string
  createdAt: string
  createdBy: string
  creator: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  problemStatement?: string
  targetAudience?: string
  plannedActivities?: string
  _count: {
    members: number
    events: number
  }
}

export default function ClubApplicationsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [applications, setApplications] = useState<ClubApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<ClubApplication | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [probationDays, setProbationDays] = useState(60)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (user) {
      fetchApplications()
    }
  }, [user])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/clubs?status=PENDING')
      setApplications(response.data.clubs || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (clubId: string) => {
    try {
      await api.post(`/clubs/${clubId}/approve`, { probationDays })
      alert('Club approved successfully')
      fetchApplications()
      setShowDetails(false)
      setSelectedApp(null)
    } catch (error: any) {
      console.error('Error approving club:', error)
      alert(error.response?.data?.message || 'Failed to approve club')
    }
  }

  const handleReject = async (clubId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      await api.post(`/clubs/${clubId}/reject`, { reason: rejectReason })
      alert('Club rejected')
      fetchApplications()
      setShowDetails(false)
      setSelectedApp(null)
      setRejectReason('')
    } catch (error: any) {
      console.error('Error rejecting club:', error)
      alert(error.response?.data?.message || 'Failed to reject club')
    }
  }

  const openDetails = (app: ClubApplication) => {
    setSelectedApp(app)
    setShowDetails(true)
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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/clubs"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Club Applications</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review and approve pending club applications
              </p>
            </div>
          </div>

          <PermissionGuard permission={Permission.APPROVE_CLUBS}>
            {applications.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No pending applications</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {app.logo ? (
                            <img
                              src={app.logo}
                              alt={app.name}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                              {app.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {app.name}
                              </h3>
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                                PENDING
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                              {app.description}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>Category: {app.category}</span>
                              <span>•</span>
                              <span>Created: {new Date(app.createdAt).toLocaleDateString()}</span>
                              {app.creator && (
                                <>
                                  <span>•</span>
                                  <span>
                                    By: {app.creator.firstName} {app.creator.lastName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetails(app)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PermissionGuard>

          {/* Details Modal */}
          {showDetails && selectedApp && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedApp.name}
                    </h2>
                    <button
                      onClick={() => {
                        setShowDetails(false)
                        setSelectedApp(null)
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XCircle className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {selectedApp.banner && (
                    <img
                      src={selectedApp.banner}
                      alt={selectedApp.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </h3>
                    <p className="text-gray-900 dark:text-white">{selectedApp.description}</p>
                  </div>

                  {selectedApp.problemStatement && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Problem Statement
                      </h3>
                      <p className="text-gray-900 dark:text-white">{selectedApp.problemStatement}</p>
                    </div>
                  )}

                  {selectedApp.targetAudience && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Audience
                      </h3>
                      <p className="text-gray-900 dark:text-white">{selectedApp.targetAudience}</p>
                    </div>
                  )}

                  {selectedApp.plannedActivities && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Planned Activities (First 30 Days)
                      </h3>
                      <p className="text-gray-900 dark:text-white">{selectedApp.plannedActivities}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category
                      </h3>
                      <p className="text-gray-900 dark:text-white">{selectedApp.category}</p>
                    </div>
                    {selectedApp.creator && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Created By
                        </h3>
                        <p className="text-gray-900 dark:text-white">
                          {selectedApp.creator.firstName} {selectedApp.creator.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {selectedApp.creator.email}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Probation Period (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={probationDays}
                        onChange={(e) => setProbationDays(parseInt(e.target.value) || 60)}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Provide a reason for rejection..."
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(selectedApp.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedApp.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        <XCircle className="h-5 w-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

