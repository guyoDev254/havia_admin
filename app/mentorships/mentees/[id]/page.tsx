'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, User, Mail, Calendar, Target, AlertCircle, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function MenteeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [mentee, setMentee] = useState<any>(null)

  useEffect(() => {
    if (id) fetchMentee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchMentee = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/mentees/${id}`)
      setMentee(res.data)
    } catch (e) {
      console.error('Failed to load mentee', e)
      setMentee(null)
    } finally {
      setLoading(false)
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentee</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Profile details</p>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          ) : !mentee ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>Mentee not found.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {mentee.user?.profileImage ? (
                        <img src={mentee.user.profileImage} alt="" className="h-14 w-14 object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-900 dark:text-white">
                        {mentee.user?.firstName} {mentee.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Mail className="h-4 w-4" /> {mentee.user?.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <Target className="h-5 w-5" /> Focus & Goals
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium">Field of interest</div>
                    <div className="text-gray-600 dark:text-gray-400">{mentee.fieldOfInterest || 'N/A'}</div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium">Career goals</div>
                    <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{mentee.careerGoals || 'N/A'}</div>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-medium">Challenges</div>
                    <div className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{mentee.challenges || 'N/A'}</div>
                  </div>
                </div>

                {/* Mentorships with Sessions and Progress */}
                {mentee.mentorships && mentee.mentorships.length > 0 && (
                  <div className="space-y-4">
                    {mentee.mentorships.map((mentorship: any) => (
                      <div key={mentorship.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                              {mentorship.mentor?.profileImage ? (
                                <img src={mentorship.mentor.profileImage} alt="" className="h-10 w-10 object-cover" />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                Mentor: {mentorship.mentor?.firstName} {mentorship.mentor?.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{mentorship.mentor?.email}</div>
                              {mentorship.cycle && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Cycle: {mentorship.cycle.name}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            mentorship.status === 'ACTIVE' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : mentorship.status === 'COMPLETED'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {mentorship.status}
                          </div>
                        </div>

                        {/* Progress Section */}
                        {mentorship.progress && mentorship.progress.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                              <TrendingUp className="h-5 w-5" /> Progress Tracking
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {mentorship.progress.slice(0, 4).map((prog: any, idx: number) => (
                                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Week {prog.week}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {prog.tasksCompleted} / {prog.totalTasks} tasks
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                    <div
                                      className="bg-primary-600 h-2 rounded-full"
                                      style={{
                                        width: `${prog.totalTasks > 0 ? (prog.tasksCompleted / prog.totalTasks) * 100 : 0}%`,
                                      }}
                                    />
                                  </div>
                                  {(prog.engagementScore !== null || prog.skillImprovement !== null) && (
                                    <div className="flex gap-4 text-xs">
                                      {prog.engagementScore !== null && (
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400">Engagement: </span>
                                          <span className="font-semibold text-gray-900 dark:text-white">{prog.engagementScore.toFixed(1)}%</span>
                                        </div>
                                      )}
                                      {prog.skillImprovement !== null && (
                                        <div>
                                          <span className="text-gray-500 dark:text-gray-400">Skills: </span>
                                          <span className="font-semibold text-gray-900 dark:text-white">{prog.skillImprovement.toFixed(1)}%</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sessions Section */}
                        {mentorship.sessions && mentorship.sessions.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                                <Clock className="h-5 w-5" /> Sessions
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Total: {mentorship.sessions.length} | 
                                Completed: {mentorship.sessions.filter((s: any) => s.status === 'COMPLETED').length} | 
                                Scheduled: {mentorship.sessions.filter((s: any) => s.status === 'SCHEDULED').length}
                              </div>
                            </div>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {mentorship.sessions.slice(0, 10).map((session: any) => {
                                const isCompleted = session.status === 'COMPLETED'
                                const isScheduled = session.status === 'SCHEDULED'
                                const sessionDate = session.actualDate || session.scheduledDate

                                return (
                                  <div
                                    key={session.id}
                                    className={`border rounded-lg p-3 ${
                                      session.status === 'CANCELLED'
                                        ? 'opacity-50 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <div
                                            className={`w-2 h-2 rounded-full ${
                                              isCompleted
                                                ? 'bg-green-500'
                                                : isScheduled
                                                ? 'bg-blue-500'
                                                : 'bg-red-500'
                                            }`}
                                          />
                                          <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {format(new Date(sessionDate), 'MMM dd, yyyy')}
                                          </p>
                                          <span
                                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
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
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          {format(new Date(sessionDate), 'h:mm a')}
                                        </p>
                                        {session.duration && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Duration: {session.duration} minutes
                                          </p>
                                        )}
                                        {session.topics && (
                                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                            Topics: {session.topics}
                                          </p>
                                        )}
                                        {session.notes && (
                                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                            {session.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Empty States */}
                        {(!mentorship.progress || mentorship.progress.length === 0) && 
                         (!mentorship.sessions || mentorship.sessions.length === 0) && (
                          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                            No progress or sessions recorded yet
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(!mentee.mentorships || mentee.mentorships.length === 0) && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
                    No mentorships found
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Experience level</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{mentee.experienceLevel || 'N/A'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Learning preference</div>
                  <div className="text-sm text-gray-900 dark:text-white">{mentee.learningPreference?.join(', ') || 'N/A'}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    Joined {mentee.createdAt ? new Date(mentee.createdAt).toLocaleDateString() : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


