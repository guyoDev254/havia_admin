'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { BookOpen, ArrowLeft, ExternalLink, FileText, Calendar, Tag } from 'lucide-react'
import Link from 'next/link'

interface Resource {
  id: string
  title: string
  description: string
  type: string
  subject?: string
  level?: string
  url?: string
  fileUrl?: string
  tags: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ResourceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && params.id) {
      fetchResource()
    }
  }, [user, params.id])

  const fetchResource = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/admin/resources/${params.id}`)
      setResource(response.data)
    } catch (error: any) {
      console.error('Error fetching resource:', error)
      setError(error.response?.data?.message || 'Failed to load resource')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Loading resource...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (error || !resource) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">
                {error || 'Resource not found'}
              </p>
              <Link
                href="/students/resources"
                className="mt-4 inline-block text-blue-600 hover:text-blue-800 dark:text-blue-400"
              >
                ← Back to Resources
              </Link>
            </div>
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
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/students/resources"
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-8 w-8" />
                    {resource.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Resource Details</p>
                </div>
              </div>
              <Link
                href={`/students/resources/${resource.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Resource
              </Link>
            </div>

            {/* Resource Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Title
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">{resource.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Type
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {resource.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Subject
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {resource.subject || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Level
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {resource.level ? resource.level.replace(/_/g, ' ') : 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                      {resource.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Links and Files */}
              {(resource.url || resource.fileUrl) && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Access
                  </h2>
                  <div className="space-y-3">
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ExternalLink className="h-5 w-5" />
                        <span>External URL</span>
                      </a>
                    )}
                    {resource.fileUrl && (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FileText className="h-5 w-5" />
                        <span>Download File</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Metadata
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </label>
                    <p className="mt-1">
                      {resource.isActive ? (
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          Inactive
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Created At
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Last Updated
                    </label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {new Date(resource.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

