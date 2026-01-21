import { useState, useRef } from 'react'

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      setSelectedFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-icon text-primary-600">upload_file</span>
            Upload Claims Data
          </h1>
          <p className="mt-2 text-gray-600">
            Import claims data from CSV files or other supported formats. Upload your hospital billing data to begin tracking and recovering denied claims.
          </p>
        </div>

        {/* Upload Area */}
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
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="material-icon text-green-600" style={{ fontSize: '48px' }}>
                    description
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleClearFile}
                    className="btn-secondary text-sm"
                  >
                    <span className="material-icon" style={{ fontSize: '18px' }}>close</span>
                    Remove
                  </button>
                  <button className="btn-primary text-sm">
                    <span className="material-icon" style={{ fontSize: '18px' }}>upload</span>
                    Upload File
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <span
                    className={`material-icon ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
                    style={{ fontSize: '48px' }}
                  >
                    cloud_upload
                  </span>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">
                    Drag and drop your file here
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    or
                  </p>
                </div>
                <button
                  onClick={handleBrowseClick}
                  className="btn-primary"
                >
                  <span className="material-icon" style={{ fontSize: '18px' }}>folder_open</span>
                  Browse Files
                </button>
                <p className="text-xs text-gray-500">
                  Supported formats: CSV, XLSX, XLS (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Supported Formats Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <span className="material-icon" style={{ fontSize: '18px' }}>info</span>
              Supported Data Formats
            </h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <span className="material-icon" style={{ fontSize: '16px' }}>check</span>
                Hospital billing system exports (CSV)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icon" style={{ fontSize: '16px' }}>check</span>
                Insurance claim reports (XLSX)
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icon" style={{ fontSize: '16px' }}>check</span>
                ESIC, CGHS, ECHS claim data formats
              </li>
            </ul>
          </div>
        </div>

        {/* Recent Uploads Section */}
        <div className="card mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="material-icon text-primary-600">history</span>
            Recent Uploads
          </h2>
          <div className="text-center py-8">
            <span className="material-icon text-gray-400" style={{ fontSize: '48px' }}>inbox</span>
            <p className="text-gray-500 mt-2">No recent uploads</p>
            <p className="text-sm text-gray-400 mt-1">Your uploaded files will appear here</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-400">
          <p>Version 1.9 | Last Updated: 2026-01-21 | zeroriskagent.com</p>
        </div>
      </footer>
    </div>
  )
}
