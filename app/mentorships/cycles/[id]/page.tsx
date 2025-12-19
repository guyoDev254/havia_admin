'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, Calendar, Users, Layers, AlertCircle, Clock, CheckCircle2, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function CycleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [cycle, setCycle] = useState<any>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ mentorId: '', menteeId: '' })
  const [assigning, setAssigning] = useState(false)
  const [availableMentors, setAvailableMentors] = useState<any[]>([])
  const [availableMentees, setAvailableMentees] = useState<any[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCycle()
      fetchAvailable()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchCycle = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/mentorship/cycles/${id}`)
      setCycle(res.data)
    } catch (e) {
      console.error('Failed to load cycle', e)
      setCycle(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailable = async () => {
    try {
      setLoadingAvailable(true)
      const res = await api.get(`/admin/mentorship/available?cycleId=${id}`)
      console.log('Available mentors/mentees response:', res.data)
      const mentors = res.data.mentors || []
      const mentees = res.data.mentees || []
      console.log('Mentors with interest:', mentors.filter((m: any) => m.hasExpressedInterest))
      console.log('Mentees with interest:', mentees.filter((m: any) => m.hasExpressedInterest))
      setAvailableMentors(mentors)
      setAvailableMentees(mentees)
    } catch (e) {
      console.error('Failed to load available mentors/mentees', e)
      setAvailableMentors([])
      setAvailableMentees([])
    } finally {
      setLoadingAvailable(false)
    }
  }

  const interestedMentors = useMemo(() => {
    const interests = cycle?.interests || []
    return interests.filter((i: any) => i.role === 'MENTOR' && i.status === 'INTERESTED')
  }, [cycle])

  const interestedMentees = useMemo(() => {
    const interests = cycle?.interests || []
    // Include uncategorized interests as mentees so admins can still proceed (they may still need onboarding)
    return interests.filter((i: any) => (i.role === 'MENTEE' || !i.role) && i.status === 'INTERESTED')
  }, [cycle])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignForm.mentorId || !assignForm.menteeId) return
    try {
      setAssigning(true)
      await api.post(`/admin/mentorship/cycles/${id}/assign`, assignForm)
      alert('Mentorship assigned and program started.')
      setShowAssignModal(false)
      setAssignForm({ mentorId: '', menteeId: '' })
      fetchCycle()
      fetchAvailable() // Refresh available list
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign mentorship')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentorship Cycle</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cycle details</p>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          ) : !cycle ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>Cycle not found.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Overview */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-transparent dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{cycle.name}</h2>
                      {cycle.description && (
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{cycle.description}</p>
                      )}
                      <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(cycle.startDate), 'MMM dd, yyyy')} – {format(new Date(cycle.endDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                      {cycle.status}
                    </span>
                  </div>

                  {(cycle.targetGroup || cycle.benefits || cycle.expectedOutcomes || cycle.requirements || cycle.conditions) && (
                    <div className="mt-6 grid grid-cols-1 gap-4">
                      {cycle.targetGroup && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Target group</div>
                          <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{cycle.targetGroup}</div>
                        </div>
                      )}
                      {cycle.benefits && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Benefits</div>
                          <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{cycle.benefits}</div>
                        </div>
                      )}
                      {cycle.expectedOutcomes && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Expected outcomes</div>
                          <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{cycle.expectedOutcomes}</div>
                        </div>
                      )}
                      {cycle.requirements && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Requirements</div>
                          <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{cycle.requirements}</div>
                        </div>
                      )}
                      {cycle.conditions && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Conditions</div>
                          <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{cycle.conditions}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Members / Mentorships */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">Members & Sessions</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {cycle.mentorships?.length ?? 0} mentorships
                    </div>
                  </div>
                  <div className="p-6">
                    {cycle.mentorships && cycle.mentorships.length > 0 ? (
                      <div className="space-y-3">
                        {cycle.mentorships.map((m: any) => (
                          <div key={m.id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {m.mentor?.firstName} {m.mentor?.lastName} → {m.mentee?.firstName} {m.mentee?.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {m.mentor?.email} • {m.mentee?.email}
                                </div>
                              </div>
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {m.status}
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Sessions: {m.sessionsCompleted ?? 0}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span>
                                  Next: {m.nextSessionDate ? format(new Date(m.nextSessionDate), 'MMM dd, yyyy • h:mm a') : '—'}
                                </span>
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">
                                Started: {m.startedAt ? format(new Date(m.startedAt), 'MMM dd, yyyy') : '—'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No mentorships in this cycle yet.</div>
                    )}
                  </div>
                </div>

                {/* Interested */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">Interested Users</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchAvailable()}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        Refresh
                      </button>
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
                      >
                        <Plus className="h-4 w-4" />
                        Assign mentorship
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {/* Interested Mentors Table */}
                    <div className="mb-6">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Mentors ({availableMentors.filter((m: any) => m.hasExpressedInterest).length})
                      </div>
                      {availableMentors.filter((m: any) => m.hasExpressedInterest).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Name</th>
                                <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Email</th>
                                <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {availableMentors
                                .filter((m: any) => m.hasExpressedInterest)
                                .map((m: any) => (
                                  <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 px-3 text-gray-900 dark:text-white">
                                      {m.firstName} {m.lastName}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{m.email}</td>
                                    <td className="py-2 px-3">
                                      <span className="inline-flex items-center gap-1">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                          ⭐ Interested
                                        </span>
                                        {m.hasProfile && (
                                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                            Has Profile
                                          </span>
                                        )}
                                        {!m.hasProfile && (
                                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                            No Profile Yet
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 py-4">No interested mentors yet.</div>
                      )}
                    </div>

                    {/* Interested Mentees Table */}
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        Mentees ({availableMentees.filter((m: any) => m.hasExpressedInterest).length})
                      </div>
                      {availableMentees.filter((m: any) => m.hasExpressedInterest).length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Name</th>
                                <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Email</th>
                                <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {availableMentees
                                .filter((m: any) => m.hasExpressedInterest)
                                .map((m: any) => (
                                  <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 px-3 text-gray-900 dark:text-white">
                                      {m.firstName} {m.lastName}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{m.email}</td>
                                    <td className="py-2 px-3">
                                      <span className="inline-flex items-center gap-1">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                          ⭐ Interested
                                        </span>
                                        {m.hasProfile && (
                                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                            Has Profile
                                          </span>
                                        )}
                                        {!m.hasProfile && (
                                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                            No Profile Yet
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 py-4">No interested mentees yet.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Matches */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">Matches</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{cycle.matches?.length ?? 0} matches</div>
                  </div>
                  <div className="p-6">
                    {cycle.matches && cycle.matches.length > 0 ? (
                      <div className="space-y-3">
                        {cycle.matches.slice(0, 25).map((match: any) => (
                          <div key={match.id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {match.mentor?.firstName} {match.mentor?.lastName} ↔ {match.mentee?.firstName} {match.mentee?.lastName}
                              </div>
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {match.status}
                              </span>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                              Score: {match.matchScore?.toFixed?.(0) ?? match.matchScore}% • Mentor approved: {match.mentorApproved ? 'Yes' : 'No'} • Mentee approved: {match.menteeApproved ? 'Yes' : 'No'}
                            </div>
                          </div>
                        ))}
                        {cycle.matches.length > 25 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">Showing 25 of {cycle.matches.length} matches.</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No matches generated for this cycle yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar stats */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3 border border-transparent dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <Users className="h-5 w-5" /> Mentorships
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {cycle._count?.mentorships ?? 0}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mt-4">
                    <Layers className="h-5 w-5" /> Programs
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {cycle._count?.programs ?? 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Max mentorships: {cycle.maxMentorships ?? '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Assign Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-800">
                <div className="p-6 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">Assign mentorship</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Pick an interested mentor and mentee</div>
                  </div>
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleAssign} className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mentor</label>
                    {loadingAvailable ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading mentors...</div>
                    ) : (
                      <select
                        value={assignForm.mentorId}
                        onChange={(e) => setAssignForm((p) => ({ ...p, mentorId: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                        required
                      >
                        <option value="">Select mentor</option>
                        {availableMentors.length > 0 ? (
                          availableMentors.map((m: any) => (
                            <option key={m.id} value={m.id}>
                              {m.firstName} {m.lastName} ({m.email})
                              {m.hasExpressedInterest ? ' ⭐ Interested' : ''}
                              {!m.hasProfile ? ' (No profile yet)' : ''}
                            </option>
                          ))
                        ) : (
                          <option disabled>No mentors available</option>
                        )}
                      </select>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {availableMentors.length === 0
                        ? 'No mentors found. Ask users to complete mentor onboarding in the mobile app.'
                        : `${availableMentors.length} mentor(s) available. ⭐ = expressed interest in this cycle.`}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mentee</label>
                    {loadingAvailable ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading mentees...</div>
                    ) : (
                      <select
                        value={assignForm.menteeId}
                        onChange={(e) => setAssignForm((p) => ({ ...p, menteeId: e.target.value }))}
                        className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                        required
                      >
                        <option value="">Select mentee</option>
                        {availableMentees.length > 0 ? (
                          availableMentees.map((m: any) => (
                            <option key={m.id} value={m.id}>
                              {m.firstName} {m.lastName} ({m.email})
                              {m.hasExpressedInterest ? ' ⭐ Interested' : ''}
                              {!m.hasProfile ? ' (No profile yet)' : ''}
                            </option>
                          ))
                        ) : (
                          <option disabled>No mentees available</option>
                        )}
                      </select>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {availableMentees.length === 0
                        ? 'No mentees found. Ask users to complete mentee onboarding in the mobile app or express interest in this cycle.'
                        : `${availableMentees.length} mentee(s) available. ⭐ = expressed interest in this cycle.`}
                    </div>
                  </div>

                  <div className="flex gap-2 sticky bottom-0 bg-white dark:bg-gray-900 pt-3 pb-1 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="submit"
                      disabled={assigning}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60"
                    >
                      {assigning ? 'Assigning...' : 'Assign & start program'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


