import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { ESICClaimsData } from '../services/gemini.service'

// Data structure matching the ESIC interface
interface ClaimStatusData {
  stage: string
  statuses: {
    status: string
    inPatient: number
    opd: number
    counts: number
    enhancement: number
    isHighlighted?: boolean
  }[]
}

const dummyClaimsData: ClaimStatusData[] = [
  {
    stage: 'ESIC Referral',
    statuses: [
      { status: 'Patient Referral', inPatient: 28, opd: 65, counts: 93, enhancement: 0 },
      { status: 'Need More Information [Ref]', inPatient: 0, opd: 0, counts: 0, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'Hospital Intimation',
    statuses: [
      { status: 'EIR To Model Hospital', inPatient: 11, opd: 0, counts: 11, enhancement: 0 },
      { status: 'Intimation Acknowledged', inPatient: 5, opd: 0, counts: 5, enhancement: 0 }
    ]
  },
  {
    stage: 'BPA Acknowledgement',
    statuses: [
      { status: 'Need More Information [Int]', inPatient: 0, opd: 0, counts: 0, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'Hospital Submission',
    statuses: [
      { status: 'Claim Submitted Electronically - More Info', inPatient: 36, opd: 0, counts: 36, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'ESIC - Document Receiver',
    statuses: [
      { status: 'Document Received', inPatient: 0, opd: 0, counts: 0, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'ESIC - Document Verifier',
    statuses: [
      { status: 'Recommended for Rejection', inPatient: 0, opd: 0, counts: 0, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'BPA Scrutinizer',
    statuses: [
      { status: 'Scrutinizer Verified', inPatient: 9, opd: 1, counts: 10, enhancement: 0 },
      { status: 'Need More Info [Scr]', inPatient: 3, opd: 0, counts: 3, enhancement: 0, isHighlighted: true },
      { status: 'Recommended for Rejection', inPatient: 5, opd: 0, counts: 5, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'ESIC - Medical Officer L1',
    statuses: [
      { status: 'Claim Authorized', inPatient: 20, opd: 0, counts: 20, enhancement: 0 },
      { status: 'Need More Information [Val]', inPatient: 0, opd: 0, counts: 0, enhancement: 0, isHighlighted: true },
      { status: 'Recommended for Rejection', inPatient: 1, opd: 0, counts: 1, enhancement: 0, isHighlighted: true },
      { status: 'Recommended for Approval', inPatient: 10, opd: 0, counts: 10, enhancement: 0 }
    ]
  },
  {
    stage: 'ESIC - Medical Officer L2',
    statuses: [
      { status: 'Review By Validator', inPatient: 1, opd: 0, counts: 1, enhancement: 0 },
      { status: 'Need More Information [App]', inPatient: 24, opd: 0, counts: 24, enhancement: 0, isHighlighted: true },
      { status: 'Recommended for Rejection', inPatient: 1, opd: 0, counts: 1, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'ESIC - CFA Sanction',
    statuses: [
      { status: 'Rejected', inPatient: 0, opd: 0, counts: 0, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'ESIC - Accounts',
    statuses: [
      { status: 'Proceed for Payment (by ESIC)', inPatient: 5, opd: 0, counts: 5, enhancement: 0 },
      { status: 'Rejected Claims', inPatient: 0, opd: 0, counts: 0, enhancement: 0, isHighlighted: true }
    ]
  },
  {
    stage: 'BPA Maintenance',
    statuses: [
      { status: 'Inactive Intimations', inPatient: 0, opd: 0, counts: 0, enhancement: 0 },
      { status: 'Inactive Submission', inPatient: 0, opd: 0, counts: 0, enhancement: 0 }
    ]
  }
]

export default function SuperAdminDashboard() {
  useAuth() // Auth check only, profile displayed in Navigation component
  const [selectedHospital, setSelectedHospital] = useState('ESI Hospital/ RO/ DCBO')
  const [searchId, setSearchId] = useState('')
  const [esicData, setEsicData] = useState<ESICClaimsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tempData, setTempData] = useState<ESICClaimsData | null>(null)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')

  // Check for temporary data first, then fetch from database
  useEffect(() => {
    checkForTempData()
    fetchAvailableDates()
    fetchLatestESICData()
  }, [])

  // Fetch data when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetchDataByDate(selectedDate)
    }
  }, [selectedDate])

  const checkForTempData = () => {
    try {
      const tempESICData = localStorage.getItem('tempESICData')
      if (tempESICData) {
        const parsedData = JSON.parse(tempESICData)
        setTempData(parsedData)
        setSelectedHospital(parsedData.hospitalName)
        // Clear temp data after use
        localStorage.removeItem('tempESICData')
      }
    } catch (error) {
      console.error('Error parsing temp ESIC data:', error)
    }
  }

  const saveTempDataToDatabase = async () => {
    if (!tempData) return

    try {
      console.log('Saving temp data:', tempData)
      
      const { data, error } = await supabase
        .from('esic_claims_extractions')
        .insert({
          hospital_name: tempData.hospitalName,
          extracted_at: tempData.extractedAt,
          total_claims: tempData.totalClaims,
          stage_data: tempData.stageData
          // Don't set created_at - let database use DEFAULT NOW()
          // Don't set upload_id - it's optional and we don't have it
        })
        .select()

      if (error) {
        console.error('Detailed error saving temp data:', error)
        alert(`Failed to save data: ${error.message}`)
      } else {
        console.log('Temp data saved successfully:', data)
        setEsicData(tempData)
        setTempData(null)
        // Refresh available dates
        fetchAvailableDates()
        alert('Data saved to database successfully!')
      }
    } catch (error) {
      console.error('Catch block error:', error)
      alert(`Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const fetchAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('esic_claims_extractions')
        .select('extracted_at')
        .order('extracted_at', { ascending: false })

      if (error) {
        console.error('Error fetching available dates:', error)
        return
      }

      if (data && data.length > 0) {
        const dates = data.map(item => 
          new Date(item.extracted_at).toISOString().split('T')[0]
        )
        const uniqueDates = [...new Set(dates)]
        setAvailableDates(uniqueDates)
      }
    } catch (error) {
      console.error('Error fetching available dates:', error)
    }
  }

  const fetchDataByDate = async (date: string) => {
    try {
      setLoading(true)

      const startOfDay = `${date}T00:00:00Z`
      const endOfDay = `${date}T23:59:59Z`

      const { data, error: fetchError } = await supabase
        .from('esic_claims_extractions')
        .select('*')
        .gte('extracted_at', startOfDay)
        .lte('extracted_at', endOfDay)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        setEsicData({
          hospitalName: data.hospital_name,
          extractedAt: data.extracted_at,
          totalClaims: data.total_claims,
          stageData: data.stage_data
        })
      } else {
        setEsicData(null)
      }
    } catch (err) {
      console.error('Error fetching ESIC data by date:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchLatestESICData = async () => {
    try {
      setLoading(true)
      
      const { data, error: fetchError } = await supabase
        .from('esic_claims_extractions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        setEsicData({
          hospitalName: data.hospital_name,
          extractedAt: data.extracted_at,
          totalClaims: data.total_claims,
          stageData: data.stage_data
        })
        setSelectedHospital(data.hospital_name)
      } else {
        // No data found, use dummy data
        setEsicData(null)
      }
    } catch (err) {
      console.error('Error fetching ESIC data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Use temp data first, then database data, then dummy data
  const activeData = tempData || esicData
  const claimsData = activeData ? activeData.stageData : dummyClaimsData
  const totalClaims = activeData ? activeData.totalClaims : 
    dummyClaimsData.reduce((acc, stage) => {
      stage.statuses.forEach(status => {
        acc.inPatient += status.inPatient
        acc.opd += status.opd
        acc.counts += status.counts
        acc.enhancement += status.enhancement
      })
      return acc
    }, { inPatient: 0, opd: 0, counts: 0, enhancement: 0 })

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-icon text-primary-600 animate-pulse" style={{ fontSize: '48px' }}>autorenew</span>
          <p className="text-gray-600">Loading ESIC dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Controls */}
      <div className="bg-white border-b border-gray-300 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{selectedHospital}</span>
            <select 
              className="bg-yellow-200 border border-gray-400 rounded px-3 py-1 text-sm font-medium"
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
            >
              <option value="ESI Hospital/ RO/ DCBO">Select Hospital</option>
              <option value="Hope Hospital Mumbai">Hope Hospital Mumbai</option>
              <option value="City Care Hospital Delhi">City Care Hospital Delhi</option>
              <option value="Metro Clinic Bangalore">Metro Clinic Bangalore</option>
            </select>
            {availableDates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">View Date:</span>
                <select 
                  className="bg-blue-100 border border-gray-400 rounded px-3 py-1 text-sm font-medium"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                >
                  <option value="">Latest Data</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Hospital</span>
            <div className="flex items-center gap-3">
              {tempData && (
                <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                  <span className="material-icon text-blue-600" style={{ fontSize: '16px' }}>preview</span>
                  <span className="text-xs text-blue-700 font-medium">Extracted Data</span>
                </div>
              )}
              {!tempData && esicData && selectedDate && (
                <div className="flex items-center gap-2 bg-purple-100 px-3 py-1 rounded-full">
                  <span className="material-icon text-purple-600" style={{ fontSize: '16px' }}>history</span>
                  <span className="text-xs text-purple-700 font-medium">Historical Data</span>
                </div>
              )}
              {!tempData && esicData && !selectedDate && (
                <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                  <span className="material-icon text-green-600" style={{ fontSize: '16px' }}>check_circle</span>
                  <span className="text-xs text-green-700 font-medium">Live Data</span>
                </div>
              )}
              {!tempData && !esicData && (
                <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
                  <span className="material-icon text-yellow-600" style={{ fontSize: '16px' }}>info</span>
                  <span className="text-xs text-yellow-700 font-medium">Demo Data</span>
                </div>
              )}
              {tempData && (
                <button 
                  onClick={saveTempDataToDatabase}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-2"
                >
                  <span className="material-icon" style={{ fontSize: '16px' }}>save</span>
                  SAVE DATA
                </button>
              )}
              <button 
                onClick={fetchLatestESICData}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-2"
              >
                <span className="material-icon" style={{ fontSize: '16px' }}>refresh</span>
                REFRESH
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-6">
        <div className="overflow-x-auto border border-gray-400">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-teal-100 border-b border-gray-400">
                <th className="border-r border-gray-400 px-4 py-3 text-left font-semibold text-gray-800 w-40">Stage</th>
                <th className="border-r border-gray-400 px-4 py-3 text-left font-semibold text-gray-800 min-w-80">Status</th>
                <th className="border-r border-gray-400 px-4 py-3 text-center font-semibold text-gray-800 w-20">In Patient</th>
                <th className="border-r border-gray-400 px-4 py-3 text-center font-semibold text-gray-800 w-20">OPD Patient</th>
                <th className="border-r border-gray-400 px-4 py-3 text-center font-semibold text-gray-800 w-20">Counts</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-800 w-24">Enhancement</th>
              </tr>
            </thead>
            <tbody>
              {claimsData.map((stageData, stageIndex) => (
                stageData.statuses.map((status, statusIndex) => (
                  <tr key={`${stageIndex}-${statusIndex}`} className="border-b border-gray-300 hover:bg-gray-50">
                    {statusIndex === 0 && (
                      <td 
                        rowSpan={stageData.statuses.length}
                        className="border-r border-gray-400 px-4 py-3 bg-teal-50 font-medium text-gray-800 align-top"
                      >
                        {stageData.stage}
                      </td>
                    )}
                    <td className={`border-r border-gray-400 px-4 py-3 ${
                      status.isHighlighted ? 'text-red-700 font-medium' : 'text-gray-700'
                    }`}>
                      {status.status}
                    </td>
                    <td className="border-r border-gray-400 px-4 py-3 text-center text-gray-700">
                      {status.inPatient}
                    </td>
                    <td className="border-r border-gray-400 px-4 py-3 text-center text-gray-700">
                      {status.opd}
                    </td>
                    <td className="border-r border-gray-400 px-4 py-3 text-center text-gray-700">
                      {status.counts}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {status.enhancement}
                    </td>
                  </tr>
                ))
              ))}
              
              {/* Total Row */}
              <tr className="bg-yellow-100 border-t-2 border-gray-400 font-semibold">
                <td className="border-r border-gray-400 px-4 py-3 text-gray-800"></td>
                <td className="border-r border-gray-400 px-4 py-3 text-gray-800 font-bold">Total Claims</td>
                <td className="border-r border-gray-400 px-4 py-3 text-center text-gray-800">{totalClaims.inPatient}</td>
                <td className="border-r border-gray-400 px-4 py-3 text-center text-gray-800">{totalClaims.opd}</td>
                <td className="border-r border-gray-400 px-4 py-3 text-center text-gray-800">{totalClaims.counts}</td>
                <td className="px-4 py-3 text-center text-gray-800">{totalClaims.enhancement}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center gap-4 mt-6">
          <span className="text-sm text-gray-700">Get Claim Status for ID</span>
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="border border-gray-400 px-3 py-1 text-sm w-48"
            placeholder="Enter claim ID..."
          />
          <button className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-1.5 text-sm font-medium">
            CLAIM STATUS
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>v1.7 | Last Updated: 2026-01-21 | zeroriskagent.com | ESIC Claims Tracking System</p>
          {tempData && (
            <p className="mt-1 text-blue-600">
              Extracted data from upload • Data not yet saved to database • 
              Click "SAVE DATA" to store permanently
            </p>
          )}
          {!tempData && esicData && selectedDate && (
            <p className="mt-1 text-purple-600">
              Historical data from {new Date(esicData.extractedAt).toLocaleDateString('en-IN')} • 
              Select "Latest Data" to view current data
            </p>
          )}
          {!tempData && esicData && !selectedDate && (
            <p className="mt-1 text-green-600">
              Data extracted on {new Date(esicData.extractedAt).toLocaleDateString('en-IN')} • 
              Upload new ESIC dashboard image to update
            </p>
          )}
          {!tempData && !esicData && (
            <p className="mt-1 text-yellow-600">
              Demo data • Upload ESIC dashboard image at <a href="/upload" className="underline hover:text-yellow-700">/upload</a> for live data
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}