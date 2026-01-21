import { useState, useRef } from 'react'
import { useUploads, useUploadFile, useDeleteUpload } from '../hooks/useUpload'
import { formatFileSize } from '../services/upload.service'
import { extractAllRecordsFromImage, ClaimRecord, extractESICClaimsFromImage, ESICClaimsData, extractNMICasesFromImage, NMICaseRecord } from '../services/gemini.service'

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedRecords, setExtractedRecords] = useState<ClaimRecord[]>([])
  const [extractionConfidence, setExtractionConfidence] = useState<number>(0)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [esicData, setEsicData] = useState<ESICClaimsData | null>(null)
  const [isESICDashboard, setIsESICDashboard] = useState(false)
  const [nmiRecords, setNmiRecords] = useState<NMICaseRecord[]>([])
  const [isNMIDashboard, setIsNMIDashboard] = useState(false)
  const [nmiHospitalName, setNmiHospitalName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: uploadsData, isLoading: uploadsLoading } = useUploads()
  const uploadMutation = useUploadFile()
  const deleteMutation = useDeleteUpload()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const validateAndSetFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      alert('Please select a valid image format (JPG, PNG, GIF, or WebP)')
      return
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return
    }

    setSelectedFile(file)
    setExtractedRecords([])
    setExtractionConfidence(0)
    setExtractionError(null)
    setEsicData(null)
    setIsESICDashboard(false)
    setNmiRecords([])
    setIsNMIDashboard(false)
    setNmiHospitalName('')

    // Create image preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Try to detect the type of ESIC dashboard and extract data
    setIsExtracting(true)
    try {
      // First attempt NMI (Need More Info) extraction - most specific
      const nmiResult = await extractNMICasesFromImage(file)

      if (nmiResult.success && nmiResult.records.length > 0) {
        // This is an NMI Cases table
        setIsNMIDashboard(true)
        setNmiRecords(nmiResult.records)
        setNmiHospitalName(nmiResult.hospitalName)
        setExtractionConfidence(nmiResult.confidence)

        // Note: Data is not auto-saved, user can save manually from dashboard
      } else {
        // Try ESIC stage dashboard extraction
        const esicResult = await extractESICClaimsFromImage(file)

        if (esicResult.success && esicResult.data && esicResult.data.stageData.length > 0) {
          // This looks like an ESIC stage dashboard
          setIsESICDashboard(true)
          setEsicData(esicResult.data)
          setExtractionConfidence(esicResult.confidence)

          // Note: Data is not auto-saved, user can save manually from dashboard
        } else {
          // Fall back to general record extraction
          setIsESICDashboard(false)
          const result = await extractAllRecordsFromImage(file)
          if (result.success && result.records.length > 0) {
            setExtractedRecords(result.records)
            setExtractionConfidence(result.confidence)
          } else {
            setExtractionError(result.error || 'No records found in image')
          }
        }
      }
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'Extraction failed')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }


  const handleClearFile = () => {
    setSelectedFile(null)
    setImagePreview(null)
    setExtractedRecords([])
    setExtractionConfidence(0)
    setExtractionError(null)
    setEsicData(null)
    setIsESICDashboard(false)
    setNmiRecords([])
    setIsNMIDashboard(false)
    setNmiHospitalName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const result = await uploadMutation.mutateAsync(selectedFile)

    if (result.success) {
      setSelectedFile(null)
      setImagePreview(null)
      setExtractedRecords([])
      setExtractionConfidence(0)
      setExtractionError(null)
      setEsicData(null)
      setIsESICDashboard(false)
      setNmiRecords([])
      setIsNMIDashboard(false)
      setNmiHospitalName('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } else {
      alert(result.error || 'Upload failed. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this upload?')) return

    const result = await deleteMutation.mutateAsync(id)
    if (!result.success) {
      alert(result.error || 'Delete failed. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return statusStyles[status] || 'bg-gray-100 text-gray-800'
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'image'
    if (fileType.includes('csv')) return 'description'
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return 'table_chart'
    return 'insert_drive_file'
  }

  // Determine which columns have data
  const getVisibleColumns = () => {
    if (extractedRecords.length === 0) return []

    const allColumns = [
      { key: 'sNo', label: 'S.No' },
      { key: 'patientName', label: 'Patient Name' },
      { key: 'patientId', label: 'Patient ID' },
      { key: 'claimNumber', label: 'Claim No' },
      { key: 'claimDate', label: 'Claim Date' },
      { key: 'admissionDate', label: 'Admission' },
      { key: 'dischargeDate', label: 'Discharge' },
      { key: 'claimAmount', label: 'Claim Amount' },
      { key: 'approvedAmount', label: 'Approved' },
      { key: 'pendingAmount', label: 'Pending' },
      { key: 'diagnosis', label: 'Diagnosis' },
      { key: 'payerName', label: 'Payer' },
      { key: 'status', label: 'Status' },
      { key: 'remarks', label: 'Remarks' },
    ]

    // Filter to only columns that have data in at least one record
    return allColumns.filter(col =>
      extractedRecords.some(record => {
        const value = record[col.key as keyof ClaimRecord]
        return value !== null && value !== undefined && value !== ''
      })
    )
  }

  const visibleColumns = getVisibleColumns()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-icon text-primary-600">upload_file</span>
            Upload Images
          </h1>
          <p className="mt-2 text-gray-600">
            Upload images for claim documentation, denial letters, or supporting documents. Supported formats include JPG, PNG, GIF, and WebP.
          </p>
        </div>

        {/* Main Content - Two Column Layout when data extracted */}
        <div className={`grid gap-6 ${(extractedRecords.length > 0 || esicData || nmiRecords.length > 0) ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl'}`}>
          {/* Left Column - Upload Area */}
          <div className={(extractedRecords.length > 0 || esicData || nmiRecords.length > 0) ? 'lg:col-span-1' : ''}>
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="material-icon text-primary-600">cloud_upload</span>
                File Upload
              </h2>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-40 max-w-full rounded-lg shadow-md object-contain"
                        />
                      ) : (
                        <span className="material-icon text-green-600" style={{ fontSize: '48px' }}>
                          image
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleClearFile}
                        className="btn-secondary text-xs px-3 py-1.5"
                        disabled={uploadMutation.isPending || isExtracting}
                      >
                        <span className="material-icon" style={{ fontSize: '14px' }}>close</span>
                        Remove
                      </button>
                      <button
                        onClick={handleUpload}
                        className="btn-primary text-xs px-3 py-1.5"
                        disabled={uploadMutation.isPending || isExtracting}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <span className="material-icon animate-spin" style={{ fontSize: '14px' }}>
                              refresh
                            </span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <span className="material-icon" style={{ fontSize: '14px' }}>upload</span>
                            Upload
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <span
                        className={`material-icon ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
                        style={{ fontSize: '40px' }}
                      >
                        cloud_upload
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-700 font-medium text-sm">
                        Drag and drop your file here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or
                      </p>
                    </div>
                    <button
                      onClick={handleBrowseClick}
                      className="btn-primary text-sm"
                    >
                      <span className="material-icon" style={{ fontSize: '16px' }}>folder_open</span>
                      Browse Files
                    </button>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF, WebP (Max 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Extraction Loading State */}
              {isExtracting && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                  <span className="material-icon animate-spin text-blue-600" style={{ fontSize: '20px' }}>
                    refresh
                  </span>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Extracting all records...</p>
                    <p className="text-xs text-blue-700">AI is analyzing the table</p>
                  </div>
                </div>
              )}

              {/* Extraction Error */}
              {extractionError && !isExtracting && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg flex items-start gap-2">
                  <span className="material-icon text-yellow-600" style={{ fontSize: '18px' }}>warning</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Extraction issue</p>
                    <p className="text-xs text-yellow-700">{extractionError}</p>
                  </div>
                </div>
              )}

              {/* NMI Extraction Success Summary */}
              {nmiRecords.length > 0 && isNMIDashboard && !isExtracting && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-icon text-green-600" style={{ fontSize: '20px' }}>info</span>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          NMI Cases extracted
                        </p>
                        <p className="text-xs text-green-700">
                          {nmiHospitalName} - {nmiRecords.length} records
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      {extractionConfidence}% confidence
                    </span>
                  </div>
                </div>
              )}

              {/* ESIC Extraction Success Summary */}
              {esicData && isESICDashboard && !isExtracting && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-icon text-green-600" style={{ fontSize: '20px' }}>account_balance</span>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          ESIC Dashboard extracted
                        </p>
                        <p className="text-xs text-green-700">
                          {esicData.hospitalName} - {esicData.totalClaims.counts} total claims
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      {extractionConfidence}% confidence
                    </span>
                  </div>
                </div>
              )}

              {/* Regular Extraction Success Summary */}
              {extractedRecords.length > 0 && !isESICDashboard && !isExtracting && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-icon text-green-600" style={{ fontSize: '20px' }}>check_circle</span>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          {extractedRecords.length} records extracted
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      {extractionConfidence}% confidence
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Messages */}
              {uploadMutation.isError && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                  <span className="material-icon text-red-600" style={{ fontSize: '18px' }}>error</span>
                  <div>
                    <p className="text-sm font-medium text-red-800">Upload failed</p>
                    <p className="text-xs text-red-700">{uploadMutation.error?.message}</p>
                  </div>
                </div>
              )}

              {uploadMutation.isSuccess && uploadMutation.data?.success && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-start gap-2">
                  <span className="material-icon text-green-600" style={{ fontSize: '18px' }}>check_circle</span>
                  <div>
                    <p className="text-sm font-medium text-green-800">File uploaded successfully</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - NMI Cases Table (exact ESIC format) */}
          {nmiRecords.length > 0 && isNMIDashboard && (
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="material-icon text-orange-600">info</span>
                    Need More Info Cases
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {nmiHospitalName}
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      {nmiRecords.length} records
                    </span>
                  </div>
                </div>

                {/* NMI Table - Matching ESIC Dashboard columns exactly */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-teal-700 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Sr.</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Admit No.</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Card ID</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Patient Name</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Claim Amt</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-white uppercase tracking-wider">Approved Amt</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">Reverted Back On</th>
                        </tr>
                      </thead>
                      <tbody className="bg-teal-800 divide-y divide-teal-700">
                        {nmiRecords.map((record, index) => (
                          <tr key={index} className="hover:bg-teal-700 transition-colors">
                            <td className="px-3 py-2 text-sm text-teal-100 whitespace-nowrap">{record.sr}</td>
                            <td className="px-3 py-2 text-sm text-yellow-400 font-medium whitespace-nowrap">
                              <a href="#" className="hover:underline">{record.id}</a>
                            </td>
                            <td className="px-3 py-2 text-sm text-teal-100 whitespace-nowrap">{record.admitNo}</td>
                            <td className="px-3 py-2 text-sm text-teal-100 whitespace-nowrap">{record.cardId}</td>
                            <td className="px-3 py-2 text-sm text-teal-100 whitespace-nowrap">{record.patientName}</td>
                            <td className="px-3 py-2 text-sm text-teal-100 whitespace-nowrap text-right font-medium">
                              {typeof record.claimAmt === 'number'
                                ? record.claimAmt.toLocaleString('en-IN')
                                : record.claimAmt}
                            </td>
                            <td className="px-3 py-2 text-sm text-teal-100 whitespace-nowrap text-right">
                              {typeof record.approvedAmt === 'number'
                                ? record.approvedAmt.toLocaleString('en-IN')
                                : record.approvedAmt}
                            </td>
                            <td className="px-3 py-2 text-sm text-teal-100 whitespace-nowrap">{record.revertedBackOn}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Footer */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="material-icon" style={{ fontSize: '14px' }}>check_circle</span>
                    Data saved to database
                  </span>
                  <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700">
                    <span className="material-icon" style={{ fontSize: '14px' }}>download</span>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - ESIC Dashboard Data - Full Table */}
          {esicData && isESICDashboard && (
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="material-icon text-primary-600">account_balance</span>
                    ESIC Dashboard Data
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {esicData.hospitalName}
                    </span>
                    <button
                      onClick={() => {
                        // Store extracted data temporarily for dashboard
                        localStorage.setItem('tempESICData', JSON.stringify(esicData))
                        window.location.href = '/dashboard/super-admin'
                      }}
                      className="text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                    >
                      <span className="material-icon" style={{ fontSize: '14px' }}>dashboard</span>
                      View in Dashboard
                    </button>
                  </div>
                </div>

                {/* Full ESIC Table - Matching exact ESIC dashboard format */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="bg-teal-700 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-teal-600 min-w-[180px]">Stage</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-teal-600 min-w-[280px]">Status</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider border-r border-teal-600 min-w-[100px]">In Patient</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider border-r border-teal-600 min-w-[100px]">OPD Patient</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider border-r border-teal-600 min-w-[80px]">Counts</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">Enhancement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {esicData.stageData.map((stage, stageIndex) => (
                          stage.statuses.map((status, statusIndex) => (
                            <tr
                              key={`${stageIndex}-${statusIndex}`}
                              className={`${statusIndex % 2 === 0 ? 'bg-teal-50' : 'bg-teal-100'} hover:bg-teal-200 transition-colors border-b border-teal-200`}
                            >
                              {/* Show stage name only for first status of each stage */}
                              <td className={`px-4 py-2 text-sm font-semibold text-teal-900 border-r border-teal-200 ${statusIndex === 0 ? 'bg-teal-200' : 'bg-transparent'}`}>
                                {statusIndex === 0 ? stage.stage : ''}
                              </td>
                              <td className={`px-4 py-2 text-sm border-r border-teal-200 ${status.isHighlighted ? 'text-red-700 font-medium' : 'text-teal-800'}`}>
                                {status.status}
                              </td>
                              <td className="px-4 py-2 text-sm text-teal-800 text-right border-r border-teal-200 font-medium">
                                {status.inPatient}
                              </td>
                              <td className="px-4 py-2 text-sm text-teal-800 text-right border-r border-teal-200 font-medium">
                                {status.opd}
                              </td>
                              <td className="px-4 py-2 text-sm text-teal-800 text-right border-r border-teal-200 font-medium">
                                {status.counts}
                              </td>
                              <td className="px-4 py-2 text-sm text-teal-800 text-right font-medium">
                                {status.enhancement}
                              </td>
                            </tr>
                          ))
                        ))}
                        {/* Total Row */}
                        <tr className="bg-teal-700 font-bold">
                          <td className="px-4 py-3 text-sm text-white border-r border-teal-600" colSpan={2}>
                            Total Claims
                          </td>
                          <td className="px-4 py-3 text-sm text-white text-right border-r border-teal-600">
                            {esicData.totalClaims.inPatient}
                          </td>
                          <td className="px-4 py-3 text-sm text-white text-right border-r border-teal-600">
                            {esicData.totalClaims.opd}
                          </td>
                          <td className="px-4 py-3 text-sm text-white text-right border-r border-teal-600">
                            {esicData.totalClaims.counts}
                          </td>
                          <td className="px-4 py-3 text-sm text-white text-right">
                            {esicData.totalClaims.enhancement}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="material-icon" style={{ fontSize: '14px' }}>check_circle</span>
                    Data extracted from ESIC dashboard
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 flex items-center gap-1">
                      <span className="material-icon" style={{ fontSize: '14px' }}>check</span>
                      Saved to database
                    </span>
                    <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700">
                      <span className="material-icon" style={{ fontSize: '14px' }}>download</span>
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column - Regular Extracted Data Table */}
          {extractedRecords.length > 0 && !isESICDashboard && (
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="material-icon text-primary-600">table_chart</span>
                    Extracted Records
                  </h2>
                  <span className="text-sm text-gray-500">
                    {extractedRecords.length} rows
                  </span>
                </div>

                {/* Scrollable Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          {visibleColumns.map((col) => (
                            <th
                              key={col.key}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {extractedRecords.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {visibleColumns.map((col) => (
                              <td
                                key={col.key}
                                className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                              >
                                {col.key === 'claimAmount' || col.key === 'approvedAmount' || col.key === 'pendingAmount' ? (
                                  <span className="font-medium">
                                    {record[col.key as keyof ClaimRecord] || '-'}
                                  </span>
                                ) : col.key === 'status' ? (
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    String(record.status || '').toLowerCase().includes('approved')
                                      ? 'bg-green-100 text-green-800'
                                      : String(record.status || '').toLowerCase().includes('pending')
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : String(record.status || '').toLowerCase().includes('denied') || String(record.status || '').toLowerCase().includes('rejected')
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {record.status || '-'}
                                  </span>
                                ) : (
                                  <span className="max-w-[150px] truncate block" title={String(record[col.key as keyof ClaimRecord] || '')}>
                                    {record[col.key as keyof ClaimRecord] || '-'}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Footer */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Scroll horizontally to see all columns</span>
                  <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700">
                    <span className="material-icon" style={{ fontSize: '14px' }}>download</span>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Uploads Section */}
        <div className="card mt-6 max-w-4xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="material-icon text-primary-600">history</span>
            Recent Uploads
          </h2>

          {uploadsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded" />
              ))}
            </div>
          ) : uploadsData && uploadsData.data.length > 0 ? (
            <div className="space-y-3">
              {uploadsData.data.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="material-icon text-primary-600" style={{ fontSize: '32px' }}>
                      {getFileIcon(upload.file_type)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{upload.file_name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{formatFileSize(upload.file_size)}</span>
                        <span>|</span>
                        <span>{new Date(upload.created_at).toLocaleDateString('en-IN')}</span>
                        {upload.records_count !== null && (
                          <>
                            <span>|</span>
                            <span>{upload.records_count} records</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        upload.status
                      )}`}
                    >
                      {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                    </span>
                    <button
                      onClick={() => handleDelete(upload.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={deleteMutation.isPending}
                      title="Delete upload"
                    >
                      <span className="material-icon" style={{ fontSize: '20px' }}>delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-icon text-gray-400" style={{ fontSize: '48px' }}>inbox</span>
              <p className="text-gray-500 mt-2">No recent uploads</p>
              <p className="text-sm text-gray-400 mt-1">Your uploaded files will appear here</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>Version 2.2 | Last Updated: 2026-01-21 | zeroriskagent.com</p>
        </div>
      </footer>
    </div>
  )
}
