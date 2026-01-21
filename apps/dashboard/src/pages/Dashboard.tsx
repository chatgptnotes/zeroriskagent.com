import { useEffect, useState } from 'react'
import { getBillsList, getRecoverySummary, type BillWithPatient, type RecoverySummary } from '../services/recovery.service'

export default function Dashboard() {
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

      // Fetch bills list and summary in parallel
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
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="material-icon text-blue-600">assessment</span>
                <span className="text-2xl font-bold">{summary.totalBills}</span>
              </div>
              <p className="text-sm text-gray-600">Total Bills</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(summary.totalAmount)} total</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="material-icon text-orange-600">pending</span>
                <span className="text-2xl font-bold">{summary.pendingBills}</span>
              </div>
              <p className="text-sm text-gray-600">Pending Bills</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(summary.pendingAmount)} pending</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="material-icon text-green-600">check_circle</span>
                <span className="text-2xl font-bold">{summary.receivedBills}</span>
              </div>
              <p className="text-sm text-gray-600">Received Bills</p>
              <p className="text-xs text-green-600 mt-1">{formatCurrency(summary.receivedAmount)} received</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="material-icon text-red-600">warning</span>
                <span className="text-2xl font-bold">{summary.nmiCount}</span>
              </div>
              <p className="text-sm text-gray-600">NMI Cases</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(summary.deductionAmount)} deductions</p>
            </div>
          </div>
        )}

        {/* Claims Table */}
        <div className="card">
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
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>Version 1.2 | Last Updated: 2026-01-20 | zeroriskagent.com</p>
        </div>
      </footer>
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
