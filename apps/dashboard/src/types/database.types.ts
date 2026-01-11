export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id: string
          name: string
          registration_number: string
          type: 'government' | 'private' | 'trust'
          address: Json
          contact_details: Json
          esic_code: string | null
          esic_branch_code: string | null
          cghs_wellness_center_code: string | null
          cghs_empanelment_number: string | null
          echs_polyclinic_code: string | null
          echs_station_code: string | null
          recovery_fee_percentage: number
          min_claim_value_for_recovery: number
          status: 'active' | 'suspended' | 'inactive'
          onboarded_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['hospitals']['Row'], 'id' | 'created_at' | 'updated_at' | 'onboarded_at'>
        Update: Partial<Database['public']['Tables']['hospitals']['Insert']>
      }
      claims: {
        Row: {
          id: string
          hospital_id: string
          payer_id: string
          claim_number: string
          hospital_claim_id: string
          external_claim_id: string | null
          patient_id_hash: string
          patient_age: number | null
          patient_gender: 'M' | 'F' | 'O' | null
          beneficiary_type: string | null
          admission_date: string | null
          discharge_date: string | null
          claim_type: 'inpatient' | 'outpatient' | 'daycare' | 'diagnostic' | 'pharmacy'
          claimed_amount: number
          approved_amount: number | null
          paid_amount: number
          outstanding_amount: number
          primary_diagnosis_code: string | null
          procedure_codes: string[] | null
          treatment_summary: string | null
          claim_status: 'submitted' | 'under_review' | 'pending_documents' | 'approved' | 'partially_approved' | 'denied' | 'appealed' | 'recovered' | 'written_off'
          submission_date: string
          last_status_update: string
          payment_due_date: string | null
          aged_days: number
          created_at: string
          updated_at: string
        }
      }
      claim_denials: {
        Row: {
          id: string
          claim_id: string
          denial_code: string
          denial_category: 'medical_necessity' | 'documentation_incomplete' | 'coding_error' | 'eligibility_issue' | 'policy_exclusion' | 'tariff_rate_dispute' | 'duplicate_claim' | 'time_limit_exceeded' | 'unauthorized_service' | 'other'
          denial_reason: string
          denial_amount: number
          denial_date: string
          denial_letter_url: string | null
          payer_reference_number: string | null
          recovery_probability: number | null
          estimated_recovery_amount: number | null
          recovery_effort_score: number | null
          ai_analysis: Json | null
          recommended_action: string | null
          ai_generated_at: string | null
          created_at: string
          updated_at: string
        }
      }
      appeals: {
        Row: {
          id: string
          claim_id: string
          denial_id: string | null
          appeal_number: string
          appeal_level: number
          appeal_type: 'reconsideration' | 'review' | 'grievance'
          appeal_reason: string
          supporting_documents_urls: string[] | null
          medical_justification: string | null
          policy_references: string[] | null
          generated_by: 'ai_agent' | 'human' | 'hybrid'
          ai_model_used: string | null
          ai_confidence_score: number | null
          ai_generation_metadata: Json | null
          appeal_status: 'draft' | 'submitted' | 'under_review' | 'additional_info_requested' | 'accepted' | 'partially_accepted' | 'rejected' | 'withdrawn'
          submitted_date: string | null
          response_due_date: string | null
          response_received_date: string | null
          outcome_amount: number | null
          outcome_reason: string | null
          payer_response_document_url: string | null
          created_at: string
          updated_at: string
        }
      }
      recovery_transactions: {
        Row: {
          id: string
          hospital_id: string
          claim_id: string
          appeal_id: string | null
          recovery_amount: number
          recovery_date: string
          recovery_method: 'direct_payment' | 'adjustment' | 'settlement'
          agent_fee_percentage: number
          agent_fee_amount: number
          hospital_amount: number
          payment_status: 'pending' | 'processed' | 'failed' | 'disputed'
          payment_reference_number: string | null
          payment_date: string | null
          payment_mode: 'bank_transfer' | 'cheque' | 'upi' | 'neft' | 'rtgs' | null
          invoice_number: string | null
          invoice_url: string | null
          invoice_generated_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
      }
      payer_organizations: {
        Row: {
          id: string
          name: string
          code: string
          type: 'esic' | 'cghs' | 'echs' | 'state_govt' | 'private_insurance' | 'corporate' | 'other'
          portal_url: string | null
          grievance_email: string | null
          helpline_number: string | null
          regional_office_details: Json | null
          typical_processing_days: number
          appeal_levels: number
          max_appeal_days: number
          api_endpoint: string | null
          api_auth_method: string | null
          has_direct_integration: boolean
          created_at: string
          updated_at: string
        }
      }
    }
    Views: {
      dashboard_metrics: {
        Row: {
          hospital_id: string
          hospital_name: string
          total_claims: number
          submitted_claims: number
          under_review_claims: number
          approved_claims: number
          denied_claims: number
          appealed_claims: number
          recovered_claims: number
          total_claimed: number
          total_approved: number
          total_paid: number
          total_outstanding: number
          total_denied_amount: number
          recoverable_amount: number
          avg_aged_days: number
          aged_over_30_days: number
          aged_over_60_days: number
          aged_over_90_days: number
          total_agent_fees: number
          total_hospital_recovered: number
          total_recovery_value: number
          total_appeals: number
          successful_appeals: number
          appeal_rate_percentage: number
          appeal_success_rate_percentage: number
          last_updated: string
        }
      }
    }
  }
}

export type Hospital = Database['public']['Tables']['hospitals']['Row']
export type Claim = Database['public']['Tables']['claims']['Row']
export type ClaimDenial = Database['public']['Tables']['claim_denials']['Row']
export type Appeal = Database['public']['Tables']['appeals']['Row']
export type RecoveryTransaction = Database['public']['Tables']['recovery_transactions']['Row']
export type PayerOrganization = Database['public']['Tables']['payer_organizations']['Row']
export type DashboardMetrics = Database['public']['Views']['dashboard_metrics']['Row']
