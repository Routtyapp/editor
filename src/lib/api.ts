import type { ScriptLineDiff } from '@/types'

const BASE = '/api/v1'

export interface Category {
  id: number
  name: string
  created_at: string
}

export interface Document {
  id: number
  category_id: number
  title: string
  audio_url: string | null
  file_size: number
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

export interface Speaker {
  id: number
  document_id: number
  name: string
}

export interface ScriptLine {
  id: number
  document_id: number
  speaker_id: number
  text: string
  start_time: string
  order: number
}

export interface DocumentDetail {
  document: Document
  audio_presigned_url: string | null
  speakers: Speaker[]
  script_lines: ScriptLine[]
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/categories`)
  if (!res.ok) throw new Error('categories fetch failed')
  return res.json().then(r => r.data)
}

export interface DocumentsQuery {
  categoryId: number
  q?: string
  progress?: string
  sortBy?: string
  order?: 'asc' | 'desc'
  page?: number
  size?: number
}

export async function fetchDocuments(params: DocumentsQuery): Promise<Document[]> {
  const { categoryId, q, progress, sortBy = 'id', order = 'asc', page = 1, size = 20 } = params
  const qs = new URLSearchParams({
    category_id: String(categoryId),
    sort_by: sortBy,
    order,
    page: String(page),
    size: String(size),
  })
  if (q) qs.set('q', q)
  if (progress) qs.set('progress', progress)
  const res = await fetch(`${BASE}/documents?${qs}`)
  if (!res.ok) throw new Error('documents fetch failed')
  return res.json().then(r => r.data)
}

export async function fetchDocument(documentId: number): Promise<DocumentDetail> {
  const res = await fetch(`${BASE}/documents/${documentId}`)
  if (!res.ok) throw new Error('document fetch failed')
  return res.json().then(r => r.data)
}

export interface PatchScriptLinesResponse {
  lines:    [string, number][]   // [temp_id, db_id]
  speakers: [string, number][]   // [temp_id, db_id]
}

export async function patchScriptLines(
  documentId: number,
  diff: ScriptLineDiff
): Promise<PatchScriptLinesResponse> {
  const res = await fetch(`${BASE}/documents/${documentId}/script_lines`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(diff),
  })
  if (!res.ok) throw new Error('script_lines patch failed')
  return res.json().then(r => r.data)
}

export async function downloadDocuments(documentIds: number[]): Promise<void> {
  const res = await fetch(`${BASE}/documents/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(documentIds),
  })
  if (!res.ok) throw new Error('download failed')

  const disposition = res.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename\*=UTF-8''(.+)/)
  const filename = match
    ? decodeURIComponent(match[1])
    : documentIds.length === 1 ? 'document.docx' : 'documents.zip'

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
