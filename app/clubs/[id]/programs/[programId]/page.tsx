'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, Users, Trash2 } from 'lucide-react'

export default function ClubProgramDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string
  const programId = params.programId as string

  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState<any>(null)

  useEffect(() => {
    if (clubId && programId) fetchProgram()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId, programId])

  const fetchProgram = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/clubs/${clubId}/programs/${programId}`)
      setProgram(res.data)
    } catch (e) {
      console.error('Failed to load program', e)
      setProgram(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this program?')) return
    try {
      await api.delete(`/clubs/${clubId}/programs/${programId}`)
      alert('Program deleted')
      router.push(`/clubs/${clubId}/programs`)
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

  if (!program) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <button onClick={() => router.back()} className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back
            </button>
            <div className="mt-4 text-gray-500 dark:text-gray-400">Program not found.</div>
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{program.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {program.type} • {program.status}
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
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{program.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Participants</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-5 w-5" /> {program._count?.participants ?? 0}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Paid</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {program.isPaid ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Price</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {program.isPaid ? `${program.currency || 'KES'} ${program.price || 0}` : '—'}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                <div className="text-sm text-gray-500 dark:text-gray-400">Max</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{program.maxParticipants || 0}</div>
              </div>
            </div>

            {program.objectives?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Objectives</h3>
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-1">
                  {program.objectives.map((o: string, idx: number) => (
                    <li key={idx}>{o}</li>
                  ))}
                </ul>
              </div>
            )}

            {program.participants?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recent Participants</h3>
                <div className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                  {program.participants.map((p: any) => (
                    <div key={p.id} className="p-4 flex items-center justify-between">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {p.user?.firstName} {p.user?.lastName}
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.status}</div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{p.progress}%</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  (Showing up to 20 participants from API)
                </p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


