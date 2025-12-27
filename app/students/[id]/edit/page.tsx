'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { Permission } from '@/hooks/usePermissions'
import { GraduationCap, ArrowLeft, Save, Mail, Phone, MapPin, School, Calendar } from 'lucide-react'
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
  isActive?: boolean
  studentProfile?: {
    gpa?: number
    achievements: string[]
    extracurriculars: string[]
    careerGoals?: string
  }
}

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    educationLevel: 'UNIVERSITY' as 'SECONDARY' | 'TVET' | 'UNIVERSITY' | 'OUT_OF_SCHOOL',
    schoolName: '',
    grade: '',
    yearOfStudy: '',
    major: '',
    studentId: '',
    expectedGraduation: '',
    isActive: true,
    gpa: '',
    achievements: [] as string[],
    extracurriculars: [] as string[],
    careerGoals: '',
  })
  const [newAchievement, setNewAchievement] = useState('')
  const [newExtracurricular, setNewExtracurricular] = useState('')

  useEffect(() => {
    if (user && params.id) {
      fetchStudent()
    }
  }, [user, params.id])

  const fetchStudent = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/students/${params.id}`)
      const studentData = response.data
      setStudent(studentData)
      setFormData({
        firstName: studentData.firstName || '',
        lastName: studentData.lastName || '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        location: studentData.location || '',
        educationLevel: studentData.educationLevel || 'UNIVERSITY',
        schoolName: studentData.schoolName || '',
        grade: studentData.grade || '',
        yearOfStudy: studentData.yearOfStudy?.toString() || '',
        major: studentData.major || '',
        studentId: studentData.studentId || '',
        expectedGraduation: studentData.expectedGraduation
          ? new Date(studentData.expectedGraduation).toISOString().split('T')[0]
          : '',
        isActive: studentData.isActive !== false,
        gpa: studentData.studentProfile?.gpa?.toString() || '',
        achievements: studentData.studentProfile?.achievements || [],
        extracurriculars: studentData.studentProfile?.extracurriculars || [],
        careerGoals: studentData.studentProfile?.careerGoals || '',
      })
    } catch (error) {
      console.error('Error fetching student:', error)
      alert('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.put(`/admin/users/${params.id}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        educationLevel: formData.educationLevel,
        schoolName: formData.schoolName || undefined,
        grade: formData.grade || undefined,
        yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : undefined,
        major: formData.major || undefined,
        studentId: formData.studentId || undefined,
        expectedGraduation: formData.expectedGraduation || undefined,
        isActive: formData.isActive,
        gpa: formData.gpa ? parseFloat(formData.gpa) : undefined,
        achievements: formData.achievements,
        extracurriculars: formData.extracurriculars,
        careerGoals: formData.careerGoals || undefined,
      })
      alert('Student updated successfully')
      router.push(`/students/${params.id}`)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update student')
    } finally {
      setSaving(false)
    }
  }

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setFormData({
        ...formData,
        achievements: [...formData.achievements, newAchievement.trim()],
      })
      setNewAchievement('')
    }
  }

  const removeAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter((_, i) => i !== index),
    })
  }

  const addExtracurricular = () => {
    if (newExtracurricular.trim()) {
      setFormData({
        ...formData,
        extracurriculars: [...formData.extracurriculars, newExtracurricular.trim()],
      })
      setNewExtracurricular('')
    }
  }

  const removeExtracurricular = (index: number) => {
    setFormData({
      ...formData,
      extracurriculars: formData.extracurriculars.filter((_, i) => i !== index),
    })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="p-6">
            <div className="text-center text-gray-500">Loading student data...</div>
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
      <PermissionGuard permission={Permission.MANAGE_USERS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/students/${params.id}`}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-8 w-8" />
                    Edit Student
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {student.firstName} {student.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Account</span>
                  </label>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Academic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Education Level *
                  </label>
                  <select
                    value={formData.educationLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, educationLevel: e.target.value as any })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="SECONDARY">Secondary</option>
                    <option value="TVET">TVET</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="OUT_OF_SCHOOL">Out of School</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {formData.educationLevel === 'SECONDARY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      placeholder="e.g., Form 4, Grade 12"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
                {(formData.educationLevel === 'UNIVERSITY' || formData.educationLevel === 'TVET') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Year of Study
                      </label>
                      <input
                        type="number"
                        value={formData.yearOfStudy}
                        onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Major/Course
                      </label>
                      <input
                        type="text"
                        value={formData.major}
                        onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Graduation
                  </label>
                  <input
                    type="date"
                    value={formData.expectedGraduation}
                    onChange={(e) => setFormData({ ...formData, expectedGraduation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gpa}
                    onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
                <div className="space-y-2">
                  {formData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">{achievement}</span>
                      <button
                        onClick={() => removeAchievement(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                    placeholder="Add achievement"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={addAchievement}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Extracurriculars & Career Goals */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Extracurricular Activities</h2>
                <div className="space-y-2">
                  {formData.extracurriculars.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-900 dark:text-white">{activity}</span>
                      <button
                        onClick={() => removeExtracurricular(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExtracurricular}
                    onChange={(e) => setNewExtracurricular(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addExtracurricular()}
                    placeholder="Add activity"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={addExtracurricular}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Career Goals
                  </label>
                  <textarea
                    value={formData.careerGoals}
                    onChange={(e) => setFormData({ ...formData, careerGoals: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

