import { useAuth } from '../hooks/useAuth'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string | string[]
  requireFinancialAccess?: boolean
  requireApprovalAccess?: boolean
}

export default function ProtectedRoute({ 
  children, 
  requiredRole,
  requireFinancialAccess = false,
  requireApprovalAccess = false
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-icon text-primary-600 animate-pulse" style={{ fontSize: '48px' }}>autorenew</span>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // User is inactive/suspended
  if (profile.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <span className="material-icon text-red-600 mb-4" style={{ fontSize: '64px' }}>block</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Suspended</h1>
          <p className="text-gray-600">
            Your account has been {profile.status}. Please contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // Role-based access check
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(profile.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md text-center">
            <span className="material-icon text-orange-600 mb-4" style={{ fontSize: '64px' }}>security</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">
              You don't have permission to access this page. Required role: {roles.join(' or ')}.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your current role: {profile.role}
            </p>
          </div>
        </div>
      )
    }
  }

  // Financial access check
  if (requireFinancialAccess && !profile.can_view_financials) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <span className="material-icon text-orange-600 mb-4" style={{ fontSize: '64px' }}>account_balance</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Financial Access Required</h1>
          <p className="text-gray-600">
            You don't have permission to view financial data. Contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  // Approval access check
  if (requireApprovalAccess && !profile.can_approve_appeals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <span className="material-icon text-orange-600 mb-4" style={{ fontSize: '64px' }}>gavel</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Approval Access Required</h1>
          <p className="text-gray-600">
            You don't have permission to approve appeals. Contact your administrator.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}