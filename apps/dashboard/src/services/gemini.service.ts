// Gemini AI Service for Image Data Extraction

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Single claim record from a table row
export interface ClaimRecord {
  sNo?: string | number
  patientName?: string
  patientId?: string
  claimNumber?: string
  claimDate?: string
  admissionDate?: string
  dischargeDate?: string
  claimAmount?: string | number
  approvedAmount?: string | number
  pendingAmount?: string | number
  hospitalName?: string
  diagnosisCode?: string
  procedureCode?: string
  diagnosis?: string
  payerName?: string
  policyNumber?: string
  status?: string
  denialReason?: string
  remarks?: string
}

// Result for multiple records extraction
export interface MultiRecordExtractionResult {
  success: boolean
  records: ClaimRecord[]
  totalCount: number
  confidence: number
  error: string | null
}

// Legacy single record interface (for backward compatibility)
export interface ExtractedClaimData {
  patientName?: string
  patientId?: string
  claimNumber?: string
  claimDate?: string
  claimAmount?: string
  hospitalName?: string
  diagnosisCode?: string
  procedureCode?: string
  payerName?: string
  policyNumber?: string
  status?: string
  denialReason?: string
  additionalNotes?: string
  rawText?: string
  confidence?: number
}

export interface GeminiExtractionResult {
  success: boolean
  data: ExtractedClaimData | null
  error: string | null
}

// Convert file to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// List of Gemini models to try (in order of preference)
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro-vision',
]

// Extract ALL records from a table/spreadsheet image
export async function extractAllRecordsFromImage(file: File): Promise<MultiRecordExtractionResult> {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      records: [],
      totalCount: 0,
      confidence: 0,
      error: 'Gemini API key not configured',
    }
  }

  try {
    const base64Data = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    const prompt = `This image contains a table or spreadsheet with multiple healthcare claim records. Extract ALL rows from the table.

For EACH row in the table, extract these fields (use null if not visible):
- sNo: Serial number or row number
- patientName: Patient's full name
- patientId: Patient ID, UHID, or IP number
- claimNumber: Claim number or Bill number
- claimDate: Date of claim
- admissionDate: Admission date
- dischargeDate: Discharge date
- claimAmount: Claim/Bill amount
- approvedAmount: Approved amount
- pendingAmount: Pending/Outstanding amount
- hospitalName: Hospital name
- diagnosis: Diagnosis or medical condition
- diagnosisCode: ICD code if visible
- payerName: Insurance/Payer (ESIC, CGHS, ECHS, etc.)
- policyNumber: Policy or insurance number
- status: Claim status
- remarks: Any remarks or notes

IMPORTANT: Extract EVERY row visible in the table. Do not skip any rows.

Return ONLY valid JSON in this exact format:
{
  "records": [
    {
      "sNo": 1,
      "patientName": "...",
      "patientId": "...",
      "claimNumber": "...",
      "claimDate": "...",
      "admissionDate": "...",
      "dischargeDate": "...",
      "claimAmount": "...",
      "approvedAmount": "...",
      "pendingAmount": "...",
      "hospitalName": "...",
      "diagnosis": "...",
      "payerName": "...",
      "status": "...",
      "remarks": "..."
    }
  ],
  "totalCount": 25,
  "confidence": 85
}`

    // Try each model until one works
    let response: Response | null = null
    let lastError = ''

    for (const model of GEMINI_MODELS) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                topK: 32,
                topP: 1,
                maxOutputTokens: 8192,
              },
            }),
          }
        )

        if (response.ok) {
          console.log(`Successfully used model: ${model}`)
          break
        } else {
          lastError = `${model}: ${response.status}`
          console.warn(`Model ${model} failed with status ${response.status}, trying next...`)
          response = null
        }
      } catch (err) {
        lastError = `${model}: ${err instanceof Error ? err.message : 'Unknown error'}`
        console.warn(`Model ${model} error:`, err)
      }
    }

    if (!response || !response.ok) {
      return {
        success: false,
        records: [],
        totalCount: 0,
        confidence: 0,
        error: `All Gemini models failed. Last error: ${lastError}`,
      }
    }

    const result = await response.json()
    const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      return {
        success: false,
        records: [],
        totalCount: 0,
        confidence: 0,
        error: 'No response from Gemini API',
      }
    }

    // Parse the JSON from the response
    let jsonStr = textContent

    // Remove markdown code blocks if present
    const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    try {
      const extractedData = JSON.parse(jsonStr)
      return {
        success: true,
        records: extractedData.records || [],
        totalCount: extractedData.totalCount || extractedData.records?.length || 0,
        confidence: extractedData.confidence || 80,
        error: null,
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw response:', textContent)
      return {
        success: false,
        records: [],
        totalCount: 0,
        confidence: 0,
        error: 'Failed to parse extraction result',
      }
    }
  } catch (error) {
    console.error('Gemini extraction error:', error)
    return {
      success: false,
      records: [],
      totalCount: 0,
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error during extraction',
    }
  }
}

