'use client'

import { useState } from 'react'

interface StatusUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string | null
  status: 'APPROVED' | 'REJECTED' | null
  onConfirm: (id: string, status: string, reason?: string, nextInstructions?: string) => Promise<void>
  title?: string
}

export default function StatusUpdateModal({
  isOpen,
  onClose,
  applicationId,
  status,
  onConfirm,
  title,
}: StatusUpdateModalProps) {
  const [reason, setReason] = useState('')
  const [nextInstructions, setNextInstructions] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const isApproved = status === 'APPROVED'
  const defaultTitle = isApproved ? 'Approve application' : 'Reject application'
  const displayTitle = title ?? defaultTitle

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!applicationId || !status) return
    setSubmitting(true)
    try {
      await onConfirm(
        applicationId,
        status,
        reason.trim() || undefined,
        nextInstructions.trim() || undefined,
      )
      setReason('')
      setNextInstructions('')
      onClose()
    } catch (err) {
      // caller may show alert
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!submitting) {
      setReason('')
      setNextInstructions('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 id="status-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">{displayTitle}</h3>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 disabled:opacity-50"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Optional: add a reason and next steps. These will be included in the email sent to the applicant.
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reason / message to applicant (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isApproved ? "e.g. Strong motivation and clear goals" : "e.g. Limited spots this round; we encourage you to reapply"}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Next instructions (optional)
              </label>
              <textarea
                value={nextInstructions}
                onChange={(e) => setNextInstructions(e.target.value)}
                placeholder={isApproved ? "e.g. Check your email within 48 hours for access details. Complete the form by Friday." : "e.g. Next application window opens in March. Visit northernbox.co.ke/scholarships."}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
              />
            </div>
          </div>
          <div className="p-6 pt-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${isApproved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {submitting ? 'Updating...' : isApproved ? 'Approve' : 'Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
