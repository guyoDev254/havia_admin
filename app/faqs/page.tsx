'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Plus, Trash2, Edit2, Eye, EyeOff, Search, X } from 'lucide-react'

interface Faq {
  id: string
  question: string
  answer: string
  category?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function FaqsPage() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    isActive: true,
  })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user) {
      fetchFaqs()
    }
  }, [user])

  const fetchFaqs = async () => {
    try {
      setLoading(true)
      const response = await api.get('/faqs')
      setFaqs(response.data)
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      showError('Failed to Load FAQs', 'An error occurred while loading FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/faqs', formData)
      showSuccess('FAQ Created', 'The FAQ has been created successfully')
      setShowCreateModal(false)
      resetForm()
      fetchFaqs()
    } catch (error: any) {
      console.error('Error creating FAQ:', error)
      showError('Failed to Create FAQ', error.response?.data?.message || 'An error occurred while creating the FAQ')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingFaq) return

    try {
      await api.patch(`/faqs/${editingFaq.id}`, formData)
      showSuccess('FAQ Updated', 'The FAQ has been updated successfully')
      setEditingFaq(null)
      resetForm()
      fetchFaqs()
    } catch (error: any) {
      console.error('Error updating FAQ:', error)
      showError('Failed to Update FAQ', error.response?.data?.message || 'An error occurred while updating the FAQ')
    }
  }

  const handleDelete = async (faqId: string) => {
    const confirmed = await showConfirm(
      'Delete FAQ',
      'Are you sure you want to delete this FAQ?',
      'Yes, delete',
      'Cancel',
      '#dc2626',
      true
    )
    if (!confirmed) return

    try {
      await api.delete(`/faqs/${faqId}`)
      showSuccess('FAQ Deleted', 'The FAQ has been deleted successfully')
      fetchFaqs()
    } catch (error: any) {
      console.error('Error deleting FAQ:', error)
      showError('Failed to Delete FAQ', error.response?.data?.message || 'An error occurred while deleting the FAQ')
    }
  }

  const handleToggleActive = async (faq: Faq) => {
    try {
      await api.patch(`/faqs/${faq.id}`, { isActive: !faq.isActive })
      showSuccess('FAQ Updated', `FAQ has been ${!faq.isActive ? 'activated' : 'deactivated'}`)
      fetchFaqs()
    } catch (error: any) {
      console.error('Error updating FAQ:', error)
      showError('Failed to Update FAQ', error.response?.data?.message || 'An error occurred while updating the FAQ')
    }
  }

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      isActive: true,
    })
  }

  const openEditModal = (faq: Faq) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      isActive: faq.isActive,
    })
  }

  // Filter and sort FAQs
  const filteredAndSortedFaqs = useMemo(() => {
    let filtered = faqs
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query) ||
          (faq.category && faq.category.toLowerCase().includes(query))
      )
    }
    
    // Sort alphabetically by question
    return filtered.sort((a, b) => a.question.localeCompare(b.question))
  }, [faqs, searchQuery])

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingFaq(null)
    resetForm()
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading FAQs..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  if (!hasPermission(Permission.CREATE_CONTENT)) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">You don't have permission to manage FAQs</p>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">FAQs</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage frequently asked questions
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Create FAQ
          </button>
        </div>

          {(showCreateModal || editingFaq) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  {editingFaq ? 'Edit FAQ' : 'Create FAQ'}
                </h2>
                <form onSubmit={editingFaq ? handleUpdate : handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Question *
                    </label>
                    <textarea
                      required
                      value={formData.question}
                      onChange={(e) =>
                        setFormData({ ...formData, question: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Answer *
                    </label>
                    <textarea
                      required
                      value={formData.answer}
                      onChange={(e) =>
                        setFormData({ ...formData, answer: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      placeholder="e.g., General, Account, Mentorship"
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Active (visible to users)
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      {editingFaq ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search FAQs by question, answer, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Answer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAndSortedFaqs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        {searchQuery.trim()
                          ? 'No FAQs found matching your search.'
                          : 'No FAQs found. Create your first FAQ to get started.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedFaqs.map((faq) => (
                      <tr key={faq.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white max-w-md">
                            {faq.question}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 max-w-lg line-clamp-2">
                            {faq.answer}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {faq.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              faq.isActive
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(faq)}
                              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                              title={faq.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {faq.isActive ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openEditModal(faq)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(faq.id)
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

