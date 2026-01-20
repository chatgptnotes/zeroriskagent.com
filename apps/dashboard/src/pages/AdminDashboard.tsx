import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { getMockDashboardMetrics } from '../services/mockData.service'
import type { DashboardMetrics } from '../types/database.types'

export default function AdminDashboard() {
  const { profile, isMockMode } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hospitalStats, setHospitalStats] = useState({
    totalStaff: 0,
    activeClaims: 0,
    monthlyRecovery: 0,
    pendingApprovals: 0
  })

  useEffect(() => {
    fetchDashboardMetrics()
    fetchHospitalStats()
  }, [isMockMode])

  async function fetchDashboardMetrics() {
    try {
      setLoading(true)
      setError(null)
      
      if (isMockMode) {
        const { data, error } = await getMockDashboardMetrics()
        if (error) throw new Error(error)
        setMetrics(data)
      } else {
        const { data, error } = await supabase
          .from('dashboard_metrics')
          .select('*')
          .limit(1)
          .single()

        if (error) throw error
        setMetrics(data)
      }
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

  async function fetchHospitalStats() {
    if (isMockMode) {
      setHospitalStats({
        totalStaff: 8,
        activeClaims: 45,
        monthlyRecovery: 850000,
        pendingApprovals: 12
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-icon text-primary-600 animate-pulse" style={{ fontSize: '48px' }}>autorenew</span>
          <p className="text-gray-600">Loading Hospital Admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-icon text-red-600">error</span>
            <h2 className="text-xl font-semibold text-red-600">Error Loading Dashboard</h2>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={fetchDashboardMetrics} className="btn-primary w-full">
            <span className="material-icon" style={{ fontSize: '20px' }}>refresh</span>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="material-icon text-primary-600" style={{ fontSize: '32px' }}>local_hospital</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hospital Admin Dashboard</h1>
                <p className="text-xs text-gray-500">{profile?.hospital_name || 'Hospital Management'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                <p className="text-xs text-blue-600 font-semibold">HOSPITAL ADMIN</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="material-icon text-white" style={{ fontSize: '20px' }}>person</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hospital Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <HospitalCard
            icon="people"
            iconColor="blue"
            value={hospitalStats.totalStaff}
            label="Total Staff"
            subtext="Hospital team members"
          />
          <HospitalCard
            icon="receipt_long"
            iconColor="orange"
            value={hospitalStats.activeClaims}
            label="Active Claims"
            subtext="Under processing"
          />
          <HospitalCard
            icon="payments"
            iconColor="green"
            value={`₹${(hospitalStats.monthlyRecovery / 100000).toFixed(1)}L`}
            label="Monthly Recovery"
            subtext="This month"
          />
          <HospitalCard
            icon="pending_actions"
            iconColor="purple"
            value={hospitalStats.pendingApprovals}
            label="Pending Approvals"
            subtext="Require your review"
          />
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">account_balance_wallet</span>
              Financial Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Claims Value</span>
                <span className="text-lg font-semibold">₹{metrics?.total_claimed?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Recovered</span>
                <span className="text-lg font-semibold text-green-600">₹{metrics?.total_recovery_value?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-600">Net Recovery (75%)</span>
                <span className="text-lg font-semibold text-blue-600">₹{((metrics?.total_recovery_value || 0) * 0.75)?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">timeline</span>
              Recovery Insights
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recovery Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {metrics && metrics.total_claims > 0 
                    ? `${((metrics.total_recovery_value / metrics.total_claimed) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Processing Time</span>
                <span className="text-lg font-semibold">28 days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-lg font-semibold text-green-600">72%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">dashboard</span>
              Claims Management
            </h3>
            <div className="space-y-3">
              <a href="/recovery" className="btn-primary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>receipt_long</span>
                  Recovery Dashboard
                </span>
                <span className="material-icon">arrow_forward</span>
              </a>
              <a href="/nmi" className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>business</span>
                  Collection Tracker
                </span>
                <span className="material-icon">arrow_forward</span>
              </a>
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>upload</span>
                  Upload New Claims
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">group</span>
              Team Management
            </h3>
            <div className="space-y-3">
              <a href="/users" className="btn-primary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>people</span>
                  Manage Staff
                </span>
                <span className="material-icon">arrow_forward</span>
              </a>
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>person_add</span>
                  Add New Staff
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
              <button className="btn-secondary w-full justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-icon" style={{ fontSize: '20px' }}>assignment</span>
                  Staff Reports
                </span>
                <span className="material-icon">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="material-icon text-primary-600">notifications</span>
            Recent Hospital Activity
          </h3>
          <div className="space-y-3">
            <ActivityItem 
              icon="check_circle" 
              text="CGHS claim #12345 approved - ₹25,000 recovered" 
              time="1 hour ago"
              type="success"
            />
            <ActivityItem 
              icon="pending" 
              text="ESIC appeal submitted for claim #12346" 
              time="3 hours ago"
              type="info"
            />
            <ActivityItem 
              icon="person" 
              text="New billing staff member added: Priya Sharma" 
              time="5 hours ago"
              type="info"
            />
            <ActivityItem 
              icon="upload" 
              text="15 new claims uploaded by billing team" 
              time="1 day ago"
              type="success"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>v1.2 | Last Updated: 2026-01-20 | zeroriskagent.com | Hospital Admin Access</p>
        </div>
      </footer>
    </div>
  )
}

function HospitalCard({
  icon,
  iconColor,
  value,
  label,
  subtext,
}: {
  icon: string
  iconColor: string
  value: number | string
  label: string
  subtext: string
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className={`material-icon ${colorClasses[iconColor]}`}>{icon}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{subtext}</p>
    </div>
  )
}

function ActivityItem({
  icon,
  text,
  time,
  type
}: {
  icon: string
  text: string
  time: string
  type: 'success' | 'info' | 'warning' | 'error'
}) {
  const typeClasses = {
    success: 'text-green-600 bg-green-50',
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-orange-600 bg-orange-50',
    error: 'text-red-600 bg-red-50'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeClasses[type]}`}>
        <span className="material-icon" style={{ fontSize: '18px' }}>{icon}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-900">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  )
}