'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { GraduationCap, Mail, Phone, MapPin, School, Calendar, Award, Users, BookOpen, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  profileImage?: string
  location?: string
  role: string
  isStudent: boolean
  educationLevel?: string
  schoolName?: string
  grade?: string
  yearOfStudy?: number
  major?: string
  studentId?: string
  expectedGraduation?: string
  createdAt: string
  studentProfile?: {
    gpa?: number
    achievements: string[]
    extracurriculars: string[]
    careerGoals?: string
  }
  scholarshipApplications?: Array<{
    id: string
    status: string
    submittedAt: string
    scholarship: {
      id: string
      title: string
      provider: string
    }
  }>
  studyGroupMembers?: Array<{
    id: string
    role: string
    studyGroup: {
      id: string
      name: string
      subject: string
    }
  }>
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && params.id) {
      fetchStudent()
    }
  }, [user, params.id])

  const fetchStudent = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/students/${params.id}`)
      setStudent(response.data)
    } catch (error) {
      console.error('Error fetching student:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Loading student details...</div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!student) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Student not found</div>
          </div>
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
              href="/students"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="h-8 w-8" />
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Student Profile Details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {student.profileImage ? (
                      <img
                        src={student.profileImage}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="h-20 w-20 rounded-full"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <GraduationCap className="h-10 w-10 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{student.role}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Email</div>
                        <div className="text-sm text-gray-900 dark:text-white">{student.email}</div>
                      </div>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Phone</div>
                          <div className="text-sm text-gray-900 dark:text-white">{student.phone}</div>
                        </div>
                      </div>
                    )}
                    {student.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Location</div>
                          <div className="text-sm text-gray-900 dark:text-white">{student.location}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Joined</div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Academic Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <School className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">School</div>
                      <div className="text-sm text-gray-900 dark:text-white">{student.schoolName || 'N/A'}</div>
                    </div>
                  </div>
                  {student.educationLevel && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Student Type</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {student.educationLevel.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  {student.grade && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Grade</div>
                      <div className="text-sm text-gray-900 dark:text-white">{student.grade}</div>
                    </div>
                  )}
                  {student.yearOfStudy && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Year of Study</div>
                      <div className="text-sm text-gray-900 dark:text-white">Year {student.yearOfStudy}</div>
                    </div>
                  )}
                  {student.major && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Major/Course</div>
                      <div className="text-sm text-gray-900 dark:text-white">{student.major}</div>
                    </div>
                  )}
                  {student.studentId && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Student ID</div>
                      <div className="text-sm text-gray-900 dark:text-white">{student.studentId}</div>
                    </div>
                  )}
                  {student.expectedGraduation && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Expected Graduation</div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(student.expectedGraduation).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {student.studentProfile?.gpa && (
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">GPA</div>
                      <div className="text-sm text-gray-900 dark:text-white">{student.studentProfile.gpa}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements */}
              {student.studentProfile && student.studentProfile.achievements.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </h2>
                  <ul className="space-y-2">
                    {student.studentProfile.achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-gray-900 dark:text-white">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracurriculars */}
              {student.studentProfile && student.studentProfile.extracurriculars.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Extracurricular Activities
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {student.studentProfile.extracurriculars.map((activity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                      >
                        {activity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Career Goals */}
              {student.studentProfile?.careerGoals && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Career Goals</h2>
                  <p className="text-gray-700 dark:text-gray-300">{student.studentProfile.careerGoals}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Scholarship Applications */}
              {student.scholarshipApplications && student.scholarshipApplications.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Scholarship Applications</h3>
                  <div className="space-y-3">
                    {student.scholarshipApplications.map((app) => (
                      <div key={app.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {app.scholarship.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {app.scholarship.provider}
                        </div>
                        <div className="mt-2">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              app.status === 'APPROVED'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : app.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {app.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Groups */}
              {student.studyGroupMembers && student.studyGroupMembers.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Study Groups
                  </h3>
                  <div className="space-y-3">
                    {student.studyGroupMembers.map((member) => (
                      <div key={member.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.studyGroup.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {member.studyGroup.subject}
                        </div>
                        {member.role === 'LEADER' && (
                          <div className="mt-2">
                            <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              Leader
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

