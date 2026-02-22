import { Button } from '@/components/ui/button'
import AudioPlayer from './AudioPlayer'
import CharacterManager from './CharacterManager'
import type { Character } from '@/types'

interface SidebarProps {
  characters: Character[]
  setCharacters: (chars: Character[]) => void
  audioSrc?: string
  onAudioTimeChange?: (time: number) => void
  onSaveProgress: () => void
  onComplete: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 mb-3">
      {children}
    </p>
  )
}

function Divider() {
  return <div className="h-px bg-slate-200 shrink-0" />
}

export default function Sidebar({ characters, setCharacters, audioSrc, onAudioTimeChange, onSaveProgress, onComplete }: SidebarProps) {
  return (
    <aside className="w-72 border-l border-slate-200 flex flex-col shrink-0 bg-slate-50/30">

      {/* 오디오 */}
      <div className="px-5 pt-5 pb-5 shrink-0">
        <SectionLabel>오디오</SectionLabel>
        <AudioPlayer src={audioSrc} onTimeChange={onAudioTimeChange} />
      </div>

      <Divider />

      {/* 화자관리 */}
      <div className="flex-1 min-h-0 flex flex-col px-5 pt-4 pb-3 overflow-hidden">
        <SectionLabel>화자관리</SectionLabel>
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          <CharacterManager characters={characters} setCharacters={setCharacters} />
        </div>
      </div>

      <Divider />

      {/* 진행상태 저장 / 완료 */}
      <div className="px-4 py-3 shrink-0 flex items-center bg-white">
        <div className="flex-1 flex justify-end pr-2">
          <Button className="h-8 w-[124px] border border-slate-600 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={onSaveProgress}>
            진행상태 저장
          </Button>
        </div>
        <div className="h-5 w-px bg-slate-300 shrink-0" />
        <div className="flex-1 flex justify-start pl-2">
          <Button className="h-8 w-[124px] text-xs font-medium" onClick={onComplete}>
            작업 완료
          </Button>
        </div>
      </div>
    </aside>
  )
}
