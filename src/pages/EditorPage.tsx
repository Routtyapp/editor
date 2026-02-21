import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import MainEditor from '@/components/MainEditor'
import Sidebar from '@/components/Sidebar'
import type { TranscriptData, Character } from '@/types'

const MOCK_TRANSCRIPT: TranscriptData = {
  date: '25.06.27.',
  lines: [
    { id: '1', speaker: '구강모', timestamp: '00:00', text: '네. 대표님.' },
    { id: '2', speaker: '유정우', timestamp: null, text: '그 저기 광명시 청소년 수련?' },
    { id: '3', speaker: '구강모', timestamp: null, text: '네?' },
    { id: '4', speaker: '유정우', timestamp: null, text: '광명시 청소년 지원센터 꿈 드림?' },
    { id: '5', speaker: '구강모', timestamp: null, text: '네네.' },
    { id: '6', speaker: '유정우', timestamp: null, text: '이거?' },
    { id: '7', speaker: '구강모', timestamp: null, text: '네.' },
    { id: '8', speaker: '유정우', timestamp: null, text: '통화했어요?' },
    { id: '9', speaker: '구강모', timestamp: '00:10', text: '오는 중에 제가 오후까지 연락드린다고 했습니다.' },
    { id: '10', speaker: '유정우', timestamp: '00:14', text: '내가 전화할 건데' },
    { id: '11', speaker: '구강모', timestamp: null, text: '네.' },
    { id: '12', speaker: '유정우', timestamp: null, text: '그 사이에 그 사람한테 받은 문자 있으면 나한테 보내주세요.' },
  ],
}

const INITIAL_CHARACTERS: Character[] = [
  { id: '1', name: '구강모', color: '#3B82F6' },
  { id: '2', name: '유정우', color: '#10B981' },
]

export default function EditorPage() {
  const { filename } = useParams<{ filename: string }>()
  const navigate = useNavigate()
  const decodedFileName = filename ? decodeURIComponent(filename) : ''

  const [transcript, setTranscript] = useState<TranscriptData>(MOCK_TRANSCRIPT)
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS)
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

      {/* ── Header 56px ── */}
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center gap-2 px-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="w-8 h-8 text-slate-400 hover:text-slate-700 shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-0.5 text-sm min-w-0">
          {['recordings', '2025', '06'].map((part, i) => (
            <span key={i} className="flex items-center gap-0.5 shrink-0">
              <span className="text-slate-400 px-1 text-xs">{part}</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-slate-800 font-medium px-1 min-w-0">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate text-sm">{decodedFileName || '파일 없음'}</span>
          </span>
        </nav>
      </header>

      {/* ── Body ── */}
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
