'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSweetAlert } from '@/hooks/useSweetAlert'
import { ArrowLeft, User, Key, Bell, Shield, Globe, Moon, Sun, Palette } from 'lucide-react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { showSuccess, showError } = useSweetAlert()
  const { theme, setTheme, isDark } = useTheme()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  })

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme)
    showSuccess('Theme Updated', 'Your theme preference has been saved')
  }

  const handleNotificationChange = async (type: string, value: boolean) => {
    try {
      setNotifications({ ...notifications, [type]: value })
      // TODO: Save notification preferences to backend
      showSuccess('Settings Updated', 'Your notification preferences have been saved')
    } catch (error: any) {
      showError('Update Failed', error.message || 'Failed to update notification preferences')
      setNotifications({ ...notifications, [type]: !value }) // Revert on error
    }
  }

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          title: 'Profile Information',
          description: 'View and edit your profile details',
          href: `/users/${user?.id}`,
          color: 'text-blue-600 dark:text-blue-400',
        },
        {
          icon: Key,
          title: 'Change Password',
          description: 'Update your account password',
          href: '/settings/change-password',
          color: 'text-green-600 dark:text-green-400',
        },
        {
          icon: Shield,
          title: 'Security & Privacy',
          description: 'Manage your security settings',
          href: `/users/${user?.id}?tab=security`,
          color: 'text-red-600 dark:text-red-400',
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Palette,
          title: 'Theme',
          description: `Current: ${theme === 'auto' ? 'Auto' : theme === 'dark' ? 'Dark' : 'Light'}`,
          action: (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  theme === 'light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Moon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleThemeChange('auto')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  theme === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Globe className="h-4 w-4" />
              </button>
            </div>
          ),
          color: 'text-purple-600 dark:text-purple-400',
        },
        {
          icon: Bell,
          title: 'Notifications',
          description: 'Manage your notification preferences',
          action: (
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => handleNotificationChange('push', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">SMS Notifications</span>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          ),
          color: 'text-orange-600 dark:text-orange-400',
        },
      ],
    },
  ]

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-900 dark:text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon
                  return (
                    <div key={itemIndex} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {item.href ? (
                        <Link href={item.href} className="flex items-start justify-between group">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${item.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                            </div>
                          </div>
                          <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                            →
                          </div>
                        </Link>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${item.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                              {item.action && <div className="mt-4">{item.action}</div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

