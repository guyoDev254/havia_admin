'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { usePermissions, Permission } from '@/hooks/usePermissions'
import Link from 'next/link'
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Calendar,
  Award,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Bell,
  Settings,
  Moon,
  Sun,
  Shield,
  BarChart3,
  FileText,
  HeartHandshake,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Users2,
  Trophy,
  ChevronDown,
  ChevronRight,
  History,
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  permission: Permission
  section?: string
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
  defaultOpen?: boolean
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: Permission.VIEW_ANALYTICS },
      { name: 'Analytics', href: '/analytics', icon: BarChart3, permission: Permission.VIEW_ANALYTICS },
    ],
    defaultOpen: true,
  },
  {
    title: 'User Management',
    items: [
      { name: 'Users', href: '/users', icon: Users, permission: Permission.VIEW_USERS },
    ],
    defaultOpen: true,
  },
  {
    title: 'Students',
    items: [
      { name: 'Students', href: '/students', icon: GraduationCap, permission: Permission.VIEW_USERS },
      { name: 'Applications', href: '/students/applications', icon: FileText, permission: Permission.VIEW_USERS },
      { name: 'Analytics', href: '/students/analytics', icon: BarChart3, permission: Permission.VIEW_ANALYTICS },
      { name: 'Scholarships', href: '/students/scholarships', icon: Trophy, permission: Permission.CREATE_CONTENT },
      { name: 'Study Groups', href: '/students/study-groups', icon: Users2, permission: Permission.VIEW_ANALYTICS },
      { name: 'Resources', href: '/students/resources', icon: BookOpen, permission: Permission.CREATE_CONTENT },
    ],
    defaultOpen: true,
  },
  {
    title: 'Community',
    items: [
      { name: 'Clubs', href: '/clubs', icon: UsersRound, permission: Permission.MANAGE_CLUBS },
      { name: 'Club Managers', href: '/clubs/managers', icon: Users, permission: Permission.MANAGE_CLUBS },
      { name: 'Community Partners', href: '/community-partners', icon: Users, permission: Permission.APPROVE_CLUBS },
      { name: 'Events', href: '/events', icon: Calendar, permission: Permission.MANAGE_EVENTS },
    ],
    defaultOpen: true,
  },
  {
    title: 'Mentorship',
    items: [
      { name: 'Overview', href: '/mentorships', icon: TrendingUp, permission: Permission.MANAGE_MENTORSHIP },
      { name: 'Automation', href: '/mentorships/automation', icon: Settings, permission: Permission.MANAGE_MENTORSHIP },
      { name: 'Mentors', href: '/mentorships/mentors', icon: Users, permission: Permission.APPROVE_MENTORS },
      { name: 'Mentees', href: '/mentorships/mentees', icon: Users, permission: Permission.REVIEW_MENTEE_APPLICATIONS },
      { name: 'Cycles', href: '/mentorships/cycles', icon: Calendar, permission: Permission.LAUNCH_MENTORSHIP_PROGRAMS },
    ],
    defaultOpen: true,
  },
  {
    title: 'Content & Engagement',
    items: [
      { name: 'Content', href: '/content', icon: FileText, permission: Permission.CREATE_CONTENT },
      { name: 'Posts', href: '/posts', icon: FileText, permission: Permission.MODERATE_POSTS },
      { name: 'Badges', href: '/badges', icon: Award, permission: Permission.MANAGE_RESOURCES },
    ],
    defaultOpen: true,
  },
  {
    title: 'Moderation & Safety',
    items: [
      { name: 'Moderation', href: '/moderation', icon: Shield, permission: Permission.MODERATE_POSTS },
      { name: 'Messages', href: '/messages', icon: MessageSquare, permission: Permission.MODERATE_CHATS },
    ],
    defaultOpen: true,
  },
  {
    title: 'Partnerships',
    items: [
      { name: 'Partnerships', href: '/partnerships', icon: HeartHandshake, permission: Permission.MANAGE_PARTNERSHIPS },
    ],
    defaultOpen: true,
  },
  {
    title: 'System',
    items: [
      { name: 'Notifications', href: '/notifications', icon: Bell, permission: Permission.SEND_BROADCASTS },
      { name: 'Audit Logs', href: '/audit-logs', icon: History, permission: Permission.VIEW_USERS },
    ],
    defaultOpen: true,
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { hasPermission, isSuperAdmin } = usePermissions()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    navigationSections.forEach((section) => {
      initial[section.title] = section.defaultOpen ?? false
    })
    return initial
  })

  // Filter navigation sections based on permissions
  const filteredSections = useMemo(() => {
    return navigationSections.map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isSuperAdmin()) return true
        return hasPermission(item.permission)
      }),
    })).filter((section) => section.items.length > 0)
  }, [hasPermission, isSuperAdmin])

  const isSectionActive = useCallback((section: NavigationSection) => {
    return section.items.some(
      (item) => pathname === item.href || pathname?.startsWith(item.href + '/')
    )
  }, [pathname])

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Auto-expand sections with active items
  useEffect(() => {
    filteredSections.forEach((section) => {
      if (isSectionActive(section)) {
        setExpandedSections((prev) => {
          if (prev[section.title]) return prev
          return {
            ...prev,
            [section.title]: true,
          }
        })
      }
    })
  }, [pathname, filteredSections, isSectionActive])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
        <div className={`fixed inset-y-0 left-0 flex w-72 flex-col h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <img 
                  src="https://res.cloudinary.com/dymlg8elg/image/upload/v1739814594/NB-2-removebg-preview_dbo2fa_x51efp.png" 
                  alt="NorthernBox Logo" 
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NBC Admin</h1>
                <p className="text-xs text-blue-100">Control Panel</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {filteredSections.map((section) => {
              const isExpanded = expandedSections[section.title]
              const hasActiveItem = isSectionActive(section)
              
              return (
                <div key={section.title} className="mb-2">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 transition-colors rounded-lg ${
                      hasActiveItem ? 'text-blue-400' : ''
                    }`}
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        if (!Icon) return null
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                            {item.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  {isSuperAdmin() && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                      SUPER ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                {isSuperAdmin() && (
                  <p className="text-xs text-yellow-400 mt-1 font-medium">Full System Access</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 shadow-2xl">
          {/* Logo Section */}
          <div className="flex h-20 items-center px-6 border-b border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <img 
                  src="https://res.cloudinary.com/dymlg8elg/image/upload/v1739814594/NB-2-removebg-preview_dbo2fa_x51efp.png" 
                  alt="NorthernBox Logo" 
                  className="h-6 w-6 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">NBC Admin</h1>
                <p className="text-xs text-blue-100">Control Panel</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {filteredSections.map((section) => {
              const isExpanded = expandedSections[section.title]
              const hasActiveItem = isSectionActive(section)
              
              return (
                <div key={section.title} className="mb-2">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 transition-colors rounded-lg ${
                      hasActiveItem ? 'text-blue-400' : ''
                    }`}
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        if (!Icon) return null
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                            }`}
                          >
                            <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                            <span className="flex-1">{item.name}</span>
                            {isActive && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
          
          {/* User Section */}
          <div className="p-4 border-t border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  {isSuperAdmin() && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                      SUPER ADMIN
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                {isSuperAdmin() && (
                  <p className="text-xs text-yellow-400 mt-1 font-medium">Full System Access</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            type="button"
            className="px-4 text-gray-500 dark:text-gray-300 lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between items-center px-6">
            <div className="flex flex-1">
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Dashboard</span>
                <span>/</span>
                <span className="text-gray-400 dark:text-gray-500">Overview</span>
              </div>
            </div>
            <div className="ml-4 flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
              </button>
              <Link
                href="/settings/change-password"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

