import { useState } from 'react'
import { useNMISummary, useNMIList, useDispositionOptions, usePayerOptions } from '../hooks/useNMI'
import MockModeMessage from '../components/MockModeMessage'
import type { NMIRecord } from '../services/nmi.service'

export default function NMITracker() {
  const [page, setPage] = useState(0)
  const [payerFilter, setPayerFilter] = useState<string>('')
  const [dispositionFilter, setDispositionFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useNMISummary()
  const { data: dispositions } = useDispositionOptions()
  const { data: payers } = usePayerOptions()
  const { data: nmiData, isLoading: nmiLoading } = useNMIList({
    limit: 20,
    offset: page * 20,
    payer: payerFilter || undefined,
    disposition: dispositionFilter || undefined,
    search: search || undefined,
  })

  if (summaryError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-icon text-red-600">error</span>
            <h2 className="text-xl font-semibold text-red-600">Error Loading NMI Data</h2>
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
      pageName="NMI Claims Tracker" 
      description="Track and manage Note of Medical Intervention (NMI) claims and responses from insurance providers."
    >
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            icon="business"
            iconColor="blue"
            value={summary?.totalNMIs || 0}
            label="Total Records"
            subtext="Corporate collection tracking"
            loading={summaryLoading}
          />
          <SummaryCard
            icon="pending"
            iconColor="orange"
            value={summary?.pendingNMIs || 0}
            label="Pending"
            subtext="Awaiting resolution"
            loading={summaryLoading}
          />
          <SummaryCard
            icon="check_circle"
            iconColor="green"
            value={summary?.resolvedNMIs || 0}
            label="Resolved"
            subtext="Completed items"
            loading={summaryLoading}
          />
        </div>

        {/* By Payer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">business</span>
              By Corporate/Payer
            </h3>
            {summaryLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-200 rounded" />
                ))}
              </div>
            ) : summary && summary.byPayer.length > 0 ? (
              <div className="space-y-3">
                {summary.byPayer.map((payer, index) => (
                  <PayerNMIRow key={index} payer={payer} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="material-icon text-primary-600">analytics</span>
              Resolution Rate
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Resolution Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {summary && summary.totalNMIs > 0
                    ? `${((summary.resolvedNMIs / summary.totalNMIs) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending Rate</span>
                <span className="text-lg font-semibold text-orange-600">
                  {summary && summary.totalNMIs > 0
                    ? `${((summary.pendingNMIs / summary.totalNMIs) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Corporates</span>
                <span className="text-lg font-semibold">{summary?.byPayer.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="material-icon text-primary-600">list_alt</span>
              Collection Records
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
                <option value="">All Corporates</option>
                {payers?.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={dispositionFilter}
                onChange={(e) => {
                  setDispositionFilter(e.target.value)
                  setPage(0)
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Dispositions</option>
                {dispositions?.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {nmiLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : nmiData && nmiData.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Corporate</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Contract Type</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Disposition</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Sub-Disposition</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Officer</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Escalation</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nmiData.data.map((nmi) => (
                      <NMIRow key={nmi.id} nmi={nmi} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {page * 20 + 1} to {Math.min((page + 1) * 20, nmiData.count)} of {nmiData.count}
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
                    disabled={(page + 1) * 20 >= (nmiData.count || 0)}
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
              <p className="text-gray-500 mt-2">No records found</p>
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

function PayerNMIRow({
  payer,
}: {
  payer: { payer: string; count: number; pendingCount: number }
}) {
  const pendingPercentage = payer.count > 0 ? (payer.pendingCount / payer.count) * 100 : 0

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{payer.payer}</p>
        <p className="text-xs text-gray-500">{payer.count} total records</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-orange-600">{payer.pendingCount} pending</p>
        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
          <div
            className="h-2 bg-orange-500 rounded-full"
            style={{ width: `${pendingPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function NMIRow({ nmi }: { nmi: NMIRecord }) {
  const dispositionColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    process: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-800',
  }

  const getDispositionColor = (disposition: string) => {
    const lower = disposition.toLowerCase()
    if (lower.includes('pending') || lower.includes('process')) return dispositionColors.pending
    if (lower.includes('approved') || lower.includes('cleared')) return dispositionColors.approved
    if (lower.includes('rejected') || lower.includes('denied')) return dispositionColors.rejected
    return 'bg-blue-100 text-blue-800'
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-2">
        <span className="font-medium text-gray-900">{nmi.corporate_company}</span>
      </td>
      <td className="py-3 px-2">
        <span className="text-gray-600">{nmi.contract_type || '-'}</span>
      </td>
      <td className="py-3 px-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDispositionColor(nmi.disposition)}`}>
          {nmi.disposition || '-'}
        </span>
      </td>
      <td className="py-3 px-2">
        <span className="text-gray-600 text-xs">{nmi.sub_disposition || '-'}</span>
      </td>
      <td className="py-3 px-2">
        <span className="text-gray-600">{nmi.collection_officer || '-'}</span>
      </td>
      <td className="py-3 px-2">
        {nmi.management_escalation === 'Yes' ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Escalated
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="py-3 px-2 text-gray-600">
        {nmi.disposition_date ? new Date(nmi.disposition_date).toLocaleDateString('en-IN') : '-'}
      </td>
    </tr>
  )
}
