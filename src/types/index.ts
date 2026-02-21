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
