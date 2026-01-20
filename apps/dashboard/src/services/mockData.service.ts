// Mock Data Service for Zero Risk Agent Dashboard
// Provides realistic sample data without requiring database connection

import type { DashboardMetrics, Claim, RecoveryTransaction, PayerOrganization } from '../types/database.types'

// Generate realistic mock data based on Hope Hospital
export class MockDataService {
  private static instance: MockDataService
  private dashboardMetrics: DashboardMetrics | null = null
  private claims: Claim[] = []
  private recoveryTransactions: RecoveryTransaction[] = []
  private payerOrganizations: PayerOrganization[] = []

  constructor() {
    this.initializeMockData()
  }

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService()
    }
    return MockDataService.instance
  }

  private initializeMockData() {
    this.generatePayerOrganizations()
    this.generateClaims()
    this.generateRecoveryTransactions()
    this.generateDashboardMetrics()
  }

  private generatePayerOrganizations() {
    this.payerOrganizations = [
      {
        id: 'esic-mumbai',
        name: 'Employees State Insurance Corporation - Mumbai',
        code: 'ESIC_MH_01',
        type: 'esic',
        portal_url: 'https://esic.nic.in',
        grievance_email: 'grievance.mumbai@esic.gov.in',
        helpline_number: '1800-121-4142',
        regional_office_details: { city: 'Mumbai', state: 'Maharashtra', address: 'ESI Building, Mumbai' },
        typical_processing_days: 30,
        appeal_levels: 3,
        max_appeal_days: 90,
        api_endpoint: null,
        api_auth_method: null,
        has_direct_integration: false,
        created_at: '2026-01-11T00:00:00Z',
        updated_at: '2026-01-11T00:00:00Z'
      },
      {
        id: 'cghs-mumbai',
        name: 'Central Government Health Scheme - Mumbai',
        code: 'CGHS_MH_02',
        type: 'cghs',
        portal_url: 'https://cghs.gov.in',
        grievance_email: 'cghs.mumbai@gov.in',
        helpline_number: '1800-121-3573',
        regional_office_details: { city: 'Mumbai', state: 'Maharashtra', address: 'CGHS Wellness Center, Mumbai' },
        typical_processing_days: 45,
        appeal_levels: 3,
        max_appeal_days: 120,
        api_endpoint: null,
        api_auth_method: null,
        has_direct_integration: false,
        created_at: '2026-01-11T00:00:00Z',
        updated_at: '2026-01-11T00:00:00Z'
      },
      {
        id: 'echs-pune',
        name: 'Ex-Servicemen Contributory Health Scheme - Pune',
        code: 'ECHS_MH_03',
        type: 'echs',
        portal_url: 'https://echs.gov.in',
        grievance_email: 'echs.pune@gov.in',
        helpline_number: '1800-121-4073',
        regional_office_details: { city: 'Pune', state: 'Maharashtra', address: 'ECHS Polyclinic, Pune' },
        typical_processing_days: 60,
        appeal_levels: 3,
        max_appeal_days: 90,
        api_endpoint: null,
        api_auth_method: null,
        has_direct_integration: false,
        created_at: '2026-01-11T00:00:00Z',
        updated_at: '2026-01-11T00:00:00Z'
      }
    ]
  }

  private generateClaims() {
    const baseDate = new Date('2026-01-01')
    const now = new Date()

    // Generate 25 sample claims with varied statuses and amounts
    this.claims = Array.from({ length: 25 }, (_, index) => {
      const submissionDate = new Date(baseDate.getTime() + (index * 3 * 24 * 60 * 60 * 1000))
      const agedDays = Math.floor((now.getTime() - submissionDate.getTime()) / (24 * 60 * 60 * 1000))
      const claimedAmount = Math.floor(Math.random() * 500000) + 50000 // ₹50K to ₹5.5L
      const payerIndex = index % this.payerOrganizations.length

      // Determine status based on index for variety
      let status: Claim['claim_status']
      let approvedAmount: number | null = null
      let paidAmount = 0
      let outstandingAmount = claimedAmount

      if (index < 5) {
        status = 'denied'
        outstandingAmount = claimedAmount
      } else if (index < 8) {
        status = 'appealed'
        outstandingAmount = claimedAmount
      } else if (index < 12) {
        status = 'recovered'
        approvedAmount = Math.floor(claimedAmount * 0.85)
        paidAmount = approvedAmount
        outstandingAmount = 0
      } else if (index < 16) {
        status = 'approved'
        approvedAmount = Math.floor(claimedAmount * 0.9)
        outstandingAmount = approvedAmount
      } else if (index < 20) {
        status = 'under_review'
        outstandingAmount = claimedAmount
      } else {
        status = 'submitted'
        outstandingAmount = claimedAmount
      }

      return {
        id: `claim-${String(index + 1).padStart(3, '0')}`,
        hospital_id: 'hope-hospital-id',
        payer_id: this.payerOrganizations[payerIndex].id,
        claim_number: `HOPE/2026/${String(index + 1).padStart(4, '0')}`,
        hospital_claim_id: `HH-${index + 1}`,
        external_claim_id: status !== 'submitted' ? `EXT-${index + 1000}` : null,
        patient_id_hash: `hash-${index + 1}`,
        patient_age: Math.floor(Math.random() * 70) + 20,
        patient_gender: ['M', 'F'][Math.floor(Math.random() * 2)] as 'M' | 'F',
        beneficiary_type: this.payerOrganizations[payerIndex].type.toUpperCase(),
        admission_date: index < 15 ? submissionDate.toISOString() : null,
        discharge_date: index < 15 ? new Date(submissionDate.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString() : null,
        claim_type: ['inpatient', 'outpatient', 'daycare', 'diagnostic'][Math.floor(Math.random() * 4)] as Claim['claim_type'],
        claimed_amount: claimedAmount,
        approved_amount: approvedAmount,
        paid_amount: paidAmount,
        outstanding_amount: outstandingAmount,
        primary_diagnosis_code: `ICD-10-${index + 1}`,
        procedure_codes: [`CPT-${index + 1000}`, `CPT-${index + 2000}`],
        treatment_summary: `Treatment summary for claim ${index + 1}`,
        claim_status: status,
        submission_date: submissionDate.toISOString(),
        last_status_update: new Date(submissionDate.getTime() + (Math.random() * 10 * 24 * 60 * 60 * 1000)).toISOString(),
        payment_due_date: status === 'approved' ? new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString() : null,
        aged_days: agedDays,
        created_at: submissionDate.toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  }

  private generateRecoveryTransactions() {
    // Generate recovery transactions for recovered claims
    const recoveredClaims = this.claims.filter(claim => claim.claim_status === 'recovered')
    
    this.recoveryTransactions = recoveredClaims.map((claim, index) => {
      const recoveryAmount = claim.paid_amount
      const agentFeePercentage = 25 // 25% agent fee
      const agentFeeAmount = Math.floor(recoveryAmount * agentFeePercentage / 100)
      const hospitalAmount = recoveryAmount - agentFeeAmount

      return {
        id: `recovery-${String(index + 1).padStart(3, '0')}`,
        hospital_id: 'hope-hospital-id',
        claim_id: claim.id,
        appeal_id: `appeal-${index + 1}`,
        recovery_amount: recoveryAmount,
        recovery_date: new Date(Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
        recovery_method: ['direct_payment', 'adjustment', 'settlement'][Math.floor(Math.random() * 3)] as RecoveryTransaction['recovery_method'],
        agent_fee_percentage: agentFeePercentage,
        agent_fee_amount: agentFeeAmount,
        hospital_amount: hospitalAmount,
        payment_status: 'processed' as RecoveryTransaction['payment_status'],
        payment_reference_number: `REF-${index + 10000}`,
        payment_date: new Date().toISOString(),
        payment_mode: ['bank_transfer', 'neft', 'rtgs'][Math.floor(Math.random() * 3)] as RecoveryTransaction['payment_mode'],
        invoice_number: `INV-2026-${String(index + 1).padStart(4, '0')}`,
        invoice_url: null,
        invoice_generated_at: new Date().toISOString(),
        notes: `Recovery processed for claim ${claim.claim_number}`,
        created_at: claim.created_at,
        updated_at: new Date().toISOString()
      }
    })
  }

  private generateDashboardMetrics() {
    const totalClaims = this.claims.length
    const submittedClaims = this.claims.filter(c => c.claim_status === 'submitted').length
    const underReviewClaims = this.claims.filter(c => c.claim_status === 'under_review').length
    const approvedClaims = this.claims.filter(c => c.claim_status === 'approved').length
    const deniedClaims = this.claims.filter(c => c.claim_status === 'denied').length
    const appealedClaims = this.claims.filter(c => c.claim_status === 'appealed').length
    const recoveredClaims = this.claims.filter(c => c.claim_status === 'recovered').length

    const totalClaimed = this.claims.reduce((sum, claim) => sum + claim.claimed_amount, 0)
    const totalApproved = this.claims.reduce((sum, claim) => sum + (claim.approved_amount || 0), 0)
    const totalPaid = this.claims.reduce((sum, claim) => sum + claim.paid_amount, 0)
    const totalOutstanding = this.claims.reduce((sum, claim) => sum + claim.outstanding_amount, 0)
    
    const deniedClaims_list = this.claims.filter(c => ['denied', 'appealed'].includes(c.claim_status))
    const totalDeniedAmount = deniedClaims_list.reduce((sum, claim) => sum + claim.outstanding_amount, 0)
    const recoverableAmount = totalDeniedAmount

    const avgAgedDays = Math.floor(this.claims.reduce((sum, claim) => sum + claim.aged_days, 0) / totalClaims)
    const agedOver30Days = this.claims.filter(c => c.aged_days > 30 && !['recovered'].includes(c.claim_status)).length
    const agedOver60Days = this.claims.filter(c => c.aged_days > 60 && !['recovered'].includes(c.claim_status)).length
    const agedOver90Days = this.claims.filter(c => c.aged_days > 90 && !['recovered'].includes(c.claim_status)).length

    const totalRecoveryValue = this.recoveryTransactions.reduce((sum, tx) => sum + tx.recovery_amount, 0)
    const totalAgentFees = this.recoveryTransactions.reduce((sum, tx) => sum + tx.agent_fee_amount, 0)
    const totalHospitalRecovered = this.recoveryTransactions.reduce((sum, tx) => sum + tx.hospital_amount, 0)

    const totalAppeals = appealedClaims + recoveredClaims // Assuming recovered claims went through appeals
    const successfulAppeals = recoveredClaims
    const appealRatePercentage = deniedClaims > 0 ? Math.round((appealedClaims / deniedClaims) * 100) : 0
    const appealSuccessRatePercentage = totalAppeals > 0 ? Math.round((successfulAppeals / totalAppeals) * 100) : 0

    this.dashboardMetrics = {
      hospital_id: 'hope-hospital-id',
      hospital_name: 'Hope Hospital',
      total_claims: totalClaims,
      submitted_claims: submittedClaims,
      under_review_claims: underReviewClaims,
      approved_claims: approvedClaims,
      denied_claims: deniedClaims,
      appealed_claims: appealedClaims,
      recovered_claims: recoveredClaims,
      total_claimed: totalClaimed,
      total_approved: totalApproved,
      total_paid: totalPaid,
      total_outstanding: totalOutstanding,
      total_denied_amount: totalDeniedAmount,
      recoverable_amount: recoverableAmount,
      avg_aged_days: avgAgedDays,
      aged_over_30_days: agedOver30Days,
      aged_over_60_days: agedOver60Days,
      aged_over_90_days: agedOver90Days,
      total_agent_fees: totalAgentFees,
      total_hospital_recovered: totalHospitalRecovered,
      total_recovery_value: totalRecoveryValue,
      total_appeals: totalAppeals,
      successful_appeals: successfulAppeals,
      appeal_rate_percentage: appealRatePercentage,
      appeal_success_rate_percentage: appealSuccessRatePercentage,
      last_updated: new Date().toISOString()
    }
  }

  // Public API methods with simulated delay
  async getDashboardMetrics(): Promise<{ data: DashboardMetrics | null; error: string | null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: this.dashboardMetrics,
          error: null
        })
      }, 300) // Simulate 300ms API delay
    })
  }

  async getClaims(): Promise<{ data: Claim[]; error: string | null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: this.claims,
          error: null
        })
      }, 400)
    })
  }

  async getRecoveryTransactions(): Promise<{ data: RecoveryTransaction[]; error: string | null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: this.recoveryTransactions,
          error: null
        })
      }, 350)
    })
  }

  async getPayerOrganizations(): Promise<{ data: PayerOrganization[]; error: string | null }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: this.payerOrganizations,
          error: null
        })
      }, 200)
    })
  }

  // Additional utility methods
  getClaimsByStatus(status: Claim['claim_status']): Claim[] {
    return this.claims.filter(claim => claim.claim_status === status)
  }

  getClaimsByPayer(payerType: string): Claim[] {
    const payerIds = this.payerOrganizations
      .filter(payer => payer.type === payerType)
      .map(payer => payer.id)
    
    return this.claims.filter(claim => payerIds.includes(claim.payer_id))
  }

  getTotalRecoveredAmount(): number {
    return this.recoveryTransactions.reduce((sum, tx) => sum + tx.recovery_amount, 0)
  }

  getTotalAgentFees(): number {
    return this.recoveryTransactions.reduce((sum, tx) => sum + tx.agent_fee_amount, 0)
  }

  // Method to refresh/regenerate data (useful for testing)
  refreshData(): void {
    this.initializeMockData()
  }
}

// Export singleton instance
export const mockDataService = MockDataService.getInstance()

// Export individual data getters for convenience
export const getMockDashboardMetrics = () => mockDataService.getDashboardMetrics()
export const getMockClaims = () => mockDataService.getClaims()
export const getMockRecoveryTransactions = () => mockDataService.getRecoveryTransactions()
export const getMockPayerOrganizations = () => mockDataService.getPayerOrganizations()