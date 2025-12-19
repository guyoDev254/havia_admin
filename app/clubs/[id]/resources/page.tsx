'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, Plus } from 'lucide-react'

export default function ClubResourcesPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [loading, setLoading] = useState(true)
  const [resources, setResources] = useState<any[]>([])

  useEffect(() => {
    if (clubId) fetchResources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/clubs/${clubId}/resources`)
      setResources(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      console.error('Failed to load resources', e)
      setResources([])
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Club Resources</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage shared documents, links, and media
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/clubs/${clubId}/resources/create`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Resource
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            {loading ? (
              <div className="p-6 text-gray-500 dark:text-gray-400">Loading resources...</div>
            ) : resources.length === 0 ? (
              <div className="p-6 text-gray-500 dark:text-gray-400">No resources yet.</div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {resources
                  .slice()
                  .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => router.push(`/clubs/${clubId}/resources/${r.id}`)}
                      className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {r.title}
                            </div>
                            {r.isPinned && (
                              <span className="text-xs px-2 py-1 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                                Pinned
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                              {r.description}
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/40">{r.type}</span>
                            {r.category && (
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/40">{r.category}</span>
                            )}
                            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/40">
                              {r.viewCount || 0} views
                            </span>
                            <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900/40">
                              {r.downloadCount || 0} downloads
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                r.isPublic
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                              }`}
                            >
                              {r.isPublic ? 'Public' : 'Restricted'}
                            </span>
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


