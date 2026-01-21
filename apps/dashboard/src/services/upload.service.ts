import { supabase, supabaseAdmin } from '../lib/supabase'

// Use admin client for storage and database operations to bypass RLS
// Falls back to regular client if admin client is not available
const adminClient = supabaseAdmin || supabase

export interface UploadRecord {
  id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  uploaded_by: string
  hospital_id: string | null
  records_count: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface UploadResult {
  success: boolean
  upload: UploadRecord | null
  error: string | null
}

// Storage bucket name
const BUCKET_NAME = 'claim-uploads'

// Upload file to Supabase Storage and create metadata record
export async function uploadFile(
  file: File,
  userId: string,
  hospitalId: string | null = null
): Promise<UploadResult> {
  try {
    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${userId}/${timestamp}_${sanitizedFileName}`

    // Upload to Supabase Storage (using admin client to bypass RLS)
    const { error: storageError } = await adminClient.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (storageError) {
      console.error('Storage upload error:', storageError)
      return {
        success: false,
        upload: null,
        error: storageError.message || 'Failed to upload file to storage',
      }
    }

    // Create metadata record in database (using admin client to bypass RLS)
    const { data: uploadRecord, error: dbError } = await adminClient
      .from('file_uploads')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type || getFileType(file.name),
        storage_path: storagePath,
        status: 'pending',
        uploaded_by: userId,
        hospital_id: hospitalId,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Try to clean up the uploaded file
      await adminClient.storage.from(BUCKET_NAME).remove([storagePath])
      return {
        success: false,
        upload: null,
        error: dbError.message || 'Failed to save upload record',
      }
    }

    return {
      success: true,
      upload: transformUploadRecord(uploadRecord),
      error: null,
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      upload: null,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    }
  }
}

// Get list of uploads for the current user/hospital
export async function getUploads(
  userId: string,
  hospitalId: string | null = null,
  limit: number = 20
): Promise<{ data: UploadRecord[]; count: number }> {
  let query = supabase
    .from('file_uploads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filter by hospital if provided, otherwise by user
  if (hospitalId) {
    query = query.eq('hospital_id', hospitalId)
  } else {
    query = query.eq('uploaded_by', userId)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching uploads:', error)
    throw error
  }

  return {
    data: (data || []).map(transformUploadRecord),
    count: count || 0,
  }
}

// Get single upload details
export async function getUploadDetails(id: string): Promise<UploadRecord | null> {
  const { data, error } = await supabase
    .from('file_uploads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching upload details:', error)
    throw error
  }

  return data ? transformUploadRecord(data) : null
}

// Delete an upload (file and record)
export async function deleteUpload(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // First get the record to find the storage path
    const { data: record, error: fetchError } = await supabase
      .from('file_uploads')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    // Delete from storage (using admin client to bypass RLS)
    if (record?.storage_path) {
      const { error: storageError } = await adminClient.storage
        .from(BUCKET_NAME)
        .remove([record.storage_path])

      if (storageError) {
        console.warn('Storage deletion error:', storageError)
      }
    }

    // Delete database record (using admin client to bypass RLS)
    const { error: dbError } = await adminClient
      .from('file_uploads')
      .delete()
      .eq('id', id)

    if (dbError) {
      return { success: false, error: dbError.message }
    }

    return { success: true, error: null }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    }
  }
}

// Get download URL for a file (using admin client to bypass RLS)
export async function getDownloadUrl(storagePath: string): Promise<string | null> {
  const { data } = await adminClient.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 3600) // 1 hour expiry

  return data?.signedUrl || null
}

// Helper to transform database record to UploadRecord
function transformUploadRecord(record: Record<string, unknown>): UploadRecord {
  return {
    id: record.id as string,
    file_name: record.file_name as string,
    file_size: record.file_size as number,
    file_type: record.file_type as string,
    storage_path: record.storage_path as string,
    status: record.status as UploadRecord['status'],
    uploaded_by: record.uploaded_by as string,
    hospital_id: record.hospital_id as string | null,
    records_count: record.records_count as number | null,
    error_message: record.error_message as string | null,
    created_at: record.created_at as string,
    updated_at: record.updated_at as string || record.created_at as string,
  }
}

// Helper to determine file type from extension
function getFileType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'csv':
      return 'text/csv'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'xls':
      return 'application/vnd.ms-excel'
    default:
      return 'application/octet-stream'
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
