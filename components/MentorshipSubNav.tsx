'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, TrendingUp, Calendar, Users, GraduationCap, Settings, FileText, BarChart3 } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

const NAV_GROUPS = [
  { label: 'Pipeline', items: [{ name: 'Overview', href: '/mentorships', icon: TrendingUp }, { name: 'Cycles', href: '/mentorships/cycles', icon: Calendar }] },
  { label: 'People', items: [{ name: 'Mentors', href: '/mentorships/mentors', icon: Users }, { name: 'Mentees', href: '/mentorships/mentees', icon: GraduationCap }] },
  { label: 'Operations', items: [{ name: 'Tasks', href: '/mentorships/tasks', icon: FileText }, { name: 'Automation', href: '/mentorships/automation', icon: Settings }] },
  { label: 'Insights', items: [{ name: 'Analytics', href: '/mentorships/tasks/analytics', icon: BarChart3 }] },
]

export default function MentorshipSubNav({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItem[] }) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/mentorships' ? pathname === '/mentorships' : href === '/mentorships/tasks/analytics' ? pathname === '/mentorships/tasks/analytics' : pathname.startsWith(href)

  return (
    <div className="space-y-3">
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
        <Link href="/mentorships" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium">
          Mentorship
        </Link>
        {breadcrumbs.map((b, i) => (
          <span key={i} className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            {b.href ? (
              <Link href={b.href} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                {b.label}
              </Link>
            ) : (
              <span className="text-gray-700 dark:text-gray-300 font-medium">{b.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {group.label}
            </span>
            {group.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href!)
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
