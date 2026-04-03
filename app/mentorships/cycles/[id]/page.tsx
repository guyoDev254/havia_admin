'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import MentorshipSubNav from '@/components/MentorshipSubNav'
import { api } from '@/lib/api'
import { ArrowLeft, Calendar, Users, Layers, AlertCircle, Clock, CheckCircle2, Plus, FileText, GraduationCap, UserCheck, LayoutList } from 'lucide-react'
import { format } from 'date-fns'

const CYCLE_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutList },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'attendance', label: 'Attendance', icon: UserCheck },
  { id: 'alumni', label: 'Alumni', icon: GraduationCap },
  { id: 'members', label: 'Members & assign', icon: Users },
  { id: 'matches', label: 'Matches', icon: Layers },
] as const

const TARGET_GROUP_LABELS: Record<string, string> = {
  STUDENTS: 'Students',
  JUNIOR_DEVELOPERS: 'Junior developers',
  NGO_STAFF: 'NGO staff',
  COMMUNITY_LEADERS: 'Community leaders',
  OTHER: 'Other',
}

const PROOF_OF_INTEREST_LABELS: Record<string, string> = {
  GITHUB: 'GitHub',
  CV: 'CV',
  SCHOOL: 'School',
  PROJECT_IDEA: 'Project idea',
}

