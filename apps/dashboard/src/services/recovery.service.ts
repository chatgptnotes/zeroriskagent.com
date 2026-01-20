import { supabase } from '../lib/supabase'

// Types based on existing hospital tables
export interface Visit {
  id: string
  visit_id: string
  patient_id: string
  visit_date: string
  visit_type: string
  appointment_with: string
  reason_for_visit: string
  status: string
  claim_id: string | null
  admission_date: string | null
  discharge_date: string | null
  billing_status: string | null
  billing_sub_status: string | null
  file_status: string
  patient_type: string
  created_at: string
  updated_at: string
}

export interface BillPreparation {
  id: string
  visit_id: string
  date_of_bill_preparation: string | null
  bill_amount: number
  expected_amount: number | null
  billing_executive: string | null
  reason_for_delay: string | null
  date_of_submission: string | null
  executive_who_submitted: string | null
  received_date: string | null
  received_amount: number | null
  deduction_amount: number | null
  reason_for_deduction: string | null
  nmi_date: string | null
  nmi: string | null
  nmi_answered: string | null
  corporate: string
  expected_payment_date: string | null
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  name: string
  patients_id: string
  corporate: string
  insurance_person_no: string | null
  age: number | null
  gender: string
  phone: string
  hospital_name: string
  created_at: string
}

export interface RecoverySummary {
  totalBills: number
  totalAmount: number
  pendingBills: number
  pendingAmount: number
  receivedBills: number
  receivedAmount: number
  deductionAmount: number
  nmiCount: number
}

export interface BillWithPatient {
  id: string
  visit_id: string
  claim_id: string | null
  bill_amount: number
  expected_amount: number | null
  received_amount: number | null
  deduction_amount: number | null
  date_of_submission: string | null
  expected_payment_date: string | null
  received_date: string | null
  patient_name: string
  patient_id: string
  payer_type: string
  nmi: string | null
  nmi_date: string | null
  nmi_answered: string | null
  status: 'pending' | 'received' | 'partial' | 'nmi' | 'overdue'
  bill_age: number
  overdue_days: number
  aging_bucket: string
}

export interface PayerSummary {
  payer_type: string
  total_bills: number
  total_amount: number
  pending_count: number
  received_count: number
  pending_amount: number
  received_amount: number
  patient_count: number
  nmi_count: number
}

// Get recovery summary metrics from bill_preparation table
export async function getRecoverySummary(): Promise<RecoverySummary> {
  const { data: bills, error } = await supabase
    .from('bill_preparation')
    .select('bill_amount, received_amount, deduction_amount, nmi, received_date')

  if (error) {
    console.error('Error fetching bill_preparation:', error)
    throw error
  }

  const totalAmount = bills?.reduce((sum, b) => sum + (b.bill_amount || 0), 0) || 0
  const receivedAmount = bills?.reduce((sum, b) => sum + (b.received_amount || 0), 0) || 0
  const deductionAmount = bills?.reduce((sum, b) => sum + (b.deduction_amount || 0), 0) || 0

  // Pending = bills without received_date
  const pendingBills = bills?.filter(b => !b.received_date) || []
  const receivedBills = bills?.filter(b => b.received_date) || []
  const nmiCount = bills?.filter(b => b.nmi && b.nmi.trim() !== '').length || 0

  const summary: RecoverySummary = {
    totalBills: bills?.length || 0,
    totalAmount,
    pendingBills: pendingBills.length,
    pendingAmount: pendingBills.reduce((sum, b) => sum + (b.bill_amount || 0), 0),
    receivedBills: receivedBills.length,
    receivedAmount,
    deductionAmount,
    nmiCount,
  }

  return summary
}

