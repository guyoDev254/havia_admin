'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ArrowLeft, Save } from 'lucide-react'

const EVENT_TYPES = ['WORKSHOP', 'MEETUP', 'CONFERENCE', 'WEBINAR', 'CHALLENGE', 'OTHER']
const EVENT_STATUSES = ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']

export default function CreateEventPage({ searchParams }: { searchParams?: { clubId?: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const { showError, showSuccess, showWarning } = useSweetAlert()
  const [loading, setLoading] = useState(false)
  const [clubId, setClubId] = useState<string | null>(null)
  const [clubName, setClubName] = useState<string>('')
  const [clubs, setClubs] = useState<Array<{ id: string; name: string }>>([])
  const [loadingClubs, setLoadingClubs] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    banner: '',
    type: 'WORKSHOP',
    status: 'UPCOMING',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    location: '',
    locationType: 'PHYSICAL',
    isOnline: false,
    onlineLink: '',
    maxAttendees: '',
    clubId: '',
    isPaid: false,
    price: '',
    currency: 'KES',
    paymentLink: '',
    tags: '',
    speakers: '',
    agenda: '',
    requirements: '',
    contactEmail: '',
    contactPhone: '',
  })

  useEffect(() => {
    // Fetch clubs list for dropdown
    const fetchClubs = async () => {
      try {
        setLoadingClubs(true)
        const response = await api.get('/admin/clubs?limit=1000')
        setClubs(response.data.clubs || [])
      } catch (error) {
        console.error('Error fetching clubs:', error)
      } finally {
        setLoadingClubs(false)
      }
    }

    fetchClubs()

    // Get clubId from URL search params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const clubIdParam = params.get('clubId') || searchParams?.clubId
      if (clubIdParam) {
        setClubId(clubIdParam)
        setFormData((prev) => ({ ...prev, clubId: clubIdParam }))
        // Fetch club name for display
        api.get(`/clubs/${clubIdParam}`)
          .then((response) => {
            setClubName(response.data.name)
          })
          .catch((error) => {
            console.error('Error fetching club:', error)
          })
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      showWarning('Validation Error', 'Please enter an event title')
      return
    }

    if (!formData.startDate) {
      showWarning('Validation Error', 'Please select a start date')
      return
    }

    if (formData.isPaid) {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        showWarning('Validation Error', 'Please enter a valid price for paid events')
        return
      }
      if (!formData.paymentLink?.trim()) {
        showWarning('Validation Error', 'Please provide a payment link for paid events')
        return
      }
    }

    if (formData.isOnline && !formData.onlineLink?.trim()) {
      showWarning('Validation Error', 'Please provide an online link for virtual events')
      return
    }

    try {
      setLoading(true)
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        image: formData.image.trim() || undefined,
        banner: formData.banner.trim() || undefined,
        type: formData.type,
        status: formData.status,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline).toISOString() : undefined,
        location: formData.location.trim() || undefined,
        locationType: formData.locationType,
        isOnline: formData.isOnline,
        onlineLink: formData.onlineLink.trim() || undefined,
        maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
        isPaid: formData.isPaid,
        price: formData.isPaid ? parseFloat(formData.price) : undefined,
        currency: formData.isPaid ? formData.currency : undefined,
        paymentLink: formData.isPaid ? formData.paymentLink.trim() : undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : undefined,
        speakers: formData.speakers ? formData.speakers.split(',').map(s => s.trim()).filter(s => s) : undefined,
        agenda: formData.agenda.trim() || undefined,
        requirements: formData.requirements.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
      }

      // Only include clubId if it's provided (club events)
      // If no clubId, it's a Havia-hosted platform event
      if (formData.clubId && formData.clubId.trim()) {
        payload.clubId = formData.clubId.trim()
        // Use the club-specific endpoint for club events
        await api.post(`/events/clubs/${formData.clubId.trim()}`, payload)
      } else {
        // Use general endpoint for Havia events (no club)
        // Don't include clubId in payload for Havia events
        await api.post('/events', payload)
      }
      await showSuccess('Event Created', 'Event created successfully!')
      router.push('/events')
    } catch (error: any) {
      console.error('Error creating event:', error)
      showError('Failed to Create Event', error.response?.data?.message || error.message || 'An error occurred while creating the event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Event</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {clubName ? `Create event for ${clubName}` : 'Create a new event or workshop'}
                </p>
              </div>
            </div>
          </div>

          {/* Club Selection Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Associated Club (Optional)
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {clubId || formData.clubId
                ? 'This event is for a specific club.' 
                : 'Leave empty to create a Havia-hosted platform event. Select a club to create a club-specific event.'}
            </p>
            {clubId ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Club:</strong> {clubName || 'Loading...'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setClubId(null)
                    setClubName('')
                    setFormData((prev) => ({ ...prev, clubId: '' }))
                  }}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Change to Havia event (remove club association)
                </button>
              </div>
            ) : (
              <select
                value={formData.clubId}
                onChange={(e) => {
                  const selectedClubId = e.target.value
                  setFormData({ ...formData, clubId: selectedClubId })
                  if (selectedClubId) {
                    const selectedClub = clubs.find(c => c.id === selectedClubId)
                    if (selectedClub) {
                      setClubId(selectedClubId)
                      setClubName(selectedClub.name)
                    }
                  }
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                disabled={loadingClubs}
              >
                <option value="">-- Havia Event (No Club) --</option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Python Workshop"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your event..."
              />
            </div>

            {/* Image and Banner */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Image URL (Square/Thumbnail)
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Banner URL (Wide Banner)
                </label>
                <input
                  type="url"
                  value={formData.banner}
                  onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                >
                  {EVENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Registration Deadline
                </label>
                <input
                  type="datetime-local"
                  value={formData.registrationDeadline}
                  onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location Type
              </label>
              <select
                value={formData.locationType}
                onChange={(e) => {
                  const newType = e.target.value
                  setFormData({ 
                    ...formData, 
                    locationType: newType,
                    isOnline: newType === 'ONLINE' || newType === 'HYBRID'
                  })
                }}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="PHYSICAL">Physical</option>
                <option value="ONLINE">Online</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            {/* Online Link or Location */}
            {(formData.locationType === 'ONLINE' || formData.locationType === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Online Link {formData.locationType === 'ONLINE' ? '*' : ''}
                </label>
                <input
                  type="url"
                  required={formData.locationType === 'ONLINE'}
                  value={formData.onlineLink}
                  onChange={(e) => setFormData({ ...formData, onlineLink: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            )}
            {(formData.locationType === 'PHYSICAL' || formData.locationType === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Physical Location {formData.locationType === 'PHYSICAL' ? '*' : ''}
                </label>
                <input
                  type="text"
                  required={formData.locationType === 'PHYSICAL'}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., NorthernBox HQ, Nairobi"
                />
              </div>
            )}

            {/* Max Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Attendees
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                placeholder="Leave empty for unlimited"
              />
            </div>

            {/* Paid/Free Toggle */}
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Paid Event
              </label>
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
            </div>

            {/* Payment Fields */}
            {formData.isPaid && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required={formData.isPaid}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="KES">KES</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Link *
                  </label>
                  <input
                    type="url"
                    required={formData.isPaid}
                    value={formData.paymentLink}
                    onChange={(e) => setFormData({ ...formData, paymentLink: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    placeholder="M-Pesa, PayPal, Stripe, etc."
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Provide a link where attendees can make payment
                  </p>
                </div>
              </>
            )}

            {/* Additional Event Details */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Details</h3>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., tech, workshop, python, beginner"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Speakers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speakers (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.speakers}
                  onChange={(e) => setFormData({ ...formData, speakers: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., John Doe, Jane Smith"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  List speaker names separated by commas
                </p>
              </div>

              {/* Agenda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agenda/Schedule
                </label>
                <textarea
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Event schedule and agenda..."
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requirements
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Bring laptop, basic Python knowledge, etc."
                />
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    placeholder="events@northernbox.co.ke"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                    placeholder="+254712345678"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


