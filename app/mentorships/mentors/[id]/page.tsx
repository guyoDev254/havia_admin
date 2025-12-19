'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { api } from '@/lib/api'
import { ArrowLeft, User, Mail, Calendar, Target, AlertCircle, CheckCircle, XCircle, Users, TrendingUp, Star, Briefcase, Award } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function MentorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [mentor, setMentor] = useState<any>(null)

  useEffect(() => {
    if (id) fetchMentor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchMentor = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/admin/mentors/${id}`)
      setMentor(res.data)
    } catch (e) {
      console.error('Failed to load mentor', e)
      setMentor(null)
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Profile</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">View mentor details and mentorship history</p>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          ) : !mentor ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex items-center gap-3 text-gray-700 dark:text-gray-200">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>Mentor not found.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                      {mentor.user?.profileImage ? (
                        <img src={mentor.user.profileImage} alt="" className="h-20 w-20 object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {mentor.user?.firstName} {mentor.user?.lastName}
                        </div>
                        <div className="flex items-center gap-2">
                          {mentor.isVerified ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              Pending
                            </span>
                          )}
                          {mentor.isActive ? (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4" /> {mentor.user?.email}
                      </div>
                      {mentor.user?.phone && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">{mentor.user.phone}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-4">
                    <Briefcase className="h-5 w-5" /> Professional Information
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {mentor.company && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Company</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mentor.company}</div>
                      </div>
                    )}
                    {mentor.user?.occupation && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Occupation</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mentor.user.occupation}</div>
                      </div>
                    )}
                    {mentor.yearsOfExperience && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Years of Experience</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {mentor.yearsOfExperience} years
                        </div>
                      </div>
                    )}
                    {mentor.user?.location && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Location</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mentor.user.location}</div>
                      </div>
                    )}
                    {mentor.user?.education && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Education</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mentor.user.education}</div>
                      </div>
                    )}
                    {mentor.linkedIn && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">LinkedIn</div>
                        <a
                          href={mentor.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          View Profile
                        </a>
                      </div>
                    )}
                  </div>
                  {mentor.bio && (
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bio</div>
                      <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{mentor.bio}</div>
                    </div>
                  )}
                  {mentor.user?.skills && mentor.user.skills.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {mentor.user.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mentorship Preferences */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-4">
                    <Target className="h-5 w-5" /> Mentorship Preferences
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Capacity</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {mentor.currentMentees || 0} / {mentor.maxMentees || 0} mentees
                      </div>
                    </div>
                    {mentor.weeklyAvailability && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Weekly Availability</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {mentor.weeklyAvailability} hours/week
                        </div>
                      </div>
                    )}
                    {mentor.preferredType && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Preferred Type</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{mentor.preferredType}</div>
                      </div>
                    )}
                  </div>
                  {mentor.mentorshipThemes && mentor.mentorshipThemes.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Mentorship Themes</div>
                      <div className="flex flex-wrap gap-2">
                        {mentor.mentorshipThemes.map((theme: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {mentor.mentorshipStyle && mentor.mentorshipStyle.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Mentorship Style</div>
                      <div className="flex flex-wrap gap-2">
                        {mentor.mentorshipStyle.map((style: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                          >
                            {style}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Active Mentorships */}
                {mentor.mentorships && mentor.mentorships.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                        <Users className="h-5 w-5" /> Active Mentorships
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {mentor.mentorships.filter((m: any) => m.status === 'ACTIVE').length} active
                      </div>
                    </div>
                    <div className="space-y-3">
                      {mentor.mentorships.slice(0, 5).map((mentorship: any) => (
                        <Link
                          key={mentorship.id}
                          href={`/mentorships/${mentorship.id}`}
                          className="block border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {mentorship.mentee?.profileImage ? (
                                  <img
                                    src={mentorship.mentee.profileImage}
                                    alt=""
                                    className="h-10 w-10 object-cover"
                                  />
                                ) : (
                                  <User className="h-5 w-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {mentorship.mentee?.firstName} {mentorship.mentee?.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{mentorship.mentee?.email}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  mentorship.status === 'ACTIVE'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                    : mentorship.status === 'COMPLETED'
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}
                              >
                                {mentorship.status}
                              </span>
                              {mentorship.sessionsCompleted > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {mentorship.sessionsCompleted} sessions
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {mentor.mentorships.length > 5 && (
                      <div className="text-center">
                        <Link
                          href="/mentorships"
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          View all {mentor.mentorships.length} mentorships
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <TrendingUp className="h-5 w-5" /> Statistics
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Mentees</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mentor.totalMentees || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Current Mentees</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {mentor.currentMentees || 0}
                      </div>
                    </div>
                    {mentor.rating && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rating</div>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {mentor.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Experience level</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {mentor.yearsOfExperience ? `${mentor.yearsOfExperience} years` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-4">
                    <Calendar className="h-4 w-4" />
                    Joined {mentor.createdAt ? format(new Date(mentor.createdAt), 'MMM dd, yyyy') : '—'}
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
