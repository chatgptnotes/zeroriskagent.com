import { useEffect, useState } from 'react'
import { getBillsList, getRecoverySummary, type BillWithPatient, type RecoverySummary } from '../services/recovery.service'

export default function AdminDashboard() {
  const [bills, setBills] = useState<BillWithPatient[]>([])
  const [summary, setSummary] = useState<RecoverySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      setError(null)

      const [billsResult, summaryResult] = await Promise.all([
        getBillsList({ limit: 50 }),
        getRecoverySummary()
      ])

      setBills(billsResult.data)
      setTotalCount(billsResult.count)
      setSummary(summaryResult)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
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
          <button onClick={fetchDashboardData} className="btn-primary w-full">
            <span className="material-icon" style={{ fontSize: '20px' }}>refresh</span>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <HospitalCard
              icon="assessment"
              iconColor="blue"
              value={summary.totalBills}
              label="Total Bills"
              subtext={formatCurrency(summary.totalAmount)}
            />
            <HospitalCard
              icon="pending"
              iconColor="orange"
              value={summary.pendingBills}
              label="Pending Bills"
              subtext={formatCurrency(summary.pendingAmount)}
            />
            <HospitalCard
              icon="check_circle"
              iconColor="green"
              value={summary.receivedBills}
              label="Received Bills"
              subtext={formatCurrency(summary.receivedAmount)}
            />
            <HospitalCard
              icon="warning"
              iconColor="red"
              value={summary.nmiCount}
              label="NMI Cases"
              subtext={formatCurrency(summary.deductionAmount) + ' deductions'}
            />
          </div>
        )}

        {/* Claims Table */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="material-icon text-primary-600">receipt_long</span>
              Claims List ({totalCount} total)
            </h3>
            <button onClick={fetchDashboardData} className="btn-secondary">
              <span className="material-icon" style={{ fontSize: '18px' }}>refresh</span>
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Claim ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Visit ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Patient Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Corporate</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Bill Age</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Submission Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Expected Payment</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Days</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Aging</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-gray-500">
                      <span className="material-icon text-gray-300 mb-2" style={{ fontSize: '48px' }}>inbox</span>
                      <p>No claims found</p>
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-primary-600">
                          {bill.claim_id || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {bill.visit_id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-900">{bill.patient_name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 font-medium">
                          {bill.payer_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(bill.bill_amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-sm font-medium ${
                          bill.bill_age > 90 ? 'text-red-600' :
                          bill.bill_age > 60 ? 'text-orange-600' :
                          bill.bill_age > 30 ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          {bill.bill_age} days
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(bill.date_of_submission)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(bill.expected_payment_date)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-medium text-gray-900">
                          {bill.overdue_days > 0 ? bill.overdue_days : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <AgingBadge bucket={bill.aging_bucket} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={bill.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
            </div>
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
    red: 'text-red-600',
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

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    received: { label: 'Received', color: 'bg-green-100 text-green-800' },
    partial: { label: 'Partial', color: 'bg-blue-100 text-blue-800' },
    nmi: { label: 'NMI', color: 'bg-orange-100 text-orange-800' },
    overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800' },
  }

  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}

function AgingBadge({ bucket }: { bucket: string }) {
  const bucketConfig: Record<string, string> = {
    '-': 'bg-gray-100 text-gray-600',
    '0-30': 'bg-green-100 text-green-800',
    '31-60': 'bg-yellow-100 text-yellow-800',
    '61-90': 'bg-orange-100 text-orange-800',
    '91-180': 'bg-red-100 text-red-800',
    '181-365': 'bg-red-200 text-red-900',
    '365+': 'bg-red-300 text-red-900',
  }

  const colorClass = bucketConfig[bucket] || 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {bucket}
    </span>
  )
}