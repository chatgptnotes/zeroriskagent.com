import { useAuth } from '../hooks/useAuth'
import SuperAdminDashboard from '../pages/SuperAdminDashboard'
import AdminDashboard from '../pages/AdminDashboard'
import StaffDashboard from '../pages/StaffDashboard'

export default function RoleDashboard() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-icon text-primary-600 animate-pulse" style={{ fontSize: '48px' }}>autorenew</span>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-icon text-red-600">error</span>
            <h2 className="text-xl font-semibold text-red-600">Access Error</h2>
          </div>
          <p className="text-gray-700 mb-4">Unable to determine user role. Please try logging in again.</p>
          <a href="/login" className="btn-primary w-full justify-center">
            <span className="material-icon" style={{ fontSize: '20px' }}>login</span>
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  // Route to appropriate dashboard based on role
  switch (profile.role) {
    case 'super_admin':
      return <SuperAdminDashboard />
    
    case 'hospital_admin':
      return <AdminDashboard />
    
    case 'staff':
      return <StaffDashboard />
    
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="card max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-icon text-orange-600">warning</span>
              <h2 className="text-xl font-semibold text-orange-600">Unknown Role</h2>
            </div>
            <p className="text-gray-700 mb-4">
              Your role "{profile.role}" is not recognized. Please contact your administrator.
            </p>
            <a href="/login" className="btn-primary w-full justify-center">
              <span className="material-icon" style={{ fontSize: '20px' }}>login</span>
              Go to Login
            </a>
          </div>
        </div>
      )
  }
}