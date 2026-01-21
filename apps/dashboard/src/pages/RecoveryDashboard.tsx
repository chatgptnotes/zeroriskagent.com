import { useState } from 'react'
import { useRecoverySummary, useBillsByPayer, useBillsList } from '../hooks/useRecovery'
import MockModeMessage from '../components/MockModeMessage'
import type { BillWithPatient } from '../services/recovery.service'

export default function RecoveryDashboard() {
  const [page, setPage] = useState(0)
  const [payerFilter, setPayerFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useRecoverySummary()
  const { data: payerData, isLoading: payerLoading } = useBillsByPayer()
  const { data: billsData, isLoading: billsLoading } = useBillsList({
    limit: 20,
    offset: page * 20,
    payerType: payerFilter || undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const isLoading = summaryLoading || payerLoading || billsLoading

  if (summaryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-icon text-red-600">error</span>
            <h2 className="text-xl font-semibold text-red-600">Error Loading Data</h2>
          </div>
          <p className="text-gray-700 mb-4">{summaryError.message}</p>
          <a href="/" className="btn-primary w-full justify-center">
            <span className="material-icon" style={{ fontSize: '20px' }}>home</span>
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <MockModeMessage 
      pageName="Recovery Dashboard" 
      description="Track recovered amounts, agent fees, and financial analytics with detailed recovery metrics."
    >
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <SummaryCard
            icon="receipt"
            iconColor="blue"
            value={summary?.totalBills || 0}
            label="Total Bills"
            subtext={formatCurrency(summary?.totalAmount || 0)}
            loading={isLoading}
          />
          <SummaryCard
            icon="pending_actions"
            iconColor="orange"
            value={summary?.pendingBills || 0}
            label="Pending"
            subtext={formatCurrency(summary?.pendingAmount || 0)}
            loading={isLoading}
          />
          <SummaryCard
            icon="check_circle"
            iconColor="green"
            value={summary?.receivedBills || 0}
            label="Received"
            subtext={formatCurrency(summary?.receivedAmount || 0)}
            loading={isLoading}
          />
          <SummaryCard
            icon="remove_circle"
            iconColor="red"
            value={formatCurrency(summary?.deductionAmount || 0)}
            label="Deductions"
            subtext="Total deducted"
            loading={isLoading}
          />
          <SummaryCard
            icon="help_outline"
            iconColor="purple"
            value={summary?.nmiCount || 0}
            label="NMI Queries"
            subtext="Need More Info"
            loading={isLoading}
          />
        </div>

        {/* Payer Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">business</span>
              Bills by Payer
            </h3>
            {payerFilter && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-gray-600">Filtered by:</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-1">
                  {payerFilter}
                  <button
                    onClick={() => {
                      setPayerFilter('')
                      setPage(0)
                    }}
                    className="hover:bg-primary-200 rounded-full p-0.5"
                  >
                    <span className="material-icon" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </span>
              </div>
            )}
            {payerLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
            ) : payerData && payerData.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {payerData.map((payer, index) => (
                  <PayerRow
                    key={index}
                    payer={payer}
                    formatCurrency={formatCurrency}
                    isSelected={payerFilter === payer.payer_type}
                    onClick={() => {
                      setPayerFilter(payerFilter === payer.payer_type ? '' : payer.payer_type)
                      setPage(0)
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No payer data available</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">analytics</span>
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Collection Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {summary && summary.totalAmount > 0
                    ? `${((summary.receivedAmount / summary.totalAmount) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Recovery</span>
                <span className="text-lg font-semibold text-orange-600">
                  {formatCurrency(summary?.pendingAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deduction Rate</span>
                <span className="text-lg font-semibold text-red-600">
                  {summary && summary.totalAmount > 0
                    ? `${((summary.deductionAmount / summary.totalAmount) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Payers</span>
                <span className="text-lg font-semibold">{payerData?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="material-icon text-primary-600">list_alt</span>
              Bills List
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(0)
                  }}
                  className="px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <span className="material-icon absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: '18px' }}>
                  search
                </span>
              </div>
              <select
                value={payerFilter}
                onChange={(e) => {
                  setPayerFilter(e.target.value)
                  setPage(0)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Payers</option>
                {payerData?.map((p, i) => (
                  <option key={i} value={p.payer_type}>{p.payer_type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="partial">Partial</option>
                <option value="nmi">NMI Query</option>
              </select>
            </div>
          </div>

          {billsLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : billsData && billsData.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Visit ID</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Patient</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Payer</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">Bill Amt</th>
                      <th className="text-right py-3 px-2 font-medium text-gray-600">Received</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billsData.data.map((bill) => (
                      <BillRow key={bill.id} bill={bill} formatCurrency={formatCurrency} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {page * 20 + 1} to {Math.min((page + 1) * 20, billsData.count)} of {billsData.count}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    <span className="material-icon" style={{ fontSize: '18px' }}>chevron_left</span>
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={(page + 1) * 20 >= (billsData.count || 0)}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    Next
                    <span className="material-icon" style={{ fontSize: '18px' }}>chevron_right</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <span className="material-icon text-gray-400" style={{ fontSize: '48px' }}>inbox</span>
              <p className="text-gray-500 mt-2">No bills found</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>Version 1.2 | Last Updated: 2026-01-12 | zeroriskagent.com</p>
        </div>
      </footer>
    </div>
    </MockModeMessage>
  )
}

function SummaryCard({
  icon,
  iconColor,
  value,
  label,
  subtext,
  loading,
}: {
  icon: string
  iconColor: string
  value: number | string
  label: string
  subtext: string
  loading: boolean
}) {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
    purple: 'text-purple-600',
  }

  return (
    <div className="card">
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className={`material-icon ${colorClasses[iconColor]}`}>{icon}</span>
            <span className="text-2xl font-bold">{value}</span>
          </div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        </>
      )}
    </div>
  )
}

function PayerRow({
  payer,
  formatCurrency,
  isSelected,
  onClick,
}: {
  payer: { payer_type: string; total_bills: number; total_amount: number; pending_count: number; received_count: number; pending_amount: number; received_amount: number; patient_count: number; nmi_count: number }
  formatCurrency: (amount: number) => string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-primary-100 border-2 border-primary-500'
          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
      }`}
    >
      <div className="flex-1">
        <p className="font-medium text-gray-900">{payer.payer_type}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="material-icon" style={{ fontSize: '12px' }}>person</span>
            {payer.patient_count} patients
          </span>
          <span className="flex items-center gap-1">
            <span className="material-icon" style={{ fontSize: '12px' }}>receipt</span>
            {payer.total_bills} bills
          </span>
          {payer.nmi_count > 0 && (
            <span className="flex items-center gap-1 text-purple-600">
              <span className="material-icon" style={{ fontSize: '12px' }}>help_outline</span>
              {payer.nmi_count} NMI
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{formatCurrency(payer.total_amount)}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-orange-600">{payer.pending_count} pending</span>
          <span className="text-green-600">{payer.received_count} received</span>
        </div>
      </div>
      <span className="material-icon text-gray-400 ml-2" style={{ fontSize: '20px' }}>
        {isSelected ? 'check_circle' : 'chevron_right'}
      </span>
    </div>
  )
}

function BillRow({
  bill,
  formatCurrency,
}: {
  bill: BillWithPatient
  formatCurrency: (amount: number) => string
}) {
  const statusColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-800',
    received: 'bg-green-100 text-green-800',
    partial: 'bg-blue-100 text-blue-800',
    nmi: 'bg-purple-100 text-purple-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    received: 'Received',
    partial: 'Partial',
    nmi: 'NMI Query',
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-2">
        <span className="font-medium text-xs">{bill.visit_id || '-'}</span>
      </td>
      <td className="py-3 px-2">
        <span className="text-gray-900">{bill.patient_name}</span>
      </td>
      <td className="py-3 px-2">
        <span className="text-gray-600">{bill.payer_type}</span>
      </td>
      <td className="py-3 px-2 text-right">
        <span className="font-medium">{formatCurrency(bill.bill_amount)}</span>
      </td>
      <td className="py-3 px-2 text-right">
        <span className={`font-medium ${bill.received_amount ? 'text-green-600' : 'text-gray-400'}`}>
          {bill.received_amount ? formatCurrency(bill.received_amount) : '-'}
        </span>
        {bill.deduction_amount && bill.deduction_amount > 0 && (
          <span className="block text-xs text-red-500">
            -{formatCurrency(bill.deduction_amount)}
          </span>
        )}
      </td>
      <td className="py-3 px-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[bill.status] || 'bg-gray-100 text-gray-800'}`}>
          {statusLabels[bill.status] || bill.status}
        </span>
        {bill.nmi && (
          <span className="block text-xs text-purple-600 mt-1 truncate max-w-[120px]" title={bill.nmi}>
            {bill.nmi}
          </span>
        )}
      </td>
      <td className="py-3 px-2 text-gray-600 text-sm">
        {bill.date_of_submission ? new Date(bill.date_of_submission).toLocaleDateString('en-IN') : '-'}
      </td>
    </tr>
  )
}