// Legacy function for single record extraction
export async function extractDataFromImage(file: File): Promise<GeminiExtractionResult> {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      data: null,
      error: 'Gemini API key not configured',
    }
  }

  try {
    const base64Data = await fileToBase64(file)
    const mimeType = file.type || 'image/jpeg'

    const prompt = `Analyze this healthcare claim document image and extract the following information in JSON format. If a field is not visible or cannot be determined, use null for that field.

Extract these fields:
- patientName: Patient's full name
- patientId: Patient ID or UHID number
- claimNumber: Claim number or reference ID
- claimDate: Date of claim (format: YYYY-MM-DD if possible)
- claimAmount: Total claim amount (include currency symbol if visible)
- hospitalName: Name of the hospital
- diagnosisCode: ICD-10 diagnosis code if visible
- procedureCode: CPT or procedure code if visible
- payerName: Insurance company or payer name (ESIC, CGHS, ECHS, or private insurer)
- policyNumber: Insurance policy number
- status: Claim status (approved, denied, pending, etc.)
- denialReason: If denied, the reason for denial
- additionalNotes: Any other relevant information from the document
- rawText: All readable text from the document

Also provide a confidence score (0-100) indicating how confident you are in the extraction accuracy.

Return ONLY valid JSON in this exact format:
{
  "patientName": "...",
  "patientId": "...",
  "claimNumber": "...",
  "claimDate": "...",
  "claimAmount": "...",
  "hospitalName": "...",
  "diagnosisCode": "...",
  "procedureCode": "...",
  "payerName": "...",
  "policyNumber": "...",
  "status": "...",
  "denialReason": "...",
  "additionalNotes": "...",
  "rawText": "...",
  "confidence": 85
}`

    // Try each model until one works
    let response: Response | null = null
    let lastError = ''

    for (const model of GEMINI_MODELS) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data,
                      },
                    },
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                topK: 32,
                topP: 1,
                maxOutputTokens: 4096,
              },
            }),
          }
        )

        if (response.ok) {
          console.log(`Successfully used model: ${model}`)
          break
        } else {
          lastError = `${model}: ${response.status}`
          console.warn(`Model ${model} failed with status ${response.status}, trying next...`)
          response = null
        }
      } catch (err) {
        lastError = `${model}: ${err instanceof Error ? err.message : 'Unknown error'}`
        console.warn(`Model ${model} error:`, err)
      }
    }

    if (!response || !response.ok) {
      return {
        success: false,
        data: null,
        error: `All Gemini models failed. Last error: ${lastError}`,
      }
    }

    const result = await response.json()
    const textContent = result.candidates?.[0]?.content?.parts?.[0]?.text

    if (!textContent) {
      return {
        success: false,
        data: null,
        error: 'No response from Gemini API',
      }
    }

    let jsonStr = textContent
    const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    try {
      const extractedData = JSON.parse(jsonStr) as ExtractedClaimData
      return {
        success: true,
        data: extractedData,
        error: null,
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Raw response:', textContent)
      return {
        success: true,
        data: {
          rawText: textContent,
          confidence: 50,
        },
        error: null,
      }
    }
  } catch (error) {
    console.error('Gemini extraction error:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error during extraction',
    }
  }
}
