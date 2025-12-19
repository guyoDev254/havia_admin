'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, Save } from 'lucide-react'

const RESOURCE_TYPES = ['DOCUMENT', 'LINK', 'VIDEO', 'IMAGE', 'OTHER']
const ROLE_OPTIONS = ['LEAD', 'CO_LEAD', 'ADMIN', 'MODERATOR', 'MEMBER']

export default function CreateClubResourcePage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LINK',
    url: '',
    fileUrl: '',
    category: '',
    tags: '',
    isPinned: false,
    isPublic: false,
    accessibleToRoles: [] as string[],
  })

  const toggleRole = (role: string) => {
    setFormData((p) => ({
      ...p,
      accessibleToRoles: p.accessibleToRoles.includes(role)
        ? p.accessibleToRoles.filter((r) => r !== role)
        : [...p.accessibleToRoles, role],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return alert('Title is required')
    if (!formData.url.trim() && !formData.fileUrl.trim()) return alert('Provide either URL or File URL')

    try {
      setLoading(true)
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        url: formData.url.trim() || undefined,
        fileUrl: formData.fileUrl.trim() || undefined,
        category: formData.category.trim() || undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        isPinned: formData.isPinned,
        isPublic: formData.isPublic,
        accessibleToRoles: formData.isPublic ? [] : formData.accessibleToRoles,
      }
      await api.post(`/clubs/${clubId}/resources`, payload)
      alert('Resource added')
      router.push(`/clubs/${clubId}/resources`)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || err.message || 'Failed to add resource')
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Resource</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">For club: {clubId}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <input
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
                <input
                  value={formData.url}
                  onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File URL</label>
                <input
                  value={formData.fileUrl}
                  onChange={(e) => setFormData((p) => ({ ...p, fileUrl: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (comma-separated)</label>
              <input
                value={formData.tags}
                onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pinned</label>
              <input
                type="checkbox"
                checked={formData.isPinned}
                onChange={(e) => setFormData((p) => ({ ...p, isPinned: e.target.checked }))}
                className="h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Public (all members)</label>
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => setFormData((p) => ({ ...p, isPublic: e.target.checked, accessibleToRoles: [] }))}
                className="h-4 w-4"
              />
            </div>

            {!formData.isPublic && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accessible roles (empty = all members)
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleRole(r)}
                      className={`px-3 py-1.5 rounded-lg text-sm border ${
                        formData.accessibleToRoles.includes(r)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Add Resource'}
            </button>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


