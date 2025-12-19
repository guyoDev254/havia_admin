'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Save, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react'

export default function NewClubPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'TECH',
    isPublic: true,
    logo: '',
  })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await api.post('/upload/club-logo', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const uploadedLogoUrl = response.data.url
      setLogoUrl(uploadedLogoUrl)
      setFormData(prevFormData => ({
        ...prevFormData,
        logo: uploadedLogoUrl,
      }))
      alert('Logo uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      alert(error.response?.data?.message || 'Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/clubs', formData)
      router.push('/clubs')
    } catch (error) {
      console.error('Error creating club:', error)
      alert('Failed to create club')
    } finally {
      setLoading(false)
    }
  }

  if (!hasPermission(Permission.MANAGE_CLUBS) && !hasPermission(Permission.APPROVE_CLUBS)) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex items-center gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-900 dark:text-red-400">Access Denied</h2>
                <p className="text-red-700 dark:text-red-300">You don't have permission to create clubs.</p>
              </div>
            </div>
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
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Club</h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
            {/* Club Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Club Logo
              </label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Club logo"
                      className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                    <label className="absolute bottom-0 right-0 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg">
                      <Upload className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col items-center justify-center text-white hover:from-blue-600 hover:to-purple-700 transition-colors">
                      {uploadingLogo ? (
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                          <span className="text-xs">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <span className="text-xs text-center">Upload Logo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </div>
                  </label>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Upload a square logo for your club. This will be displayed on club cards and in the club directory.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Club Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="TECH">Tech</option>
                <option value="BUSINESS">Business</option>
                <option value="CREATIVE">Creative</option>
                <option value="HEALTH">Health</option>
                <option value="EDUCATION">Education</option>
                <option value="LEADERSHIP">Leadership</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Public Club</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

