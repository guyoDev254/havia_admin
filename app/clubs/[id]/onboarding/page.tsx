'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle,
  Clock,
  UserPlus,
  FileText,
  Settings,
  Zap,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

interface OnboardingTemplate {
  id: string
  name: string
  subject: string
  message: string
  trigger: 'immediate' | '1_day' | '3_days' | '7_days'
  isActive: boolean
}

interface OnboardingWorkflow {
  id: string
  name: string
  description: string
  steps: Array<{
    id: string
    type: 'email' | 'notification' | 'task'
    title: string
    content: string
    delay: number
  }>
  isActive: boolean
}

export default function ClubOnboardingPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useSweetAlert()
  const clubId = params.id as string

  const [templates, setTemplates] = useState<OnboardingTemplate[]>([])
  const [workflows, setWorkflows] = useState<OnboardingWorkflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [clubName, setClubName] = useState('')
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    message: '',
    trigger: 'immediate' as 'immediate' | '1_day' | '3_days' | '7_days',
  })
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    if (user && clubId) {
      fetchOnboardingData()
      fetchClubName()
    }
  }, [user, clubId])

  const fetchClubName = async () => {
    try {
      const response = await api.get(`/clubs/${clubId}`)
      setClubName(response.data.name)
    } catch (error) {
      console.error('Error fetching club name:', error)
    }
  }

  const fetchOnboardingData = async () => {
    try {
      setLoading(true)
      // Fetch templates and workflows
      const templatesResponse = await api.get(`/clubs/${clubId}/onboarding/templates`).catch(() => ({ data: [] }))
      const workflowsResponse = await api.get(`/clubs/${clubId}/onboarding/workflows`).catch(() => ({ data: [] }))

      setTemplates(templatesResponse.data || [])
      setWorkflows(workflowsResponse.data || [])
    } catch (error: any) {
      console.error('Error fetching onboarding data:', error)
      showError('Failed to Load Data', error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.subject.trim() || !newTemplate.message.trim()) {
      showError('Validation Error', 'Please fill in all fields')
      return
    }

    try {
      await api.post(`/clubs/${clubId}/onboarding/templates`, newTemplate)
      showSuccess('Template Created', 'The onboarding template has been created successfully')
      setNewTemplate({ name: '', subject: '', message: '', trigger: 'immediate' })
      setShowTemplateModal(false)
      fetchOnboardingData()
    } catch (error: any) {
      showError('Failed to Create Template', error.response?.data?.message || 'An error occurred')
    }
  }

  const handleToggleTemplate = async (templateId: string, isActive: boolean) => {
    try {
      await api.put(`/clubs/${clubId}/onboarding/templates/${templateId}`, { isActive: !isActive })
      showSuccess('Template Updated', 'The template status has been updated')
      fetchOnboardingData()
    } catch (error: any) {
      showError('Failed to Update Template', error.response?.data?.message || 'An error occurred')
    }
  }

  const handleSendWelcomeMessage = async () => {
    const confirmed = await showConfirm(
      'Send Welcome Message',
      'Send a welcome message to all new members (joined in last 7 days)?',
      'Yes, send',
      'Cancel'
    )
    if (!confirmed) return

    try {
      await api.post(`/clubs/${clubId}/onboarding/send-welcome`)
      showSuccess('Welcome Messages Sent', 'Welcome messages have been sent to new members')
    } catch (error: any) {
      showError('Failed to Send Messages', error.response?.data?.message || 'An error occurred')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <LoadingSpinner message="Loading onboarding settings..." showProgress={true} fullScreen={false} />
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/clubs/${clubId}`}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Member Onboarding</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{clubName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSendWelcomeMessage}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                Send Welcome to New Members
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FileText className="h-4 w-4" />
                New Template
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Active Templates</p>
                  <p className="text-3xl font-bold mt-1">
                    {templates.filter((t) => t.isActive).length}
                  </p>
                </div>
                <FileText className="h-12 w-12 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Workflows</p>
                  <p className="text-3xl font-bold mt-1">
                    {workflows.filter((w) => w.isActive).length}
                  </p>
                </div>
                <Zap className="h-12 w-12 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Templates</p>
                  <p className="text-3xl font-bold mt-1">{templates.length}</p>
                </div>
                <Settings className="h-12 w-12 opacity-80" />
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Onboarding Templates</h2>
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No templates yet. Create your first onboarding template!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-lg border ${
                      template.isActive
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                          {template.isActive ? (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Trigger: {template.trigger === 'immediate' ? 'Immediate' : `${template.trigger.replace('_', ' ')} after join`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleTemplate(template.id, template.isActive)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          template.isActive
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200'
                        }`}
                      >
                        {template.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Default Welcome Template */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Default Welcome Template</h2>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Subject:</strong> Welcome to {clubName}!
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                <strong>Message:</strong> We're excited to have you join our community! Get started by exploring our
                events, programs, and connecting with other members.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This template is automatically sent to all new members when they join.
              </p>
            </div>
          </div>
        </div>

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Onboarding Template</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., Welcome Email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Welcome to [Club Name]!"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Message
                  </label>
                  <textarea
                    value={newTemplate.message}
                    onChange={(e) => setNewTemplate({ ...newTemplate, message: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Your welcome message..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Send Timing
                  </label>
                  <select
                    value={newTemplate.trigger}
                    onChange={(e) => setNewTemplate({ ...newTemplate, trigger: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="immediate">Immediately when member joins</option>
                    <option value="1_day">1 day after joining</option>
                    <option value="3_days">3 days after joining</option>
                    <option value="7_days">7 days after joining</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowTemplateModal(false)
                      setNewTemplate({ name: '', subject: '', message: '', trigger: 'immediate' })
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}

