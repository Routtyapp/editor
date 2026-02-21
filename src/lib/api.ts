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
  speakers: Speaker[]
  script_lines: ScriptLine[]
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/categories`)
  if (!res.ok) throw new Error('categories fetch failed')
  return res.json()
}

export async function fetchDocuments(categoryId: number): Promise<Document[]> {
  const res = await fetch(`${BASE}/documents?category_id=${categoryId}`)
  if (!res.ok) throw new Error('documents fetch failed')
  return res.json()
}

export async function fetchDocument(documentId: number): Promise<DocumentDetail> {
  const res = await fetch(`${BASE}/documents/${documentId}`)
  if (!res.ok) throw new Error('document fetch failed')
  return res.json()
}
