'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, Plus } from 'lucide-react'

export default function ClubProgramsPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [loading, setLoading] = useState(true)
  const [programs, setPrograms] = useState<any[]>([])

  useEffect(() => {
    if (clubId) fetchPrograms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/clubs/${clubId}/programs`)
      setPrograms(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Failed to load programs', e)
      setPrograms([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Club Programs</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create and manage long-term programs for this club
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/clubs/${clubId}/programs/create`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create Program
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            {loading ? (
              <div className="p-6 text-gray-500 dark:text-gray-400">Loading programs...</div>
            ) : programs.length === 0 ? (
              <div className="p-6 text-gray-500 dark:text-gray-400">No programs yet.</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {programs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/clubs/${clubId}/programs/${p.id}`)}
                    className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {p.title}
                        </div>
                        {p.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {p.description}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/40">
                            {p.type}
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/40">
                            {p.status}
                          </span>
                          <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/40">
                            {(p._count?.participants ?? p.participantCount ?? 0) + ' participants'}
                          </span>
                          {p.isPaid && (
                            <span className="px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              {p.currency || 'KES'} {p.price}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-blue-600 dark:text-blue-400">Open →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


