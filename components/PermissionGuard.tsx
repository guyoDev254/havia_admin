'use client'

import { usePermissions, Permission } from '@/hooks/usePermissions'
import { ReactNode } from 'react'

interface PermissionGuardProps {
  permission: Permission | Permission[]
  children: ReactNode
  fallback?: ReactNode
  requireAll?: boolean
}

export default function PermissionGuard({
  permission,
  children,
  fallback = null,
  requireAll = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

