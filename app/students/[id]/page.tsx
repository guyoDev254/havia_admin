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
  studentGoals?: Array<{
    id: string
    title: string
    description?: string
    status: string
    targetDate?: string
    completedAt?: string
  }>
  _count?: {
    clubs?: number
    userBadges?: number
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
  courses?: Array<{
    id: string
    courseCode: string
    courseName: string
    instructor?: string
    credits?: number
    semester?: string
    academicYear?: string
    status: string
    finalGrade?: number
    grades: Array<{
      id: string
      title: string
      grade: number
      maxGrade: number
      gradedAt?: string
    }>
    assignments: Array<{
      id: string
      title: string
      status: string
      dueDate: string
    }>
    _count: {
      grades: number
      assignments: number
    }
  }>
  assignments?: Array<{
    id: string
    title: string
    status: string
    dueDate: string
    grade?: number
    course?: {
      id: string
      courseCode: string
      courseName: string
    }
  }>
  studySessions?: Array<{
    id: string
    subject?: string
    startTime: string
    duration: number
    course?: {
      id: string
      courseCode: string
      courseName: string
    }
  }>
  academicCalendarEvents?: Array<{
    id: string
    title: string
    eventType: string
    startDate: string
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

              {/* Student Goals */}
              {student.studentGoals && student.studentGoals.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Goals ({student.studentGoals.length})
                  </h3>
                  <div className="space-y-3">
                    {student.studentGoals.slice(0, 5).map((goal: any) => (
                      <div key={goal.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{goal.title}</div>
                            {goal.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{goal.description}</div>
                            )}
                            {goal.targetDate && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Target: {new Date(goal.targetDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              goal.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : goal.status === 'IN_PROGRESS'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : goal.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {goal.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                    {student.studentGoals.length > 5 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                        +{student.studentGoals.length - 5} more goals
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Courses */}
              {student.courses && student.courses.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Courses ({student.courses.length})
                  </h3>
                  <div className="space-y-3">
                    {student.courses.slice(0, 5).map((course: any) => (
                      <div key={course.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {course.courseCode} - {course.courseName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {course._count.grades} grades • {course._count.assignments} assignments
                        </div>
                        {course.finalGrade !== null && course.finalGrade !== undefined && (
                          <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
                            Grade: {course.finalGrade.toFixed(1)}
                          </div>
                        )}
                      </div>
                    ))}
                    {student.courses.length > 5 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{student.courses.length - 5} more courses
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recent Assignments */}
              {student.assignments && student.assignments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Assignments</h3>
                  <div className="space-y-3">
                    {student.assignments.slice(0, 5).map((assignment: any) => (
                      <div key={assignment.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {assignment.title}
                        </div>
                        {assignment.course && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {assignment.course.courseCode}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              assignment.status === 'GRADED'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : assignment.status === 'SUBMITTED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {assignment.status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Statistics */}
              {student.studySessions && student.studySessions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Study Activity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {student.studySessions.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Study Hours</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {(student.studySessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / 60).toFixed(1)}h
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Engagement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Clubs Joined</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {student._count?.clubs || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Badges Earned</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {student._count?.userBadges || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Scholarship Applications</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {student.scholarshipApplications?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Study Groups</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {student.studyGroupMembers?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

