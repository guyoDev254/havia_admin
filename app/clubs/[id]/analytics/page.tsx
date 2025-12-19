'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft } from 'lucide-react'

export default function ClubAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    if (clubId) fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/clubs/${clubId}/analytics`)
      setAnalytics(res.data)
    } catch (e) {
      console.error('Failed to load analytics', e)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Club Analytics</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">For club: {clubId}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-100 dark:border-gray-700">
            {loading ? (
              <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
            ) : !analytics ? (
              <div className="text-gray-500 dark:text-gray-400">No analytics data.</div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview?.memberCount || 0}</div>
                  </div>
                  <div className="rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview?.eventCount || 0}</div>
                  </div>
                  <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Programs</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overview?.programCount || 0}</div>
                  </div>
                  <div className="rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Engagement</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{(analytics.overview?.engagementScore ?? 0).toFixed(2)}</div>
                  </div>
                </div>

                {analytics.growth && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="font-semibold text-gray-900 dark:text-white mb-2">Growth (30 days)</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">New members</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{analytics.growth.newMembersLast30Days || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Growth rate</div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{(analytics.growth.memberGrowthRate ?? 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {analytics.engagement?.breakdown && (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="font-semibold text-gray-900 dark:text-white mb-2">Engagement breakdown</div>
                    <div className="space-y-1 text-sm">
                      {Object.entries(analytics.engagement.breakdown).map(([k, v]: any) => (
                        <div key={k} className="flex justify-between text-gray-700 dark:text-gray-300">
                          <span className="capitalize">{k}</span>
                          <span className="font-semibold">{v} pts</span>
                        </div>
                      ))}
                      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between text-gray-900 dark:text-white">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold">{analytics.engagement.totalEngagementPoints || 0} pts</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


