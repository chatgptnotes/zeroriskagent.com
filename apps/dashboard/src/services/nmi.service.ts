import { supabase } from '../lib/supabase'

// NMI = Need More Information - queries raised by payers before claim approval
// Note: corporate_collection_management tracks at company level, not patient level

export interface NMIRecord {
  id: number
  corporate_company: string
  contract_type: string
  disposition: string
  sub_disposition: string
  disposition_date: string | null
  disposition_notes: string | null
  corporate_response: string | null
  reason_for_delay: string | null
  promised_clearance_date: string | null
  collection_officer: string | null
  report_date: string | null
  remarks: string | null
  action_required: string | null
  next_steps: string | null
  management_escalation: string | null
  created_at: string
  updated_at: string
}

export interface NMISummary {
  totalNMIs: number
  pendingNMIs: number
  resolvedNMIs: number
  byPayer: {
    payer: string
    count: number
    pendingCount: number
  }[]
}

export interface NMIFilters {
  payer?: string
  disposition?: string
  search?: string
  limit?: number
  offset?: number
}

// Get NMI summary metrics
export async function getNMISummary(): Promise<NMISummary> {
  // Query corporate_collection_management for NMI data
  const { data: records, error } = await supabase
    .from('corporate_collection_management')
    .select('id, disposition, sub_disposition, corporate_company')

  if (error) {
    console.error('Error fetching NMI summary:', error)
    throw error
  }

  // Group by payer (corporate_company)
  const payerMap = new Map<string, { count: number; pendingCount: number }>()

  records?.forEach(record => {
    const payer = record.corporate_company || 'Unknown'
    if (!payerMap.has(payer)) {
      payerMap.set(payer, { count: 0, pendingCount: 0 })
    }
    const group = payerMap.get(payer)!
    group.count++

    // Consider pending if disposition indicates pending/open status
    const isPending = record.disposition?.toLowerCase().includes('pending') ||
      record.disposition?.toLowerCase().includes('process') ||
      record.disposition?.toLowerCase().includes('open')

    if (isPending) {
      group.pendingCount++
    }
  })

  const byPayer = Array.from(payerMap.entries()).map(([payer, data]) => ({
    payer,
    count: data.count,
    pendingCount: data.pendingCount,
  }))

  const pendingNMIs = records?.filter(r =>
    r.disposition?.toLowerCase().includes('pending') ||
    r.disposition?.toLowerCase().includes('process')
  ).length || 0

  return {
    totalNMIs: records?.length || 0,
    pendingNMIs,
    resolvedNMIs: (records?.length || 0) - pendingNMIs,
    byPayer: byPayer.sort((a, b) => b.count - a.count),
  }
}

// Get list of NMI records (company-level tracking)
export async function getNMIList(filters?: NMIFilters): Promise<{ data: NMIRecord[]; count: number }> {
  const limit = filters?.limit || 20
  const offset = filters?.offset || 0

  // Build query for corporate_collection_management
  let query = supabase
    .from('corporate_collection_management')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply filters
  if (filters?.payer) {
    query = query.eq('corporate_company', filters.payer)
  }

  if (filters?.disposition) {
    query = query.eq('disposition', filters.disposition)
  }

  const { data: records, count, error } = await query

  if (error) {
    console.error('Error fetching NMI list:', error)
    throw error
  }

  // Transform data
  let transformedData: NMIRecord[] = records?.map(record => ({
    id: record.id,
    corporate_company: record.corporate_company || 'Unknown',
    contract_type: record.contract_type || '',
    disposition: record.disposition || '',
    sub_disposition: record.sub_disposition || '',
    disposition_date: record.disposition_date || null,
    disposition_notes: record.disposition_notes || null,
    corporate_response: record.corporate_response || null,
    reason_for_delay: record.reason_for_delay || null,
    promised_clearance_date: record.promised_clearance_date || null,
    collection_officer: record.collection_officer || null,
    report_date: record.report_date || null,
    remarks: record.remarks || null,
    action_required: record.action_required || null,
    next_steps: record.next_steps || null,
    management_escalation: record.management_escalation || null,
    created_at: record.created_at,
    updated_at: record.updated_at || record.created_at,
  })) || []

  // Apply search filter client-side
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    transformedData = transformedData.filter(r =>
      r.corporate_company.toLowerCase().includes(searchLower) ||
      r.disposition.toLowerCase().includes(searchLower) ||
      r.sub_disposition.toLowerCase().includes(searchLower) ||
      (r.remarks && r.remarks.toLowerCase().includes(searchLower))
    )
  }

  return {
    data: transformedData,
    count: count || 0,
  }
}

// Get unique disposition values for filtering
export async function getDispositionOptions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('corporate_collection_management')
    .select('disposition')

  if (error) {
    console.error('Error fetching dispositions:', error)
    return []
  }

  const uniqueDispositions = [...new Set(data?.map(d => d.disposition).filter(Boolean) || [])]
  return uniqueDispositions.sort()
}

// Get unique payer names for filtering
export async function getPayerOptions(): Promise<string[]> {
  const { data, error } = await supabase
    .from('corporate_collection_management')
    .select('corporate_company')

  if (error) {
    console.error('Error fetching payers:', error)
    return []
  }

  const uniquePayers = [...new Set(data?.map(d => d.corporate_company).filter(Boolean) || [])]
  return uniquePayers.sort()
}

// Get single NMI record details
export async function getNMIDetails(id: string): Promise<NMIRecord | null> {
  const { data: record, error } = await supabase
    .from('corporate_collection_management')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching NMI details:', error)
    throw error
  }

  if (!record) return null

  return {
    id: record.id,
    corporate_company: record.corporate_company || 'Unknown',
    contract_type: record.contract_type || '',
    disposition: record.disposition || '',
    sub_disposition: record.sub_disposition || '',
    disposition_date: record.disposition_date || null,
    disposition_notes: record.disposition_notes || null,
    corporate_response: record.corporate_response || null,
    reason_for_delay: record.reason_for_delay || null,
    promised_clearance_date: record.promised_clearance_date || null,
    collection_officer: record.collection_officer || null,
    report_date: record.report_date || null,
    remarks: record.remarks || null,
    action_required: record.action_required || null,
    next_steps: record.next_steps || null,
    management_escalation: record.management_escalation || null,
    created_at: record.created_at,
    updated_at: record.updated_at || record.created_at,
  }
}
