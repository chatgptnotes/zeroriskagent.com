import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  uploadFile,
  getUploads,
  getUploadDetails,
  deleteUpload,
  type UploadRecord,
  type UploadResult,
} from '../services/upload.service'
import { useAuth } from './useAuth'

// Query keys
export const uploadKeys = {
  all: ['uploads'] as const,
  list: () => [...uploadKeys.all, 'list'] as const,
  listFiltered: (userId: string, hospitalId: string | null) =>
    [...uploadKeys.list(), userId, hospitalId] as const,
  detail: (id: string) => [...uploadKeys.all, 'detail', id] as const,
}

// Hook to get uploads list
export function useUploads(limit: number = 20) {
  const { user, profile } = useAuth()
  const userId = user?.id || ''
  const hospitalId = profile?.hospital_id || null

  return useQuery<{ data: UploadRecord[]; count: number }, Error>({
    queryKey: uploadKeys.listFiltered(userId, hospitalId),
    queryFn: () => getUploads(userId, hospitalId, limit),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  })
}

// Hook to get single upload details
export function useUploadDetails(id: string) {
  return useQuery<UploadRecord | null, Error>({
    queryKey: uploadKeys.detail(id),
    queryFn: () => getUploadDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for uploading files
export function useUploadFile() {
  const queryClient = useQueryClient()
  const { user, profile } = useAuth()

  return useMutation<UploadResult, Error, File>({
    mutationFn: async (file: File) => {
      if (!user?.id) {
        return {
          success: false,
          upload: null,
          error: 'User not authenticated',
        }
      }
      return uploadFile(file, user.id, profile?.hospital_id || null)
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate uploads list to refetch
        queryClient.invalidateQueries({ queryKey: uploadKeys.list() })
      }
    },
  })
}

// Hook for deleting uploads
export function useDeleteUpload() {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean; error: string | null }, Error, string>({
    mutationFn: deleteUpload,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: uploadKeys.list() })
      }
    },
  })
}
