'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import MentorshipSubNav from '@/components/MentorshipSubNav'
import { ArrowLeft, Edit2, Save, X, Calendar, CheckCircle, Clock, FileText, TrendingUp, User, Users, Target, Award, Activity, MessageSquare, BarChart3, Percent } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface MentorshipDetail {
  id: string
  status: string
  type?: string
  goals?: string
  notes?: string
  sessionsCompleted: number
  nextSessionDate?: string
  engagementScore?: number
  satisfactionScore?: number
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  mentor: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    bio?: string
    profileImage?: string
    skills?: string[]
    occupation?: string
  }
  mentee: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    bio?: string
    profileImage?: string
    skills?: string[]
    occupation?: string
  }
  cycle?: {
    id: string
    name: string
    startDate: string
    endDate: string
  }
  match?: {
    matchScore: number
    skillMatch: number
    industryRelevance: number
    availabilityMatch?: number
    communicationMatch?: number
  }
  programs?: Array<{
    id: string
    week: number
    status: string
    tasks?: Array<{
      id: string
      title: string
      status: string
      week: number
      type: string
    }>
    progress?: Array<{
      week: number
      tasksCompleted: number
      totalTasks: number
      engagementScore?: number
      skillImprovement?: number
    }>
  }>
  progress?: Array<{
    week: number
    tasksCompleted: number
    totalTasks: number
    engagementScore?: number
    skillImprovement?: number
  }>
  certificate?: {
    id: string
    certificateNumber: string
    issuedAt: string
    pdfUrl?: string
  }
  sessions?: Array<{
    id: string
    scheduledDate: string
    actualDate?: string
    status: string
    notes?: string
    completedBy?: string
    duration?: number
    topics?: string
    createdAt: string
    updatedAt: string
  }>
  evaluations?: Array<{
    id: string
    type: string
    isMentor: boolean
    engagementRating?: number
    progressRating?: number
    satisfactionRating?: number
    skillImprovement?: number
    feedback?: string
    challenges?: string
    recommendations?: string
    submittedAt?: string
    createdAt: string
    evaluator: {
      id: string
      firstName: string
      lastName: string
      email: string
      profileImage?: string
    }
  }>
}

