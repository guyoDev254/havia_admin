'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, Save } from 'lucide-react'

const PROGRAM_TYPES = ['TRAINING', 'WORKSHOP_SERIES', 'CHALLENGE', 'MENTORSHIP_COHORT', 'ACCELERATOR', 'INCUBATOR', 'OTHER']
const PROGRAM_STATUSES = ['DRAFT', 'UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED', 'PAUSED']

export default function CreateClubProgramPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'TRAINING',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    isPaid: false,
    price: '',
    currency: 'KES',
    paymentLink: '',
    objectives: '',
    curriculum: '',
    requirements: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return alert('Title is required')
    if (!formData.description.trim()) return alert('Description is required')
    if (formData.isPaid && (!formData.price || Number(formData.price) <= 0)) return alert('Price must be > 0')

    try {
      setLoading(true)
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
        isPaid: formData.isPaid,
        price: formData.isPaid ? Number(formData.price) : undefined,
        currency: formData.isPaid ? formData.currency : undefined,
        paymentLink: formData.isPaid ? formData.paymentLink : undefined,
        objectives: formData.objectives
          ? formData.objectives.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined,
        curriculum: formData.curriculum.trim() || undefined,
        requirements: formData.requirements.trim() || undefined,
      }

      await api.post(`/clubs/${clubId}/programs`, payload)
      alert('Program created')
      router.push(`/clubs/${clubId}/programs`)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || err.message || 'Failed to create program')
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Program</h1>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                rows={4}
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
                  {PROGRAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {PROGRAM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max participants (0 = unlimited)</label>
              <input
                type="number"
                min={0}
                value={formData.maxParticipants}
                onChange={(e) => setFormData((p) => ({ ...p, maxParticipants: e.target.value }))}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Paid program</label>
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData((p) => ({ ...p, isPaid: e.target.checked }))}
                className="h-4 w-4"
              />
            </div>

            {formData.isPaid && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
                  <input
                    value={formData.currency}
                    onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment link</label>
                  <input
                    value={formData.paymentLink}
                    onChange={(e) => setFormData((p) => ({ ...p, paymentLink: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Objectives (one per line)</label>
              <textarea
                value={formData.objectives}
                onChange={(e) => setFormData((p) => ({ ...p, objectives: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Curriculum</label>
              <textarea
                value={formData.curriculum}
                onChange={(e) => setFormData((p) => ({ ...p, curriculum: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements</label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData((p) => ({ ...p, requirements: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Program'}
            </button>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