// Get bills grouped by payer type from bill_preparation (includes patient counts)
export async function getBillsByPayer(): Promise<PayerSummary[]> {
  // Get all bill_preparation records
  const { data: bills, error: billsError } = await supabase
    .from('bill_preparation')
    .select('id, visit_id, bill_amount, received_amount, received_date, nmi, corporate')

  if (billsError) {
    console.error('Error fetching bill_preparation:', billsError)
    throw billsError
  }

  // Get visit_ids to find patient_ids
  const visitIds = [...new Set(bills?.map(b => b.visit_id).filter(Boolean) || [])]

  // Get visits to map visit_id -> patient_id
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('visit_id, patient_id')
    .in('visit_id', visitIds)

  if (visitsError) {
    console.error('Error fetching visits:', visitsError)
    throw visitsError
  }

  // Create visit -> patient map
  const visitPatientMap = new Map(visits?.map(v => [v.visit_id, v.patient_id]))

  // Group bills by payer type (corporate field in bill_preparation)
  const payerGroups = new Map<string, PayerSummary & { patientIds: Set<string> }>()

  bills?.forEach(bill => {
    const payerType = bill.corporate || 'private'
    const patientId = visitPatientMap.get(bill.visit_id)

    if (!payerGroups.has(payerType)) {
      payerGroups.set(payerType, {
        payer_type: payerType,
        total_bills: 0,
        total_amount: 0,
        pending_count: 0,
        received_count: 0,
        pending_amount: 0,
        received_amount: 0,
        patient_count: 0,
        nmi_count: 0,
        patientIds: new Set(),
      })
    }

    const group = payerGroups.get(payerType)!
    group.total_bills++
    group.total_amount += bill.bill_amount || 0

    if (patientId) {
      group.patientIds.add(patientId)
    }

    if (bill.received_date) {
      group.received_count++
      group.received_amount += bill.received_amount || 0
    } else {
      group.pending_count++
      group.pending_amount += bill.bill_amount || 0
    }

    if (bill.nmi && bill.nmi.trim() !== '') {
      group.nmi_count++
    }
  })

  // Convert to array and set patient counts
  const result: PayerSummary[] = Array.from(payerGroups.values()).map(group => ({
    payer_type: group.payer_type,
    total_bills: group.total_bills,
    total_amount: group.total_amount,
    pending_count: group.pending_count,
    received_count: group.received_count,
    pending_amount: group.pending_amount,
    received_amount: group.received_amount,
    patient_count: group.patientIds.size,
    nmi_count: group.nmi_count,
  }))

  return result.sort((a, b) => b.total_amount - a.total_amount)
}

