'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { FileText, Plus, Edit, Trash2, Star, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'

interface Content {
  id: string
  title: string
  type: 'resource' | 'opportunity' | 'featured'
  status: 'draft' | 'published'
  createdAt: string
}

export default function ContentPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && hasPermission(Permission.CREATE_CONTENT)) {
      fetchContent()
    }
  }, [user])

  const fetchContent = async () => {
    try {
      setLoading(true)
      // Placeholder - would call actual endpoint
      setContent([])
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!hasPermission(Permission.CREATE_CONTENT)) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900">Access Denied</h2>
            <p className="text-red-700">You don't have permission to manage content.</p>
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
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8" />
                <div>
                  <h1 className="text-3xl font-bold mb-2">Content Management</h1>
                  <p className="text-orange-100">
                    Create, manage, and feature content across the platform
                  </p>
                </div>
              </div>
              <PermissionGuard permission={Permission.CREATE_CONTENT}>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                  <Plus className="h-4 w-4" />
                  Create Content
                </button>
              </PermissionGuard>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/events/new"
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <Calendar className="h-8 w-8 text-blue-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Schedule Event</h3>
              <p className="text-sm text-gray-600">Create and schedule new events</p>
            </Link>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
              <BookOpen className="h-8 w-8 text-green-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Create Resource</h3>
              <p className="text-sm text-gray-600">Add learning resources</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
              <Star className="h-8 w-8 text-yellow-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Feature Content</h3>
              <p className="text-sm text-gray-600">Feature content on homepage</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer">
              <FileText className="h-8 w-8 text-purple-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Publish Opportunity</h3>
              <p className="text-sm text-gray-600">Publish new opportunities</p>
            </div>
          </div>

          {/* Content List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">All Content</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading content...</div>
            ) : content.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No content yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Start creating content to engage your community
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {content.map((item) => (
                  <div
                    key={item.id}
                    className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {item.type}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <PermissionGuard permission={Permission.FEATURE_CONTENT}>
                        <button className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors">
                          <Star className="h-4 w-4" />
                        </button>
                      </PermissionGuard>
                      <button className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
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

