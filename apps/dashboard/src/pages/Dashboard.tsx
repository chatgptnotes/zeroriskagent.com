import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { DashboardMetrics } from '../types/database.types'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardMetrics()
  }, [])

  async function fetchDashboardMetrics() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error
      setMetrics(data)
    } catch (err) {
      console.error('Error fetching metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

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

  if (error || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-icon text-red-600">error</span>
            <h2 className="text-xl font-semibold text-red-600">Configuration Required</h2>
          </div>
          <p className="text-gray-700 mb-4">
            {error || 'Unable to load dashboard metrics. Please ensure Supabase is configured correctly.'}
          </p>
          <div className="bg-gray-50 p-4 rounded text-sm">
            <p className="font-medium mb-2">To get started:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-600">
              <li>Create a Supabase project at <a href="https://supabase.com" className="text-primary-600 underline" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
              <li>Run the migrations from <code className="bg-gray-200 px-1 rounded">supabase/migrations/</code></li>
              <li>Run the seed data from <code className="bg-gray-200 px-1 rounded">supabase/seed.sql</code></li>
              <li>Set environment variables in <code className="bg-gray-200 px-1 rounded">.env</code></li>
            </ol>
          </div>
          <div className="mt-4">
            <a href="/" className="btn-primary w-full justify-center">
              <span className="material-icon" style={{ fontSize: '20px' }}>home</span>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition">
                <span className="material-icon text-primary-600" style={{ fontSize: '32px' }}>local_hospital</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Zero Risk Agent</h1>
                  <p className="text-xs text-gray-500">Healthcare Revenue Recovery</p>
                </div>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{metrics.hospital_name}</p>
                <p className="text-xs text-gray-500">Admin Dashboard</p>
              </div>
              <button className="btn-secondary">
                <span className="material-icon" style={{ fontSize: '20px' }}>account_circle</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Claims */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="material-icon text-blue-600">assessment</span>
              <span className="text-2xl font-bold">{metrics.total_claims}</span>
            </div>
            <p className="text-sm text-gray-600">Total Claims</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(metrics.total_claimed)} claimed</p>
          </div>

          {/* Denied Claims */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="material-icon text-red-600">cancel</span>
              <span className="text-2xl font-bold">{metrics.denied_claims}</span>
            </div>
            <p className="text-sm text-gray-600">Denied Claims</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(metrics.total_denied_amount)} denied</p>
          </div>

          {/* Recovered Amount */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="material-icon text-green-600">trending_up</span>
              <span className="text-2xl font-bold">{formatCurrency(metrics.total_recovery_value)}</span>
            </div>
            <p className="text-sm text-gray-600">Total Recovered</p>
            <p className="text-xs text-green-600 mt-1">+{metrics.recovered_claims} claims</p>
          </div>

          {/* Hospital Net Recovery */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="material-icon text-purple-600">account_balance_wallet</span>
              <span className="text-2xl font-bold">{formatCurrency(metrics.total_hospital_recovered)}</span>
            </div>
            <p className="text-sm text-gray-600">Your Net Recovery</p>
            <p className="text-xs text-gray-500 mt-1">After {formatCurrency(metrics.total_agent_fees)} agent fee</p>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Claim Status Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">pie_chart</span>
              Claim Status Breakdown
            </h3>
            <div className="space-y-3">
              <StatusBar label="Submitted" count={metrics.submitted_claims} total={metrics.total_claims} color="blue" />
              <StatusBar label="Under Review" count={metrics.under_review_claims} total={metrics.total_claims} color="yellow" />
              <StatusBar label="Approved" count={metrics.approved_claims} total={metrics.total_claims} color="green" />
              <StatusBar label="Denied" count={metrics.denied_claims} total={metrics.total_claims} color="red" />
              <StatusBar label="Appealed" count={metrics.appealed_claims} total={metrics.total_claims} color="orange" />
              <StatusBar label="Recovered" count={metrics.recovered_claims} total={metrics.total_claims} color="emerald" />
            </div>
          </div>

          {/* Recovery Performance */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">show_chart</span>
              Recovery Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Appeal Rate</span>
                <span className="text-lg font-semibold text-primary-600">{metrics.appeal_rate_percentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Appeal Success Rate</span>
                <span className="text-lg font-semibold text-green-600">{metrics.appeal_success_rate_percentage}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Appeals</span>
                <span className="text-lg font-semibold">{metrics.total_appeals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Successful Appeals</span>
                <span className="text-lg font-semibold text-green-600">{metrics.successful_appeals}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Recoverable Amount</span>
                <span className="text-lg font-semibold text-orange-600">{formatCurrency(metrics.recoverable_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Aging Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="material-icon text-primary-600">schedule</span>
            Claim Aging Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <AgingCard label="Average Age" value={`${metrics.avg_aged_days} days`} icon="timer" />
            <AgingCard label="Over 30 Days" value={metrics.aged_over_30_days.toString()} icon="warning" color="yellow" />
            <AgingCard label="Over 60 Days" value={metrics.aged_over_60_days.toString()} icon="error_outline" color="orange" />
            <AgingCard label="Over 90 Days" value={metrics.aged_over_90_days.toString()} icon="dangerous" color="red" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>Version 1.1 • Last Updated: 2026-01-11 • zeroriskagent.com</p>
        </div>
      </footer>
    </div>
  )
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  const colorClasses = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium">{count}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function AgingCard({ label, value, icon, color = 'gray' }: { label: string; value: string; icon: string; color?: string }) {
  const colorClasses = {
    gray: 'text-gray-600',
    yellow: 'text-yellow-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-icon ${colorClasses[color as keyof typeof colorClasses]}`} style={{ fontSize: '20px' }}>
          {icon}
        </span>
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
