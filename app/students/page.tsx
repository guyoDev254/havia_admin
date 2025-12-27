'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { GraduationCap, Search, Filter, Eye, Mail, Phone, MapPin, School, Calendar, BarChart3, Download, UserX, UserCheck, Edit, Trash2, MoreVertical } from 'lucide-react'
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
  createdAt: string
  studentProfile?: {
    gpa?: number
    achievements: string[]
    extracurriculars: string[]
  }
  isActive?: boolean
}

export default function StudentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [educationLevelFilter, setEducationLevelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user) {
      fetchStudents()
    }
  }, [user, page, search, educationLevelFilter, statusFilter, sortBy, sortOrder])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        limit: 20,
      }
      if (search) params.search = search
      if (educationLevelFilter !== 'all') params.educationLevel = educationLevelFilter
      if (statusFilter !== 'all') params.status = statusFilter
      if (sortBy) params.sortBy = sortBy
      if (sortOrder) params.sortOrder = sortOrder

      const response = await api.get('/admin/students', { params })
      setStudents(response.data.students)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEducationLevelBadge = (type?: string) => {
    if (!type) return null
    const colors: Record<string, string> = {
      SECONDARY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      TVET: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      UNIVERSITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      OUT_OF_SCHOOL: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    }
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
        {type.replace('_', ' ')}
      </span>
    )
  }

  const handleSuspend = async (studentId: string) => {
    if (!confirm('Are you sure you want to suspend this student?')) return
    try {
      await api.post(`/admin/users/${studentId}/suspend`, { reason: 'Suspended by admin' })
      alert('Student suspended successfully')
      fetchStudents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to suspend student')
    }
  }

  const handleActivate = async (studentId: string) => {
    try {
      await api.post(`/admin/users/${studentId}/activate`)
      alert('Student activated successfully')
      fetchStudents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to activate student')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select students to delete')
      return
    }
    if (!confirm(`Are you sure you want to delete ${selectedStudents.size} student(s)?`)) return
    try {
      await Promise.all(Array.from(selectedStudents).map(id => api.delete(`/admin/users/${id}`)))
      alert('Students deleted successfully')
      setSelectedStudents(new Set())
      fetchStudents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete students')
    }
  }

  const toggleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.VIEW_USERS}>
        <Layout>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="h-8 w-8" />
                  Students Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all student accounts and profiles</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/students/analytics"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
                <button
                  onClick={async () => {
                    try {
                      const response = await api.get('/admin/students/export', { responseType: 'blob' })
                      const url = window.URL.createObjectURL(new Blob([response.data]))
                      const link = document.createElement('a')
                      link.href = url
                      link.setAttribute('download', `students-export-${new Date().toISOString().split('T')[0]}.csv`)
                      document.body.appendChild(link)
                      link.click()
                      link.remove()
                    } catch (error) {
                      console.error('Error exporting students:', error)
                      alert('Failed to export students')
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {students.length}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">High School</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {students.filter(s => s.educationLevel === 'SECONDARY').length}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">University</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {students.filter(s => s.educationLevel === 'UNIVERSITY').length}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Graduate</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {students.filter(s => s.educationLevel === 'OUT_OF_SCHOOL').length}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={educationLevelFilter}
                    onChange={(e) => {
                      setEducationLevelFilter(e.target.value)
                      setPage(1)
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="TVET">TVET</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="OUT_OF_SCHOOL">Out of school</option>
                  </select>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value)
                    setPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Sort by: Join Date</option>
                  <option value="firstName">Sort by: Name</option>
                  <option value="schoolName">Sort by: School</option>
                </select>
                <button
                  onClick={() => {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                    setPage(1)
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedStudents.size > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedStudents.size} student(s) selected
                </span>
                <div className="flex gap-2">
                  <PermissionGuard permission={Permission.MANAGE_USERS}>
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Selected
                    </button>
                  </PermissionGuard>
                  <button
                    onClick={() => setSelectedStudents(new Set())}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading students...</div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No students found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedStudents.size === students.length && students.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          School
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Details
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => toggleSelectStudent(student.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {student.profileImage ? (
                                <img
                                  src={student.profileImage}
                                  alt={`${student.firstName} ${student.lastName}`}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <GraduationCap className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {student.email}
                                </div>
                                {student.phone && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {student.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1">
                              <School className="h-4 w-4" />
                              {student.schoolName || 'N/A'}
                            </div>
                            {student.major && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{student.major}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getEducationLevelBadge(student.educationLevel)}
                            {student.grade && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {student.grade}
                              </div>
                            )}
                            {student.yearOfStudy && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Year {student.yearOfStudy}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {student.studentProfile && (
                              <div className="text-sm text-gray-900 dark:text-white">
                                {student.studentProfile.gpa && (
                                  <div>GPA: {student.studentProfile.gpa}</div>
                                )}
                                {student.studentProfile.achievements.length > 0 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {student.studentProfile.achievements.length} achievements
                                  </div>
                                )}
                              </div>
                            )}
                            {student.location && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {student.location}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                student.isActive !== false
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {student.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/students/${student.id}`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <PermissionGuard permission={Permission.MANAGE_USERS}>
                                <Link
                                  href={`/students/${student.id}/edit`}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </PermissionGuard>
                              <PermissionGuard permission={Permission.SUSPEND_USERS}>
                                {student.isActive !== false ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSuspend(student.id)
                                    }}
                                    className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                                    title="Suspend"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleActivate(student.id)
                                    }}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                    title="Activate"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </button>
                                )}
                              </PermissionGuard>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

