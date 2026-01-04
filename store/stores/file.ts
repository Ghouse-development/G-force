import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type FileCategory = 'document' | 'audio' | 'image' | 'memo'

export type DocumentCategory =
  | 'land_registry'
  | 'cadastral_map'
  | 'land_survey'
  | 'land_explanation'
  | 'land_contract'
  | 'road_designation'
  | 'drivers_license'
  | 'health_insurance'
  | 'loan_preapproval'
  | 'site_photos'
  | 'housing_map'
  | 'meeting_records'
  | 'other'

export interface StoredFile {
  id: string
  customerId: string
  name: string
  type: string
  size: number
  dataUrl: string
  category: FileCategory
  documentCategory?: DocumentCategory
  uploadedAt: string
  uploadedBy: string | null
  memoContent?: string
  aiAnalysis?: {
    summary?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    keywords?: string[]
    analyzedAt?: string
  }
}

interface FileState {
  files: StoredFile[]
  addFile: (file: Omit<StoredFile, 'id' | 'uploadedAt'>) => string
  addMemo: (customerId: string, content: string, uploadedBy: string | null) => string
  updateMemo: (id: string, content: string) => void
  deleteFile: (id: string) => void
  getFilesByCustomer: (customerId: string) => StoredFile[]
  getFilesByCategory: (customerId: string, category: FileCategory) => StoredFile[]
  getFile: (id: string) => StoredFile | undefined
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      addFile: (file) => {
        const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newFile: StoredFile = {
          ...file,
          id,
          uploadedAt: new Date().toISOString(),
        }
        set((state) => ({
          files: [newFile, ...state.files],
        }))
        return id
      },
      addMemo: (customerId, content, uploadedBy) => {
        const id = `memo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const now = new Date()
        const newMemo: StoredFile = {
          id,
          customerId,
          name: `メモ ${now.toLocaleDateString('ja-JP')} ${now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`,
          type: 'text/plain',
          size: new Blob([content]).size,
          dataUrl: '',
          category: 'memo',
          uploadedAt: now.toISOString(),
          uploadedBy,
          memoContent: content,
        }
        set((state) => ({
          files: [newMemo, ...state.files],
        }))
        return id
      },
      updateMemo: (id, content) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id
              ? { ...f, memoContent: content, size: new Blob([content]).size }
              : f
          ),
        }))
      },
      deleteFile: (id) => {
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        }))
      },
      getFilesByCustomer: (customerId) => {
        return get().files
          .filter((f) => f.customerId === customerId)
          .map((f) => ({
            ...f,
            category: f.category || (
              f.type.startsWith('audio/') ? 'audio' :
              f.type.startsWith('image/') ? 'image' :
              f.memoContent ? 'memo' : 'document'
            ) as FileCategory,
          }))
      },
      getFilesByCategory: (customerId, category) => {
        return get().files.filter((f) => f.customerId === customerId && f.category === category)
      },
      getFile: (id) => {
        return get().files.find((f) => f.id === id)
      },
    }),
    {
      name: 'ghouse-files',
    }
  )
)
