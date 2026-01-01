import { useAuth } from '@/contexts/AuthContext'

// Permission enum (matches backend)
export enum Permission {
  ALL_ACCESS = 'ALL_ACCESS',
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_USERS = 'VIEW_USERS',
  SUSPEND_USERS = 'SUSPEND_USERS',
  VERIFY_USERS = 'VERIFY_USERS',
  ASSIGN_ROLES = 'ASSIGN_ROLES',
  MANAGE_ADMINS = 'MANAGE_ADMINS',
  CREATE_ADMINS = 'CREATE_ADMINS',
  REMOVE_ADMINS = 'REMOVE_ADMINS',
  MANAGE_MENTORSHIP = 'MANAGE_MENTORSHIP',
  APPROVE_MENTORS = 'APPROVE_MENTORS',
  REVIEW_MENTEE_APPLICATIONS = 'REVIEW_MENTEE_APPLICATIONS',
  LAUNCH_MENTORSHIP_PROGRAMS = 'LAUNCH_MENTORSHIP_PROGRAMS',
  OVERRIDE_MATCHES = 'OVERRIDE_MATCHES',
  REASSIGN_MENTORSHIP = 'REASSIGN_MENTORSHIP',
  VIEW_MENTORSHIP_ANALYTICS = 'VIEW_MENTORSHIP_ANALYTICS',
  APPROVE_EVENTS = 'APPROVE_EVENTS',
  APPROVE_CLUBS = 'APPROVE_CLUBS',
  MANAGE_EVENTS = 'MANAGE_EVENTS',
  MANAGE_CLUBS = 'MANAGE_CLUBS',
  CREATE_CONTENT = 'CREATE_CONTENT',
  MANAGE_RESOURCES = 'MANAGE_RESOURCES',
  PUBLISH_OPPORTUNITIES = 'PUBLISH_OPPORTUNITIES',
  SCHEDULE_EVENTS = 'SCHEDULE_EVENTS',
  FEATURE_CONTENT = 'FEATURE_CONTENT',
  MODERATE_CHATS = 'MODERATE_CHATS',
  MODERATE_POSTS = 'MODERATE_POSTS',
  PIN_ANNOUNCEMENTS = 'PIN_ANNOUNCEMENTS',
  SEND_BROADCASTS = 'SEND_BROADCASTS',
  REMOVE_SPAM = 'REMOVE_SPAM',
  VIEW_ENGAGEMENT_METRICS = 'VIEW_ENGAGEMENT_METRICS',
  MANAGE_PARTNERSHIPS = 'MANAGE_PARTNERSHIPS',
  CREATE_PARTNER_PROFILES = 'CREATE_PARTNER_PROFILES',
  PUBLISH_PARTNER_PROGRAMS = 'PUBLISH_PARTNER_PROGRAMS',
  MANAGE_SPONSORED_CONTENT = 'MANAGE_SPONSORED_CONTENT',
  VIEW_PARTNER_ENGAGEMENT = 'VIEW_PARTNER_ENGAGEMENT',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_FINANCIALS = 'VIEW_FINANCIALS',
  EXPORT_DATA = 'EXPORT_DATA',
  GENERATE_REPORTS = 'GENERATE_REPORTS',
  VIEW_REPORTS = 'VIEW_REPORTS',
  REVIEW_FLAGGED_CONTENT = 'REVIEW_FLAGGED_CONTENT',
  MANAGE_APPEALS = 'MANAGE_APPEALS',
  HANDLE_ABUSE = 'HANDLE_ABUSE',
  CHANGE_PLATFORM_SETTINGS = 'CHANGE_PLATFORM_SETTINGS',
  MANAGE_PARTNERSHIPS_GLOBAL = 'MANAGE_PARTNERSHIPS_GLOBAL',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
}

