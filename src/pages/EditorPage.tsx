import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MainEditor from '@/components/MainEditor'
import Sidebar from '@/components/Sidebar'
import type { TranscriptData, TranscriptLine, Character, ScriptLineDiff } from '@/types'
import { fetchDocument, patchScriptLines, patchDocumentStatus } from '@/lib/api'

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
  const originalLinesRef = useRef<TranscriptLine[]>([])

  useEffect(() => {
    if (!documentId) return
    fetchDocument(Number(documentId)).then(({ document, audio_presigned_url, speakers, script_lines }) => {
      setTitle(document.title)
      setAudioSrc(audio_presigned_url ?? undefined)

      const speakerMap = new Map(speakers.map(s => [s.id, s.name]))

      setCharacters(speakers.map((s, i) => ({
        id: String(s.id),
        name: s.name,
        color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
      })))

      const loadedLines: TranscriptLine[] = script_lines.map(sl => ({
        id: String(sl.id),
        speaker: speakerMap.get(sl.speaker_id) ?? '알 수 없음',
        timestamp: sl.start_time || null,
        text: sl.text,
      }))
      originalLinesRef.current = loadedLines
      setTranscript({
        date: '',
        lines: loadedLines,
      })
    })
  }, [documentId])

  function buildDiff(): ScriptLineDiff | null {
    const original = originalLinesRef.current
    const current  = transcript.lines

    const originalMap = new Map(original.map(l => [l.id, l]))
    const currentIds  = new Set(current.map(l => l.id))

    const speakerIdMap = new Map(characters.map(c => [c.name, Number(c.id)]))

    const created = current
      .filter(l => l.id.startsWith('new_'))
      .map(l => ({
        temp_id: l.id,
        speaker_id: speakerIdMap.get(l.speaker) ?? 0,
        text: l.text,
        start_time: l.timestamp,
        order: current.indexOf(l),
      }))

    const deleted = original
      .filter(l => !currentIds.has(l.id))
      .map(l => Number(l.id))

    const updated = current
      .filter(l => !l.id.startsWith('new_'))
      .flatMap(l => {
        const orig = originalMap.get(l.id)
        if (!orig) return []
        const patch: ScriptLineDiff['updated'][number] = { id: Number(l.id) }
        let changed = false
        if (orig.text !== l.text)           { patch.text = l.text; changed = true }
        if (orig.speaker !== l.speaker)     { patch.speaker_id = speakerIdMap.get(l.speaker) ?? 0; changed = true }
        if (orig.timestamp !== l.timestamp) { patch.start_time = l.timestamp; changed = true }
        return changed ? [patch] : []
      })

    const hasStructureChange = created.length > 0 || deleted.length > 0
    const orders = hasStructureChange
      ? current
          .filter(l => !l.id.startsWith('new_'))
          .map((l, i) => ({ id: Number(l.id), order: i }))
      : []

    if (created.length === 0 && updated.length === 0 && deleted.length === 0) {
      return null
    }

    return { created, updated, deleted, orders }
  }

  async function saveLines() {
    if (!documentId) return
    const diff = buildDiff()
    if (diff) {
      await patchScriptLines(Number(documentId), diff)
      originalLinesRef.current = transcript.lines
    }
  }

  async function handleSaveProgress() {
    await saveLines()
    await patchDocumentStatus(Number(documentId!), 'in_progress')
  }

  async function handleComplete() {
    await saveLines()
    await patchDocumentStatus(Number(documentId!), 'completed')
  }

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
              카테고리
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
          onSaveProgress={handleSaveProgress}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}
