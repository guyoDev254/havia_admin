'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Trophy, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'

export default function EditScholarshipPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    provider: '',
    amount: '',
    eligibility: [] as string[],
    requirements: [] as string[],
    deadline: '',
    applicationUrl: '',
    category: '',
    level: 'UNIVERSITY',
    isActive: true,
    visibility: 'both' as 'web' | 'both',
  })
  const [newEligibility, setNewEligibility] = useState('')
  const [newRequirement, setNewRequirement] = useState('')

  useEffect(() => {
    if (!id || !user) return
    const fetchScholarship = async () => {
      try {
        const res = await api.get(`/admin/scholarships/${id}`)
        const s = res.data
        setFormData({
          title: s.title ?? '',
          description: s.description ?? '',
          provider: s.provider ?? '',
          amount: s.amount ?? '',
          eligibility: Array.isArray(s.eligibility) ? s.eligibility : [],
          requirements: Array.isArray(s.requirements) ? s.requirements : [],
          deadline: s.deadline ? new Date(s.deadline).toISOString().slice(0, 10) : '',
          applicationUrl: s.applicationUrl ?? '',
          category: s.category ?? '',
          level: s.level ?? 'UNIVERSITY',
          isActive: s.isActive ?? true,
          visibility: (s.visibility === 'web' ? 'web' : 'both') as 'web' | 'both',
        })
      } catch (e) {
        console.error(e)
        alert('Failed to load scholarship')
        router.push('/students/scholarships')
      } finally {
        setFetching(false)
      }
    }
    fetchScholarship()
  }, [id, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description || !formData.provider || !formData.deadline) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      await api.put(`/admin/scholarships/${id}`, {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
        eligibility: formData.eligibility,
        requirements: formData.requirements,
        visibility: formData.visibility,
      })
      router.push('/students/scholarships')
    } catch (error: any) {
      console.error('Error updating scholarship:', error)
      alert(error.response?.data?.message || 'Failed to update scholarship')
    } finally {
      setLoading(false)
    }
  }

  const addEligibility = () => {
    if (newEligibility.trim()) {
      setFormData({
        ...formData,
        eligibility: [...formData.eligibility, newEligibility.trim()],
      })
      setNewEligibility('')
    }
  }

  const removeEligibility = (index: number) => {
    setFormData({
      ...formData,
      eligibility: formData.eligibility.filter((_, i) => i !== index),
    })
  }

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()],
      })
      setNewRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    })
  }

  if (fetching) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">Loading...</div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/students/scholarships"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="h-8 w-8" />
                Edit Scholarship
              </h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provider *</label>
              <input
                type="text"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                <input
                  type="text"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g., KES 50,000"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deadline *</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="SECONDARY">Secondary</option>
                  <option value="TVET">TVET</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="OUT_OF_SCHOOL">Out of school</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Academic, Sports"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application URL</label>
              <input
                type="url"
                value={formData.applicationUrl}
                onChange={(e) => setFormData({ ...formData, applicationUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eligibility Criteria</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newEligibility}
                  onChange={(e) => setNewEligibility(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEligibility())}
                  placeholder="Add eligibility criteria"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button type="button" onClick={addEligibility} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.eligibility.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm flex items-center gap-2">
                    {item}
                    <button type="button" onClick={() => removeEligibility(index)} className="hover:text-blue-600">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Requirements</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                  placeholder="Add requirement"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button type="button" onClick={addRequirement} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm flex items-center gap-2">
                    {item}
                    <button type="button" onClick={() => removeRequirement(index)} className="hover:text-green-600">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Show on</label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'web' | 'both' })}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="web">Web only (NBC website)</option>
                <option value="both">Web & Mobile (website + app)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Choose where this scholarship is visible.</p>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save changes'}
              </button>
              <Link href="/students/scholarships" className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
