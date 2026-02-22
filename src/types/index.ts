export interface TranscriptLine {
  id: string
  speaker: string
  timestamp: string | null
  text: string
}

export interface TranscriptData {
  date: string
  lines: TranscriptLine[]
}

export interface Character {
  id: string
  name: string
  color: string  // hex e.g. '#3B82F6'
}

export interface AudioData {
  url: string
  title?: string
}

export interface ScriptLineDiff {
  created: {
    temp_id: string          // "new_xxx", 백엔드는 무시하고 새 id 발급
    speaker_id: number
    text: string
    start_time: string | null
    order: number
  }[]
  updated: {
    id: number
    speaker_id?: number
    text?: string
    start_time?: string | null
  }[]
  deleted: number[]
  orders: { id: number; order: number }[]  // 구조 변경 시에만 채움
}
