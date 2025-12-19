'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { HeartHandshake, Plus, Building2, TrendingUp, Users, Award } from 'lucide-react'

interface Partner {
  id: string
  name: string
  type: string
  status: 'active' | 'inactive' | 'pending'
  programsCount?: number
  engagement?: number
  totalEngagement?: number
  createdAt: string
  description?: string
  logo?: string
  website?: string
  contactEmail?: string
  contactPhone?: string
}

export default function PartnershipsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && hasPermission(Permission.MANAGE_PARTNERSHIPS)) {
      fetchPartners()
    }
  }, [user])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const response = await api.get('/partnerships', {
        params: {
          limit: 100,
        },
      })
      setPartners(response.data.partners || [])
    } catch (error) {
      console.error('Error fetching partners:', error)
      setPartners([])
    } finally {
      setLoading(false)
    }
  }

  if (!hasPermission(Permission.MANAGE_PARTNERSHIPS)) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="text-red-700">You don't have permission to manage partnerships.</p>
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
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <HeartHandshake className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold mb-2">Partnership Management</h1>
                  <p className="text-teal-100">
                    Manage partner relationships, programs, and engagement
                  </p>
                </div>
              </div>
              <PermissionGuard permission={Permission.CREATE_PARTNER_PROFILES}>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Partner
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="h-8 w-8 text-teal-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Active Partners</p>
              <p className="text-2xl font-bold text-gray-900">{partners.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-blue-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Partner Programs</p>
              <p className="text-2xl font-bold text-gray-900">
                {partners.reduce((sum, p) => sum + (p.programsCount ?? 0), 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-purple-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {partners.reduce((sum, p) => sum + (p.engagement ?? 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Avg. Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {partners.length > 0
                  ? Math.round(
                      partners.reduce((sum, p) => sum + (p.engagement ?? 0), 0) / partners.length,
                    )
                  : 0}
              </p>
            </div>
          </div>

          {/* Partners List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">All Partners</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading partners...</div>
            ) : partners.length === 0 ? (
              <div className="p-8 text-center">
                <HeartHandshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No partners yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start building partnerships to expand opportunities
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold">
                          {partner.type}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            partner.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {partner.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {partner.name}
                      </h3>
                      {partner.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {partner.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{partner.programsCount || 0} programs</span>
                        <span>•</span>
                        <span>{(partner.engagement || partner.totalEngagement || 0).toLocaleString()} engagement</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <PermissionGuard permission={Permission.VIEW_PARTNER_ENGAGEMENT}>
                        <button className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                          View Details
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