function ApplicationScreeningModal({ app, onClose, onSaved }: { app: any; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState(app.status)
  const [score, setScore] = useState(String(app.screeningScore ?? ''))
  const [notes, setNotes] = useState(app.screeningNotes ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put(`/admin/mentorship/applications/${app.id}`, {
        status: status || undefined,
        screeningScore: score ? parseInt(score, 10) : undefined,
        screeningNotes: notes || undefined,
      })
      onSaved()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const detail = (label: string, value: string | null | undefined) => {
    if (value == null || value === '') return null
    return (
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</div>
        <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-800/50 rounded-md px-3 py-2">{value}</div>
      </div>
    )
  }

  const linkDetail = (label: string, url: string | null | undefined) => {
    if (url == null || url === '') return null
    return (
      <div className="mb-4">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 dark:text-primary-400 hover:underline break-all">{url}</a>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="text-lg font-bold text-gray-900 dark:text-white">Screen application</div>
          <button onClick={onClose} className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">Close</button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              {app.user?.firstName} {app.user?.lastName} — {app.user?.email}
            </div>
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Application details</div>
            {detail('Short bio', app.shortBio)}
            {detail('Why do you want to join?', app.whyJoin)}
            {(app.proofOfInterestType || app.proofOfInterestValue) && (
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Proof of interest</div>
                <div className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800/50 rounded-md px-3 py-2">
                  {app.proofOfInterestType && <span className="font-medium">{PROOF_OF_INTEREST_LABELS[app.proofOfInterestType] ?? app.proofOfInterestType}: </span>}
                  {app.proofOfInterestValue ? (
                    app.proofOfInterestValue.startsWith('http') ? (
                      <a href={app.proofOfInterestValue} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline break-all">{app.proofOfInterestValue}</a>
                    ) : (
                      <span className="whitespace-pre-wrap break-words">{app.proofOfInterestValue}</span>
                    )
                  ) : null}
                </div>
              </div>
            )}
            {detail('Availability / commitment', app.availabilityCommitment)}
            {linkDetail('Technical task URL', app.technicalTaskUrl)}
            {linkDetail('Video intro URL', app.videoIntroUrl)}
            {!app.shortBio && !app.whyJoin && !app.proofOfInterestValue && !app.availabilityCommitment && !app.technicalTaskUrl && !app.videoIntroUrl && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">No application details submitted.</div>
            )}
          </div>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Screening</div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2">
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under review</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Screening score (0–100)</label>
              <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function AttendanceModal({
  mentorship,
  week,
  onClose,
  onSaved,
  saving,
  setSaving,
}: {
  mentorship: any
  week: number
  onClose: () => void
  onSaved: () => void
  saving: boolean
  setSaving: (v: boolean) => void
}) {
  const prog = (mentorship.progress || []).find((p: any) => p.week === week)
  const [attended, setAttended] = useState(prog?.attended ?? null)
  const [excused, setExcused] = useState(!!prog?.excusedAbsence)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await api.put('/admin/mentorship/attendance', {
        mentorshipId: mentorship.id,
        week,
        attended: attended === true,
        excusedAbsence: excused,
      })
      onSaved()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-sm border border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900 dark:text-white">Week {week} — {mentorship.mentee?.firstName} {mentorship.mentee?.lastName}</div>
          <button onClick={onClose} className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">Close</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-gray-900 dark:text-white">
              <input type="radio" checked={attended === true} onChange={() => { setAttended(true); setExcused(false); }} className="rounded-full" />
              Attended
            </label>
            <label className="flex items-center gap-2 text-gray-900 dark:text-white">
              <input type="radio" checked={attended === false && !excused} onChange={() => { setAttended(false); setExcused(false); }} className="rounded-full" />
              Absent
            </label>
            <label className="flex items-center gap-2 text-gray-900 dark:text-white">
              <input type="radio" checked={excused} onChange={() => { setAttended(false); setExcused(true); }} className="rounded-full" />
              Excused
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

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
  const [applications, setApplications] = useState<any[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  const [appFilter, setAppFilter] = useState<string>('')
  const [editingApp, setEditingApp] = useState<any>(null)
  const [alumni, setAlumni] = useState<any[]>([])
  const [alumniLoading, setAlumniLoading] = useState(false)
  const [attendanceModal, setAttendanceModal] = useState<{ mentorship: any; week: number } | null>(null)
  const [attendanceSaving, setAttendanceSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [showMatchingModal, setShowMatchingModal] = useState(false)
  const [matchingData, setMatchingData] = useState({ minScore: 70, autoApprove: false })
  const [matchingLoading, setMatchingLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchCycle()
      fetchAvailable()
      fetchApplications()
      fetchAlumni()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchApplications = async (statusFilter?: string) => {
    try {
      setApplicationsLoading(true)
      const filter = statusFilter !== undefined ? statusFilter : appFilter
      const url = filter ? `/admin/mentorship/cycles/${id}/applications?status=${filter}` : `/admin/mentorship/cycles/${id}/applications`
      const res = await api.get(url)
      setApplications(res.data)
    } catch {
      setApplications([])
    } finally {
      setApplicationsLoading(false)
    }
  }

  const fetchAlumni = async () => {
    try {
      setAlumniLoading(true)
      const res = await api.get(`/admin/mentorship/cycles/${id}/alumni`)
      setAlumni(res.data)
    } catch {
      setAlumni([])
    } finally {
      setAlumniLoading(false)
    }
  }

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
      const mentors = res.data.mentors || []
      const mentees = res.data.mentees || []
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

  const handleRunMatching = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setMatchingLoading(true)
      const res = await api.post(
        `/admin/mentorship/cycles/${id}/match?minScore=${matchingData.minScore}&autoApprove=${matchingData.autoApprove}`
      )
      const count = res.data?.matchesCreated ?? res.data?.totalMatches ?? 0
      if (count > 0) {
        alert(`Matching complete. ${count} ${count === 1 ? 'match' : 'matches'} created.${matchingData.autoApprove ? ' All auto-approved and mentorships started.' : ' Review and approve matches in the app or here.'}`)
      } else {
        alert('Matching complete. No new matches (try lowering the minimum score or ensure mentees have commitment score ≥ 50).')
      }
      setShowMatchingModal(false)
      fetchCycle()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to run matching')
    } finally {
      setMatchingLoading(false)
    }
  }

  const cycleName = cycle?.name ?? 'Cycle'
  return (
    <ProtectedRoute>
      <Layout>
        <div className="p-6 space-y-6">
          <MentorshipSubNav breadcrumbs={[{ label: 'Cycles', href: '/mentorships/cycles' }, { label: cycleName }]} />

          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{cycle?.name ?? 'Cycle'}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cycle?.status ?? '\u2014'} • {cycle ? format(new Date(cycle.startDate), 'MMM dd') : ''} – {cycle ? format(new Date(cycle.endDate), 'MMM dd, yyyy') : '\u2014'}
              </p>
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
            <>
              {/* Tab bar */}
              <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                {CYCLE_TABS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Overview */}
                {(activeTab === 'overview') && (
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
                      {(cycle.targetGroupEnum && TARGET_GROUP_LABELS[cycle.targetGroupEnum]) && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Target: {TARGET_GROUP_LABELS[cycle.targetGroupEnum]}
                        </div>
                      )}
                      {(cycle.maxCohortSize != null || cycle.totalWeeks != null) && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Max cohort: {cycle.maxCohortSize ?? cycle.maxMentorships ?? '—'} • {cycle.totalWeeks ?? 12} weeks
                        </div>
                      )}
                    </div>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                      {cycle.status}
                    </span>
                  </div>

                  {cycle.phases && cycle.phases.length > 0 && (
                    <div className="mt-6">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Phases</div>
                      <div className="space-y-2">
                        {cycle.phases.map((p: any) => (
                          <div key={p.id} className="text-sm text-gray-900 dark:text-white border-l-2 border-primary-500 pl-3">
                            <span className="font-medium">{p.name}</span> — Weeks {p.startWeek}–{p.endWeek}
                            {p.description && <div className="text-gray-600 dark:text-gray-400 mt-0.5">{p.description}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(cycle.targetGroup || cycle.benefits || cycle.expectedOutcomes || cycle.requirements || cycle.conditions) && (
                    <div className="mt-6 grid grid-cols-1 gap-4">
                      {cycle.targetGroup && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Target group (text)</div>
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
                )}

                {/* Members / Mentorships + Interested (Assign) */}
                {(activeTab === 'members') && (
                <>
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
                </>
                )}

                {/* Cohort Applications */}
                {(activeTab === 'applications') && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Cohort applications
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={appFilter}
                        onChange={(e) => { const v = e.target.value; setAppFilter(v); fetchApplications(v); }}
                        className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="">All</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_REVIEW">Under review</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                      <button onClick={() => fetchApplications()} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Refresh</button>
                    </div>
                  </div>
                  <div className="p-6">
                    {applicationsLoading ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : applications.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No applications.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Applicant</th>
                              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Status</th>
                              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Score</th>
                              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Submitted</th>
                              <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {applications.map((app: any) => (
                              <tr key={app.id} className="border-b border-gray-100 dark:border-gray-700">
                                <td className="py-2 px-3 text-gray-900 dark:text-white">
                                  {app.user?.firstName} {app.user?.lastName}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{app.user?.email}</div>
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                                    app.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                                    app.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  }`}>{app.status}</span>
                                </td>
                                <td className="py-2 px-3 text-gray-700 dark:text-gray-300">{app.screeningScore ?? '—'}</td>
                                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">{app.submittedAt ? format(new Date(app.submittedAt), 'MMM dd, yyyy') : '—'}</td>
                                <td className="py-2 px-3 flex items-center gap-2">
                                  <button onClick={() => setEditingApp(app)} className="text-primary-600 dark:text-primary-400 hover:underline text-xs">Screen</button>
                                  {app.status === 'ACCEPTED' && (
                                    <button
                                      onClick={() => {
                                        setAssignForm((prev) => ({ ...prev, menteeId: app.userId }))
                                        setActiveTab('members')
                                      }}
                                      className="text-green-600 dark:text-green-400 hover:underline text-xs font-medium"
                                    >
                                      Assign
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Attendance (accountability) */}
                {(activeTab === 'attendance') && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
                  {cycle.mentorships && cycle.mentorships.length > 0 ? (
                    <>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="h-5 w-5" /> Weekly attendance
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">2 consecutive absences → removed</div>
                    </div>
                    <div className="p-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Mentee</th>
                            <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300 font-medium">Status</th>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].slice(0, cycle.totalWeeks || 12).map((w) => (
                              <th key={w} className="text-center py-2 px-1 text-gray-600 dark:text-gray-400 font-medium">W{w}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cycle.mentorships.map((m: any) => (
                            <tr key={m.id} className="border-b border-gray-100 dark:border-gray-700">
                              <td className="py-2 px-3 text-gray-900 dark:text-white">
                                {m.mentee?.firstName} {m.mentee?.lastName}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${m.status === 'DROPPED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>{m.status}</span>
                              </td>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].slice(0, cycle.totalWeeks || 12).map((w) => {
                                const prog = (m.progress || []).find((p: any) => p.week === w)
                                return (
                                  <td key={w} className="text-center py-1 px-1">
                                    {prog ? (
                                      <button
                                        onClick={() => setAttendanceModal({ mentorship: m, week: w })}
                                        className={`w-6 h-6 rounded text-xs font-medium ${
                                          prog.attended === true ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                                          prog.excusedAbsence ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                                          prog.attended === false ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                                          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        }`}
                                        title={prog.attended === true ? 'Attended' : prog.excusedAbsence ? 'Excused' : prog.attended === false ? 'Absent' : 'Not set'}
                                      >
                                        {prog.attended === true ? '✓' : prog.excusedAbsence ? 'E' : prog.attended === false ? '✗' : '·'}
                                      </button>
                                    ) : (
                                      <button onClick={() => setAttendanceModal({ mentorship: m, week: w })} className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs">·</button>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    </>
                  ) : (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      <UserCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No mentorships in this cycle yet. Assign mentor–mentee pairs from the <button type="button" onClick={() => setActiveTab('members')} className="text-primary-600 dark:text-primary-400 hover:underline">Members & assign</button> tab.</p>
                    </div>
                  )}
                  </div>
                )}

                {/* Alumni */}
                {(activeTab === 'alumni') && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" /> Alumni
                    </div>
                    <button onClick={() => fetchAlumni()} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Refresh</button>
                  </div>
                  <div className="p-6">
                    {alumniLoading ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
                    ) : alumni.length === 0 ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">No alumni yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {alumni.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{a.user?.firstName} {a.user?.lastName}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Graduated {format(new Date(a.graduatedAt), 'MMM dd, yyyy')}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={!!a.showcased}
                                  onChange={async (e) => {
                                    try {
                                      await api.put(`/admin/mentorship/alumni/${a.id}`, { showcased: e.target.checked })
                                      fetchAlumni()
                                    } catch (err) { console.error(err) }
                                  }}
                                  className="rounded border-gray-300 dark:border-gray-600"
                                />
                                Showcase
                              </label>
                              <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={!!a.canMentorFutureCohorts}
                                  onChange={async (e) => {
                                    try {
                                      await api.put(`/admin/mentorship/alumni/${a.id}`, { canMentorFutureCohorts: e.target.checked })
                                      fetchAlumni()
                                    } catch (err) { console.error(err) }
                                  }}
                                  className="rounded border-gray-300 dark:border-gray-600"
                                />
                                Can mentor
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Matches */}
                {(activeTab === 'matches') && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">Matches</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{cycle.matches?.length ?? 0} matches</span>
                      <button
                        type="button"
                        onClick={() => setShowMatchingModal(true)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700"
                      >
                        Run matching
                      </button>
                    </div>
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
                )}
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
                    Max: {cycle.maxCohortSize ?? cycle.maxMentorships ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mt-4">
                    <FileText className="h-5 w-5" /> Applications
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {cycle._count?.applications ?? 0}
                  </div>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mt-4">
                    <GraduationCap className="h-5 w-5" /> Alumni
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {cycle._count?.alumni ?? 0}
                  </div>
                </div>
              </div>
            </div>
            </>
          )}

          {/* Application screening modal */}
          {editingApp && (
            <ApplicationScreeningModal
              app={editingApp}
              onClose={() => setEditingApp(null)}
              onSaved={() => { setEditingApp(null); fetchApplications(); fetchCycle(); }}
            />
          )}

          {/* Attendance modal */}
          {attendanceModal && (
            <AttendanceModal
              mentorship={attendanceModal.mentorship}
              week={attendanceModal.week}
              onClose={() => setAttendanceModal(null)}
              onSaved={async () => { setAttendanceModal(null); fetchCycle(); }}
              saving={attendanceSaving}
              setSaving={setAttendanceSaving}
            />
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

          {/* Run Matching Modal */}
          {showMatchingModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-md border border-gray-200 dark:border-gray-800">
                <div className="p-6 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">Run matching for this cycle</div>
                  <button onClick={() => setShowMatchingModal(false)} className="px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200">Close</button>
                </div>
                <form onSubmit={handleRunMatching} className="p-6 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Match mentees with mentors by compatibility. Mentees with commitment score &lt; 50 are excluded.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum match score (0–100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={matchingData.minScore}
                      onChange={(e) => setMatchingData((p) => ({ ...p, minScore: Number(e.target.value) }))}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <input
                      type="checkbox"
                      checked={matchingData.autoApprove}
                      onChange={(e) => setMatchingData((p) => ({ ...p, autoApprove: e.target.checked }))}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm">Auto-approve matches (start mentorships immediately)</span>
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" disabled={matchingLoading} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-60">
                      {matchingLoading ? 'Running...' : 'Run matching'}
                    </button>
                    <button type="button" onClick={() => setShowMatchingModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white">
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