// Role to Permissions mapping (matches backend)
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [Permission.ALL_ACCESS],
  CLUB_MANAGER: [
    // Club managers should manage their assigned clubs (scoped by backend checks)
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_CLUBS,
    Permission.MANAGE_EVENTS,
    Permission.SCHEDULE_EVENTS,
    Permission.MANAGE_RESOURCES,
    Permission.CREATE_CONTENT,
    Permission.SEND_BROADCASTS,
    Permission.VIEW_ENGAGEMENT_METRICS,
    Permission.EXPORT_DATA,
    Permission.MODERATE_POSTS, // For their club's posts
  ],
  PLATFORM_ADMIN: [
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.SUSPEND_USERS,
    Permission.VERIFY_USERS,
    Permission.ASSIGN_ROLES,
    Permission.APPROVE_EVENTS,
    Permission.APPROVE_CLUBS,
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_CLUBS,
    Permission.MANAGE_MENTORSHIP,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_ENGAGEMENT_METRICS,
  ],
  COMMUNITY_MANAGER: [
    Permission.MODERATE_CHATS,
    Permission.MODERATE_POSTS,
    Permission.APPROVE_CLUBS,
    Permission.PIN_ANNOUNCEMENTS,
    Permission.SEND_BROADCASTS,
    Permission.REMOVE_SPAM,
    Permission.VIEW_ENGAGEMENT_METRICS,
    Permission.VIEW_USERS,
    Permission.SUSPEND_USERS,
  ],
  MENTORSHIP_ADMIN: [
    Permission.APPROVE_MENTORS,
    Permission.REVIEW_MENTEE_APPLICATIONS,
    Permission.LAUNCH_MENTORSHIP_PROGRAMS,
    Permission.OVERRIDE_MATCHES,
    Permission.REASSIGN_MENTORSHIP,
    Permission.VIEW_MENTORSHIP_ANALYTICS,
    Permission.MANAGE_MENTORSHIP,
  ],
  CONTENT_MANAGER: [
    Permission.CREATE_CONTENT,
    Permission.MANAGE_RESOURCES,
    Permission.PUBLISH_OPPORTUNITIES,
    Permission.SCHEDULE_EVENTS,
    Permission.FEATURE_CONTENT,
    Permission.VIEW_ENGAGEMENT_METRICS,
  ],
  PARTNERSHIP_MANAGER: [
    Permission.MANAGE_PARTNERSHIPS,
    Permission.CREATE_PARTNER_PROFILES,
    Permission.PUBLISH_PARTNER_PROGRAMS,
    Permission.MANAGE_SPONSORED_CONTENT,
    Permission.VIEW_PARTNER_ENGAGEMENT,
    Permission.VIEW_ANALYTICS,
  ],
  DATA_ADMIN: [
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.GENERATE_REPORTS,
  ],
  SUPPORT_ADMIN: [
    Permission.VIEW_REPORTS,
    Permission.REVIEW_FLAGGED_CONTENT,
    Permission.MANAGE_APPEALS,
    Permission.HANDLE_ABUSE,
    Permission.SUSPEND_USERS,
    Permission.VIEW_USERS,
  ],
  ADMIN: [
    Permission.MANAGE_USERS,
    Permission.VIEW_USERS,
    Permission.SUSPEND_USERS,
    Permission.VERIFY_USERS,
    Permission.ASSIGN_ROLES,
    Permission.APPROVE_EVENTS,
    Permission.APPROVE_CLUBS,
    Permission.MANAGE_EVENTS,
    Permission.MANAGE_CLUBS,
    Permission.VIEW_ANALYTICS,
  ],
  MODERATOR: [
    Permission.MODERATE_CHATS,
    Permission.MODERATE_POSTS,
    Permission.APPROVE_CLUBS,
    Permission.PIN_ANNOUNCEMENTS,
    Permission.SEND_BROADCASTS,
    Permission.REMOVE_SPAM,
    Permission.VIEW_ENGAGEMENT_METRICS,
    Permission.VIEW_USERS,
    Permission.SUSPEND_USERS,
  ],
}

export function usePermissions() {
  const { user } = useAuth()

  const hasPermission = (permission: Permission): boolean => {
    if (!user?.role) return false

    const permissions = ROLE_PERMISSIONS[user.role] || []

    // SUPER_ADMIN has all permissions
    if (permissions.includes(Permission.ALL_ACCESS)) {
      return true
    }

    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((permission) => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((permission) => hasPermission(permission))
  }

  const isAdmin = (): boolean => {
    if (!user?.role) return false
    return [
      'SUPER_ADMIN',
      'PLATFORM_ADMIN',
      'COMMUNITY_MANAGER',
      'MENTORSHIP_ADMIN',
      'CONTENT_MANAGER',
      'PARTNERSHIP_MANAGER',
      'DATA_ADMIN',
      'SUPPORT_ADMIN',
      'ADMIN',
      'MODERATOR',
      'CLUB_MANAGER',
    ].includes(user.role)
  }

  const isSuperAdmin = (): boolean => {
    return user?.role === 'SUPER_ADMIN'
  }

  const getPermissions = (): Permission[] => {
    if (!user?.role) return []
    return ROLE_PERMISSIONS[user.role] || []
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSuperAdmin,
    getPermissions,
    role: user?.role,
  }
}

