import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MainEditor from '@/components/MainEditor'
import Sidebar from '@/components/Sidebar'
import type { TranscriptData, Character } from '@/types'

const EMPTY_TRANSCRIPT: TranscriptData = { date: '', lines: [] }
const EMPTY_CHARACTERS: Character[] = []

export default function EditorPage() {
  const { folderName, filename } = useParams<{ folderName: string; filename: string }>()
  const navigate = useNavigate()
  const decodedFolderName = folderName ? decodeURIComponent(folderName) : ''
  const decodedFileName = filename ? decodeURIComponent(filename) : ''

  const [transcript, setTranscript] = useState<TranscriptData>(EMPTY_TRANSCRIPT)
  const [characters, setCharacters] = useState<Character[]>(EMPTY_CHARACTERS)
  const [audioTime, setAudioTime] = useState(0)

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
          onClick={() => navigate(`/${encodeURIComponent(decodedFolderName)}`)}
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
              onClick={() => navigate(`/${encodeURIComponent(decodedFolderName)}`)}
              className="text-slate-400 px-1 text-xs hover:text-slate-700"
            >
              {decodedFolderName || '폴더'}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </span>

          <span className="flex items-center gap-1.5 text-slate-800 font-medium px-1 min-w-0">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-sm">{decodedFileName || '파일 없음'}</span>
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
          audioSrc="/통화_녹음_홍판_김창용대표님_241119_231323.m4a"
          onAudioTimeChange={setAudioTime}
        />
      </div>
    </div>
  )
}
