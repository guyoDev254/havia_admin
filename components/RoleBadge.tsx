'use client'

interface RoleBadgeProps {
  role: string
  size?: 'sm' | 'md' | 'lg'
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
  PLATFORM_ADMIN: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
  COMMUNITY_MANAGER: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
  MENTORSHIP_ADMIN: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
  CONTENT_MANAGER: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
  PARTNERSHIP_MANAGER: 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white',
  DATA_ADMIN: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
  SUPPORT_ADMIN: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
  ADMIN: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
  MODERATOR: 'bg-gradient-to-r from-green-500 to-teal-500 text-white',
  CLUB_MANAGER: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
  MENTOR: 'bg-gradient-to-r from-blue-400 to-blue-600 text-white',
  MENTEE: 'bg-gradient-to-r from-purple-400 to-purple-600 text-white',
  MEMBER: 'bg-gray-200 text-gray-700',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const colorClass = roleColors[role] || roleColors.MEMBER
  const displayRole = role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full shadow-sm ${colorClass} ${sizeClasses[size]}`}
    >
      {displayRole}
    </span>
  )
}

