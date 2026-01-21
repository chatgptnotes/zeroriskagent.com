import { useState, useRef } from 'react'
import { useUploads, useUploadFile, useDeleteUpload } from '../hooks/useUpload'
import { formatFileSize } from '../services/upload.service'

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
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

  const validateAndSetFile = (file: File) => {
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

    // Create image preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setImagePreview(null)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span className="material-icon text-primary-600">upload_file</span>
            Upload Images
          </h1>
          <p className="mt-2 text-gray-600">
            Upload images for claim documentation, denial letters, or supporting documents. Supported formats include JPG, PNG, GIF, and WebP.
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
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 max-w-full rounded-lg shadow-md object-contain"
                    />
                  ) : (
                    <span className="material-icon text-green-600" style={{ fontSize: '48px' }}>
                      image
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleClearFile}
                    className="btn-secondary text-sm"
                    disabled={uploadMutation.isPending}
                  >
                    <span className="material-icon" style={{ fontSize: '18px' }}>close</span>
                    Remove
                  </button>
                  <button
                    onClick={handleUpload}
                    className="btn-primary text-sm"
                    disabled={uploadMutation.isPending}
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <span className="material-icon animate-spin" style={{ fontSize: '18px' }}>
                          refresh
                        </span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <span className="material-icon" style={{ fontSize: '18px' }}>upload</span>
                        Upload File
                      </>
                    )}
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
                  Supported formats: JPG, PNG, GIF, WebP (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload Error Message */}
          {uploadMutation.isError && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <span className="material-icon text-red-600" style={{ fontSize: '20px' }}>error</span>
              <div>
                <p className="text-sm font-medium text-red-800">Upload failed</p>
                <p className="text-sm text-red-700">{uploadMutation.error?.message}</p>
              </div>
            </div>
          )}

          {/* Upload Success Message */}
          {uploadMutation.isSuccess && uploadMutation.data?.success && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-start gap-3">
              <span className="material-icon text-green-600" style={{ fontSize: '20px' }}>check_circle</span>
              <div>
                <p className="text-sm font-medium text-green-800">File uploaded successfully</p>
                <p className="text-sm text-green-700">Your file is being processed.</p>
              </div>
            </div>
          )}

          {/* Supported Formats Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 flex items-center gap-2">
              <span className="material-icon" style={{ fontSize: '18px' }}>info</span>
              Supported Image Formats
            </h3>
            <ul className="mt-2 text-sm text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <span className="material-icon" style={{ fontSize: '16px' }}>check</span>
                JPEG/JPG images
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icon" style={{ fontSize: '16px' }}>check</span>
                PNG images with transparency support
              </li>
              <li className="flex items-center gap-2">
                <span className="material-icon" style={{ fontSize: '16px' }}>check</span>
                GIF and WebP formats
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
          <p>Version 2.0 | Last Updated: 2026-01-21 | zeroriskagent.com</p>
        </div>
      </footer>
    </div>
  )
}