// Get list of bills from bill_preparation with patient details
export async function getBillsList(options?: {
  limit?: number
  offset?: number
  payerType?: string
  status?: string
  search?: string
}): Promise<{ data: BillWithPatient[]; count: number }> {
  const limit = options?.limit || 20
  const offset = options?.offset || 0

  // Build query for bill_preparation
  let query = supabase
    .from('bill_preparation')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Apply payer filter at DB level
  if (options?.payerType) {
    query = query.eq('corporate', options.payerType)
  }

  const { data: bills, error: billsError } = await query

  if (billsError) {
    console.error('Error fetching bill_preparation:', billsError)
    throw billsError
  }

  // Get visit_ids to fetch patient info
  const visitIds = [...new Set(bills?.map(b => b.visit_id).filter(Boolean) || [])]

  // Get visits with patient_id and claim_id
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select('visit_id, patient_id, claim_id')
    .in('visit_id', visitIds)

  if (visitsError) {
    console.error('Error fetching visits:', visitsError)
    throw visitsError
  }

  // Get patient_ids
  const patientIds = [...new Set(visits?.map(v => v.patient_id).filter(Boolean) || [])]

  // Get patient names
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, name')
    .in('id', patientIds)

  if (patientsError) {
    console.error('Error fetching patients:', patientsError)
    throw patientsError
  }

  // Create maps
  const visitPatientMap = new Map(visits?.map(v => [v.visit_id, v.patient_id]))
  const visitClaimMap = new Map(visits?.map(v => [v.visit_id, v.claim_id]))
  const patientMap = new Map(patients?.map(p => [p.id, p.name]))

  // Determine status for each bill
  const getStatus = (bill: typeof bills[0], overdueDays: number): 'pending' | 'received' | 'partial' | 'nmi' | 'overdue' => {
    if (bill.nmi && bill.nmi.trim() !== '' && !bill.nmi_answered) return 'nmi'
    if (bill.received_date && bill.received_amount) {
      if (bill.received_amount >= bill.bill_amount) return 'received'
      return 'partial'
    }
    if (overdueDays > 0) return 'overdue'
    return 'pending'
  }

  // Calculate bill age in days from submission date
  const calculateBillAge = (submissionDate: string | null): number => {
    if (!submissionDate) return 0
    const submission = new Date(submissionDate)
    const today = new Date()
    const diffTime = today.getTime() - submission.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  // Calculate overdue days from expected payment date
  const calculateOverdueDays = (expectedPaymentDate: string | null): number => {
    if (!expectedPaymentDate) return 0
    const expected = new Date(expectedPaymentDate)
    const today = new Date()
    const diffTime = today.getTime() - expected.getTime()
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  // Get aging bucket based on overdue days
  const getAgingBucket = (overdueDays: number): string => {
    if (overdueDays === 0) return '-'
    if (overdueDays <= 30) return '0-30'
    if (overdueDays <= 60) return '31-60'
    if (overdueDays <= 90) return '61-90'
    if (overdueDays <= 180) return '91-180'
    if (overdueDays <= 365) return '181-365'
    return '365+'
  }

  // Transform data
  let combinedData: BillWithPatient[] = bills?.map(bill => {
    const patientId = visitPatientMap.get(bill.visit_id) || ''
    const patientName = patientMap.get(patientId) || 'Unknown'
    const claimId = visitClaimMap.get(bill.visit_id) || null
    const overdueDays = calculateOverdueDays(bill.expected_payment_date)

    return {
      id: bill.id,
      visit_id: bill.visit_id || '',
      claim_id: claimId,
      bill_amount: bill.bill_amount || 0,
      expected_amount: bill.expected_amount,
      received_amount: bill.received_amount,
      deduction_amount: bill.deduction_amount,
      date_of_submission: bill.date_of_submission,
      expected_payment_date: bill.expected_payment_date,
      received_date: bill.received_date,
      patient_name: patientName,
      patient_id: patientId,
      payer_type: bill.corporate || 'private',
      nmi: bill.nmi,
      nmi_date: bill.nmi_date,
      nmi_answered: bill.nmi_answered,
      status: getStatus(bill, overdueDays),
      bill_age: calculateBillAge(bill.date_of_submission),
      overdue_days: overdueDays,
      aging_bucket: getAgingBucket(overdueDays),
    }
  }) || []

  // Apply status filter
  if (options?.status) {
    combinedData = combinedData.filter(b => b.status === options.status)
  }

  // Apply search filter
  if (options?.search) {
    const searchLower = options.search.toLowerCase()
    combinedData = combinedData.filter(b =>
      b.patient_name.toLowerCase().includes(searchLower) ||
      b.visit_id.toLowerCase().includes(searchLower) ||
      b.payer_type.toLowerCase().includes(searchLower)
    )
  }

  // Apply pagination after filtering
  const paginatedData = combinedData.slice(offset, offset + limit)

  return {
    data: paginatedData,
    count: combinedData.length,
  }
}

// Get single bill details from bill_preparation
export async function getBillDetails(billId: string): Promise<BillWithPatient | null> {
  const { data: bill, error: billError } = await supabase
    .from('bill_preparation')
    .select('*')
    .eq('id', billId)
    .single()

  if (billError) {
    console.error('Error fetching bill_preparation:', billError)
    throw billError
  }

  if (!bill) return null

  // Get visit to find patient and claim_id
  const { data: visit } = await supabase
    .from('visits')
    .select('patient_id, claim_id')
    .eq('visit_id', bill.visit_id)
    .single()

  // Get patient name
  let patientName = 'Unknown'
  let patientId = ''
  let claimId: string | null = null
  if (visit?.patient_id) {
    patientId = visit.patient_id
    claimId = visit.claim_id || null
    const { data: patient } = await supabase
      .from('patients')
      .select('name')
      .eq('id', visit.patient_id)
      .single()
    if (patient) {
      patientName = patient.name
    }
  }

  // Calculate bill age
  const calculateBillAge = (submissionDate: string | null): number => {
    if (!submissionDate) return 0
    const submission = new Date(submissionDate)
    const today = new Date()
    const diffTime = today.getTime() - submission.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  // Calculate overdue days from expected payment date
  const calculateOverdueDays = (expectedPaymentDate: string | null): number => {
    if (!expectedPaymentDate) return 0
    const expected = new Date(expectedPaymentDate)
    const today = new Date()
    const diffTime = today.getTime() - expected.getTime()
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  // Get aging bucket based on overdue days
  const getAgingBucket = (overdueDays: number): string => {
    if (overdueDays === 0) return '-'
    if (overdueDays <= 30) return '0-30'
    if (overdueDays <= 60) return '31-60'
    if (overdueDays <= 90) return '61-90'
    if (overdueDays <= 180) return '91-180'
    if (overdueDays <= 365) return '181-365'
    return '365+'
  }

  const overdueDays = calculateOverdueDays(bill.expected_payment_date)

  // Determine status
  const getStatus = (): 'pending' | 'received' | 'partial' | 'nmi' | 'overdue' => {
    if (bill.nmi && bill.nmi.trim() !== '' && !bill.nmi_answered) return 'nmi'
    if (bill.received_date && bill.received_amount) {
      if (bill.received_amount >= bill.bill_amount) return 'received'
      return 'partial'
    }
    if (overdueDays > 0) return 'overdue'
    return 'pending'
  }

  return {
    id: bill.id,
    visit_id: bill.visit_id || '',
    claim_id: claimId,
    bill_amount: bill.bill_amount || 0,
    expected_amount: bill.expected_amount,
    received_amount: bill.received_amount,
    deduction_amount: bill.deduction_amount,
    date_of_submission: bill.date_of_submission,
    expected_payment_date: bill.expected_payment_date,
    received_date: bill.received_date,
    patient_name: patientName,
    patient_id: patientId,
    payer_type: bill.corporate || 'private',
    nmi: bill.nmi,
    nmi_date: bill.nmi_date,
    nmi_answered: bill.nmi_answered,
    status: getStatus(),
    bill_age: calculateBillAge(bill.date_of_submission),
    overdue_days: overdueDays,
    aging_bucket: getAgingBucket(overdueDays),
  }
}
