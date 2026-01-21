import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleDashboard from './components/RoleDashboard'
import Navigation from './components/Navigation'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import AdminRegister from './pages/AdminRegister'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import RecoveryDashboard from './pages/RecoveryDashboard'
import NMITracker from './pages/NMITracker'
import Upload from './pages/Upload'
import UserManagement from './pages/UserManagement'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AdminRegister />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navigation />
              <RoleDashboard />
            </ProtectedRoute>
          } />
          
          {/* Individual dashboard routes for direct access */}
          <Route path="/dashboard/super-admin" element={
            <ProtectedRoute requiredRole={['super_admin']}>
              <Navigation />
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/admin" element={
            <ProtectedRoute requiredRole={['hospital_admin']}>
              <Navigation />
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard/staff" element={
            <ProtectedRoute requiredRole={['staff']}>
              <Navigation />
              <StaffDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/recovery" element={
            <ProtectedRoute requireFinancialAccess={true}>
              <Navigation />
              <RecoveryDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/nmi" element={
            <ProtectedRoute>
              <Navigation />
              <NMITracker />
            </ProtectedRoute>
          } />

          <Route path="/upload" element={
            <ProtectedRoute>
              <Navigation />
              <Upload />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute requiredRole={['hospital_admin', 'super_admin']}>
              <Navigation />
              <UserManagement />
            </ProtectedRoute>
          } />
          
          {/* Redirect to dashboard for any other path */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
