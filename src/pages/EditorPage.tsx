import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MainEditor from '@/components/MainEditor'
import Sidebar from '@/components/Sidebar'
import type { TranscriptData, Character } from '@/types'
import { fetchDocument } from '@/lib/api'

const SPEAKER_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
const EMPTY_TRANSCRIPT: TranscriptData = { date: '', lines: [] }

export default function EditorPage() {
  const { categoryId, folderName, documentId } = useParams<{ categoryId: string; folderName: string; documentId: string }>()
  const navigate = useNavigate()
  const decodedFolderName = folderName ? decodeURIComponent(folderName) : ''

  const [title, setTitle] = useState('')
  const [audioSrc, setAudioSrc] = useState<string | undefined>()
  const [transcript, setTranscript] = useState<TranscriptData>(EMPTY_TRANSCRIPT)
  const [characters, setCharacters] = useState<Character[]>([])
  const [audioTime, setAudioTime] = useState(0)

  useEffect(() => {
    if (!documentId) return
    fetchDocument(Number(documentId)).then(({ document, speakers, script_lines }) => {
      setTitle(document.title)
      setAudioSrc(document.audio_url ?? undefined)

      const speakerMap = new Map(speakers.map(s => [s.id, s.name]))

      setCharacters(speakers.map((s, i) => ({
        id: String(s.id),
        name: s.name,
        color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
      })))

      setTranscript({
        date: '',
        lines: script_lines.map(sl => ({
          id: String(sl.id),
          speaker: speakerMap.get(sl.speaker_id) ?? '알 수 없음',
          timestamp: sl.start_time || null,
          text: sl.text,
        })),
      })
    })
  }, [documentId])

  const handleSetCharacters = (newChars: Character[]) => {
    const renamedMap = new Map<string, string>()
    newChars.forEach(newChar => {
      const oldChar = characters.find(c => c.id === newChar.id)
      if (oldChar && oldChar.name !== newChar.name) {
        renamedMap.set(oldChar.name, newChar.name)
      }
    })

    if (renamedMap.size > 0) {
      setTranscript(prev => ({
        ...prev,
        lines: prev.lines.map(line => ({
          ...line,
          speaker: renamedMap.get(line.speaker) ?? line.speaker,
        })),
      }))
    }

    setCharacters(newChars)
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center gap-2 px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/${categoryId}/${encodeURIComponent(decodedFolderName)}`)}
          className="w-8 h-8 text-slate-400 hover:text-slate-700 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <nav className="flex items-center gap-0.5 text-sm min-w-0">
          <span className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-slate-400 px-1 text-xs hover:text-slate-700"
            >
              루트
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </span>

          <span className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/${categoryId}/${encodeURIComponent(decodedFolderName)}`)}
              className="text-slate-400 px-1 text-xs hover:text-slate-700"
            >
              {decodedFolderName || '폴더'}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </span>

          <span className="flex items-center gap-1.5 text-slate-800 font-medium px-1 min-w-0">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-sm">{title || '로딩 중...'}</span>
          </span>
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <MainEditor
          transcript={transcript}
          setTranscript={setTranscript}
          characters={characters}
          audioTime={audioTime}
        />
        <Sidebar
          characters={characters}
          setCharacters={handleSetCharacters}
          audioSrc={audioSrc}
          onAudioTimeChange={setAudioTime}
        />
      </div>
    </div>
  )
}
