'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import PermissionGuard from '@/components/PermissionGuard'
import { MessageSquare, ArrowLeft, Send, User, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Message {
  id: string
  content: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    role: string
  }
  receiver: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
    role: string
  }
}

interface UserInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  profileImage?: string
  role: string
}

export default function MessageThreadPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const userId = params.userId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyText, setReplyText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user && hasPermission(Permission.MODERATE_CHATS) && userId) {
      fetchMessages()
    }
  }, [user, userId])

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/users/${userId}/messages`)
      const fetchedMessages = response.data.messages || []
      setMessages(fetchedMessages)

      // Determine the other user (not the current admin)
      if (fetchedMessages.length > 0) {
        const firstMessage = fetchedMessages[0]
        const otherUserId = firstMessage.sender.id === user?.id ? firstMessage.receiver.id : firstMessage.sender.id
        const otherUserInfo = firstMessage.sender.id === user?.id ? firstMessage.receiver : firstMessage.sender
        
        // Fetch full user info
        try {
          const userResponse = await api.get(`/admin/users/${otherUserId}`)
          setOtherUser(userResponse.data)
        } catch {
          // Fallback to message user info
          setOtherUser(otherUserInfo)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !userId || sending) return

    try {
      setSending(true)
      await api.post(`/admin/users/${userId}/message`, {
        message: replyText.trim(),
      })
      
      setReplyText('')
      // Refresh messages to show the new reply
      await fetchMessages()
    } catch (error) {
      console.error('Error sending reply:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      PLATFORM_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      MODERATOR: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    }
    return colors[role] || colors.MEMBER
  }

  const isAdminMessage = (message: Message) => {
    const adminRoles = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'ADMIN', 'MODERATOR', 'COMMUNITY_MANAGER', 'SUPPORT_ADMIN']
    return adminRoles.includes(message.sender.role)
  }

  return (
    <ProtectedRoute>
      <PermissionGuard permission={Permission.MODERATE_CHATS}>
        <Layout>
          <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/messages"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Link>
                {otherUser ? (
                  <div className="flex items-center gap-3 flex-1">
                    {otherUser.profileImage ? (
                      <img
                        src={otherUser.profileImage}
                        alt={otherUser.firstName}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {otherUser.firstName} {otherUser.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {otherUser.email}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${getRoleBadgeColor(otherUser.role)}`}>
                      {otherUser.role}
                    </span>
                  </div>
                ) : (
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Loading...
                  </div>
                )}
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-2">Start the conversation by sending a message</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {messages.map((message) => {
                    const isFromAdmin = message.sender.id === user?.id || isAdminMessage(message)
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isFromAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 ${
                            isFromAdmin
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!isFromAdmin && (
                              <div>
                                {message.sender.profileImage ? (
                                  <img
                                    src={message.sender.profileImage}
                                    alt={message.sender.firstName}
                                    className="h-8 w-8 rounded-full"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-medium ${
                                  isFromAdmin ? 'text-blue-100' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {message.sender.firstName} {message.sender.lastName}
                                </span>
                                {isAdminMessage(message) && (
                                  <span className={`px-2 py-0.5 text-xs rounded ${
                                    isFromAdmin 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  }`}>
                                    Admin
                                  </span>
                                )}
                              </div>
                              <div className={`whitespace-pre-wrap ${
                                isFromAdmin ? 'text-white' : 'text-gray-900 dark:text-white'
                              }`}>
                                {message.content}
                              </div>
                              <div className={`text-xs mt-2 ${
                                isFromAdmin ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                {message.isRead && !isFromAdmin && (
                                  <span className="ml-2">✓ Read</span>
                                )}
                              </div>
                            </div>
                            {isFromAdmin && (
                              <div>
                                {message.sender.profileImage ? (
                                  <img
                                    src={message.sender.profileImage}
                                    alt={message.sender.firstName}
                                    className="h-8 w-8 rounded-full"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                                    <User className="h-4 w-4 text-white" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Messages are encrypted and stored securely
                </p>
              </div>
            </div>
          </div>
        </Layout>
      </PermissionGuard>
    </ProtectedRoute>
  )
}

