import { useQuery } from '@tanstack/react-query'
import {
  getRecoverySummary,
  getBillsByPayer,
  getBillsList,
  getBillDetails,
  type RecoverySummary,
  type PayerSummary,
  type BillWithPatient,
} from '../services/recovery.service'

// Query keys
export const recoveryKeys = {
  all: ['recovery'] as const,
  summary: () => [...recoveryKeys.all, 'summary'] as const,
  byPayer: () => [...recoveryKeys.all, 'byPayer'] as const,
  bills: () => [...recoveryKeys.all, 'bills'] as const,
  billsList: (filters?: Record<string, unknown>) => [...recoveryKeys.bills(), filters] as const,
  billDetail: (id: string) => [...recoveryKeys.bills(), id] as const,
}

// Hook to get recovery summary metrics
export function useRecoverySummary() {
  return useQuery<RecoverySummary, Error>({
    queryKey: recoveryKeys.summary(),
    queryFn: getRecoverySummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook to get bills grouped by payer
export function useBillsByPayer() {
  return useQuery<PayerSummary[], Error>({
    queryKey: recoveryKeys.byPayer(),
    queryFn: getBillsByPayer,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// Hook to get bills list with filters
export function useBillsList(options?: {
  limit?: number
  offset?: number
  payerType?: string
  status?: string
  search?: string
}) {
  return useQuery<{ data: BillWithPatient[]; count: number }, Error>({
    queryKey: recoveryKeys.billsList(options),
    queryFn: () => getBillsList(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook to get single bill details
export function useBillDetails(billId: string) {
  return useQuery<BillWithPatient | null, Error>({
    queryKey: recoveryKeys.billDetail(billId),
    queryFn: () => getBillDetails(billId),
    enabled: !!billId,
    staleTime: 5 * 60 * 1000,
  })
}
