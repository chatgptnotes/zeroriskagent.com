import { supabase } from '../lib/supabase'

// ESIC Claims data structure matching your dashboard
export interface ESICClaimStatus {
  stage: string
  status: string
  inPatient: number
  opd: number
  counts: number
  enhancement: number
  isHighlighted?: boolean
}

export interface ESICClaimsData {
  hospitalName: string
  extractedAt: string
  totalClaims: {
    inPatient: number
    opd: number
    counts: number
    enhancement: number
  }
  stageData: {
    stage: string
    statuses: {
      status: string
      inPatient: number
      opd: number
      counts: number
      enhancement: number
      isHighlighted?: boolean
    }[]
  }[]
}

// Extract ESIC claims data from uploaded image using Gemini
export async function extractESICClaimsFromImage(imageFile: File): Promise<{
  success: boolean
  data?: ESICClaimsData
  error?: string
}> {
  try {
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile)
    
    // Call Gemini API to extract ESIC claims data
    const response = await fetch('/api/gemini-extract-esic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        prompt: `Extract all ESIC claims data from this dashboard image. Parse the table with the following structure:
        
        Stages: ESIC Referral, Hospital Intimation, BPA Acknowledgement, Hospital Submission, ESIC - Document Receiver, ESIC - Document Verifier, BPA Scrutinizer, ESIC - Medical Officer L1, ESIC - Medical Officer L2, ESIC - CFA Sanction, ESIC - Accounts, BPA Maintenance
        
        For each stage, extract all statuses with their corresponding values for:
        - In Patient (number)
        - OPD Patient (number) 
        - Counts (number)
        - Enhancement (number)
        
        Also identify which statuses are highlighted in red (these typically contain "Need More Information", "Recommended for Rejection", "Rejected", etc.).
        
        Extract the hospital name from the top of the dashboard.
        
        Return the data as a structured JSON object with exact stage names and status text as shown in the image.`
      })
    })

    if (!response.ok) {
      throw new Error('Failed to extract data from image')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('ESIC extraction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract ESIC claims data'
    }
  }
}

// Save extracted ESIC claims data to Supabase
export async function saveESICClaimsData(data: ESICClaimsData, uploadId?: string): Promise<{
  success: boolean
  id?: string
  error?: string
}> {
  try {
    const { data: savedData, error } = await supabase
      .from('esic_claims_extractions')
      .insert({
        hospital_name: data.hospitalName,
        extracted_at: data.extractedAt,
        total_claims: data.totalClaims,
        stage_data: data.stageData,
        upload_id: uploadId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      id: savedData.id
    }
  } catch (error) {
    console.error('Save ESIC data error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save extracted data'
    }
  }
}

// Get latest ESIC claims data for dashboard
export async function getLatestESICClaimsData(): Promise<{
  success: boolean
  data?: ESICClaimsData
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('esic_claims_extractions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return {
        success: true,
        data: undefined
      }
    }

    return {
      success: true,
      data: {
        hospitalName: data.hospital_name,
        extractedAt: data.extracted_at,
        totalClaims: data.total_claims,
        stageData: data.stage_data
      }
    }
  } catch (error) {
    console.error('Get ESIC data error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load ESIC claims data'
    }
  }
}

// Get all ESIC extractions for history
export async function getESICExtractionsHistory(): Promise<{
  success: boolean
  data?: {
    id: string
    hospitalName: string
    extractedAt: string
    totalRecords: number
    createdAt: string
  }[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('esic_claims_extractions')
      .select('id, hospital_name, extracted_at, total_claims, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    const history = data?.map(item => ({
      id: item.id,
      hospitalName: item.hospital_name,
      extractedAt: item.extracted_at,
      totalRecords: item.total_claims?.counts || 0,
      createdAt: item.created_at
    })) || []

    return {
      success: true,
      data: history
    }
  } catch (error) {
    console.error('Get ESIC history error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load extraction history'
    }
  }
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      // Remove the data URL prefix (data:image/jpeg;base64,)
      const base64Data = base64String.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Parse Gemini response and structure ESIC data
export function parseGeminiESICResponse(geminiResponse: any): ESICClaimsData {
  // This function will parse the raw Gemini response and structure it
  // according to our ESICClaimsData interface
  
  // Default structure if parsing fails
  const defaultData: ESICClaimsData = {
    hospitalName: 'Unknown Hospital',
    extractedAt: new Date().toISOString(),
    totalClaims: { inPatient: 0, opd: 0, counts: 0, enhancement: 0 },
    stageData: []
  }

  try {
    // Parse the structured response from Gemini
    if (geminiResponse && geminiResponse.stageData) {
      return {
        hospitalName: geminiResponse.hospitalName || 'Extracted Hospital',
        extractedAt: new Date().toISOString(),
        totalClaims: geminiResponse.totalClaims || { inPatient: 0, opd: 0, counts: 0, enhancement: 0 },
        stageData: geminiResponse.stageData
      }
    }

    return defaultData
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    return defaultData
  }
}