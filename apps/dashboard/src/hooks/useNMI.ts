import { useQuery } from '@tanstack/react-query'
import {
  getNMISummary,
  getNMIList,
  getNMIDetails,
  getDispositionOptions,
  getPayerOptions,
  type NMISummary,
  type NMIRecord,
  type NMIFilters,
} from '../services/nmi.service'

// Query keys
export const nmiKeys = {
  all: ['nmi'] as const,
  summary: () => [...nmiKeys.all, 'summary'] as const,
  list: () => [...nmiKeys.all, 'list'] as const,
  listFiltered: (filters?: NMIFilters) => [...nmiKeys.list(), filters] as const,
  detail: (id: string) => [...nmiKeys.all, 'detail', id] as const,
  dispositions: () => [...nmiKeys.all, 'dispositions'] as const,
  payers: () => [...nmiKeys.all, 'payers'] as const,
}

// Hook to get NMI summary metrics
export function useNMISummary() {
  return useQuery<NMISummary, Error>({
    queryKey: nmiKeys.summary(),
    queryFn: getNMISummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook to get NMI list with filters
export function useNMIList(filters?: NMIFilters) {
  return useQuery<{ data: NMIRecord[]; count: number }, Error>({
    queryKey: nmiKeys.listFiltered(filters),
    queryFn: () => getNMIList(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })
}

// Hook to get single NMI record details
export function useNMIDetails(id: string) {
  return useQuery<NMIRecord | null, Error>({
    queryKey: nmiKeys.detail(id),
    queryFn: () => getNMIDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook to get disposition options for filtering
export function useDispositionOptions() {
  return useQuery<string[], Error>({
    queryKey: nmiKeys.dispositions(),
    queryFn: getDispositionOptions,
    staleTime: 30 * 60 * 1000, // 30 minutes - these don't change often
    refetchOnWindowFocus: false,
  })
}

// Hook to get payer options for filtering
export function usePayerOptions() {
  return useQuery<string[], Error>({
    queryKey: nmiKeys.payers(),
    queryFn: getPayerOptions,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  })
}
