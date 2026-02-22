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
  status: 'in_progress' | 'completed' | null  // null이면 변경 안 함
  speakers: {
    created: { temp_id: string; name: string }[]  // "new_speaker_xxx"
    updated: { id: number; name: string }[]
    deleted: number[]
  }
  created: {
    temp_id: string          // "new_xxx", 백엔드는 무시하고 새 id 발급
    speaker_id: string       // DB id 문자열 or 새 화자의 temp_id
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
