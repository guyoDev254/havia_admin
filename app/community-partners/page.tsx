'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Users, Search, Filter, Plus, CheckCircle, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react'
import Link from 'next/link'

interface Partner {
  id: string
  name: string
  description?: string
  focusArea: string
  location?: string
  status: string
  memberCount: number
  eventCount: number
  programCount: number
  engagementScore: number
  owner: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

export default function CommunityPartnersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      })
      const response = await api.get(`/community-partners?${params}`)
      setPartners(response.data.partners)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching partners:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPartners()
    }
  }, [user, page, search, statusFilter])

  const getStatusBadge = (status: string) => {
    const badges = {
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      REJECTED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    }
    return badges[status as keyof typeof badges] || badges.PENDING
  }

  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED') return <CheckCircle className="h-4 w-4" />
    if (status === 'SUSPENDED') return <XCircle className="h-4 w-4" />
    if (status === 'PENDING') return <Clock className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.APPROVE_CLUBS}>
        <Layout>
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <Users className="h-8 w-8" />
                    Community Partners
                  </h1>
                  <p className="text-blue-100">
                    Manage approved community organizations operating within NorthernBox
                  </p>
                </div>
                <Link
                  href="/community-partners/applications"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                >
                  View Applications
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Search partners..."
                    className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {partners.length} partners
                  </span>
                </div>
              </div>
            </div>

            {/* Partners Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading partners...</p>
              </div>
            ) : partners.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No partners found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {search || statusFilter
                    ? 'Try adjusting your filters'
                    : 'No community partners have been created yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map((partner) => (
                  <div
                    key={partner.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                          {partner.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {partner.focusArea}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusBadge(
                          partner.status,
                        )}`}
                      >
                        {getStatusIcon(partner.status)}
                        {partner.status}
                      </span>
                    </div>

                    {partner.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {partner.description}
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {partner.memberCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {partner.eventCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Events</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {partner.programCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Programs</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Owner: {partner.owner.firstName} {partner.owner.lastName}
                      </div>
                      <Link
                        href={`/community-partners/${partner.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Page <span className="text-blue-600 dark:text-blue-400">{page}</span> of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white dark:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