export default function MentorshipDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const mentorshipId = params.id as string

  const [mentorship, setMentorship] = useState<MentorshipDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'tasks' | 'sessions' | 'evaluations'>('overview')
  const [generatingCertificate, setGeneratingCertificate] = useState(false)
  const [formData, setFormData] = useState({
    status: 'PENDING',
    goals: '',
    notes: '',
  })

  useEffect(() => {
    if (user && mentorshipId) {
      fetchMentorship()
    }
  }, [user, mentorshipId])

  const fetchMentorship = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/mentorships/${mentorshipId}`)
      console.log('Mentorship data:', response.data)
      console.log('Sessions:', response.data.sessions)
      console.log('Progress:', response.data.progress)
      setMentorship(response.data)
      setFormData({
        status: response.data.status || 'PENDING',
        goals: response.data.goals || '',
        notes: response.data.notes || '',
      })
    } catch (error) {
      console.error('Error fetching mentorship:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCertificate = async () => {
    if (!confirm('Generate certificate for this mentorship?')) return

    try {
      setGeneratingCertificate(true)
      const response = await api.post(`/admin/mentorships/${mentorshipId}/certificate`)
      alert('Certificate generated successfully!')
      fetchMentorship() // Refresh to show new certificate
    } catch (error: any) {
      console.error('Error generating certificate:', error)
      alert(error.response?.data?.message || 'Failed to generate certificate')
    } finally {
      setGeneratingCertificate(false)
    }
  }

  const handleSave = async () => {
    try {
      await api.put(`/admin/mentorships/${mentorshipId}`, formData)
      setEditing(false)
      fetchMentorship()
    } catch (error) {
      console.error('Error updating mentorship:', error)
      alert('Failed to update mentorship')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!mentorship) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <p className="text-gray-500">Mentorship not found</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  const currentWeek = mentorship.programs?.[0]?.week || 1
  const totalTasks = mentorship.programs?.reduce((acc, p) => acc + (p.tasks?.length || 0), 0) || 0
  const completedTasks = mentorship.programs?.reduce(
    (acc, p) => acc + (p.tasks?.filter((t) => t.status === 'COMPLETED').length || 0),
    0
  ) || 0

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <MentorshipSubNav breadcrumbs={[{ label: 'All', href: '/mentorships' }, { label: mentorship ? `${mentorship.mentor?.firstName} ${mentorship.mentor?.lastName} – ${mentorship.mentee?.firstName} ${mentorship.mentee?.lastName}` : 'Detail' }]} />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mentorship Details</h1>
                <p className="mt-1 text-sm text-gray-500">
                  {mentorship.mentor.firstName} {mentorship.mentor.lastName} →{' '}
                  {mentorship.mentee.firstName} {mentorship.mentee.lastName}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      fetchMentorship()
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {(['overview', 'progress', 'tasks', 'sessions', 'evaluations'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 shadow-lg rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-200 dark:bg-blue-900 px-2 py-1 rounded-full">
                      Progress
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Current Week</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{currentWeek} / 8</p>
                    <div className="mt-3 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all"
                        style={{ width: `${(currentWeek / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg rounded-xl p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-200 dark:bg-green-900 px-2 py-1 rounded-full">
                        Tasks
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">Tasks Completed</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {completedTasks} / {totalTasks}
                      </p>
                      {totalTasks > 0 && (
                        <div className="mt-3 w-full bg-green-200 dark:bg-green-900 rounded-full h-2">
                          <div
                            className="bg-green-600 dark:bg-green-400 h-2 rounded-full transition-all"
                            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 shadow-lg rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-4">
                      <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-200 dark:bg-purple-900 px-2 py-1 rounded-full">
                        Engagement
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">Engagement Score</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                        {mentorship.engagementScore?.toFixed(0) || 'N/A'}
                        {mentorship.engagementScore && (
                          <span className="text-lg text-purple-600 dark:text-purple-400">%</span>
                        )}
                      </p>
                      {mentorship.engagementScore && (
                        <div className="mt-3 w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2">
                          <div
                            className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all"
                            style={{ width: `${mentorship.engagementScore}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 shadow-lg rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-4">
                      <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-200 dark:bg-orange-900 px-2 py-1 rounded-full">
                        Sessions
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">Completed</p>
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                        {mentorship.sessionsCompleted || 0}
                      </p>
                      {mentorship.nextSessionDate && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                          Next: {format(new Date(mentorship.nextSessionDate), 'MMM dd')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                  {/* Match Info - Enhanced */}
                  {mentorship.match && (
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Match Analysis</h2>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Match Score</p>
                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              {mentorship.match.matchScore.toFixed(0)}%
                            </p>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all"
                              style={{ width: `${mentorship.match.matchScore}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Skill Match</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {mentorship.match.skillMatch.toFixed(0)}%
                            </p>
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
                                style={{ width: `${(mentorship.match.skillMatch / 40) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Industry Relevance</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {mentorship.match.industryRelevance.toFixed(0)}%
                            </p>
                            <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${(mentorship.match.industryRelevance / 20) * 100}%` }}
                              />
                            </div>
                          </div>
                          {mentorship.match.availabilityMatch && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Availability</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {mentorship.match.availabilityMatch.toFixed(0)}%
                              </p>
                            </div>
                          )}
                          {mentorship.match.communicationMatch && (
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Communication</p>
                              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {mentorship.match.communicationMatch.toFixed(0)}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cycle Info - Enhanced */}
                  {mentorship.cycle && (
                    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-4">
                        <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cycle Information</h2>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cycle Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">{mentorship.cycle.name}</p>
                        </div>
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Program Duration</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {format(new Date(mentorship.cycle.startDate), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Start Date</p>
                            </div>
                            <div className="h-px flex-1 bg-gray-300 dark:bg-gray-600" />
                            <div className="flex-1 text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {format(new Date(mentorship.cycle.endDate), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">End Date</p>
                            </div>
                          </div>
                          {new Date(mentorship.cycle.endDate) > new Date() && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>Program Progress</span>
                                <span>
                                  {Math.round(
                                    ((new Date().getTime() - new Date(mentorship.cycle.startDate).getTime()) /
                                      (new Date(mentorship.cycle.endDate).getTime() -
                                        new Date(mentorship.cycle.startDate).getTime())) *
                                      100
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full"
                                  style={{
                                    width: `${
                                      Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          ((new Date().getTime() - new Date(mentorship.cycle.startDate).getTime()) /
                                            (new Date(mentorship.cycle.endDate).getTime() -
                                              new Date(mentorship.cycle.startDate).getTime())) *
                                            100
                                        )
                                      )
                                    }%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mentor & Mentee Cards - Enhanced */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mentor Card */}
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 shadow-lg rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                          {mentorship.mentor.firstName[0]}{mentorship.mentor.lastName[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mentor</h3>
                          <p className="text-sm text-indigo-600 dark:text-indigo-400">Guiding & Supporting</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {mentorship.mentor.firstName} {mentorship.mentor.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{mentorship.mentor.email}</p>
                        </div>
                        {mentorship.mentor.phone && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{mentorship.mentor.phone}</p>
                          </div>
                        )}
                        {mentorship.mentor.occupation && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Occupation</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{mentorship.mentor.occupation}</p>
                          </div>
                        )}
                        {mentorship.mentor.skills && mentorship.mentor.skills.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-1">
                              {mentorship.mentor.skills.slice(0, 3).map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mentee Card */}
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 shadow-lg rounded-xl p-6 border border-cyan-200 dark:border-cyan-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 rounded-full bg-cyan-600 dark:bg-cyan-500 flex items-center justify-center text-white font-semibold text-lg">
                          {mentorship.mentee.firstName[0]}{mentorship.mentee.lastName[0]}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mentee</h3>
                          <p className="text-sm text-cyan-600 dark:text-cyan-400">Learning & Growing</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Full Name</p>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {mentorship.mentee.firstName} {mentorship.mentee.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{mentorship.mentee.email}</p>
                        </div>
                        {mentorship.mentee.phone && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{mentorship.mentee.phone}</p>
                          </div>
                        )}
                        {mentorship.mentee.skills && mentorship.mentee.skills.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Learning</p>
                            <div className="flex flex-wrap gap-1">
                              {mentorship.mentee.skills.slice(0, 3).map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-cyan-200 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Goals - Enhanced */}
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mentorship Goals</h2>
                    </div>
                    {editing ? (
                      <textarea
                        value={formData.goals}
                        onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                        rows={5}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Describe the goals and objectives for this mentorship..."
                      />
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {mentorship.goals || (
                            <span className="text-gray-400 dark:text-gray-500 italic">No goals set for this mentorship</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats Summary */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Summary</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {mentorship.sessions?.length || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {mentorship.sessions?.filter((s: any) => s.status === 'COMPLETED').length || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {totalTasks}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {mentorship.evaluations?.length || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Evaluations</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar - Enhanced */}
                <div className="space-y-6">
                  {/* Status Card - Enhanced */}
                  <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-6">
                      <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status & Metrics</h2>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</label>
                        {editing ? (
                          <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="ACTIVE">Active</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="PAUSED">Paused</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${
                              mentorship.status === 'ACTIVE'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : mentorship.status === 'PENDING'
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                : mentorship.status === 'COMPLETED'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {mentorship.status}
                          </span>
                        )}
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                            Sessions Completed
                          </label>
                          <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                          {mentorship.sessionsCompleted || 0}
                        </p>
                      </div>

                      {mentorship.engagementScore && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-blue-700 dark:text-blue-300">
                              Engagement Score
                            </label>
                            <TrendingUp className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                              {mentorship.engagementScore.toFixed(0)}
                            </p>
                            <span className="text-sm text-blue-500 dark:text-blue-400">%</span>
                          </div>
                          <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 dark:bg-blue-400 h-1.5 rounded-full"
                              style={{ width: `${mentorship.engagementScore}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {mentorship.satisfactionScore && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-purple-700 dark:text-purple-300">
                              Satisfaction Score
                            </label>
                            <Award className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                              {mentorship.satisfactionScore.toFixed(0)}
                            </p>
                            <span className="text-sm text-purple-500 dark:text-purple-400">%</span>
                          </div>
                          <div className="mt-2 w-full bg-purple-200 dark:bg-purple-900 rounded-full h-1.5">
                            <div
                              className="bg-purple-600 dark:bg-purple-400 h-1.5 rounded-full"
                              style={{ width: `${mentorship.satisfactionScore}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {mentorship.nextSessionDate && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-orange-700 dark:text-orange-300">
                              Next Session
                            </label>
                            <Calendar className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                          </div>
                          <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                            {format(new Date(mentorship.nextSessionDate), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            {format(new Date(mentorship.nextSessionDate), 'h:mm a')}
                          </p>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        {mentorship.startedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Started</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {format(new Date(mentorship.startedAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        {mentorship.completedAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Completed</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {format(new Date(mentorship.completedAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Created</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(mentorship.createdAt), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                  </div>
                </div>

                {/* Certificate */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Certificate</h2>
                    {!mentorship.certificate && mentorship.status === 'COMPLETED' && (
                      <button
                        onClick={handleGenerateCertificate}
                        disabled={generatingCertificate}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium transition-colors"
                      >
                        {generatingCertificate ? 'Generating...' : 'Generate Certificate'}
                      </button>
                    )}
                  </div>
                  {mentorship.certificate ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Certificate Number</p>
                        <p className="text-gray-900 dark:text-white font-mono text-sm">
                          {mentorship.certificate.certificateNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Issued</p>
                        <p className="text-gray-900 dark:text-white">
                          {format(new Date(mentorship.certificate.issuedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {mentorship.certificate.pdfUrl && (
                        <div className="mt-4">
                          <a
                            href={mentorship.certificate.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            Download PDF
                          </a>
                        </div>
                      )}
                    </div>
                  ) : mentorship.status === 'COMPLETED' ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Certificate can be generated for this completed mentorship
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Certificate will be available after mentorship is completed
                    </p>
                  )}
                </div>

                {/* Info */}
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">Information</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="text-gray-900">
                        {format(new Date(mentorship.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    {mentorship.startedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Started</span>
                        <span className="text-gray-900">
                          {format(new Date(mentorship.startedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                    {mentorship.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed</span>
                        <span className="text-gray-900">
                          {format(new Date(mentorship.completedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === 'progress' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Progress Tracking</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {mentorship.progress?.length || 0} week(s) tracked
                </div>
              </div>
              {mentorship.progress && mentorship.progress.length > 0 ? (
                <div className="space-y-4">
                  {mentorship.progress.map((prog, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Week {prog.week}</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {prog.tasksCompleted} / {prog.totalTasks} tasks
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${(prog.tasksCompleted / prog.totalTasks) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {prog.engagementScore !== null && prog.engagementScore !== undefined && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Engagement: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">{prog.engagementScore.toFixed(1)}%</span>
                          </div>
                        )}
                        {prog.skillImprovement !== null && prog.skillImprovement !== undefined && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Skill Improvement: </span>
                            <span className="font-semibold text-gray-900 dark:text-white">{prog.skillImprovement.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No progress data available yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Progress will appear here as tasks are completed
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sessions</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total: {mentorship.sessions?.length || 0} |{' '}
                  Completed: {mentorship.sessions?.filter((s) => s.status === 'COMPLETED').length || 0} |{' '}
                  Scheduled: {mentorship.sessions?.filter((s) => s.status === 'SCHEDULED').length || 0}
                </div>
              </div>
              {mentorship.sessions && mentorship.sessions.length > 0 ? (
                <div className="space-y-4">
                  {mentorship.sessions
                    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                    .map((session) => {
                      const isCompleted = session.status === 'COMPLETED'
                      const isScheduled = session.status === 'SCHEDULED'
                      const isCancelled = session.status === 'CANCELLED'
                      const sessionDate = session.actualDate || session.scheduledDate

                      return (
                        <div
                          key={session.id}
                          className={`border rounded-lg p-4 ${
                            isCancelled 
                              ? 'opacity-50 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700' 
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    isCompleted
                                      ? 'bg-green-500'
                                      : isScheduled
                                      ? 'bg-blue-500'
                                      : 'bg-red-500'
                                  }`}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                      {format(new Date(sessionDate), 'EEEE, MMMM dd, yyyy')}
                                    </p>
                                    <span
                                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        isCompleted
                                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                          : isScheduled
                                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                      }`}
                                    >
                                      {session.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(sessionDate), 'h:mm a')}
                                  </p>
                                </div>
                              </div>

                              {session.actualDate && session.actualDate !== session.scheduledDate && (
                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                  <span className="font-medium">Actual:</span>{' '}
                                  {format(new Date(session.actualDate), 'MMM dd, yyyy • h:mm a')}
                                </div>
                              )}

                              {session.duration && (
                                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                  <span className="font-medium">Duration:</span> {session.duration} minutes
                                </div>
                              )}

                              {session.topics && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Topics Covered:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{session.topics}</p>
                                </div>
                              )}

                              {session.notes && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{session.notes}</p>
                                </div>
                              )}

                              {session.completedBy && (
                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                  Completed by:{' '}
                                  {session.completedBy === mentorship.mentor.id
                                    ? `${mentorship.mentor.firstName} ${mentorship.mentor.lastName} (Mentor)`
                                    : `${mentorship.mentee.firstName} ${mentorship.mentee.lastName} (Mentee)`}
                                </div>
                              )}

                              <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                Created: {format(new Date(session.createdAt), 'MMM dd, yyyy • h:mm a')}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sessions recorded yet</p>
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Tasks</h2>
              {mentorship.programs && mentorship.programs.length > 0 ? (
                <div className="space-y-4">
                  {mentorship.programs.map((program) => (
                    <div key={program.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-3">Week {program.week}</h3>
                      {program.tasks && program.tasks.length > 0 ? (
                        <div className="space-y-2">
                          {program.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded"
                            >
                              <div className="flex-1">
                                <p className="font-medium">{task.title}</p>
                                <p className="text-sm text-gray-500">{task.type}</p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  task.status === 'COMPLETED'
                                    ? 'bg-green-100 text-green-800'
                                    : task.status === 'IN_PROGRESS'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {task.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No tasks for this week</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tasks available</p>
              )}
            </div>
          )}

          {/* Evaluations Tab */}
          {activeTab === 'evaluations' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Evaluations</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {mentorship.evaluations?.length || 0} evaluation(s)
                </div>
              </div>
              {mentorship.evaluations && mentorship.evaluations.length > 0 ? (
                <div className="space-y-6">
                  {mentorship.evaluations.map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {evaluation.evaluator.profileImage ? (
                              <img
                                src={evaluation.evaluator.profileImage}
                                alt=""
                                className="h-10 w-10 object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {evaluation.evaluator.firstName} {evaluation.evaluator.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {evaluation.isMentor ? 'Mentor Evaluation' : 'Mentee Evaluation'} • {evaluation.type}
                            </div>
                          </div>
                        </div>
                        {evaluation.submittedAt && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(evaluation.submittedAt), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>

                      {/* Ratings */}
                      {(evaluation.engagementRating ||
                        evaluation.progressRating ||
                        evaluation.satisfactionRating ||
                        evaluation.skillImprovement) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {evaluation.engagementRating && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Engagement</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < evaluation.engagementRating!
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                  {evaluation.engagementRating}/5
                                </span>
                              </div>
                            </div>
                          )}
                          {evaluation.progressRating && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progress</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < evaluation.progressRating!
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                  {evaluation.progressRating}/5
                                </span>
                              </div>
                            </div>
                          )}
                          {evaluation.satisfactionRating && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Satisfaction</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < evaluation.satisfactionRating!
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                  {evaluation.satisfactionRating}/5
                                </span>
                              </div>
                            </div>
                          )}
                          {evaluation.skillImprovement && (
                            <div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Skill Improvement</div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`text-lg ${
                                      i < evaluation.skillImprovement!
                                        ? 'text-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                  {evaluation.skillImprovement}/5
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback */}
                      {evaluation.feedback && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {evaluation.feedback}
                          </div>
                        </div>
                      )}

                      {/* Challenges */}
                      {evaluation.challenges && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Challenges</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {evaluation.challenges}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {evaluation.recommendations && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recommendations
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {evaluation.recommendations}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No evaluations submitted yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Evaluations will appear here when mentor or mentee submit feedback
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
