'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, Trash2, ExternalLink, Download } from 'lucide-react'

export default function ClubResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string
  const resourceId = params.resourceId as string

  const [loading, setLoading] = useState(true)
  const [resource, setResource] = useState<any>(null)

  useEffect(() => {
    if (clubId && resourceId) fetchResource()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, resourceId])

  const fetchResource = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/clubs/${clubId}/resources/${resourceId}`)
      setResource(res.data)
    } catch (e) {
      console.error('Failed to load resource', e)
      setResource(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this resource?')) return
    try {
      await api.delete(`/clubs/${clubId}/resources/${resourceId}`)
      alert('Resource deleted')
      router.push(`/clubs/${clubId}/resources`)
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6 text-gray-500 dark:text-gray-400">Loading...</div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!resource) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <button onClick={() => router.back()} className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back
            </button>
            <div className="mt-4 text-gray-500 dark:text-gray-400">Resource not found.</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{resource.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {resource.type} {resource.isPinned ? '• Pinned' : ''} {resource.isPublic ? '• Public' : '• Restricted'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-4 border border-gray-100 dark:border-gray-700">
            {resource.description && (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{resource.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Views</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{resource.viewCount || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Downloads</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{resource.downloadCount || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Category</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{resource.category || '—'}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Tags</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {(resource.tags || []).slice(0, 3).join(', ') || '—'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open link
                </a>
              )}
              {resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Download file
                </a>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


